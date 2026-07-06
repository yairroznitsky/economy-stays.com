import { buildBookingSearchResultsUrl } from "@/lib/bookingHotels";
import { getDeviceKayakAutocompleteContext } from "@/lib/kayakDestinationSearch";
import {
  assertEdgeFunctionsAvailable,
  invokeEdgeFunction,
} from "@/lib/edgeFunctionClient";
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

const normalizeKayakSuggestionType = (type: string): string => {
  const normalized = type.trim().toLowerCase();
  if (normalized === "ct" || normalized.includes("city")) return "city";
  if (normalized.includes("hotel") || normalized.includes("hostel")) return "hotel";
  if (normalized === "ap" || normalized.includes("airport")) return "airport";
  if (normalized === "reg" || normalized.includes("region") || normalized.includes("state")) {
    return "region";
  }
  return normalized || "unknown";
};

const mapKayakAutocompleteSuggestion = (
  suggestion: HotelDestinationSuggestion
): HotelDestinationSuggestion => ({
  id: suggestion.id,
  label: suggestion.label,
  type: normalizeKayakSuggestionType(suggestion.type),
  subtitle: suggestion.subtitle,
  raw: suggestion.raw,
});

const filterKayakSuggestions = (
  suggestions: HotelDestinationSuggestion[]
): HotelDestinationSuggestion[] =>
  suggestions
    .map(mapKayakAutocompleteSuggestion)
    .filter((suggestion) => {
      const type = suggestion.type.toLowerCase();
      return (
        type.includes("city") ||
        type.includes("hotel") ||
        type.includes("region") ||
        type.includes("airport")
      );
    })
    .slice(0, 10);

const buildBookingRedirect = (
  payload: HotelRedirectRequest
): HotelAffiliateRouteResponse => {
  const search = payload.search;
  const destination = search.destination?.trim();
  if (!destination) {
    throw new Error("Destination is required.");
  }
  if (!search.checkIn || !search.checkOut) {
    throw new Error("Check-in and check-out dates are required.");
  }

  return {
    redirectUrl: buildBookingSearchResultsUrl({
      query: destination,
      checkin: search.checkIn,
      checkout: search.checkOut,
      rooms: search.rooms ?? 1,
      adults: search.adults ?? 2,
      children: search.children ?? 0,
      children_ages: search.childrenAges ?? [],
      click_id: payload.clickId,
      latitude: search.latitude,
      longitude: search.longitude,
    }),
    entityId: destination,
    provider: "booking",
    clickId: payload.clickId,
  };
};

export const requestHotelRedirectUrl = async (
  payload: HotelRedirectRequest
): Promise<HotelAffiliateRouteResponse> => {
  const affiliateSource = payload.affiliateSource ?? "kayak";

  if (affiliateSource === "booking") {
    return buildBookingRedirect(payload);
  }

  assertEdgeFunctionsAvailable();
  const requestDestinationId = assertValidDestinationId(payload.search.destinationId);

  const { locale, marketCountry } = getDeviceKayakAutocompleteContext();

  const data = await invokeEdgeFunction<HotelAffiliateRouterResponse>(
    AFFILIATE_EDGE_FUNCTION_NAME,
    {
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
    }
  );

  if (!data?.success || !data.redirect_url) {
    const message =
      data && !data.success && data.error
        ? data.error
        : "Unable to generate affiliate redirect URL.";
    throw new Error(message);
  }

  return {
    redirectUrl: data.redirect_url,
    entityId: resolveRouterEntityId(data.entity_id, requestDestinationId ?? ""),
    provider: affiliateSource,
    clickId: data.tracking_payload?.click_id ?? payload.clickId,
  };
};

export const requestHotelDestinationAutocomplete = async (
  payload: HotelAutocompleteRequest
): Promise<HotelDestinationSuggestion[]> => {
  assertEdgeFunctionsAvailable();

  const query = payload.query.trim();
  if (query.length < KAYAK_AUTOCOMPLETE_MIN_QUERY_LENGTH) {
    return [];
  }

  const { locale, country } = resolveAutocompleteContext(payload);
  const cacheKey = `kayak:hotels:${query.toLowerCase()}:${country}:${locale}`;
  const cached = autosuggestCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.results;
  }

  const data = await invokeEdgeFunction<HotelAutocompleteResponse>(
    KAYAK_AUTOCOMPLETE_FUNCTION_NAME,
    {
      query,
      locale,
      country,
    }
  );

  const results = filterKayakSuggestions(data?.suggestions ?? []);

  autosuggestCache.set(cacheKey, {
    results,
    expiresAt: Date.now() + AUTOSUGGEST_CACHE_TTL_MS,
  });

  return results;
};
