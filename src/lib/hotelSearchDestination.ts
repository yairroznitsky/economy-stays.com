import { requestHotelDestinationAutocomplete } from "@/lib/hotelAffiliateApi";
import type { HotelDestinationSuggestion } from "@/types/hotels";

/** Prefer cached autocomplete; otherwise fetch and return the top match. */
export const resolveFirstDestinationSuggestion = async (
  query: string,
  cachedSuggestions: HotelDestinationSuggestion[],
  options?: { locale?: string; country?: string }
): Promise<HotelDestinationSuggestion | null> => {
  const trimmed = query.trim();
  if (!trimmed) return null;

  if (trimmed.length >= 2 && cachedSuggestions.length > 0) {
    return cachedSuggestions[0];
  }

  if (trimmed.length < 2) return null;

  const results = await requestHotelDestinationAutocomplete({
    query: trimmed,
    locale: options?.locale ?? "en",
    country: options?.country ?? "US",
  });

  return results[0] ?? null;
};
