export interface KayakDeeplinkInput {
  query: string;
  destination_id: string;
  hotel_id?: string;
  airport_place_id?: string;
  airport_code?: string;
  airport_name?: string;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  checkin: string;
  checkout: string;
  rooms: number;
  adults: number;
  children: number;
  children_ages: number[];
  click_id: string;
  country: string;
  from_facebook_ads?: boolean;
}

export interface KayakNormalizedDestination {
  destination_id: string;
}

export interface KayakAffiliateConfig {
  affiliateId: string;
  deeplinkBase: string;
  utmMedium: string;
}

/** Kayak requires at least 1 room per 4 guests (adults + children). */
const KAYAK_GUESTS_PER_ROOM = 4;

/**
 * Kayak deeplinks are rejected/ignored if the room count is too low for the
 * number of guests. Kayak requires at least 1 room per 4 guests, so we bump
 * the room count up to that minimum while still respecting a higher room
 * count explicitly chosen by the user.
 */
export const getKayakMinimumRooms = (totalGuests: number): number =>
  Math.max(1, Math.ceil(totalGuests / KAYAK_GUESTS_PER_ROOM));

export const resolveKayakRoomCount = (rooms: number, adults: number, children: number): number => {
  const minimumRooms = getKayakMinimumRooms(adults + children);
  return Math.max(rooms, minimumRooms);
};

const DEFAULT_KAYAK_AFFILIATE_ID = "kan_317689_594114";

const DEFAULT_KAYAK_AFFILIATE_CONFIG: KayakAffiliateConfig = {
  affiliateId: import.meta.env.VITE_KAYAK_AFFILIATE_ID?.trim() || DEFAULT_KAYAK_AFFILIATE_ID,
  deeplinkBase:
    import.meta.env.VITE_KAYAK_DEEPLINK_BASE?.trim() ?? "https://www.kayak.com/in",
  utmMedium: import.meta.env.VITE_KAYAK_UTM_MEDIUM?.trim() ?? "affiliate",
};

export const getKayakAffiliateConfig = (): KayakAffiliateConfig => ({
  ...DEFAULT_KAYAK_AFFILIATE_CONFIG,
});

/** Builds the inner `/hotels/...` path (without affiliate wrapper). */
export const buildKayakHotelPath = (
  input: KayakDeeplinkInput,
  destination: KayakNormalizedDestination
): string => {
  const removeDestinationCode = (value: string) =>
    value
      .replace(/-?c\d+\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

  const queryParts = input.query
    .split(",")
    .map((part) => removeDestinationCode(part))
    .filter(Boolean);
  const city = input.city_name ?? queryParts[0] ?? removeDestinationCode(input.query);
  const country =
    input.country_name ??
    (queryParts.length >= 2 ? queryParts[queryParts.length - 1] : input.country);
  const state = input.state_name ?? (queryParts.length >= 3 ? queryParts[1] : "");
  const normalizedCountry = country.trim().toLowerCase();
  const isUnitedStates = ["us", "usa", "united states", "united states of america"].includes(
    normalizedCountry
  );

  const slugify = (value: string) =>
    value
      .trim()
      .replace(/['’]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const hotelName = input.hotel_id
    ? removeDestinationCode(input.query.split(",")[0] ?? input.query)
    : "";
  const baseSegments = isUnitedStates
    ? [slugify(city), slugify(state), slugify(country)].filter(Boolean)
    : [slugify(city), slugify(country)].filter(Boolean);
  const isAirportDeeplink =
    Boolean(input.airport_place_id && input.airport_code && input.airport_name);
  const locationSegments = isAirportDeeplink
    ? [slugify(city), slugify(country), slugify(input.airport_name!)]
    : input.hotel_id
      ? [slugify(hotelName), ...baseSegments].filter(Boolean)
      : baseSegments;
  const locationSlug = locationSegments.join(",");
  const destinationCode = isAirportDeeplink ? "" : `-c${destination.destination_id}`;
  const hotelCode = input.hotel_id ? `-h${input.hotel_id}` : "";
  const airportCode = isAirportDeeplink
    ? `-p${input.airport_place_id}-l${input.airport_code}`
    : "";
  const adultsSegment = `${input.adults}adults`;
  const childrenSegment =
    input.children > 0
      ? `/${input.children}children-${input.children_ages.join("-")}`
      : "";
  const roomsSegment = `${resolveKayakRoomCount(input.rooms, input.adults, input.children)}rooms`;

  return `/hotels/${locationSlug}${destinationCode}${hotelCode}${airportCode}/${input.checkin}/${input.checkout}/${adultsSegment}${childrenSegment}/${roomsSegment}`;
};

export const buildKayakDeeplink = (
  input: KayakDeeplinkInput,
  destination: KayakNormalizedDestination,
  config: KayakAffiliateConfig = getKayakAffiliateConfig()
): string => {
  const kayakPath = buildKayakHotelPath(input, destination);
  const wrapper = new URL(config.deeplinkBase);

  if (config.affiliateId) {
    wrapper.searchParams.set("a", config.affiliateId);
  }
  wrapper.searchParams.set("enc_cid", input.click_id);
  wrapper.searchParams.set("enc_lid", "hotels");
  wrapper.searchParams.set("enc_pid", "deeplinks");
  wrapper.searchParams.set("encoder", "27_1");
  wrapper.searchParams.set("url", kayakPath);
  wrapper.searchParams.set("utm_medium", config.utmMedium);
  if (input.from_facebook_ads) {
    wrapper.searchParams.set("cc", "us");
  }

  return wrapper.toString();
};
