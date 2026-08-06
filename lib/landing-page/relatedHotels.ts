import { buildHotelPath, slugToCityName } from "./hotelSlug";
import { selectRows } from "./supabaseRest";

export const RELATED_HOTELS_LIMIT = 6;

const RELATED_HOTEL_SELECT =
  "external_id,name,city_name,star_rating,rating,reviews";

export type RelatedHotelRow = {
  external_id: number;
  name: string;
  city_name: string | null;
  star_rating: number | null;
  rating: number | null;
  reviews: number | null;
};

export type RelatedHotelIntent = {
  star_rating: number | null;
};

export const mapRelatedHotel = (row: RelatedHotelRow) => ({
  id: String(row.external_id),
  name: row.name,
  path: buildHotelPath(row.city_name, row.name),
  starRating: row.star_rating ?? undefined,
  rating: row.rating ?? undefined,
  reviews: row.reviews ?? undefined,
});

/** Ordered city filters — first match wins; later entries are broader fallbacks. */
export const buildRelatedHotelCityFilters = (
  citySlug: string,
  cityName: string | null | undefined
): string[] => {
  const filters = [`city_slug=eq.${encodeURIComponent(citySlug)}`];

  const names = [cityName, slugToCityName(citySlug)].filter(
    (name, index, all): name is string =>
      Boolean(name) && all.indexOf(name) === index
  );

  for (const name of names) {
    filters.push(`city_name=ilike.${encodeURIComponent(name)}`);
    filters.push(`city_name=ilike.*${encodeURIComponent(name)}*`);
  }

  return filters;
};

export const dedupeRelatedHotels = (
  rows: RelatedHotelRow[]
): RelatedHotelRow[] => {
  const bestByPath = new Map<string, RelatedHotelRow>();
  for (const row of rows) {
    const path = buildHotelPath(row.city_name, row.name);
    const existing = bestByPath.get(path);
    if (!existing || (row.reviews ?? 0) > (existing.reviews ?? 0)) {
      bestByPath.set(path, row);
    }
  }

  return [...bestByPath.values()]
    .sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0))
    .slice(0, RELATED_HOTELS_LIMIT);
};

const safeSelectRelatedHotels = async (
  query: string
): Promise<RelatedHotelRow[]> => {
  try {
    return await selectRows<RelatedHotelRow>("staging_hotels", query);
  } catch {
    return [];
  }
};

export const fetchRelatedHotels = async (
  citySlug: string,
  cityName: string | null | undefined,
  intent: RelatedHotelIntent | null
): Promise<ReturnType<typeof mapRelatedHotel>[]> => {
  const buildQuery = (cityFilter: string): string => {
    const parts = [
      `select=${RELATED_HOTEL_SELECT}`,
      cityFilter,
      "order=reviews.desc.nullslast,external_id.asc",
      "limit=500",
    ];
    if (intent?.star_rating) {
      parts.push(`star_rating=eq.${intent.star_rating}`);
    }
    return parts.join("&");
  };

  let rows: RelatedHotelRow[] = [];
  for (const filter of buildRelatedHotelCityFilters(citySlug, cityName)) {
    if (rows.length > 0) break;
    rows = await safeSelectRelatedHotels(buildQuery(filter));
  }

  return dedupeRelatedHotels(rows).map(mapRelatedHotel);
};
