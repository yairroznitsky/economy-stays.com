import { buildKayakDeeplink } from "./kayakDeeplink";
import { getBookingAffiliateConfig, getKayakAffiliateConfig, readEnv } from "./env";

const resolveAffiliateSource = (value: unknown): "kayak" | "skyscanner" | "booking" => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "booking") return "booking";
    if (normalized === "skyscanner") return "skyscanner";
    if (normalized === "kayak") return "kayak";
  }
  return "kayak";
};

const buildBookingAffiliateRedirectUrl = (
  validated: { query: string; checkin: string; checkout: string; rooms: number; adults: number; children: number; children_ages: number[]; click_id: string; latitude?: number; longitude?: number },
  config: ReturnType<typeof getBookingAffiliateConfig>
): string => {
  const base = config.baseUrl;
  const url = new URL(base);
  url.searchParams.set("aid", config.tid);
  url.searchParams.set("ss", validated.query);
  url.searchParams.set("checkin", validated.checkin);
  url.searchParams.set("checkout", validated.checkout);
  url.searchParams.set("no_rooms", String(validated.rooms));
  url.searchParams.set("group_adults", String(validated.adults));
  url.searchParams.set("group_children", String(validated.children));
  url.searchParams.set("currency", config.currency);
  url.searchParams.set("lang", config.lang);
  return url.toString();
};

interface HotelAffiliateRequest {
  query: string;
  destination_id?: string;
  hotel_id?: string;
  airport_place_id?: string;
  airport_code?: string;
  airport_name?: string;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  checkin: string;
  checkout: string;
  rooms?: number;
  adults?: number;
  children?: number;
  children_ages?: number[];
  click_id?: string;
  landing_id?: string;
  locale?: string;
  country?: string;
  affiliate_source?: string;
  latitude?: number;
  longitude?: number;
}

interface ValidatedInput {
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
  landing_id: string;
  locale: string;
  country: string;
}

interface NormalizedDestination {
  original_query: string;
  normalized_query: string;
  destination_id: string;
  destination_type: "city_or_region";
  locale: string;
  country: string;
}

const SKYSCANNER_MEDIA_PARTNER_ID = readEnv("SKYSCANNER_MEDIA_PARTNER_ID") ?? "3495464";
const SKYSCANNER_UTM_SOURCE =
  readEnv("SKYSCANNER_UTM_SOURCE")?.trim() ??
  readEnv("SITE_SLUG")?.trim() ??
  readEnv("VITE_SITE_SLUG")?.trim() ??
  "affiliate";
const SKYSCANNER_MARKET = "US";
const SKYSCANNER_LOCALE = "en-US";
const SKYSCANNER_CURRENCY = "USD";

