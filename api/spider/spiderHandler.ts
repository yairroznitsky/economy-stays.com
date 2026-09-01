/**
 * Self-contained spider redirect logic for Vercel serverless.
 * Do not import from ../server, ../src, or ../supabase — Vercel NFT often fails to bundle those.
 */

import { randomBytes, timingSafeEqual } from "node:crypto";

// --- Token validation ---

const readSpiderToken = (): string | undefined => {
  const value = process.env.SPIDER_TOKEN?.trim();
  return value && value.length > 0 ? value : undefined;
};

export const tokensMatch = (provided: string, expected: string): boolean => {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
};

export const isValidSpiderToken = (provided: string | undefined | null): boolean => {
  const expected = readSpiderToken();
  if (!expected || !provided) return false;
  return tokensMatch(provided.trim(), expected);
};

// --- Random destination + dates ---

const SPIDER_TOURIST_CITIES = [
  "Paris, France",
  "London, United Kingdom",
  "Dubai, United Arab Emirates",
  "Rome, Italy",
  "New York City, New York, United States",
  "Tokyo, Japan",
  "Istanbul, Turkey",
  "Bangkok, Thailand",
  "Barcelona, Spain",
  "Amsterdam, Netherlands",
  "Milan, Italy",
  "Singapore",
  "Hong Kong",
  "Madrid, Spain",
  "Los Angeles, California, United States",
  "Prague, Czech Republic",
  "Vienna, Austria",
  "Munich, Germany",
  "Berlin, Germany",
  "Lisbon, Portugal",
  "Seoul, South Korea",
  "Florence, Italy",
  "Venice, Italy",
  "Dublin, Ireland",
  "Athens, Greece",
  "Las Vegas, Nevada, United States",
  "Miami, Florida, United States",
  "Orlando, Florida, United States",
  "San Francisco, California, United States",
  "Chicago, Illinois, United States",
  "Washington, District of Columbia, United States",
  "Boston, Massachusetts, United States",
  "Seattle, Washington, United States",
  "Honolulu, Hawaii, United States",
  "Cancun, Mexico",
  "Mexico City, Mexico",
  "Sydney, Australia",
  "Melbourne, Australia",
  "Bali, Indonesia",
  "Phuket, Thailand",
  "Marrakech, Morocco",
  "Cape Town, South Africa",
  "Cairo, Egypt",
  "Jerusalem, Israel",
  "Tel Aviv, Israel",
  "Doha, Qatar",
  "Abu Dhabi, United Arab Emirates",
  "Shanghai, China",
  "Beijing, China",
  "Kyoto, Japan",
  "Osaka, Japan",
  "Taipei, Taiwan",
  "Ho Chi Minh City, Vietnam",
  "Hanoi, Vietnam",
  "Kuala Lumpur, Malaysia",
  "Jakarta, Indonesia",
  "Manila, Philippines",
  "Edinburgh, United Kingdom",
  "Zurich, Switzerland",
  "Geneva, Switzerland",
  "Brussels, Belgium",
  "Copenhagen, Denmark",
  "Stockholm, Sweden",
  "Oslo, Norway",
  "Helsinki, Finland",
  "Budapest, Hungary",
  "Krakow, Poland",
  "Warsaw, Poland",
  "Dubrovnik, Croatia",
  "Split, Croatia",
  "Santorini, Greece",
  "Mykonos, Greece",
  "Nice, France",
  "Cannes, France",
  "Monaco",
  "Interlaken, Switzerland",
  "Salzburg, Austria",
  "Bruges, Belgium",
  "Porto, Portugal",
  "Seville, Spain",
  "Granada, Spain",
  "Ibiza, Spain",
  "Palma de Mallorca, Spain",
  "Reykjavik, Iceland",
  "Montreal, Canada",
  "Vancouver, Canada",
  "Toronto, Canada",
  "Quebec City, Canada",
  "Rio de Janeiro, Brazil",
  "Buenos Aires, Argentina",
  "Lima, Peru",
  "Cusco, Peru",
  "Cartagena, Colombia",
  "Punta Cana, Dominican Republic",
  "San Juan, Puerto Rico",
  "New Orleans, Louisiana, United States",
  "Nashville, Tennessee, United States",
  "San Diego, California, United States",
  "Queenstown, New Zealand",
  "Maldives",
] as const;

