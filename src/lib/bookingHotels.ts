export interface BookingDeeplinkInput {
  query: string;
  checkin: string;
  checkout: string;
  rooms: number;
  adults: number;
  children: number;
  children_ages: number[];
  click_id: string;
  latitude?: number;
  longitude?: number;
}

export interface BookingAffiliateConfig {
  tid: string;
  auth: string;
  baseUrl: string;
  currency: string;
  lang: string;
}

export const BOOKING_CURRENCY = "USD";
export const BOOKING_LANG = "en-us";

const DEFAULT_BOOKING_AFFILIATE_CONFIG: BookingAffiliateConfig = {
  tid: "1321636",
  auth: "ofxbqjcsboet",
  baseUrl: "https://selfashelookedrou.com/brands_redirect",
  currency: BOOKING_CURRENCY,
  lang: BOOKING_LANG,
};

const isValidCoordinate = (value: number, min: number, max: number) =>
  Number.isFinite(value) && value >= min && value <= max;

const formatCoordinate = (value: number) => String(value);

export const parseSkyscannerLocation = (
  value: unknown
): { lat: string; lng: string } | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const commaParts = trimmed.split(",").map((part) => part.trim());
    if (commaParts.length >= 2) {
      const lat = Number(commaParts[0]);
      const lng = Number(commaParts[1]);
      if (isValidCoordinate(lat, -90, 90) && isValidCoordinate(lng, -180, 180)) {
        return { lat: formatCoordinate(lat), lng: formatCoordinate(lng) };
      }
    }
    return null;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const lat = Number(record.latitude ?? record.lat);
    const lng = Number(record.longitude ?? record.lng ?? record.lon);
    if (isValidCoordinate(lat, -90, 90) && isValidCoordinate(lng, -180, 180)) {
      return { lat: formatCoordinate(lat), lng: formatCoordinate(lng) };
    }
  }

  return null;
};

export const buildBookingSearchResultsUrl = (
  input: BookingDeeplinkInput,
  options?: Pick<BookingAffiliateConfig, "currency" | "lang">
) => {
  const currency = options?.currency ?? BOOKING_CURRENCY;
  const lang = options?.lang ?? BOOKING_LANG;

  const params = new URLSearchParams({
    ss: input.query.trim(),
    checkin: input.checkin,
    checkout: input.checkout,
    group_adults: String(input.adults),
    group_children: String(input.children),
    no_rooms: String(input.rooms),
    selected_currency: currency,
    lang,
  });

  for (const age of input.children_ages) {
    params.append("age", String(age));
  }

  if (
    typeof input.latitude === "number" &&
    typeof input.longitude === "number" &&
    isValidCoordinate(input.latitude, -90, 90) &&
    isValidCoordinate(input.longitude, -180, 180)
  ) {
    params.set("latitude", formatCoordinate(input.latitude));
    params.set("longitude", formatCoordinate(input.longitude));
  }

  return `https://www.booking.com/searchresults.html?${params.toString()}`;
};

export const buildBookingAffiliateRedirectUrl = (
  input: BookingDeeplinkInput,
  config: BookingAffiliateConfig = DEFAULT_BOOKING_AFFILIATE_CONFIG
) => {
  const innerUrl = buildBookingSearchResultsUrl(input, config);
  const outerParams = new URLSearchParams({
    tid: config.tid,
    auth: config.auth,
    puid: input.click_id,
    subid: input.click_id,
    osr: innerUrl,
  });

  const baseUrl = config.baseUrl.replace(/\/$/, "");
  return `${baseUrl}?${outerParams.toString()}`;
};
