import { parseEdgeFunctionInvokeError } from "@/lib/hotelSearchErrors";
import { getDeviceKayakAutocompleteContext } from "@/lib/kayakDestinationSearch";
import { hasSupabaseClientConfig, supabase } from "@/lib/supabaseClient";
import { parseNumericEntityId } from "@/lib/skyscannerHotels";
import type {
  HotelAffiliateRouteResponse,
  HotelAffiliateRouterResponse,
  HotelAutocompleteRequest,
  HotelAutocompleteResponse,
  HotelDestinationSuggestion,
  HotelRedirectRequest,
} from "@/types/hotels";

const AFFILIATE_EDGE_FUNCTION_NAME = "hotel-affiliate-router";
const KAYAK_AUTOCOMPLETE_FUNCTION_NAME = "kayak-autocomplete";
const AUTOSUGGEST_CACHE_TTL_MS = 10 * 60 * 1000;
const KAYAK_AUTOCOMPLETE_MIN_QUERY_LENGTH = 3;

const autosuggestCache = new Map<string, { expiresAt: number; results: HotelDestinationSuggestion[] }>();

const assertSupabaseConfigured = () => {
  if (!hasSupabaseClientConfig) {
    throw new Error(
      "Supabase client configuration missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
    );
  }
};

const assertValidDestinationId = (destinationId: string | undefined): string => {
  const entityId = parseNumericEntityId(destinationId);
  if (!entityId) {
    throw new Error(
      "destination_id is required. Select a destination from autocomplete before searching."
    );
  }
  return entityId;
};

const resolveRouterEntityId = (
  responseEntityId: unknown,
  requestDestinationId: string
): string => {
  const entityId = parseNumericEntityId(responseEntityId, requestDestinationId);
  if (!entityId) {
    throw new Error("Invalid redirect response: missing entity_id.");
  }
  return entityId;
};

const resolveAutocompleteContext = (payload: HotelAutocompleteRequest) => {
  const device = getDeviceKayakAutocompleteContext();
  return {
    locale: payload.locale?.trim() || device.locale,
    country: payload.country?.trim().toUpperCase() || device.marketCountry,
  };
};

const filterKayakSuggestions = (
  suggestions: HotelDestinationSuggestion[]
): HotelDestinationSuggestion[] =>
  suggestions
    .filter((suggestion) => {
      const type = suggestion.type.toLowerCase();
      return type.includes("city") || type.includes("hotel") || type.includes("region");
    })
    .slice(0, 10);

export const requestHotelRedirectUrl = async (
  payload: HotelRedirectRequest
): Promise<HotelAffiliateRouteResponse> => {
  assertSupabaseConfigured();
  const affiliateSource = payload.affiliateSource ?? "kayak";
  const requestDestinationId =
    affiliateSource === "booking"
      ? payload.search.destinationId
      : assertValidDestinationId(payload.search.destinationId);

  const { locale, marketCountry } = getDeviceKayakAutocompleteContext();

  const { data, error } = await supabase.functions.invoke<HotelAffiliateRouterResponse>(
    AFFILIATE_EDGE_FUNCTION_NAME,
    {
      body: {
        query: payload.search.destination,
        destination_id: requestDestinationId,
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
        affiliate_source: affiliateSource,
        latitude: payload.search.latitude,
        longitude: payload.search.longitude,
        locale: payload.search.locale ?? locale,
        country: payload.search.country ?? marketCountry,
      },
    }
  );

  if (error) {
    throw new Error(await parseEdgeFunctionInvokeError(error));
  }

  if (!data?.success || !data.redirect_url) {
    const message =
      data && !data.success && data.error
        ? data.error
        : "Unable to generate affiliate redirect URL.";
    throw new Error(message);
  }

  return {
    redirectUrl: data.redirect_url,
    entityId:
      affiliateSource === "booking"
        ? String(data.entity_id ?? payload.search.destination)
        : resolveRouterEntityId(data.entity_id, requestDestinationId ?? ""),
    provider: affiliateSource,
    clickId: data.tracking_payload?.click_id ?? payload.clickId,
  };
};

export const requestHotelDestinationAutocomplete = async (
  payload: HotelAutocompleteRequest
): Promise<HotelDestinationSuggestion[]> => {
  assertSupabaseConfigured();

  const query = payload.query.trim();
  if (query.length < KAYAK_AUTOCOMPLETE_MIN_QUERY_LENGTH) {
    return [];
  }

  const { locale, country } = resolveAutocompleteContext(payload);
  const cacheKey = `kayak:${query.toLowerCase()}:${country}:${locale}`;
  const cached = autosuggestCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.results;
  }

  const { data, error } = await supabase.functions.invoke<HotelAutocompleteResponse>(
    KAYAK_AUTOCOMPLETE_FUNCTION_NAME,
    {
      body: {
        query,
        locale,
        country,
      },
    }
  );

  if (error) {
    throw new Error(await parseEdgeFunctionInvokeError(error));
  }

  const results = filterKayakSuggestions(data?.suggestions ?? []);

  autosuggestCache.set(cacheKey, {
    results,
    expiresAt: Date.now() + AUTOSUGGEST_CACHE_TTL_MS,
  });

  return results;
};
