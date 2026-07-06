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
}

export interface KayakNormalizedDestination {
  destination_id: string;
}

export interface KayakAffiliateConfig {
  affiliateId: string;
  deeplinkBase: string;
  utmMedium: string;
}

export const resolveAffiliateSource = (
  value: unknown
): "kayak" | "skyscanner" | "booking" => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "booking") return "booking";
    if (normalized === "skyscanner") return "skyscanner";
    if (normalized === "kayak") return "kayak";
  }
  return "kayak";
};

export const getKayakAffiliateConfig = (): KayakAffiliateConfig => ({
  affiliateId: Deno.env.get("KAYAK_AFFILIATE_ID") ?? "",
  deeplinkBase: Deno.env.get("KAYAK_DEEPLINK_BASE") ?? "https://www.kayak.com/in",
  utmMedium: Deno.env.get("KAYAK_UTM_MEDIUM") ?? "affiliate",
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
  const roomsSegment = `${input.rooms}rooms`;

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

  return wrapper.toString();
};
