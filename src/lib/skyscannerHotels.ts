export interface HotelLocation {
  id: string;
  name: string;
  displayName: string;
  city: string;
  country: string;
  code: string;
  type: "city" | "airport" | "location";
  partnerMetadata?: {
    entityId: string;
    entityName: string;
    product: string;
    source: string;
  };
}

export interface HotelSearchParams {
  checkin: string;
  checkout: string;
  adults: number;
  rooms: number;
}

export interface SelectedLocation {
  id: string;
  partnerMetadata?: { entityId?: string };
}

export const parseNumericEntityId = (...candidates: unknown[]): string | null => {
  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isInteger(candidate) && candidate >= 0) {
      return String(candidate);
    }
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (/^\d+$/.test(trimmed)) {
        return trimmed;
      }
    }
  }
  return null;
};

export const resolveEntityId = (location: SelectedLocation): string | null => {
  return parseNumericEntityId(
    location.partnerMetadata?.entityId,
    location.id
  );
};

export const validateHotelSearch = (params: HotelSearchParams): string | null => {
  if (params.checkout <= params.checkin) {
    return "Check-out must be after check-in";
  }
  if (params.adults < params.rooms) {
    return "Number of adults must be greater than or equal to number of rooms";
  }
  if (params.adults < 1 || params.rooms < 1) {
    return "Adults and rooms must be at least 1";
  }
  return null;
};

const SKYSCANNER_LOCALIZATION = {
  market: "US",
  locale: "en-US",
  currency: "USD",
} as const;

export const buildHotelDeepLink = (
  location: SelectedLocation,
  params: HotelSearchParams
): string | null => {
  const entityId = resolveEntityId(location);
  if (!entityId) return null;

  const qs = new URLSearchParams({
    entity_id: entityId,
    checkin: params.checkin,
    checkout: params.checkout,
    adults: String(params.adults),
    rooms: String(params.rooms),
    market: SKYSCANNER_LOCALIZATION.market,
    locale: SKYSCANNER_LOCALIZATION.locale,
    currency: SKYSCANNER_LOCALIZATION.currency,
  });

  return `https://www.skyscanner.net/hotels/search?${qs.toString()}`;
};

export const buildAffiliateHotelDeepLink = (
  location: SelectedLocation,
  params: HotelSearchParams,
  options: {
    mediaPartnerId: string;
    clickId?: string;
    utmSource?: string;
  }
): string | null => {
  const entityId = resolveEntityId(location);
  if (!entityId) return null;

  const qs = new URLSearchParams({
    entity_id: entityId,
    checkin: params.checkin,
    checkout: params.checkout,
    adults: String(params.adults),
    rooms: String(params.rooms),
    market: SKYSCANNER_LOCALIZATION.market,
    locale: SKYSCANNER_LOCALIZATION.locale,
    currency: SKYSCANNER_LOCALIZATION.currency,
    mediaPartnerId: options.mediaPartnerId,
    utm_term: options.clickId ?? "",
    utm_source: options.utmSource ?? "your-site",
    utm_medium: "affiliate",
  });

  return `https://skyscanner.net/g/referrals/v1/hotels/day-view?${qs.toString()}`;
};
