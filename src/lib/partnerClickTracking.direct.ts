import { trackGoogleAdsConversion } from "@/lib/googleAdsTracking";
import { generateClickId, LandingTrackingService } from "@/lib/landingTrackingService";
import { postTrackingJson } from "@/lib/trackingApi";
import type { HotelSearchInput } from "@/types/hotels";

export type PartnerPlacement = "redirect" | "new_tab";

export interface PartnerExitOptions {
  partner: string;
  redirectUrl: string;
  placement: PartnerPlacement;
  clickId?: string;
  landingId?: string;
  iataCode?: string | null;
  locationId?: string | null;
  pickupDateNew?: string | null;
  pickupTimeNew?: string | null;
  dropoffDateNew?: string | null;
  dropoffTimeNew?: string | null;
  searchParams?: Record<string, string>;
  autoParams?: boolean;
  onBeforeRedirect?: () => void | Promise<void>;
}

const parseWindowSearchParams = (): Record<string, string> => {
  const params: Record<string, string> = {};
  new URLSearchParams(window.location.search).forEach((value, key) => {
    params[key] = value;
  });

  const utmSource = (params.utm_source ?? "").toLowerCase();
  const isTikTokTraffic = Boolean(params.ttclid) || utmSource === "tiktok";

  if (isTikTokTraffic && !params.tk) {
    params.tk = "1";
  }

  return params;
};

export const buildHotelClickSearchParams = (
  search: HotelSearchInput,
  extra?: Record<string, string>
): Record<string, string> => {
  const merged: Record<string, string> = {
    ...parseWindowSearchParams(),
    ...extra,
  };

  if (search.destination) merged.destination = search.destination;
  if (search.destinationId) merged.destination_id = search.destinationId;
  if (search.hotelId) merged.hotel_id = search.hotelId;
  if (search.airportCode) merged.airport_code = search.airportCode;
  if (search.checkIn) merged.check_in = search.checkIn;
  if (search.checkOut) merged.check_out = search.checkOut;
  if (search.adults != null) merged.adults = String(search.adults);
  if (search.children != null) merged.children = String(search.children);
  if (search.rooms != null) merged.rooms = String(search.rooms);
  if (search.locale) merged.locale = search.locale;
  if (search.country) merged.country = search.country;

  return merged;
};

const insertRentalClick = async (options: {
  clickId: string;
  landingId: string | null;
  partner: string;
  redirectUrl: string;
  placement: PartnerPlacement;
  iataCode: string | null;
  locationId: string | null;
  pickupDateNew: string | null;
  pickupTimeNew: string | null;
  dropoffDateNew: string | null;
  dropoffTimeNew: string | null;
  searchParams: Record<string, string>;
  autoParams: boolean;
}): Promise<void> => {
  try {
    await postTrackingJson("/api/exits", {
      click_id: options.clickId,
      visit_id: options.landingId,
      partner: options.partner,
      iata_code: options.iataCode,
      location_id: options.locationId,
      pickup_date_new: options.pickupDateNew,
      pickup_time_new: options.pickupTimeNew,
      dropoff_date_new: options.dropoffDateNew,
      dropoff_time_new: options.dropoffTimeNew,
      timestamp: new Date().toISOString(),
      placement: options.placement,
      redirect_url: options.redirectUrl,
      search_params: options.searchParams,
      auto_params: options.autoParams,
    });
  } catch (error) {
    console.warn("[tracking] rental_clicks insert failed", error);
  }
};

/**
 * Logs a click to rental_clicks without performing any navigation.
 * Use when you need a fire-and-forget record for a tab opened manually
 * (e.g. the Kayak leg of the 2pop flow).
 */
export const recordPartnerClick = async (options: {
  partner: string;
  redirectUrl: string;
  placement: PartnerPlacement;
  clickId: string;
  landingId: string | null;
  iataCode?: string | null;
  locationId?: string | null;
  pickupDateNew?: string | null;
  dropoffDateNew?: string | null;
  searchParams?: Record<string, string>;
}): Promise<void> => {
  await insertRentalClick({
    clickId: options.clickId,
    landingId: options.landingId,
    partner: options.partner,
    redirectUrl: options.redirectUrl,
    placement: options.placement,
    iataCode: options.iataCode ?? null,
    locationId: options.locationId ?? null,
    pickupDateNew: options.pickupDateNew ?? null,
    pickupTimeNew: null,
    dropoffDateNew: options.dropoffDateNew ?? null,
    dropoffTimeNew: null,
    searchParams: options.searchParams ?? {},
    autoParams: false,
  });
};

export const trackPartnerExit = async (
  options: PartnerExitOptions
): Promise<void> => {
  let landingId =
    options.landingId ?? LandingTrackingService.getCurrentLandingId();

  if (!landingId) {
    try {
      landingId = await LandingTrackingService.getOrCreateLandingId();
    } catch {
      landingId = null;
    }
  }

  const clickId = options.clickId ?? generateClickId();
  const searchParams = options.searchParams ?? parseWindowSearchParams();

  const recordPromise = insertRentalClick({
    clickId,
    landingId,
    partner: options.partner,
    redirectUrl: options.redirectUrl,
    placement: options.placement,
    iataCode: options.iataCode ?? null,
    locationId: options.locationId ?? null,
    pickupDateNew: options.pickupDateNew ?? null,
    pickupTimeNew: options.pickupTimeNew ?? null,
    dropoffDateNew: options.dropoffDateNew ?? null,
    dropoffTimeNew: options.dropoffTimeNew ?? null,
    searchParams,
    autoParams: options.autoParams ?? false,
  });

  await Promise.race([
    recordPromise,
    new Promise<void>((resolve) => {
      setTimeout(resolve, 500);
    }),
  ]).catch(() => {});

  try {
    await options.onBeforeRedirect?.();
  } catch {
    // Tracking hooks must not block redirect.
  }

  if (options.placement === "new_tab") {
    trackGoogleAdsConversion({ clickId });
    window.open(options.redirectUrl, "_blank", "noopener,noreferrer");
  } else {
    // Navigate in event_callback so the conversion hit isn't dropped.
    trackGoogleAdsConversion({
      clickId,
      redirectUrl: options.redirectUrl,
    });
  }
};
