import { buildIntentPath } from "./hotelSlug";
import { selectRows } from "./supabaseRest";

const INTENT_BROWSE_SELECT = "slug,label,priority";

export type BrowseIntentRow = {
  slug: string;
  label: string;
  priority: number | null;
};

export type LandingBrowseIntent = {
  slug: string;
  label: string;
  path: string;
};

const safeSelectIntents = async (
  query: string
): Promise<BrowseIntentRow[]> => {
  try {
    return await selectRows<BrowseIntentRow>("landing_page_intents", query);
  } catch {
    return [];
  }
};

export const fetchBrowseIntents = async (
  citySlug: string
): Promise<LandingBrowseIntent[]> => {
  const rows = await safeSelectIntents(
    [
      `select=${INTENT_BROWSE_SELECT}`,
      "active=eq.true",
      "order=priority.asc.nullslast,slug.asc",
    ].join("&")
  );

  return rows.map((row) => ({
    slug: row.slug,
    label: row.label,
    path: buildIntentPath(citySlug, row.slug),
  }));
};
