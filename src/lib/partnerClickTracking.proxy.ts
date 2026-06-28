import { LandingTrackingService } from "@/lib/landingTrackingService";
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

  if (options.placement === "new_tab") {
    window.open(options.redirectUrl, "_blank", "noopener,noreferrer");
  } else {
    window.location.assign(options.redirectUrl);
  }
};
