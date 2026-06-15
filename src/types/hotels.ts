export type AffiliateSource = "skyscanner" | "kayak" | "booking" | "fallback";

export interface HotelSearchInput {
  destination: string;
  destinationId?: string;
  hotelId?: string;
  airportPlaceId?: string;
  airportCode?: string;
  airportName?: string;
  cityName?: string;
  stateName?: string;
  countryName?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  childrenAges?: number[];
  rooms?: number;
  latitude?: number;
  longitude?: number;
  locale?: string;
  country?: string;
}

export interface HotelRedirectRequest {
  search: HotelSearchInput;
  clickId: string;
  landingId?: string;
  affiliateSource?: AffiliateSource;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

export interface HotelAutocompleteRequest {
  query: string;
  locale?: string;
  country?: string;
}

export interface HotelDestinationSuggestion {
  id: string;
  label: string;
  type: string;
  subtitle?: string;
  raw?: Record<string, unknown>;
}

export interface HotelAutocompleteResponse {
  success: boolean;
  query: string;
  suggestions: HotelDestinationSuggestion[];
  error?: string;
}

export interface HotelAffiliateRouterSuccessResponse {
  success: true;
  entity_id: string;
  redirect_url: string;
  tracking_payload?: { click_id?: string };
}

export interface HotelAffiliateRouterErrorResponse {
  success: false;
  error: string;
}

export type HotelAffiliateRouterResponse =
  | HotelAffiliateRouterSuccessResponse
  | HotelAffiliateRouterErrorResponse;

export interface HotelAffiliateRouteResponse {
  redirectUrl: string;
  entityId: string;
  provider: AffiliateSource;
  clickId: string;
}
