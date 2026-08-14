import { buildLandingPath } from "@/lib/landingPages";
import type { SitelinkPageConfig } from "@/lib/sitelinkPages";
import { TRENDING_DESTINATIONS } from "@/lib/trendingDestinations";

export const getSitelinkBrowseLinks = (
  page: SitelinkPageConfig
): { name: string; path: string }[] =>
  TRENDING_DESTINATIONS.map((city) => ({
    name: city.title,
    path: buildLandingPath(city.slug, page.browseIntentSlug),
  }));
