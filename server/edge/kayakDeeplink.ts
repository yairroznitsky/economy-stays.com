import { getKayakAffiliateConfig } from "./env";

export type KayakAffiliateConfig = ReturnType<typeof getKayakAffiliateConfig>;

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

const KAYAK_GUESTS_PER_ROOM = 4;

const resolveKayakRoomCount = (rooms: number, adults: number, children: number): number => {
  const minimum = Math.max(1, Math.ceil((adults + children) / KAYAK_GUESTS_PER_ROOM));
  return Math.max(rooms, minimum);
};

export const buildKayakHotelPath = (
  input: KayakDeeplinkInput,
  destination: KayakNormalizedDestination
): string => {
  const strip = (v: string) =>
    v.replace(/-?c\d+\b/gi, "").replace(/\s+/g, " ").trim();

  const parts = input.query.split(",").map(strip).filter(Boolean);
  const city = input.city_name ?? parts[0] ?? strip(input.query);
  const country =
    input.country_name ??
    (parts.length >= 2 ? parts[parts.length - 1] : input.country);
  const state = input.state_name ?? (parts.length >= 3 ? parts[1] : "");
  const isUS = ["us", "usa", "united states", "united states of america"].includes(
    country.trim().toLowerCase()
  );

  const slug = (v: string) =>
    v.trim().replace(/['']/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const hotelName = input.hotel_id ? strip(input.query.split(",")[0] ?? input.query) : "";
  const base = isUS
    ? [slug(city), slug(state), slug(country)].filter(Boolean)
    : [slug(city), slug(country)].filter(Boolean);
  const isAirport = Boolean(input.airport_place_id && input.airport_code && input.airport_name);
  const locs = isAirport
    ? [slug(city), slug(country), slug(input.airport_name!)]
    : input.hotel_id
      ? [slug(hotelName), ...base].filter(Boolean)
      : base;

  const destCode = isAirport ? "" : `-c${destination.destination_id}`;
  const hotelCode = input.hotel_id ? `-h${input.hotel_id}` : "";
  const airCode = isAirport ? `-p${input.airport_place_id}-l${input.airport_code}` : "";
  const adults = `${input.adults}adults`;
  const kids =
    input.children > 0
      ? `/${input.children}children-${input.children_ages.join("-")}`
      : "";
  const rooms = `${resolveKayakRoomCount(input.rooms, input.adults, input.children)}rooms`;

  return `/hotels/${locs.join(",")}${destCode}${hotelCode}${airCode}/${input.checkin}/${input.checkout}/${adults}${kids}/${rooms}`;
};

export const buildKayakDeeplink = (
  input: KayakDeeplinkInput,
  destination: KayakNormalizedDestination,
  config: KayakAffiliateConfig = getKayakAffiliateConfig()
): string => {
  const path = buildKayakHotelPath(input, destination);
  const url = new URL(config.deeplinkBase);
  if (config.affiliateId) url.searchParams.set("a", config.affiliateId);
  url.searchParams.set("enc_cid", input.click_id);
  url.searchParams.set("enc_lid", "hotels");
  url.searchParams.set("enc_pid", "deeplinks");
  url.searchParams.set("encoder", "27_1");
  url.searchParams.set("url", path);
  url.searchParams.set("utm_medium", config.utmMedium);
  if (input.from_facebook_ads) url.searchParams.set("cc", "us");
  return url.toString();
};