const pickRandomSpiderDestination = (): string => {
  const index = Math.floor(Math.random() * SPIDER_TOURIST_CITIES.length);
  return SPIDER_TOURIST_CITIES[index] ?? SPIDER_TOURIST_CITIES[0];
};

type WeightedItem<T> = { value: T; weight: number };

const pickWeighted = <T>(items: WeightedItem<T>[], random: () => number): T => {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll < 0) return item.value;
  }
  return items[items.length - 1]!.value;
};

const randomInt = (min: number, max: number, random: () => number): number =>
  min + Math.floor(random() * (max - min + 1));

const startOfLocalDay = (date: Date): Date => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const addDays = (date: Date, days: number): Date => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const pickLeadDays = (random: () => number): number =>
  pickWeighted(
    [
      { value: randomInt(1, 14, random), weight: 0.45 },
      { value: randomInt(15, 35, random), weight: 0.35 },
      { value: randomInt(36, 60, random), weight: 0.15 },
      { value: randomInt(61, 90, random), weight: 0.05 },
    ],
    random
  );

const pickNights = (random: () => number): number =>
  pickWeighted(
    [
      { value: 1, weight: 0.45 },
      { value: 2, weight: 0.3 },
      { value: 3, weight: 0.15 },
      { value: 4, weight: 0.06 },
      { value: randomInt(5, 7, random), weight: 0.04 },
    ],
    random
  );

const pickRandomSpiderDateRange = (
  now: Date = new Date(),
  random: () => number = Math.random
): { from: Date; to: Date } => {
  const today = startOfLocalDay(now);
  const leadDays = pickLeadDays(random);
  const nights = pickNights(random);
  const from = addDays(today, leadDays);
  const to = addDays(from, nights);
  return { from, to };
};

// --- Kayak autocomplete ---

const readEnv = (key: string): string | undefined => {
  const value = process.env[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
};

const KAYAK_AUTOCOMPLETE_BASE_URL =
  readEnv("KAYAK_AUTOCOMPLETE_BASE_URL") ??
  "https://www.kayak.com/mvm/smartyv2/search";
const KAYAK_AUTOCOMPLETE_SIZE = Number(readEnv("KAYAK_AUTOCOMPLETE_SIZE") ?? "50");
const MAX_SUGGESTIONS = 10;

interface SpiderSuggestion {
  id: string;
  label: string;
  type: string;
  raw?: Record<string, unknown>;
}

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const extractString = (
  source: Record<string, unknown>,
  keys: string[],
  fallback = ""
): string => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return fallback;
};

const extractId = (source: Record<string, unknown>, keys: string[]): string | null => {
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
    for (const nestedValue of Object.values(value as Record<string, unknown>)) {
      const nested = findSuggestionArray(nestedValue);
      if (nested) return nested;
    }
  }

  return null;
};

const normalizeKayakSuggestions = (payload: unknown): SpiderSuggestion[] => {
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

  const normalized: SpiderSuggestion[] = [];
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

const buildKayakAutocompleteUrl = (query: string, locale: string, country: string) => {
  const params = new URLSearchParams({
    where: query,
    lc_cc: country,
    lc: locale,
    f: "j",
    s: String(KAYAK_AUTOCOMPLETE_SIZE),
  });
  return `${KAYAK_AUTOCOMPLETE_BASE_URL}?${params.toString()}`;
};

const buildBotUserAgent = (): string => {
  const siteDomain =
    readEnv("SITE_DOMAIN")?.trim() ?? readEnv("VITE_SITE_DOMAIN")?.trim() ?? "";
  const supabaseUrl = readEnv("SUPABASE_URL") ?? readEnv("VITE_SUPABASE_URL") ?? "";
  const botName = readEnv("BOT_NAME")?.trim() ?? "AffiliateBot";
  const ref = siteDomain ? `https://${siteDomain}` : supabaseUrl;
  return ref
    ? `Mozilla/5.0 (compatible; ${botName}/1.0; +${ref})`
    : `Mozilla/5.0 (compatible; ${botName}/1.0)`;
};

const fetchKayakSuggestions = async (
  query: string,
  locale: string,
  country: string
): Promise<{ success: boolean; suggestions: SpiderSuggestion[] }> => {
  if (query.length < 3) {
    return { success: true, suggestions: [] };
  }

  try {
    const response = await fetch(buildKayakAutocompleteUrl(query, locale, country), {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        "User-Agent": buildBotUserAgent(),
      },
    });

    if (!response.ok) {
      return { success: false, suggestions: [] };
    }

    const raw = await response.json();
    return {
      success: true,
      suggestions: normalizeKayakSuggestions(raw).slice(0, MAX_SUGGESTIONS),
    };
  } catch {
    return { success: false, suggestions: [] };
  }
};

