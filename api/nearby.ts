/**
 * GET /api/nearby[?lat=&lng=]
 *
 * Returns budget-friendly hotels near the visitor's location, plus the
 * nearest city from the cities table (used to prefill the SearchForm).
 *
 * Position resolution order:
 *   1. ?lat= & ?lng= query params (precise, from browser geolocation API)
 *   2. x-vercel-ip-latitude / x-vercel-ip-longitude headers (IP-based)
 *   3. Neither available → { source: "none", hotels: [] }
 *
 * Always returns HTTP 200. Never 500 — failures return { source: "none" }.
 * Cache-Control: private, no-store (per-user data must not reach CDN).
 *
 * Self-contained: no imports from lib/ (Vercel NFT bundling requirement).
 */

interface ApiRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  url?: string;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const readEnv = (key: string): string | undefined => {
  const v = process.env[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
};

const headerValue = (
  headers: ApiRequest["headers"],
  name: string
): string => {
  if (!headers) return "";
  const raw = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0]?.trim() ?? "";
  return typeof raw === "string" ? raw.trim() : "";
};

const getSupabaseConfig = (): { url: string; key: string } => {
  const url = readEnv("SUPABASE_URL") ?? readEnv("VITE_SUPABASE_URL");
  const key = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing Supabase config");
  return { url, key };
};

const setCors = (res: ApiResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
};

// ── Geo math ───────────────────────────────────────────────────────────────

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

interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

function buildBox(lat: number, lng: number, radiusKm: number): BoundingBox {
  const latDelta = radiusKm / 111.32;
  const cosLat = Math.max(Math.cos(lat * DEG_TO_RAD), 0.01); // clamp away from zero
  const lngDelta = radiusKm / (111.32 * cosLat);
  return {
    minLat: Math.max(lat - latDelta, -90),
    maxLat: Math.min(lat + latDelta, 90),
    // Clamp to [-180, 180]; antimeridian edge cases are rare in this catalog
    minLng: Math.max(lng - lngDelta, -180),
    maxLng: Math.min(lng + lngDelta, 180),
  };
}

// ── Supabase types ─────────────────────────────────────────────────────────

interface CityRow {
  slug: string;
  name: string;
  country: string;
  country_code: string;
  lat: number;
  lng: number;
  airport_code: string | null;
  kayak_destination_id: string | null;
}

interface HotelRow {
  external_id: number;
  name: string;
  type: string | null;
  latitude: number;
  longitude: number;
  city_name: string | null;
  city_slug: string | null;
  country_name: string | null;
  star_rating: number | null;
  rating: number | null;
  reviews: number | null;
}

// ── Supabase fetches ───────────────────────────────────────────────────────

