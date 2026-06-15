import { format } from "date-fns";
import { parseSkyscannerLocation } from "@/lib/bookingHotels";
import { parseNumericEntityId } from "@/lib/skyscannerHotels";
import type { HotelDestinationSuggestion, HotelSearchInput } from "@/types/hotels";

const readRawString = (raw: Record<string, unknown> | undefined, key: string) => {
  const value = raw?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

export const SKYSCANNER_MARKET = "US";
export const SKYSCANNER_LOCALE = "en-US";
export const SKYSCANNER_CURRENCY = "USD";

/** Force US market, en-US locale, and USD on Skyscanner hotel deeplinks. */
export const ensureSkyscannerHotelLocalization = (url: string): string => {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("skyscanner")) {
      return url;
    }

    parsed.searchParams.set("market", SKYSCANNER_MARKET);
    parsed.searchParams.set("locale", SKYSCANNER_LOCALE);
    parsed.searchParams.set("currency", SKYSCANNER_CURRENCY);
    return parsed.toString();
  } catch {
    return url;
  }
};

/** Fixed US market + en-US locale for Skyscanner hotels (autosuggest + deeplinks). */
export const getDeviceSkyscannerContext = () => ({
  market: SKYSCANNER_MARKET,
  locale: SKYSCANNER_LOCALE,
});

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
    market: string;
    fallbackCountryName?: string;
  }
): HotelSearchInput => {
  const entityId = parseNumericEntityId(
    readRawString(suggestion.raw, "entity_id"),
    suggestion.id
  );
  if (!entityId) {
    throw new Error(
      "Could not resolve destination. Select a city or hotel from the suggestions list."
    );
  }

  const countryName =
    readRawString(suggestion.raw, "country") ??
    params.fallbackCountryName ??
    params.market;
  const isAirport = suggestion.type === "airport";
  const airportCode = isAirport ? readRawString(suggestion.raw, "code") : undefined;
  const coordinates = parseSkyscannerLocation(suggestion.raw?.location);

  return {
    destination: suggestion.label.trim(),
    destinationId: entityId,
    hotelId: suggestion.type === "hotel" ? entityId : undefined,
    airportCode,
    airportName: isAirport ? suggestion.label : undefined,
    cityName: readRawString(suggestion.raw, "city") ?? suggestion.label.split(",")[0]?.trim(),
    countryName,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    adults: params.adults,
    children: params.children,
    childrenAges: params.children > 0 ? Array.from({ length: params.children }, () => 8) : [],
    rooms: params.rooms,
    latitude: coordinates ? Number(coordinates.lat) : undefined,
    longitude: coordinates ? Number(coordinates.lng) : undefined,
    locale: SKYSCANNER_LOCALE,
    country: SKYSCANNER_MARKET,
  };
};
