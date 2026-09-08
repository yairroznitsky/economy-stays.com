/**
 * Dev-server handler for GET /api/nearby?lat=&lng=
 * Mirrors the logic in api/nearby.ts but importable from the dev server.
 * Only called when both lat and lng query params are present.
 */

const readEnv = (key: string): string | undefined => {
  const v = process.env[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
};

const DEG_TO_RAD = Math.PI / 180;
const EARTH_KM = 6371;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLng = (lng2 - lng1) * DEG_TO_RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) * Math.sin(dLng / 2) ** 2;
  return EARTH_KM * 2 * Math.asin(Math.sqrt(a));
}

function buildBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111.32;
  const cosLat = Math.max(Math.cos(lat * DEG_TO_RAD), 0.01);
  const lngDelta = radiusKm / (111.32 * cosLat);
  return {
    minLat: Math.max(lat - latDelta, -90),
    maxLat: Math.min(lat + latDelta, 90),
    minLng: Math.max(lng - lngDelta, -180),
    maxLng: Math.min(lng + lngDelta, 180),
  };
}

interface CityRow {
  slug: string; name: string; country: string; country_code: string;
  lat: number; lng: number; airport_code: string | null; kayak_destination_id: string | null;
}

interface HotelRow {
  external_id: number; name: string; type: string | null;
  latitude: number; longitude: number;
  city_name: string | null; city_slug: string | null; country_name: string | null;
  star_rating: number | null; rating: number | null; reviews: number | null;
}

async function supabaseFetch<T>(path: string): Promise<T[]> {
  const url = readEnv("SUPABASE_URL") ?? readEnv("VITE_SUPABASE_URL");
  const key = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return [];
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return [];
  return (await res.json()) as T[];
}

let cachedCities: CityRow[] | null = null;

export async function handleNearbyGet(lat: number, lng: number) {
  try {
    if (!cachedCities) {
      cachedCities = await supabaseFetch<CityRow>(
        "cities?select=slug,name,country,country_code,lat,lng,airport_code,kayak_destination_id&active=eq.true"
      );
    }

    const sortedCities = (cachedCities ?? [])
      .map((c) => ({ ...c, distanceKm: haversineKm(lat, lng, c.lat, c.lng) }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
    const nearestRow = sortedCities[0];
    const nearest = nearestRow
      ? {
          slug: nearestRow.slug, name: nearestRow.name, country: nearestRow.country,
          countryCode: nearestRow.country_code, lat: nearestRow.lat, lng: nearestRow.lng,
          kayakDestinationId: nearestRow.kayak_destination_id,
          airportCode: nearestRow.airport_code, distanceKm: nearestRow.distanceKm,
        }
      : undefined;

    const box = buildBox(lat, lng, 50);
    let hotelRows = await supabaseFetch<HotelRow>(
      `staging_hotels?select=external_id,name,type,latitude,longitude,city_name,city_slug,country_name,star_rating,rating,reviews` +
      `&latitude=gte.${box.minLat}&latitude=lte.${box.maxLat}` +
      `&longitude=gte.${box.minLng}&longitude=lte.${box.maxLng}` +
      `&or=(star_rating.lte.3,star_rating.is.null)&limit=500`
    );

    if (hotelRows.length < 6) {
      const big = buildBox(lat, lng, 200);
      hotelRows = await supabaseFetch<HotelRow>(
        `staging_hotels?select=external_id,name,type,latitude,longitude,city_name,city_slug,country_name,star_rating,rating,reviews` +
        `&latitude=gte.${big.minLat}&latitude=lte.${big.maxLat}` +
        `&longitude=gte.${big.minLng}&longitude=lte.${big.maxLng}` +
        `&or=(star_rating.lte.3,star_rating.is.null)&limit=500`
      );
    }

    const hotels = hotelRows
      .map((h) => ({
        externalId: h.external_id, name: h.name, type: h.type,
        starRating: h.star_rating, rating: h.rating, reviews: h.reviews,
        citySlug: h.city_slug, cityName: h.city_name, countryName: h.country_name,
        latitude: h.latitude, longitude: h.longitude,
        distanceKm: haversineKm(lat, lng, h.latitude, h.longitude),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 9);

    return { source: "precise" as const, detected: {}, nearest, hotels };
  } catch {
    return { source: "none" as const, hotels: [] };
  }
}
