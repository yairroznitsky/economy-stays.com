interface KayakAutocompleteRequest {
  query?: string;
  locale?: string;
  country?: string;
}

interface NormalizedSuggestion {
  id: string;
  label: string;
  type: string;
  subtitle?: string;
  raw?: Record<string, unknown>;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const KAYAK_AUTOCOMPLETE_BASE_URL =
  Deno.env.get("KAYAK_AUTOCOMPLETE_BASE_URL") ??
  "https://www.kayak.com/mvm/smartyv2/search";
const KAYAK_AUTOCOMPLETE_SIZE = Number(Deno.env.get("KAYAK_AUTOCOMPLETE_SIZE") ?? "50");
const MAX_SUGGESTIONS = 10;

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const validateInput = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Request body must be a JSON object.");
  }

  const input = payload as KayakAutocompleteRequest;
  const query = (input.query ?? "").trim();
  const locale = (input.locale ?? "en").trim();
  const country = (input.country ?? "US").trim().toUpperCase();

  if (!query) {
    throw new Error("query is required.");
  }

  return { query, locale, country };
};

const buildKayakRequestUrl = ({
  query,
  locale,
  country,
}: {
  query: string;
  locale: string;
  country: string;
}) => {
  const params = new URLSearchParams({
    where: query,
    lc_cc: country,
    lc: locale,
    f: "j",
    s: String(KAYAK_AUTOCOMPLETE_SIZE),
  });

  return `${KAYAK_AUTOCOMPLETE_BASE_URL}?${params.toString()}`;
};

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const extractString = (
  source: Record<string, unknown>,
  keys: string[],
  fallback = ""
) => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return fallback;
};

const findSuggestionArray = (value: unknown): Record<string, unknown>[] | null => {
  if (Array.isArray(value)) {
    const asRecords = value
      .map((entry) => toRecord(entry))
      .filter((entry) => Object.keys(entry).length > 0);

    const hasAutocompleteLikeFields = asRecords.some((entry) =>
      ["loctype", "kayakType", "displayname", "label", "name"].some((key) =>
        Object.prototype.hasOwnProperty.call(entry, key)
      )
    );

    if (hasAutocompleteLikeFields) {
      return asRecords;
    }

    for (const item of value) {
      const nested = findSuggestionArray(item);
      if (nested) return nested;
    }
    return null;
  }

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const nestedValue of Object.values(obj)) {
      const nested = findSuggestionArray(nestedValue);
      if (nested) return nested;
    }
  }

  return null;
};

const normalizeKayakSuggestions = (payload: unknown): NormalizedSuggestion[] => {
  const root = toRecord(payload);
  const candidates = [
    root["value"],
    root["results"],
    root["suggestions"],
    root["data"],
    root["items"],
  ].find((value) => Array.isArray(value));

  const fallbackCandidates = findSuggestionArray(root);
  const sourceArray = Array.isArray(candidates) ? candidates : fallbackCandidates;

  if (!sourceArray) {
    return [];
  }

  const normalized: NormalizedSuggestion[] = [];
  const seen = new Set<string>();

  for (const item of sourceArray) {
    const record = toRecord(item);
    const rawType = extractString(record, [
      "loctype",
      "kayakType",
      "type",
      "entityType",
      "category",
      "t",
    ]);
    const mappedType = rawType.toLowerCase() || "unknown";

    const label = extractString(record, [
      "displayname",
      "smartyDisplay",
      "label",
      "name",
      "display",
      "where",
      "value",
    ]);
    if (!label) continue;

    const subtitle = extractString(record, [
      "secondary",
      "searchFormSecondary",
      "subtitle",
      "description",
      "subLabel",
      "countryName",
      "regionName",
      "location",
    ]);
    const id = extractString(
      record,
      ["id", "kayakId", "hid", "entityId", "rid", "destinationId"],
      label
    );

    const dedupeKey = `${mappedType}|${label.toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    normalized.push({
      id,
      label,
      type: mappedType,
      subtitle: subtitle || undefined,
      // Keep provider metadata needed for deeplink composition.
      raw: {
        id: record["id"] ?? record["entityId"] ?? null,
        type: rawType || null,
        hotel_id: record["hid"] ?? null,
        city_id: record["ctid"] ?? record["id"] ?? null,
        city: record["cityonly"] ?? record["cityname"] ?? null,
        state: record["region"] ?? record["rc"] ?? null,
        country: record["country"] ?? null,
        name: record["name"] ?? record["hotelname"] ?? null,
        place_id: record["placeID"] ?? record["indexId"] ?? null,
        airport_code: record["apicode"] ?? record["ap"] ?? null,
        airport_name: record["airportname"] ?? null,
      },
    });

    if (normalized.length >= MAX_SUGGESTIONS) {
      break;
    }
  }

  return normalized;
};

const fetchKayakSuggestions = async (params: {
  query: string;
  locale: string;
  country: string;
}) => {
  const kayakUrl = buildKayakRequestUrl(params);
  const response = await fetch(kayakUrl, {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*",
      "User-Agent":
        "Mozilla/5.0 (compatible; SecretStaysBot/1.0; +https://twcvlutykblgoatahobf.supabase.co)",
    },
  });

  if (!response.ok) {
    throw new Error("Kayak autocomplete request failed");
  }

  const payload = await response.json();
  return normalizeKayakSuggestions(payload);
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse(405, {
      success: false,
      suggestions: [],
      error: "Method not allowed. Use POST.",
    });
  }

  try {
    const input = validateInput(await request.json());

    if (input.query.length < 3) {
      return jsonResponse(200, {
        success: true,
        query: input.query,
        suggestions: [],
      });
    }

    let normalizedSuggestions: NormalizedSuggestion[] = [];
    try {
      normalizedSuggestions = await fetchKayakSuggestions(input);
    } catch {
      return jsonResponse(200, {
        success: false,
        query: input.query,
        suggestions: [],
        error: "Autocomplete unavailable",
      });
    }

    const suggestions = normalizedSuggestions.slice(0, MAX_SUGGESTIONS);

    return jsonResponse(200, {
      success: true,
      query: input.query,
      suggestions,
    });
  } catch (error) {
    console.error("kayak-autocomplete error", error);
    return jsonResponse(200, {
      success: false,
      suggestions: [],
      error: "Autocomplete unavailable",
    });
  }
});
