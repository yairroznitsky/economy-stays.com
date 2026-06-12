import { requestHotelDestinationAutocomplete } from "@/lib/hotelAffiliateApi";
import type { HotelDestinationSuggestion } from "@/types/hotels";

const findBestSuggestionMatch = (
  query: string,
  suggestions: HotelDestinationSuggestion[]
): HotelDestinationSuggestion | null => {
  if (suggestions.length === 0) return null;

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
  if (trimmed.length < 2) return null;

  const cachedMatch = findBestSuggestionMatch(trimmed, cachedSuggestions);
  if (cachedMatch) return cachedMatch;

  const results = await requestHotelDestinationAutocomplete({
    query: trimmed,
    locale: options?.locale ?? "en",
    country: options?.country ?? "US",
  });

  return findBestSuggestionMatch(trimmed, results);
};
