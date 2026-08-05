export const slugify = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const buildLandingPagePath = (
  citySlug: string,
  intentSlug?: string | null
): string => {
  const city = slugify(citySlug);
  if (!intentSlug) return `/hotels/${city}`;
  return `/hotels/${city}/${slugify(intentSlug)}`;
};

export const buildLandingDataFilePath = (
  citySlug: string,
  intentSlug?: string | null
): string => {
  const city = slugify(citySlug);
  if (!intentSlug) return `${city}/index.json`;
  return `${city}/${slugify(intentSlug)}.json`;
};
