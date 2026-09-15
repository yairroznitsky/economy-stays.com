/**
 * Landing page URL helpers.
 *
 * Hotel URLs are /hotels/{city-slug}/{hotel-slug} with no embedded id.
 * Lookup slugifies hotel names in JS and picks the best match (most reviews
 * on slug collisions). City and intent URLs use the same /hotels/ prefix.
 */

export const slugifyName = (value: string): string => {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "hotel";
};

/** Best-effort city name for DB filters when no cities row exists (e.g. praiano → Praiano). */
export const slugToCityName = (slug: string): string =>
  slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const buildCityPath = (countryCode: string, citySlug: string): string =>
  `/stay/${countryCode.toLowerCase()}/${citySlug}`;

export const buildIntentPath = (
  countryCode: string,
  citySlug: string,
  intentSlug: string
): string => `/stay/${countryCode.toLowerCase()}/${citySlug}/${intentSlug}`;

export const buildHotelPath = (
  cityName: string | null | undefined,
  hotelName: string
): string =>
  `/hotels/${slugifyName(cityName || "city")}/${slugifyName(hotelName)}`;

export interface LandingPathRef {
  countryCode: string;
  citySlug: string;
  segmentSlug?: string;
}

const LANDING_PATH_PATTERN = /^\/stay\/([a-z]{2})\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?$/;

export const parseLandingPath = (path: string): LandingPathRef | null => {
  const match = LANDING_PATH_PATTERN.exec(path);
  if (!match) return null;
  return { countryCode: match[1], citySlug: match[2], segmentSlug: match[3] };
};

/** @deprecated Use parseLandingPath */
export const parseHotelPath = parseLandingPath;
