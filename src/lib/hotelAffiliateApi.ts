import { buildBookingSearchResultsUrl } from "@/lib/bookingHotels";
import { buildCjBookingUrl } from "@/lib/cjBooking";
import { isFacebookAdsTraffic } from "@/lib/facebookTraffic";
import { buildKayakDeeplink, getKayakAffiliateConfig } from "@/lib/kayakDeeplink";
import {
  getDeviceKayakAutocompleteContext,
  pickBestIataSuggestion,
} from "@/lib/kayakDestinationSearch";
import { invokeEdgeFunction } from "@/lib/edgeFunctionClient";
import { parseNumericEntityId, parseIataCode } from "@/lib/skyscannerHotels";
import type {
  HotelAffiliateRouteResponse,
  HotelAutocompleteRequest,
  HotelAutocompleteResponse,
  HotelDestinationSuggestion,
  HotelRedirectRequest,
} from "@/types/hotels";

const KAYAK_AUTOCOMPLETE_FUNCTION_NAME = "kayak-autocomplete";
const AUTOSUGGEST_CACHE_TTL_MS = 10 * 60 * 1000;
const KAYAK_AUTOCOMPLETE_MIN_QUERY_LENGTH = 3;

const autosuggestCache = new Map<string, { expiresAt: number; results: HotelDestinationSuggestion[] }>();

const assertValidKayakDestinationId = (search: HotelRedirectRequest["search"]): string => {
  const numericId = parseNumericEntityId(search.destinationId);
  if (numericId) return numericId;

  const hasAirportDeeplink = Boolean(
    search.airportPlaceId && search.airportCode && search.airportName
  );
  if (hasAirportDeeplink && search.destinationId?.trim()) {
    return search.destinationId.trim();
  }

  throw new Error(
    "destination_id is required. Select a destination from autocomplete before searching."
  );
};

const assertValidSkyscannerEntityId = (search: HotelRedirectRequest["search"]): string => {
  const entityId = resolveSkyscannerEntityId({
    destinationId: search.destinationId,
    airportCode: search.airportCode,
    airportName: search.airportName,
  });
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
  const entityId =
    parseNumericEntityId(responseEntityId, requestDestinationId) ??
    parseIataCode(responseEntityId, requestDestinationId);
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

const prioritizeIataSuggestions = (
  query: string,
  suggestions: HotelDestinationSuggestion[]
): HotelDestinationSuggestion[] => {
  const best = pickBestIataSuggestion(query, suggestions);
  if (!best) return suggestions;
  return [best, ...suggestions.filter((suggestion) => suggestion.id !== best.id)];
};

const filterKayakSuggestions = (
  query: string,
  suggestions: HotelDestinationSuggestion[]
): HotelDestinationSuggestion[] =>
  prioritizeIataSuggestions(
    query,
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
  ).slice(0, 10);

const buildKayakRedirect = (
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

  const destinationId = assertValidKayakDestinationId(search);
  const { marketCountry } = getDeviceKayakAutocompleteContext();
  const fromFacebookAds = isFacebookAdsTraffic();

  const redirectUrl = buildKayakDeeplink(
    {
      query: destination,
      destination_id: destinationId,
      hotel_id: search.hotelId,
      airport_place_id: search.airportPlaceId,
      airport_code: search.airportCode,
      airport_name: search.airportName,
      city_name: search.cityName,
      state_name: search.stateName,
      country_name: search.countryName,
      checkin: search.checkIn,
      checkout: search.checkOut,
      rooms: search.rooms ?? 1,
      adults: search.adults ?? 2,
      children: search.children ?? 0,
      children_ages: search.childrenAges ?? [],
      click_id: payload.clickId,
      country: search.country ?? marketCountry,
      from_facebook_ads: fromFacebookAds,
    },
    { destination_id: destinationId }
  );

  return {
    redirectUrl,
    entityId: destinationId,
    provider: "kayak",
    clickId: payload.clickId,
  };
};

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

  const bookingInput = {
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
  };

  return {
    redirectUrl: buildCjBookingUrl(bookingInput),
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

  // Kayak is the primary provider — deeplink built entirely client-side.
  // Skyscanner routing via edge function has been removed.
  return buildKayakRedirect(payload);
};

export const requestHotelDestinationAutocomplete = async (
  payload: HotelAutocompleteRequest
): Promise<HotelDestinationSuggestion[]> => {
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

  const results = filterKayakSuggestions(query, data?.suggestions ?? []);

  autosuggestCache.set(cacheKey, {
    results,
    expiresAt: Date.now() + AUTOSUGGEST_CACHE_TTL_MS,
  });

  return results;
};
