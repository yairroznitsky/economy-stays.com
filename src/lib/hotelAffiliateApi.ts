import { hasSupabaseClientConfig, supabase } from "@/lib/supabaseClient";
import type {
  HotelAffiliateRouteResponse,
  HotelAutocompleteRequest,
  HotelAutocompleteResponse,
  HotelDestinationSuggestion,
  HotelRedirectRequest,
} from "@/types/hotels";

const AFFILIATE_EDGE_FUNCTION_NAME = "hotel-affiliate-router";
const AUTOCOMPLETE_EDGE_FUNCTION_NAME = "kayak-autocomplete";

const assertSupabaseConfigured = () => {
  if (!hasSupabaseClientConfig || !supabase) {
    throw new Error(
      "Supabase client configuration missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
    );
  }
};

export const requestHotelRedirectUrl = async (
  payload: HotelRedirectRequest
): Promise<HotelAffiliateRouteResponse> => {
  assertSupabaseConfigured();

  const { data, error } = await supabase.functions.invoke<{
    success: boolean;
    redirect_url?: string;
    error?: string;
    tracking_payload?: { click_id?: string };
  }>(AFFILIATE_EDGE_FUNCTION_NAME, {
    body: {
      query: payload.search.destination,
      destination_id: payload.search.destinationId,
      checkin: payload.search.checkIn,
      checkout: payload.search.checkOut,
      rooms: payload.search.rooms,
      adults: payload.search.adults,
      children: payload.search.children,
      children_ages: payload.search.childrenAges,
      click_id: payload.clickId,
      landing_id: payload.landingId,
      locale: payload.search.locale ?? "en",
      country: payload.search.country ?? "US",
    },
  });

  if (error) {
    throw new Error(error.message || "Unable to generate affiliate redirect URL.");
  }

  if (!data?.success || !data.redirect_url) {
    throw new Error(data?.error || "Edge Function returned an invalid redirect response.");
  }

  return {
    redirectUrl: data.redirect_url,
    provider: payload.affiliateSource ?? "kayak",
    clickId: data.tracking_payload?.click_id ?? payload.clickId,
  };
};

export const requestHotelDestinationAutocomplete = async (
  payload: HotelAutocompleteRequest
): Promise<HotelDestinationSuggestion[]> => {
  assertSupabaseConfigured();

  const { data, error } = await supabase.functions.invoke<HotelAutocompleteResponse>(
    AUTOCOMPLETE_EDGE_FUNCTION_NAME,
    { body: payload }
  );

  if (error) {
    throw new Error(error.message || "Unable to fetch destination suggestions.");
  }

  if (!data?.success) {
    return [];
  }

  return data.suggestions ?? [];
};
