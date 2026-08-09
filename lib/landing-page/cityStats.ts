import { buildRelatedHotelCityFilters } from "./relatedHotels";
import { selectRows } from "./supabaseRest";

const CITY_STATS_SELECT = "type,star_rating,rating";
const CITY_STATS_SAMPLE_LIMIT = 1000;

export type CityStatsRow = {
  type: string | null;
  star_rating: number | null;
  rating: number | null;
};

export type LandingCityStats = {
  hotelCount: number;
  hotelCountCapped: boolean;
  avgRating?: number;
  dominantStarRating?: number;
  topTypes: string[];
  airportCode?: string;
};

const normalizeType = (type: string | null | undefined): string | null => {
  const trimmed = type?.trim();
  if (!trimmed) return null;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

export const computeCityStats = (
  rows: CityStatsRow[],
  options?: { airportCode?: string | null; sampleLimit?: number }
): LandingCityStats | null => {
  if (rows.length === 0) return null;

  const sampleLimit = options?.sampleLimit ?? CITY_STATS_SAMPLE_LIMIT;
  let ratingSum = 0;
  let ratingCount = 0;
  const starCounts = new Map<number, number>();
  const typeCounts = new Map<string, number>();

  for (const row of rows) {
    if (row.rating != null && Number.isFinite(row.rating)) {
      ratingSum += row.rating;
      ratingCount += 1;
    }
    if (row.star_rating != null && row.star_rating > 0) {
      starCounts.set(
        row.star_rating,
        (starCounts.get(row.star_rating) ?? 0) + 1
      );
    }
    const type = normalizeType(row.type);
    if (type) {
      typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
    }
  }

  let dominantStarRating: number | undefined;
  let dominantStarCount = 0;
  for (const [stars, count] of starCounts) {
    if (count > dominantStarCount) {
      dominantStarRating = stars;
      dominantStarCount = count;
    }
  }

  const topTypes = [...typeCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([type]) => type);

  const avgRating =
    ratingCount > 0
      ? Math.round((ratingSum / ratingCount) * 10) / 10
      : undefined;

  return {
    hotelCount: rows.length,
    hotelCountCapped: rows.length >= sampleLimit,
    avgRating,
    dominantStarRating,
    topTypes,
    airportCode: options?.airportCode?.trim() || undefined,
  };
};

const safeSelectCityStats = async (
  query: string
): Promise<CityStatsRow[]> => {
  try {
    return await selectRows<CityStatsRow>("staging_hotels", query);
  } catch {
    return [];
  }
};

export const fetchCityStats = async (
  citySlug: string,
  cityName: string | null | undefined,
  airportCode?: string | null
): Promise<LandingCityStats | null> => {
  let rows: CityStatsRow[] = [];
  for (const filter of buildRelatedHotelCityFilters(citySlug, cityName)) {
    if (rows.length > 0) break;
    rows = await safeSelectCityStats(
      [
        `select=${CITY_STATS_SELECT}`,
        filter,
        "order=reviews.desc.nullslast,external_id.asc",
        `limit=${CITY_STATS_SAMPLE_LIMIT}`,
      ].join("&")
    );
  }

  return computeCityStats(rows, { airportCode, sampleLimit: CITY_STATS_SAMPLE_LIMIT });
};

export const formatHotelCountLabel = (stats: LandingCityStats): string => {
  const formatted = stats.hotelCount.toLocaleString("en-US");
  return stats.hotelCountCapped ? `${formatted}+ stays` : `${formatted} stays`;
};

/** Quiet summary line for the below-fold inventory strip. */
export const formatCityStatsSummary = (stats: LandingCityStats): string => {
  const parts: string[] = [formatHotelCountLabel(stats)];
  if (stats.avgRating != null) {
    parts.push(`avg guest rating ${stats.avgRating}`);
  }
  if (stats.dominantStarRating != null) {
    parts.push(`mostly ${stats.dominantStarRating}-star`);
  }
  if (stats.topTypes[0]) {
    const types =
      stats.topTypes.length === 1
        ? stats.topTypes[0].toLowerCase() + "s"
        : stats.topTypes
            .slice(0, 2)
            .map((t) => t.toLowerCase() + "s")
            .join(" & ");
    parts.push(types);
  }
  if (stats.airportCode) {
    parts.push(`near ${stats.airportCode}`);
  }
  return parts.join(" · ");
};