const createRequestId = () => {
  if (typeof crypto?.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const sanitizeDate = (value: string, fieldName: "checkin" | "checkout") => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) {
    throw new Error(`Invalid ${fieldName} format. Expected YYYY-MM-DD.`);
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${fieldName} date.`);
  }

  return parsed.toISOString().slice(0, 10);
};

const parsePositiveInt = (
  value: unknown,
  fallback: number,
  fieldName: string,
  min = 0,
  max?: number
) => {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed < min) {
    throw new Error(`${fieldName} must be a number greater than or equal to ${min}.`);
  }
  if (typeof max === "number" && parsed > max) {
    throw new Error(`${fieldName} must be less than or equal to ${max}.`);
  }
  return Math.floor(parsed);
};

const parseChildrenAges = (value: unknown, children: number) => {
  if (children === 0) return [] as number[];

  if (!Array.isArray(value) || value.length !== children) {
    throw new Error("children_ages must be provided for each child.");
  }

  return value.map((age, index) => {
    const parsed = Number(age);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 17) {
      throw new Error(`children_ages[${index}] must be between 0 and 17.`);
    }
    return Math.floor(parsed);
  });
};

const parseOptionalCoordinate = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return parsed;
};

const validateBookingInput = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Request body must be a JSON object.");
  }

  const input = payload as Partial<HotelAffiliateRequest>;
  const query = input.query?.trim();

  if (!query) {
    throw new Error("query is required.");
  }

  if (!input.checkin || !input.checkout) {
    throw new Error("checkin and checkout are required.");
  }

  const checkin = sanitizeDate(input.checkin, "checkin");
  const checkout = sanitizeDate(input.checkout, "checkout");
  if (checkin >= checkout) {
    throw new Error("checkout must be after checkin.");
  }

  const rooms = parsePositiveInt(input.rooms, 1, "rooms", 1);
  const adults = parsePositiveInt(input.adults, 2, "adults", 1, 6);
  const children = parsePositiveInt(input.children, 0, "children", 0, 6);
  const childrenAges = parseChildrenAges(input.children_ages, children);

  if (rooms > 8) throw new Error("rooms cannot exceed 8.");
  if (adults > 28) throw new Error("adults cannot exceed 28.");
  if (adults < rooms) {
    throw new Error("Number of adults must be greater than or equal to number of rooms.");
  }
  if (adults < children) {
    throw new Error("At least one adult is required per child.");
  }
  if (adults + children > rooms * 4) {
    throw new Error("Maximum 4 guests (including children) are allowed per room.");
  }

  return {
    query,
    checkin,
    checkout,
    rooms,
    adults,
    children,
    children_ages: childrenAges,
    click_id: input.click_id?.trim() || createRequestId(),
    landing_id: input.landing_id?.trim() || "default-landing",
    latitude: parseOptionalCoordinate(input.latitude),
    longitude: parseOptionalCoordinate(input.longitude),
  };
};

const validateInput = (payload: unknown): ValidatedInput => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Request body must be a JSON object.");
  }

  const input = payload as Partial<HotelAffiliateRequest>;
  const query = input.query?.trim();

  if (!query) {
    throw new Error("query is required.");
  }

  if (!input.checkin || !input.checkout) {
    throw new Error("checkin and checkout are required.");
  }

  const checkin = sanitizeDate(input.checkin, "checkin");
  const checkout = sanitizeDate(input.checkout, "checkout");
  if (checkin >= checkout) {
    throw new Error("checkout must be after checkin.");
  }

  const rooms = parsePositiveInt(input.rooms, 1, "rooms", 1);
  const adults = parsePositiveInt(input.adults, 2, "adults", 1, 6);
  const children = parsePositiveInt(input.children, 0, "children", 0, 6);
  const childrenAges = parseChildrenAges(input.children_ages, children);

  if (rooms > 8) throw new Error("rooms cannot exceed 8.");
  if (adults > 28) throw new Error("adults cannot exceed 28.");
  if (adults < rooms) {
    throw new Error("Number of adults must be greater than or equal to number of rooms.");
  }
  if (adults < children) {
    throw new Error("At least one adult is required per child.");
  }
  if (adults + children > rooms * 4) {
    throw new Error("Maximum 4 guests (including children) are allowed per room.");
  }

  const destinationId =
    input.destination_id?.trim() || query.match(/-c(\d+)/i)?.[1] || "";

  const airportCode = input.airport_code?.trim().toUpperCase() || undefined;
  const airportName = input.airport_name?.trim() || undefined;
  const hasAirportIata = Boolean(
    airportCode && airportName && /^[A-Z]{3}$/.test(airportCode)
  );

  if (!destinationId && !hasAirportIata) {
    throw new Error(
      "destination_id is required. Select a destination from autocomplete before searching."
    );
  }

  if (destinationId && !/^\d+$/.test(destinationId) && !hasAirportIata) {
    throw new Error(
      "destination_id must be a numeric destination ID. Select a destination from the list."
    );
  }

  return {
    query,
    destination_id: destinationId || airportCode || "",
    hotel_id: input.hotel_id?.trim() || undefined,
    airport_place_id: input.airport_place_id?.trim() || undefined,
    airport_code: airportCode,
    airport_name: airportName,
    city_name: input.city_name?.trim() || undefined,
    state_name: input.state_name?.trim() || undefined,
    country_name: input.country_name?.trim() || undefined,
    checkin,
    checkout,
    rooms,
    adults,
    children,
    children_ages: childrenAges,
    click_id: input.click_id?.trim() || createRequestId(),
    landing_id: input.landing_id?.trim() || "default-landing",
    locale: input.locale?.trim() || "en",
    country: input.country?.trim().toUpperCase() || "US",
  };
};

const normalizeDestination = (input: ValidatedInput): NormalizedDestination => ({
  original_query: input.query,
  normalized_query: input.query.toLowerCase().replace(/\s+/g, " ").trim(),
  destination_id: input.destination_id,
  destination_type: "city_or_region",
  locale: input.locale,
  country: input.country,
});

const parseIataCode = (value: string | undefined): string | null => {
  const trimmed = value?.trim().toUpperCase() ?? "";
  return /^[A-Z]{3}$/.test(trimmed) ? trimmed : null;
};

const resolveSkyscannerEntityId = (input: ValidatedInput): string | null => {
  const isAirportSearch = Boolean(input.airport_code && input.airport_name);
  if (isAirportSearch) {
    const iata = parseIataCode(input.airport_code);
    if (iata) return iata;
  }
  if (/^\d+$/.test(input.destination_id)) return input.destination_id;
  return parseIataCode(input.destination_id);
};

const buildSkyscannerHotelDeeplink = (input: ValidatedInput) => {
  const entityId = resolveSkyscannerEntityId(input);
  if (!entityId) {
    throw new Error("Could not resolve destination. Please select a different result.");
  }

  const qs = new URLSearchParams({
    entity_id: entityId,
    checkin: input.checkin,
    checkout: input.checkout,
    adults: String(input.adults),
    rooms: String(input.rooms),
    market: SKYSCANNER_MARKET,
    locale: SKYSCANNER_LOCALE,
    currency: SKYSCANNER_CURRENCY,
  });

  if (SKYSCANNER_MEDIA_PARTNER_ID) {
    qs.set("mediaPartnerId", SKYSCANNER_MEDIA_PARTNER_ID);
    qs.set("utm_term", input.click_id);
    qs.set("utm_source", SKYSCANNER_UTM_SOURCE);
    qs.set("utm_medium", "affiliate");
    return `https://skyscanner.net/g/referrals/v1/hotels/day-view?${qs.toString()}`;
  }

  return `https://www.skyscanner.net/hotels/search?${qs.toString()}`;
};

