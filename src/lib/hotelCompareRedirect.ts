/**
 * Shared hotel compare-and-redirect logic extracted from RelatedHotels.tsx.
 * Used by RelatedHotels (city landing pages) and NearbyHotels (sitelink page).
 *
 * Resolution: staging_hotels.external_id is NOT a Kayak hotel ID.
 * We resolve the property by querying autocomplete with "{name}, {city}, {country}"
 * and preferring the suggestion whose type contains "hotel".
 */

import { toast } from "sonner";
import {
  requestHotelDestinationAutocomplete,
  requestHotelRedirectUrl,
} from "@/lib/hotelAffiliateApi";
import {
  isDestinationPickRequiredMessage,
  isSearchValidationMessage,
} from "@/lib/hotelSearchErrors";
import { useLandingI18n } from "@/i18n/landing";
import {
  buildHotelSearchInputFromSuggestion,
  getDeviceKayakAutocompleteContext,
} from "@/lib/kayakDestinationSearch";
import { getHotelAffiliateRouting } from "@/lib/bookingMode";
import { generateClickId, LandingTrackingService } from "@/lib/landingTrackingService";
import {
  buildHotelClickSearchParams,
  trackPartnerExit,
} from "@/lib/partnerClickTracking";
import { trackMetaSearch } from "@/lib/metaPixelTracking";
import type { HotelDestinationSuggestion } from "@/types/hotels";

export const DEFAULT_COMPARE_ADULTS = 2;
export const DEFAULT_COMPARE_CHILDREN = 0;
export const DEFAULT_COMPARE_ROOMS = 1;

export const buildHotelAutocompleteQuery = (
  hotelName: string,
  cityName: string,
  countryName: string
): string => [hotelName, cityName, countryName].filter(Boolean).join(", ");

export const pickHotelSuggestion = (
  suggestions: HotelDestinationSuggestion[]
): HotelDestinationSuggestion | null => {
  if (suggestions.length === 0) return null;
  const hotelMatch = suggestions.find((s) =>
    s.type.toLowerCase().includes("hotel")
  );
  return hotelMatch ?? suggestions[0] ?? null;
};

export interface HotelCompareParams {
  hotelName: string;
  cityName: string;
  countryName: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
  children?: number;
  rooms?: number;
  trackingExtras?: Record<string, string>;
}

/**
 * Resolves a hotel by name via Kayak autocomplete, then redirects to the
 * booking partner (Kayak by default, unless ?booking=1 or ?skyscanner=1).
 *
 * Throws if the hotel cannot be resolved or the redirect fails. The caller
 * is responsible for toast error handling so that loading state can be managed
 * per-component.
 */
export async function runHotelCompareRedirect(
  params: HotelCompareParams
): Promise<void> {
  const {
    hotelName,
    cityName,
    countryName,
    checkIn,
    checkOut,
    adults = DEFAULT_COMPARE_ADULTS,
    children = DEFAULT_COMPARE_CHILDREN,
    rooms = DEFAULT_COMPARE_ROOMS,
    trackingExtras = {},
  } = params;

  const { locale, marketCountry } = getDeviceKayakAutocompleteContext();

  const suggestions = await requestHotelDestinationAutocomplete({
    query: buildHotelAutocompleteQuery(hotelName, cityName, countryName),
    locale,
    country: marketCountry,
  });

  const suggestion = pickHotelSuggestion(suggestions);
  if (!suggestion) {
    throw new Error(`Could not resolve destination for: ${hotelName}`);
  }

  const search = buildHotelSearchInputFromSuggestion(suggestion, {
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    locale,
    marketCountry,
    fallbackCountryName: countryName,
  });

  const clickId = generateClickId();
  const landingId = await LandingTrackingService.getOrCreateLandingId();
  const { affiliateSource, partner } = getHotelAffiliateRouting();

  const response = await requestHotelRedirectUrl({
    search,
    clickId,
    landingId,
    affiliateSource,
    metadata: {
      ...trackingExtras,
      destination_id: search.destinationId ?? "",
    },
  });

  try {
    trackMetaSearch(search);
  } catch {
    // Non-blocking
  }

  await trackPartnerExit({
    partner,
    redirectUrl: response.redirectUrl,
    placement: "redirect",
    clickId,
    landingId,
    iataCode: search.airportCode ?? null,
    locationId: response.entityId,
    pickupDateNew: search.checkIn ?? null,
    dropoffDateNew: search.checkOut ?? null,
    searchParams: buildHotelClickSearchParams(search, trackingExtras),
    autoParams: true,
  });
}

/**
 * Hook-friendly error toast handler matching the RelatedHotels / TrendingDestinations pattern.
 * Call this in your catch block after runHotelCompareRedirect throws.
 */
export function handleHotelCompareError(
  error: unknown,
  t: ReturnType<typeof useLandingI18n>["t"],
  hotelName: string
): void {
  const message =
    error instanceof Error
      ? error.message
      : `Rates aren't available for ${hotelName} right now.`;

  if (isDestinationPickRequiredMessage(message)) {
    toast.error(t.destinationPickTitle, { description: t.destinationPickDesc });
  } else if (isSearchValidationMessage(message)) {
    toast.error(t.reviewSearch, { description: message });
  } else {
    toast.error(t.ratesUnavailable, {
      description: message || t.ratesUnavailableDesc,
    });
  }
}
