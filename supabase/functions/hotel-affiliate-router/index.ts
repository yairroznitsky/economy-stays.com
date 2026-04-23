import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface HotelAffiliateRequest {
  query: string;
  destination_id?: string;
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
}

interface ValidatedInput {
  query: string;
  destination_id: string;
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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const KAYAK_AFFILIATE_ID = Deno.env.get("KAYAK_AFFILIATE_ID") ?? "YOUR_KAYAK_AFFILIATE_ID";
const KAYAK_DEEPLINK_BASE = Deno.env.get("KAYAK_DEEPLINK_BASE") ?? "https://www.kayak.com/in";
const KAYAK_ENCODER = Deno.env.get("KAYAK_ENCODER") ?? "27_1";
const KAYAK_ENC_EID = Deno.env.get("KAYAK_ENC_EID") ?? "0";
const KAYAK_ENC_PID = Deno.env.get("KAYAK_ENC_PID") ?? "deeplinks";
const KAYAK_UTM_CAMPAIGN = Deno.env.get("KAYAK_UTM_CAMPAIGN") ?? "deeplinks";
const KAYAK_UTM_MEDIUM = Deno.env.get("KAYAK_UTM_MEDIUM") ?? "affiliate";
const KAYAK_UTM_TERM = Deno.env.get("KAYAK_UTM_TERM") ?? "rev";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ENABLE_TRACKING_LOGS = Deno.env.get("ENABLE_TRACKING_LOGS") === "true";

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

const createRequestId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

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

export const validateInput = (payload: unknown): ValidatedInput => {
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

  if (rooms > 8) {
    throw new Error("rooms cannot exceed 8.");
  }
  if (adults > 28) {
    throw new Error("adults cannot exceed 28.");
  }
  if (adults < children) {
    throw new Error("At least one adult is required per child.");
  }
  if (adults + children > rooms * 4) {
    throw new Error("Maximum 4 guests (including children) are allowed per room.");
  }

  const clickId = input.click_id?.trim() || createRequestId();
  const landingId = input.landing_id?.trim() || "default-landing";
  const locale = input.locale?.trim() || "en";
  const country = input.country?.trim() || "US";
  const destinationId =
    input.destination_id?.trim() || query.match(/-c(\d+)/i)?.[1] || "";

  if (!destinationId) {
    throw new Error(
      "destination_id is required. Select a destination from autocomplete before searching."
    );
  }

  return {
    query,
    destination_id: destinationId,
    checkin,
    checkout,
    rooms,
    adults,
    children,
    children_ages: childrenAges,
    click_id: clickId,
    landing_id: landingId,
    locale,
    country,
  };
};

export const normalizeDestination = (input: ValidatedInput): NormalizedDestination => {
  const normalizedQuery = input.query.toLowerCase().replace(/\s+/g, " ").trim();

  return {
    original_query: input.query,
    normalized_query: normalizedQuery,
    destination_id: input.destination_id,
    destination_type: "city_or_region",
    locale: input.locale,
    country: input.country,
  };
};

export const buildKayakDeeplink = (
  input: ValidatedInput,
  destination: NormalizedDestination
) => {
  const removeDestinationCode = (value: string) =>
    value
      .replace(/-?c\d+\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

  const queryParts = input.query
    .split(",")
    .map((part) => removeDestinationCode(part))
    .filter(Boolean);
  const city = queryParts[0] ?? removeDestinationCode(input.query);
  const country = queryParts.length >= 2 ? queryParts[queryParts.length - 1] : input.country;
  const state = queryParts.length >= 3 ? queryParts[1] : "";
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

  const locationSegments = isUnitedStates
    ? [slugify(city), slugify(state), slugify(country)].filter(Boolean)
    : [slugify(city), slugify(country)].filter(Boolean);
  const locationSlug = locationSegments.join(",");
  const destinationCode = `c${destination.destination_id}`;
  const adultsSegment = `${input.adults}adults`;
  const childrenSegment =
    input.children > 0
      ? `/${input.children}children-${input.children_ages.join("-")}`
      : "";
  const roomsSegment = `${input.rooms}rooms`;
  const kayakPath = `/hotels/${locationSlug}-${destinationCode}/${input.checkin}/${input.checkout}/${adultsSegment}${childrenSegment}/${roomsSegment}`;

  const params = new URLSearchParams({
    a: KAYAK_AFFILIATE_ID,
    enc_cid: input.click_id,
    enc_eid: KAYAK_ENC_EID,
    enc_lid: input.landing_id,
    enc_pid: KAYAK_ENC_PID,
    encoder: KAYAK_ENCODER,
    url: kayakPath,
    utm_campaign: KAYAK_UTM_CAMPAIGN,
    utm_content: input.landing_id,
    utm_medium: KAYAK_UTM_MEDIUM,
    utm_source: KAYAK_AFFILIATE_ID,
    utm_term: KAYAK_UTM_TERM,
  });

  const baseUrl = new URL(KAYAK_DEEPLINK_BASE);
  if (!baseUrl.pathname || baseUrl.pathname === "/") {
    baseUrl.pathname = "/in";
  }
  baseUrl.search = "";
  baseUrl.hash = "";
  baseUrl.search = params.toString();

  return baseUrl.toString();
};

export const logTrackingEvent = async (params: {
  input: ValidatedInput;
  destination: NormalizedDestination;
  redirectUrl: string;
  requestId: string;
}) => {
  if (!ENABLE_TRACKING_LOGS || !supabase) return;

  const { input, destination, redirectUrl, requestId } = params;
  const { error } = await supabase.from("hotel_affiliate_events").insert({
    request_id: requestId,
    click_id: input.click_id,
    landing_id: input.landing_id,
    affiliate_source: "kayak",
    query: input.query,
    normalized_destination: destination,
    checkin: input.checkin,
    checkout: input.checkout,
    rooms: input.rooms,
    adults: input.adults,
    children: input.children,
    locale: input.locale,
    country: input.country,
    redirect_url: redirectUrl,
  });

  if (error) {
    throw new Error(`Failed to log tracking event: ${error.message}`);
  }
};

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse(405, {
      success: false,
      error: "Method not allowed. Use POST.",
    });
  }

  const requestId = createRequestId();

  try {
    const payload = await request.json();
    const validated = validateInput(payload);
    const normalizedDestination = normalizeDestination(validated);
    const redirectUrl = buildKayakDeeplink(validated, normalizedDestination);

    await logTrackingEvent({
      input: validated,
      destination: normalizedDestination,
      redirectUrl,
      requestId,
    });

    return jsonResponse(200, {
      success: true,
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
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return jsonResponse(400, {
      success: false,
      error: message,
      request_id: requestId,
    });
  }
});