export const handleHotelAffiliateRouter = async (
  payload: unknown
): Promise<{ status: number; body: Record<string, unknown> }> => {
  const requestId = createRequestId();
  const kayakConfig = getKayakAffiliateConfig();

  try {
    const affiliateSource = resolveAffiliateSource(
      payload && typeof payload === "object"
        ? (payload as Partial<HotelAffiliateRequest>).affiliate_source
        : undefined
    );

    if (affiliateSource === "booking") {
      const validated = validateBookingInput(payload);
      const redirectUrl = buildBookingAffiliateRedirectUrl(
        validated,
        getBookingAffiliateConfig()
      );

      return {
        status: 200,
        body: {
          success: true,
          entity_id: validated.query,
          redirect_url: redirectUrl,
          tracking_payload: {
            request_id: requestId,
            click_id: validated.click_id,
            landing_id: validated.landing_id,
            affiliate_source: "booking",
            query: validated.query,
          },
        },
      };
    }

    if (affiliateSource === "kayak") {
      const validated = validateInput(payload);
      const normalizedDestination = normalizeDestination(validated);
      const redirectUrl = buildKayakDeeplink(
        validated,
        normalizedDestination,
        kayakConfig
      );

      return {
        status: 200,
        body: {
          success: true,
          entity_id: validated.destination_id,
          normalized_destination: normalizedDestination,
          redirect_url: redirectUrl,
          tracking_payload: {
            request_id: requestId,
            click_id: validated.click_id,
            landing_id: validated.landing_id,
            affiliate_source: "kayak",
            locale: validated.locale,
            country: validated.country,
            query: validated.query,
          },
        },
      };
    }

    const validated = validateInput(payload);
    const normalizedDestination = normalizeDestination(validated);
    const redirectUrl = buildSkyscannerHotelDeeplink(validated);
    const skyscannerEntityId = resolveSkyscannerEntityId(validated) ?? validated.destination_id;

    return {
      status: 200,
      body: {
        success: true,
        entity_id: skyscannerEntityId,
        normalized_destination: normalizedDestination,
        redirect_url: redirectUrl,
        tracking_payload: {
          request_id: requestId,
          click_id: validated.click_id,
          landing_id: validated.landing_id,
          affiliate_source: "skyscanner",
          locale: validated.locale,
          country: validated.country,
          query: validated.query,
        },
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return {
      status: 400,
      body: { success: false, error: message, request_id: requestId },
    };
  }
};
