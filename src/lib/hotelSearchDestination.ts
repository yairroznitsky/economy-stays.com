import { requestHotelDestinationAutocomplete } from "@/lib/hotelAffiliateApi";
import {
  getDeviceKayakAutocompleteContext,
  pickBestIataSuggestion,
} from "@/lib/kayakDestinationSearch";
import type { HotelDestinationSuggestion } from "@/types/hotels";

const KAYAK_AUTOCOMPLETE_MIN_QUERY_LENGTH = 3;

const findBestSuggestionMatch = (
  query: string,
  suggestions: HotelDestinationSuggestion[]
): HotelDestinationSuggestion | null => {
  if (suggestions.length === 0) return null;

  const iataMatch = pickBestIataSuggestion(query, suggestions);
  if (iataMatch) return iataMatch;

  const normalizedQuery = query.trim().toLowerCase();

  const exactLabel = suggestions.find(
    (suggestion) => suggestion.label.trim().toLowerCase() === normalizedQuery
  );
  if (exactLabel) return exactLabel;

  const startsWithLabel = suggestions.find((suggestion) =>
    suggestion.label.trim().toLowerCase().startsWith(normalizedQuery)
  );
  if (startsWithLabel) return startsWithLabel;

  return suggestions[0] ?? null;
};

/** Fetch autocomplete for the submitted query and return the best match. */
export const resolveFirstDestinationSuggestion = async (
  query: string,
  cachedSuggestions: HotelDestinationSuggestion[],
  options?: { locale?: string; country?: string }
): Promise<HotelDestinationSuggestion | null> => {
  const trimmed = query.trim();
  if (trimmed.length < KAYAK_AUTOCOMPLETE_MIN_QUERY_LENGTH) return null;

  const device = getDeviceKayakAutocompleteContext();
  const locale = options?.locale?.trim() || device.locale;
  const country = options?.country?.trim().toUpperCase() || device.marketCountry;

  const cachedMatch = findBestSuggestionMatch(trimmed, cachedSuggestions);
  if (cachedMatch) return cachedMatch;

  const results = await requestHotelDestinationAutocomplete({
    query: trimmed,
    locale,
    country,
  });

  return findBestSuggestionMatch(trimmed, results);
};