// --- Kayak deeplink ---

const DEFAULT_KAYAK_AFFILIATE_ID = "kan_317716_594040";

const getKayakAffiliateConfig = () => ({
  affiliateId: readEnv("KAYAK_AFFILIATE_ID")?.trim() || DEFAULT_KAYAK_AFFILIATE_ID,
  deeplinkBase: readEnv("KAYAK_DEEPLINK_BASE") ?? "https://www.kayak.com/in",
  utmMedium: readEnv("KAYAK_UTM_MEDIUM") ?? "affiliate",
});

interface KayakDeeplinkInput {
  query: string;
  destination_id: string;
  hotel_id?: string;
  airport_place_id?: string;
  airport_code?: string;
  airport_name?: string;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  checkin: string;
  checkout: string;
  rooms: number;
  adults: number;
  children: number;
  children_ages: number[];
  click_id: string;
  country: string;
}

const buildKayakHotelPath = (
  input: KayakDeeplinkInput,
  destinationId: string
): string => {
  const removeDestinationCode = (value: string) =>
    value
      .replace(/-?c\d+\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

  const queryParts = input.query
    .split(",")
    .map((part) => removeDestinationCode(part))
    .filter(Boolean);
  const city = input.city_name ?? queryParts[0] ?? removeDestinationCode(input.query);
  const country =
    input.country_name ??
    (queryParts.length >= 2 ? queryParts[queryParts.length - 1] : input.country);
  const state = input.state_name ?? (queryParts.length >= 3 ? queryParts[1] : "");
  const normalizedCountry = country.trim().toLowerCase();
  const isUnitedStates = ["us", "usa", "united states", "united states of america"].includes(
    normalizedCountry
  );

  const slugify = (value: string) =>
    value
      .trim()
      .replace(/['’]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const hotelName = input.hotel_id
    ? removeDestinationCode(input.query.split(",")[0] ?? input.query)
    : "";
  const baseSegments = isUnitedStates
    ? [slugify(city), slugify(state), slugify(country)].filter(Boolean)
    : [slugify(city), slugify(country)].filter(Boolean);
  const isAirportDeeplink =
    Boolean(input.airport_place_id && input.airport_code && input.airport_name);
  const locationSegments = isAirportDeeplink
    ? [slugify(city), slugify(country), slugify(input.airport_name!)]
    : input.hotel_id
      ? [slugify(hotelName), ...baseSegments].filter(Boolean)
      : baseSegments;
  const locationSlug = locationSegments.join(",");
  const destinationCode = isAirportDeeplink ? "" : `-c${destinationId}`;
  const hotelCode = input.hotel_id ? `-h${input.hotel_id}` : "";
  const airportCode = isAirportDeeplink
    ? `-p${input.airport_place_id}-l${input.airport_code}`
    : "";
  const adultsSegment = `${input.adults}adults`;
  const childrenSegment =
    input.children > 0
      ? `/${input.children}children-${input.children_ages.join("-")}`
      : "";
  const roomsSegment = `${input.rooms}rooms`;

  return `/hotels/${locationSlug}${destinationCode}${hotelCode}${airportCode}/${input.checkin}/${input.checkout}/${adultsSegment}${childrenSegment}/${roomsSegment}`;
};

const buildKayakDeeplink = (input: KayakDeeplinkInput): string => {
  const config = getKayakAffiliateConfig();
  const kayakPath = buildKayakHotelPath(input, input.destination_id);
  const wrapper = new URL(config.deeplinkBase);

  if (config.affiliateId) {
    wrapper.searchParams.set("a", config.affiliateId);
  }
  wrapper.searchParams.set("enc_cid", input.click_id);
  wrapper.searchParams.set("enc_lid", "hotels");
  wrapper.searchParams.set("enc_pid", "deeplinks");
  wrapper.searchParams.set("encoder", "27_1");
  wrapper.searchParams.set("url", kayakPath);
  wrapper.searchParams.set("utm_medium", config.utmMedium);

  return wrapper.toString();
};

// --- Spider redirect runner ---

const ID_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const SPIDER_LOCALE = "en";
const SPIDER_MARKET_COUNTRY = "US";
const SPIDER_ADULTS = 2;
const SPIDER_CHILDREN = 0;
const SPIDER_ROOMS = 1;

export type SpiderKayakRedirectResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; error: string };

export type RunSpiderKayakRedirectOptions = {
  random?: () => number;
  now?: Date;
  clickId?: string;
  destinationQuery?: string;
};

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const generateClickId = (): string => {
  const bytes = randomBytes(10);
  return Array.from(bytes, (byte) => ID_CHARS[byte % ID_CHARS.length]).join("");
};

const readRawId = (
  raw: Record<string, unknown> | undefined,
  key: string
): string | undefined => {
  const value = raw?.[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return undefined;
};

const readRawString = (
  raw: Record<string, unknown> | undefined,
  key: string
): string | undefined => {
  const value = raw?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

export const pickSpiderSuggestion = (
  suggestions: SpiderSuggestion[]
): SpiderSuggestion | null => {
  if (suggestions.length === 0) return null;

  const cityOrRegion = suggestions.find((suggestion) => {
    const type = suggestion.type.toLowerCase();
    const hasCityId = Boolean(readRawId(suggestion.raw, "city_id"));
    return (type.includes("city") || type.includes("region")) && hasCityId;
  });
  if (cityOrRegion) return cityOrRegion;

  const withUsableId = suggestions.find((suggestion) => {
    return (
      readRawId(suggestion.raw, "city_id") ??
      readRawId(suggestion.raw, "id") ??
      suggestion.id.trim()
    );
  });

  return withUsableId ?? null;
};

const buildKayakInputFromSuggestion = (
  suggestion: SpiderSuggestion,
  checkin: string,
  checkout: string,
  clickId: string
): KayakDeeplinkInput | null => {
  const raw = suggestion.raw ?? {};
  const destinationId =
    readRawId(raw, "city_id") ?? readRawId(raw, "id") ?? suggestion.id.trim();
  if (!destinationId) return null;

  const cityName =
    readRawString(raw, "city") ?? suggestion.label.split(",")[0]?.trim() ?? suggestion.label;
  const stateName = readRawString(raw, "state");
  const countryName = readRawString(raw, "country");

  return {
    query: suggestion.label.trim(),
    destination_id: destinationId,
    hotel_id: readRawId(raw, "hotel_id"),
    city_name: cityName,
    state_name: stateName,
    country_name: countryName,
    checkin,
    checkout,
    rooms: SPIDER_ROOMS,
    adults: SPIDER_ADULTS,
    children: SPIDER_CHILDREN,
    children_ages: [],
    click_id: clickId,
    country: countryName ?? SPIDER_MARKET_COUNTRY,
  };
};

export const runSpiderKayakRedirect = async (
  options: RunSpiderKayakRedirectOptions = {}
): Promise<SpiderKayakRedirectResult> => {
  const random = options.random ?? Math.random;
  const destinationQuery =
    options.destinationQuery?.trim() || pickRandomSpiderDestination();
  const dateRange = pickRandomSpiderDateRange(options.now ?? new Date(), random);
  const checkin = formatLocalDate(dateRange.from);
  const checkout = formatLocalDate(dateRange.to);
  const clickId = options.clickId ?? generateClickId();

  const autocomplete = await fetchKayakSuggestions(
    destinationQuery,
    SPIDER_LOCALE,
    SPIDER_MARKET_COUNTRY
  );

  if (!autocomplete.success) {
    return { ok: false, error: "Kayak autocomplete unavailable" };
  }

  const suggestion = pickSpiderSuggestion(autocomplete.suggestions);
  if (!suggestion) {
    return { ok: false, error: "No usable Kayak destination suggestion" };
  }

  const kayakInput = buildKayakInputFromSuggestion(
    suggestion,
    checkin,
    checkout,
    clickId
  );
  if (!kayakInput) {
    return { ok: false, error: "Could not map Kayak suggestion to deeplink input" };
  }

  return { ok: true, redirectUrl: buildKayakDeeplink(kayakInput) };
};
