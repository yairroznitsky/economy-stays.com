import { format } from "date-fns";
import type { HotelDestinationSuggestion, HotelSearchInput } from "@/types/hotels";

const readRawString = (raw: Record<string, unknown> | undefined, key: string) => {
  const value = raw?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

/** Kayak often returns numeric ctid/placeID; coerce to a non-empty string when present. */
const readRawId = (raw: Record<string, unknown> | undefined, key: string): string | undefined => {
  const value = raw?.[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return undefined;
};

export const isIataQuery = (query: string): boolean => /^[A-Za-z]{3}$/.test(query.trim());

const extractIataFromLabel = (label: string): string | undefined => {
  const match = label.match(/\(([A-Za-z]{3})\)\s*$/);
  return match?.[1]?.toUpperCase();
};

const extractAirportNameFromLabel = (label: string): string | undefined => {
  const trimmed = label.trim();
  const withoutCode = trimmed.replace(/\s*\([A-Za-z]{3}\)\s*$/, "").trim();
  return withoutCode || trimmed;
};

export const isAirportSuggestion = (suggestion: HotelDestinationSuggestion): boolean => {
  const type = suggestion.type.toLowerCase();
  return type === "ap" || type.includes("airport");
};

export const readSuggestionAirportCode = (
  suggestion: HotelDestinationSuggestion
): string | undefined => {
  if (!isAirportSuggestion(suggestion)) return undefined;
  return (
    readRawString(suggestion.raw, "airport_code") ??
    readRawString(suggestion.raw, "apicode") ??
    extractIataFromLabel(suggestion.label)
  )?.toUpperCase();
};

/** When the query is a 3-letter IATA code, prefer the airport row over a city with the same apicode. */
export const pickBestIataSuggestion = (
  query: string,
  suggestions: HotelDestinationSuggestion[]
): HotelDestinationSuggestion | null => {
  const upperQuery = query.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(upperQuery)) return null;

  const iataMatches = suggestions.filter(
    (suggestion) => readSuggestionAirportCode(suggestion) === upperQuery
  );
  if (iataMatches.length === 0) {
    const byAirportId = suggestions.find(
      (suggestion) =>
        isAirportSuggestion(suggestion) && suggestion.id.trim().toUpperCase() === upperQuery
    );
    if (byAirportId) return byAirportId;
    return null;
  }

  return iataMatches.find(isAirportSuggestion) ?? iataMatches[0] ?? null;
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

  const isAirport = isAirportSuggestion(suggestion);
  const airportCode = isAirport
    ? readSuggestionAirportCode(suggestion)
    : undefined;
  const airportName = isAirport
    ? readRawString(suggestion.raw, "airport_name") ??
      extractAirportNameFromLabel(suggestion.label)
    : undefined;

  return {
    destination: suggestion.label.trim(),
    destinationId: readRawId(suggestion.raw, "city_id") ?? readRawId(suggestion.raw, "id") ?? suggestion.id,
    hotelId: readRawId(suggestion.raw, "hotel_id"),
    airportPlaceId: isAirport ? readRawId(suggestion.raw, "place_id") : undefined,
    airportCode,
    airportName,
    cityName:
      readRawString(suggestion.raw, "city") ??
      readRawString(suggestion.raw, "cityonly") ??
      suggestion.label.split(",")[0]?.trim(),
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
