import { format } from "date-fns";
import { resolveEntityId } from "@/lib/skyscannerHotels";
import type { HotelDestinationSuggestion, HotelSearchInput } from "@/types/hotels";

const readRawString = (raw: Record<string, unknown> | undefined, key: string) => {
  const value = raw?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

/** Skyscanner market + locale for hotels autosuggest (e.g. US / en-US). */
export const getDeviceSkyscannerContext = () => {
  if (typeof navigator === "undefined") {
    return { market: "US", locale: "en-US" };
  }

  const tag = navigator.language || "en-US";
  const [lang, region] = tag.split("-");
  const language = (lang || "en").toLowerCase();
  const market = region?.toUpperCase() && /^[A-Z]{2}$/.test(region.toUpperCase())
    ? region.toUpperCase()
    : "US";

  return {
    market,
    locale: `${language}-${market}`,
  };
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
    market: string;
    fallbackCountryName?: string;
  }
): HotelSearchInput => {
  const entityId =
    resolveEntityId({
      id: suggestion.id,
      partnerMetadata: {
        entityId: readRawString(suggestion.raw, "entity_id"),
      },
    }) ?? suggestion.id;
  const countryName =
    readRawString(suggestion.raw, "country") ??
    params.fallbackCountryName ??
    params.market;
  const isAirport = suggestion.type === "airport";
  const airportCode = isAirport ? readRawString(suggestion.raw, "code") : undefined;

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
    locale: params.locale,
    country: params.market,
  };
};
