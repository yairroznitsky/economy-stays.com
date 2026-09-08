/**
 * Types and fetch helper for the /api/nearby endpoint.
 * Used by useNearbyLocation hook and NearbyHotels component.
 */

export interface NearestCity {
  slug: string;
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  kayakDestinationId: string | null;
  airportCode: string | null;
  distanceKm: number;
}

export interface NearbyHotelItem {
  externalId: number;
  name: string;
  type: string | null;
  starRating: number | null;
  rating: number | null;
  reviews: number | null;
  citySlug: string | null;
  cityName: string | null;
  countryName: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

export type NearbySource = "ip" | "precise" | "none";

export interface NearbyDetected {
  city?: string;
  region?: string;
  country?: string;
}

export interface NearbyData {
  source: NearbySource;
  detected?: NearbyDetected;
  nearest?: NearestCity;
  hotels: NearbyHotelItem[];
}

export async function fetchNearby(opts?: { lat?: number; lng?: number }): Promise<NearbyData> {
  const url = new URL("/api/nearby", window.location.origin);
  if (opts?.lat != null && opts?.lng != null) {
    url.searchParams.set("lat", String(opts.lat));
    url.searchParams.set("lng", String(opts.lng));
  }
  const res = await fetch(url.toString());
  if (!res.ok) return { source: "none", hotels: [] };
  const data = (await res.json()) as Partial<NearbyData>;
  return {
    source: data.source ?? "none",
    detected: data.detected,
    nearest: data.nearest,
    hotels: data.hotels ?? [],
  };
}
