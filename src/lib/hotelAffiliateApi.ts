import { parseEdgeFunctionInvokeError } from "@/lib/hotelSearchErrors";
import { hasSupabaseClientConfig, supabase } from "@/lib/supabaseClient";
import type {
  HotelAffiliateRouteResponse,
  HotelAutocompleteRequest,
  HotelDestinationSuggestion,
  HotelRedirectRequest,
} from "@/types/hotels";

const AFFILIATE_EDGE_FUNCTION_NAME = "hotel-affiliate-router";
const SKYSCANNER_PLACES_FUNCTION_NAME = "skyscanner-places";
const AUTOSUGGEST_CACHE_TTL_MS = 10 * 60 * 1000;

const autosuggestCache = new Map<string, { expiresAt: number; results: HotelDestinationSuggestion[] }>();

interface SkyscannerPlaceSuggestion {
  id: string;
  name: string;
  displayName: string;
  city: string;
  country: string;
  code: string;
  type: string;
  partnerMetadata?: {
    entityId?: string;
    entityName?: string;
    skyscannerClass?: string;
    location?: string | null;
  };
}

const toSkyscannerLocale = (locale: string | undefined, market: string) => {
  const trimmed = (locale ?? "en").trim();
  if (trimmed.includes("-")) return trimmed;
  return `${trimmed.toLowerCase()}-${market}`;
};

const mapSkyscannerPlaceToSuggestion = (
  place: SkyscannerPlaceSuggestion
): HotelDestinationSuggestion => {
  const skyscannerClass = place.partnerMetadata?.skyscannerClass?.toLowerCase() ?? "";
  const type = skyscannerClass === "hotel" ? "hotel" : place.type;

  return {
    id: place.id,
    label: place.name,
    type,
    subtitle:
      place.displayName && place.displayName !== place.name ? place.displayName : undefined,
    raw: {
      entity_id: place.partnerMetadata?.entityId ?? place.id,
      city: place.city,
      country: place.country,
      code: place.code,
      skyscanner_class: place.partnerMetadata?.skyscannerClass ?? null,
      location: place.partnerMetadata?.location ?? null,
    },
  };
};

const assertSupabaseConfigured = () => {
  if (!hasSupabaseClientConfig) {
    throw new Error(
      "Supabase client configuration missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
    );
  }
};

export const requestHotelRedirectUrl = async (
  payload: HotelRedirectRequest
): Promise<HotelAffiliateRouteResponse> => {
  assertSupabaseConfigured();

  const { data, error } = await supabase.functions.invoke<{
    success: boolean;
    redirect_url?: string;
    error?: string;
    tracking_payload?: { click_id?: string };
  }>(AFFILIATE_EDGE_FUNCTION_NAME, {
    body: {
      query: payload.search.destination,
      destination_id: payload.search.destinationId,
      hotel_id: payload.search.hotelId,
      airport_place_id: payload.search.airportPlaceId,
      airport_code: payload.search.airportCode,
      airport_name: payload.search.airportName,
      city_name: payload.search.cityName,
      state_name: payload.search.stateName,
      country_name: payload.search.countryName,
      checkin: payload.search.checkIn,
      checkout: payload.search.checkOut,
      rooms: payload.search.rooms,
      adults: payload.search.adults,
      children: payload.search.children,
      children_ages: payload.search.childrenAges,
      click_id: payload.clickId,
      landing_id: payload.landingId,
      locale: payload.search.locale ?? "en",
      country: payload.search.country ?? "US",
    },
  });

  if (error) {
    throw new Error(await parseEdgeFunctionInvokeError(error));
  }

  if (!data?.success || !data.redirect_url) {
    throw new Error(data?.error || "Unable to generate affiliate redirect URL.");
  }

  return {
    redirectUrl: data.redirect_url,
    provider: payload.affiliateSource ?? "skyscanner",
    clickId: data.tracking_payload?.click_id ?? payload.clickId,
  };
};

export const requestHotelDestinationAutocomplete = async (
  payload: HotelAutocompleteRequest
): Promise<HotelDestinationSuggestion[]> => {
  assertSupabaseConfigured();

  const query = payload.query.trim();
  if (query.length < 2) {
    return [];
  }

  const market = (payload.country ?? "US").trim().toUpperCase();
  const locale = toSkyscannerLocale(payload.locale, market);
  const cacheKey = `skyscanner:hotels:${query.toLowerCase()}:${market}:${locale}`;
  const cached = autosuggestCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.results;
  }

  const params = new URLSearchParams({
    q: query,
    market,
    locale,
    product: "hotels",
  });

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${SKYSCANNER_PLACES_FUNCTION_NAME}?${params}`,
    {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    }
  );

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Unable to fetch destination suggestions.";
    throw new Error(message);
  }

  if (!Array.isArray(data)) {
    return [];
  }

  const results = (data as SkyscannerPlaceSuggestion[])
    .map(mapSkyscannerPlaceToSuggestion)
    .slice(0, 10);

  autosuggestCache.set(cacheKey, {
    results,
    expiresAt: Date.now() + AUTOSUGGEST_CACHE_TTL_MS,
  });

  return results;
};
