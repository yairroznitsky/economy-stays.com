import { parseEdgeFunctionInvokeError } from "@/lib/hotelSearchErrors";
import { hasSupabaseClientConfig, supabase } from "@/lib/supabaseClient";
import {
  ensureSkyscannerHotelLocalization,
  SKYSCANNER_LOCALE,
  SKYSCANNER_MARKET,
} from "@/lib/skyscannerDestinationSearch";
import { parseNumericEntityId } from "@/lib/skyscannerHotels";
import type {
  HotelAffiliateRouteResponse,
  HotelAffiliateRouterResponse,
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

interface SkyscannerWebsitePlace {
  entity_id?: string;
  entity_name?: string;
  hierarchy?: string;
  location?: string;
  class?: string;
  type?: string;
}

const extractIataCode = (entityName: string): string => {
  const match = entityName.match(/\(([A-Z]{3})\)\s*$/);
  return match?.[1] ?? "";
};

const mapWebsitePlaceType = (skyscannerClass: string, type: string): string => {
  const normalized = `${skyscannerClass} ${type}`.toLowerCase();
  if (normalized.includes("hotel")) return "hotel";
  if (normalized.includes("airport")) return "airport";
  if (normalized.includes("city")) return "city";
  return "location";
};

const transformWebsitePlace = (item: SkyscannerWebsitePlace): SkyscannerPlaceSuggestion | null => {
  const entityId = parseNumericEntityId(item.entity_id);
  if (!entityId) return null;

  const entityName = String(item.entity_name ?? `Entity ${entityId}`);
  const hierarchy = String(item.hierarchy ?? "");
  const parts = hierarchy.split("|").filter(Boolean);
  const skyscannerClass = String(item.class ?? item.type ?? "");
  const iataCode = extractIataCode(entityName);

  return {
    id: entityId,
    name: entityName.replace(/\s*\([A-Z]{3}\)\s*$/, "").trim() || entityName,
    displayName: hierarchy ? parts.join(", ") : entityName,
    city: parts[0] ?? "",
    country: parts[parts.length - 1] ?? "",
    code: iataCode || entityId,
    type: mapWebsitePlaceType(skyscannerClass, String(item.type ?? "")),
    partnerMetadata: {
      entityId,
      entityName,
      skyscannerClass,
      location: item.location ?? null,
    },
  };
};

const normalizeSkyscannerPlaces = (data: unknown): SkyscannerPlaceSuggestion[] => {
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => transformWebsitePlace(item as SkyscannerWebsitePlace))
    .filter((place): place is SkyscannerPlaceSuggestion => place !== null);
};

const mapSkyscannerPlaceToSuggestion = (
  place: SkyscannerPlaceSuggestion
): HotelDestinationSuggestion | null => {
  const entityId = parseNumericEntityId(
    place.partnerMetadata?.entityId,
    place.id
  );
  if (!entityId) {
    return null;
  }

  const skyscannerClass = place.partnerMetadata?.skyscannerClass?.toLowerCase() ?? "";
  const type = skyscannerClass === "hotel" ? "hotel" : place.type;

  return {
    id: entityId,
    label: place.name,
    type,
    subtitle:
      place.displayName && place.displayName !== place.name ? place.displayName : undefined,
    raw: {
      entity_id: entityId,
      city: place.city,
      country: place.country,
      code: place.code,
      skyscanner_class: place.partnerMetadata?.skyscannerClass ?? null,
      location: place.partnerMetadata?.location ?? null,
    },
  };
};

const toDestinationSuggestions = (places: SkyscannerPlaceSuggestion[]): HotelDestinationSuggestion[] =>
  places
    .map(mapSkyscannerPlaceToSuggestion)
    .filter((suggestion): suggestion is HotelDestinationSuggestion => suggestion !== null)
    .slice(0, 10);

const fetchSkyscannerHotelsAutosuggestFromBrowser = async (
  query: string,
  market: string,
  locale: string
): Promise<SkyscannerPlaceSuggestion[]> => {
  if (typeof window === "undefined") {
    return [];
  }

  const url =
    `https://www.skyscanner.net/g/autosuggest-search/api/v1/search-hotel/` +
    `${market}/${locale}/${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      referer: "https://www.skyscanner.net/hotels",
      "skyscanner-client-name": "hotel-search-controls",
    },
  });

  if (!response.ok) {
    return [];
  }

  const data: unknown = await response.json().catch(() => null);
  return normalizeSkyscannerPlaces(data);
};

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

export const requestHotelRedirectUrl = async (
  payload: HotelRedirectRequest
): Promise<HotelAffiliateRouteResponse> => {
  assertSupabaseConfigured();
  const affiliateSource = payload.affiliateSource ?? "skyscanner";
  const requestDestinationId =
    affiliateSource === "booking"
      ? payload.search.destinationId
      : assertValidDestinationId(payload.search.destinationId);

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
        locale: SKYSCANNER_LOCALE,
        country: SKYSCANNER_MARKET,
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
    redirectUrl: ensureSkyscannerHotelLocalization(data.redirect_url),
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
  if (query.length < 2) {
    return [];
  }

  const market = SKYSCANNER_MARKET;
  const locale = SKYSCANNER_LOCALE;
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

  let places: SkyscannerPlaceSuggestion[] = Array.isArray(data) ? data : [];

  if (!response.ok || places.length === 0) {
    const browserPlaces = await fetchSkyscannerHotelsAutosuggestFromBrowser(query, market, locale);
    if (browserPlaces.length > 0) {
      places = browserPlaces;
    } else if (!response.ok) {
      const message =
        data &&
        typeof data === "object" &&
        "error" in data &&
        typeof (data as { error?: unknown }).error === "string"
          ? (data as { error: string }).error
          : "Unable to fetch destination suggestions.";
      throw new Error(message);
    }
  }

  const results = toDestinationSuggestions(places);

  autosuggestCache.set(cacheKey, {
    results,
    expiresAt: Date.now() + AUTOSUGGEST_CACHE_TTL_MS,
  });

  return results;
};