async function fetchCities(supabaseUrl: string, supabaseKey: string): Promise<CityRow[]> {
  const url = new URL(`${supabaseUrl}/rest/v1/cities`);
  url.searchParams.set("select", "slug,name,country,country_code,lat,lng,airport_code,kayak_destination_id");
  url.searchParams.set("active", "eq.true");
  const res = await fetch(url.toString(), {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  if (!res.ok) throw new Error(`cities fetch failed: ${res.status}`);
  return (await res.json()) as CityRow[];
}

async function fetchHotelsInBox(
  box: BoundingBox,
  supabaseUrl: string,
  supabaseKey: string
): Promise<HotelRow[]> {
  const url = new URL(`${supabaseUrl}/rest/v1/staging_hotels`);
  url.searchParams.set(
    "select",
    "external_id,name,type,latitude,longitude,city_name,city_slug,country_name,star_rating,rating,reviews"
  );
  // PostgREST ANDs repeated filters on the same column → bounding box
  url.searchParams.append("latitude", `gte.${box.minLat}`);
  url.searchParams.append("latitude", `lte.${box.maxLat}`);
  url.searchParams.append("longitude", `gte.${box.minLng}`);
  url.searchParams.append("longitude", `lte.${box.maxLng}`);
  // Budget filter: 1–3 stars or unrated
  url.searchParams.set("or", "(star_rating.lte.3,star_rating.is.null)");
  url.searchParams.set("limit", "500");
  const res = await fetch(url.toString(), {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  if (!res.ok) throw new Error(`staging_hotels fetch failed: ${res.status}`);
  return (await res.json()) as HotelRow[];
}

// Cache city list in module scope across warm invocations
let citiesCache: CityRow[] | null = null;

async function getCities(supabaseUrl: string, supabaseKey: string): Promise<CityRow[]> {
  if (!citiesCache) {
    citiesCache = await fetchCities(supabaseUrl, supabaseKey);
  }
  return citiesCache;
}

// ── Response types (mirrored in src/lib/nearbyLocation.ts) ────────────────

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

// ── Main handler ───────────────────────────────────────────────────────────

const RADIUS_KM = 50;
const RADIUS_EXPAND_KM = 200;
const MAX_HOTELS = 9;
const MIN_HOTELS_BEFORE_EXPAND = 6;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  setCors(res);
  res.setHeader("Cache-Control", "private, no-store");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const NONE_RESPONSE = { source: "none" as const, hotels: [] };

  try {
    // ── Resolve position ──────────────────────────────────────────────────
    const qs = new URLSearchParams((req.url ?? "").split("?")[1] ?? "");
    const qLat = parseFloat(qs.get("lat") ?? "");
    const qLng = parseFloat(qs.get("lng") ?? "");

    let lat: number;
    let lng: number;
    let source: "precise" | "ip";
    let detected: { city?: string; region?: string; country?: string } = {};

    if (Number.isFinite(qLat) && Number.isFinite(qLng)) {
      lat = qLat;
      lng = qLng;
      source = "precise";
    } else {
      const ipLat = parseFloat(headerValue(req.headers, "x-vercel-ip-latitude"));
      const ipLng = parseFloat(headerValue(req.headers, "x-vercel-ip-longitude"));
      if (!Number.isFinite(ipLat) || !Number.isFinite(ipLng)) {
        res.status(200).json(NONE_RESPONSE);
        return;
      }
      lat = ipLat;
      lng = ipLng;
      source = "ip";
      detected = {
        city: headerValue(req.headers, "x-vercel-ip-city") || undefined,
        region: headerValue(req.headers, "x-vercel-ip-country-region") || undefined,
        country: headerValue(req.headers, "x-vercel-ip-country") || undefined,
      };
    }

    // ── Supabase ──────────────────────────────────────────────────────────
    const { url: sbUrl, key: sbKey } = getSupabaseConfig();

    // Nearest city (for SearchForm prefill)
    const cities = await getCities(sbUrl, sbKey);
    const sortedCities = cities
      .map((c) => ({ ...c, distanceKm: haversineKm(lat, lng, c.lat, c.lng) }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
    const nearestRow = sortedCities[0];
    const nearest: NearestCity | undefined = nearestRow
      ? {
          slug: nearestRow.slug,
          name: nearestRow.name,
          country: nearestRow.country,
          countryCode: nearestRow.country_code,
          lat: nearestRow.lat,
          lng: nearestRow.lng,
          kayakDestinationId: nearestRow.kayak_destination_id,
          airportCode: nearestRow.airport_code,
          distanceKm: nearestRow.distanceKm,
        }
      : undefined;

    // Hotels by bounding box, with expand if too few results
    let hotelRows: HotelRow[] = await fetchHotelsInBox(buildBox(lat, lng, RADIUS_KM), sbUrl, sbKey);
    if (hotelRows.length < MIN_HOTELS_BEFORE_EXPAND) {
      hotelRows = await fetchHotelsInBox(buildBox(lat, lng, RADIUS_EXPAND_KM), sbUrl, sbKey);
    }

    const hotels: NearbyHotelItem[] = hotelRows
      .map((h) => ({
        externalId: h.external_id,
        name: h.name,
        type: h.type,
        starRating: h.star_rating,
        rating: h.rating,
        reviews: h.reviews,
        citySlug: h.city_slug,
        cityName: h.city_name,
        countryName: h.country_name,
        latitude: h.latitude,
        longitude: h.longitude,
        distanceKm: haversineKm(lat, lng, h.latitude, h.longitude),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, MAX_HOTELS);

    res.status(200).json({ source, detected, nearest, hotels });
  } catch {
    // Never 500 — the client must degrade gracefully
    res.status(200).json(NONE_RESPONSE);
  }
}
