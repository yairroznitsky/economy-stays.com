/**
 * Self-contained Vercel serverless function: POST /api/edge/kayak-autocomplete
 *
 * Everything is inlined on purpose. Vercel serverless functions cannot reliably
 * import sibling source files (extensionless ESM specifiers fail at runtime with
 * ERR_MODULE_NOT_FOUND), so do NOT import from ../../server, ../../src, etc.
 * The local Vite dev equivalent lives in server/edge/kayakAutocomplete.ts — keep in sync.
 */

interface ApiRequest {
  method?: string;
  query: { name?: string | string[] };
  body: unknown;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  end: (body?: string) => void;
  setHeader: (name: string, value: string) => void;
}

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

const ALLOWED_FUNCTIONS = new Set(["kayak-autocomplete"]);
const MAX_SUGGESTIONS = 10;

const readEnv = (key: string): string | undefined => {
  const value = process.env[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
};

const getKayakAutocompleteConfig = () => ({
  baseUrl:
    readEnv("KAYAK_AUTOCOMPLETE_BASE_URL") ??
    "https://www.kayak.com/mvm/smartyv2/search",
  size: Number(readEnv("KAYAK_AUTOCOMPLETE_SIZE") ?? "50"),
  botName: readEnv("BOT_NAME")?.trim() ?? "AffiliateBot",
  siteDomain: readEnv("SITE_DOMAIN")?.trim() ?? readEnv("VITE_SITE_DOMAIN")?.trim() ?? "",
  supabaseUrl: readEnv("SUPABASE_URL") ?? readEnv("VITE_SUPABASE_URL") ?? "",
});

const getFunctionName = (query: ApiRequest["query"]): string | null => {
  const raw = query.name;
  const name = Array.isArray(raw) ? raw[0] : raw;
  return typeof name === "string" && ALLOWED_FUNCTIONS.has(name) ? name : null;
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

const extractId = (source: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(Math.trunc(value));
    }
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
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

    const isAirport = mappedType === "ap" || mappedType.includes("airport");

    normalized.push({
      id,
      label,
      type: mappedType,
      subtitle: subtitle || undefined,
      raw: {
        id: record["id"] ?? record["entityId"] ?? null,
        type: rawType || null,
        hotel_id: extractId(record, ["hid"]),
        city_id: extractId(record, ["ctid", "id"]),
        city: record["cityonly"] ?? record["cityname"] ?? null,
        cityonly: record["cityonly"] ?? null,
        state: record["region"] ?? record["rc"] ?? null,
        country: record["country"] ?? null,
        name: record["name"] ?? record["hotelname"] ?? null,
        place_id: extractId(record, ["placeID", "indexId"]),
        airport_code: isAirport ? (record["apicode"] ?? record["ap"] ?? null) : null,
        airport_name: isAirport ? (record["airportname"] ?? record["name"] ?? null) : null,
      },
    });

    if (normalized.length >= MAX_SUGGESTIONS) {
      break;
    }
  }

  return normalized;
};

const buildKayakRequestUrl = (
  params: { query: string; locale: string; country: string },
  config: ReturnType<typeof getKayakAutocompleteConfig>
) => {
  const search = new URLSearchParams({
    where: params.query,
    lc_cc: params.country,
    lc: params.locale,
    f: "j",
    s: String(config.size),
  });
  return `${config.baseUrl}?${search.toString()}`;
};

const buildBotUserAgent = (config: ReturnType<typeof getKayakAutocompleteConfig>) => {
  const ref = config.siteDomain
    ? `https://${config.siteDomain}`
    : config.supabaseUrl;
  return ref
    ? `Mozilla/5.0 (compatible; ${config.botName}/1.0; +${ref})`
    : `Mozilla/5.0 (compatible; ${config.botName}/1.0)`;
};

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

const handleKayakAutocomplete = async (
  payload: unknown
): Promise<{ status: number; body: Record<string, unknown> }> => {
  try {
    const input = validateInput(payload);
    const config = getKayakAutocompleteConfig();

    if (input.query.length < 3) {
      return {
        status: 200,
        body: { success: true, query: input.query, suggestions: [] },
      };
    }

    try {
      const kayakUrl = buildKayakRequestUrl(input, config);
      const response = await fetch(kayakUrl, {
        method: "GET",
        headers: {
          Accept: "application/json, text/plain, */*",
          "User-Agent": buildBotUserAgent(config),
        },
      });

      if (!response.ok) {
        throw new Error("Kayak autocomplete request failed");
      }

      const raw = await response.json();
      const suggestions = normalizeKayakSuggestions(raw).slice(0, MAX_SUGGESTIONS);

      return {
        status: 200,
        body: { success: true, query: input.query, suggestions },
      };
    } catch {
      return {
        status: 200,
        body: {
          success: false,
          query: input.query,
          suggestions: [],
          error: "Autocomplete unavailable",
        },
      };
    }
  } catch (error) {
    console.error("kayak-autocomplete error", error);
    return {
      status: 200,
      body: { success: false, suggestions: [], error: "Autocomplete unavailable" },
    };
  }
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const functionName = getFunctionName(req.query);
  if (!functionName) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const body =
    typeof req.body === "object" && req.body !== null
      ? req.body
      : typeof req.body === "string"
        ? JSON.parse(req.body)
        : {};

  try {
    const result = await handleKayakAutocomplete(body);
    res.status(result.status).json(result.body);
  } catch {
    res.status(502).json({ error: "Upstream request failed" });
  }
}
