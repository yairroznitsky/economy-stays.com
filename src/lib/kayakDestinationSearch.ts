import { format } from "date-fns";
import type { HotelDestinationSuggestion, HotelSearchInput } from "@/types/hotels";

const readRawString = (raw: Record<string, unknown> | undefined, key: string) => {
  const value = raw?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

/** `lc` / `lc_cc` for Kayak autocomplete (2-letter market where available). */
export const getDeviceKayakAutocompleteContext = () => {
  if (typeof navigator === "undefined") {
    return { locale: "en", marketCountry: "US" };
  }
  const tag = navigator.language || "en-US";
  const [lang, region] = tag.split("-");
  const locale = (lang || "en").toLowerCase();
  const upper = region?.toUpperCase();
  const marketCountry = upper && /^[A-Z]{2}$/.test(upper) ? upper : "US";
  return { locale, marketCountry };
};

/** Same default night as SearchForm: tomorrow → day after, local calendar dates. */
export const getDefaultHotelStayDateStrings = () => {
  const today = new Date();
  const checkInDate = new Date(today);
  checkInDate.setDate(today.getDate() + 1);
  const checkOutDate = new Date(today);
  checkOutDate.setDate(today.getDate() + 2);
  return {
    checkIn: format(checkInDate, "yyyy-MM-dd"),
    checkOut: format(checkOutDate, "yyyy-MM-dd"),
  };
};

export const buildHotelSearchInputFromSuggestion = (
  suggestion: HotelDestinationSuggestion,
  params: {
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    rooms: number;
    locale: string;
    marketCountry: string;
    fallbackCountryName?: string;
  }
): HotelSearchInput => {
  const countryName =
    readRawString(suggestion.raw, "country") ??
    (() => {
      const candidate = suggestion.subtitle || suggestion.label;
      const parts = candidate.split(",").map((p) => p.trim()).filter(Boolean);
      if (parts.length > 0) return parts[parts.length - 1];
      return params.fallbackCountryName ?? params.marketCountry;
    })();

  return {
    destination: suggestion.label.trim(),
    destinationId: readRawString(suggestion.raw, "city_id") ?? suggestion.id,
    hotelId: readRawString(suggestion.raw, "hotel_id"),
    airportPlaceId: readRawString(suggestion.raw, "place_id"),
    airportCode:
      readRawString(suggestion.raw, "airport_code") ??
      readRawString(suggestion.raw, "apicode"),
    airportName: readRawString(suggestion.raw, "airport_name"),
    cityName:
      readRawString(suggestion.raw, "city") ?? suggestion.label.split(",")[0]?.trim(),
    stateName: readRawString(suggestion.raw, "state"),
    countryName,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    adults: params.adults,
    children: params.children,
    childrenAges: params.children > 0 ? Array.from({ length: params.children }, () => 8) : [],
    rooms: params.rooms,
    locale: params.locale,
    country: countryName,
  };
};

/** Forces `query` + structured fields to city, state, country for Kayak US hotel slugs. */
export const withTrendingDeeplinkPlace = (
  search: HotelSearchInput,
  place: { city: string; state: string; country: string }
): HotelSearchInput => {
  const { city, state, country } = place;
  return {
    ...search,
    destination: `${city}, ${state}, ${country}`,
    cityName: city,
    stateName: state,
    countryName: country,
    country,
  };
};
