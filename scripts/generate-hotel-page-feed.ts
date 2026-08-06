import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";
import {
  buildCityPath,
  buildHotelPath,
  buildIntentPath,
  slugifyName,
} from "../lib/landing-page/hotelSlug.ts";
import { loadDotEnv, selectRows } from "./lib/supabaseAdmin.ts";

/**
 * Google Ads page feed for all landing page types:
 * - City pages (/hotels/{city})
 * - City × intent pages (/hotels/{city}/{intent})
 * - Hotel pages (/hotels/{city}/{hotel-slug})
 *
 * Usage:
 *   npx tsx scripts/generate-hotel-page-feed.ts
 *   npx tsx scripts/generate-hotel-page-feed.ts --hotels-only --limit 50000
 *   npx tsx scripts/generate-hotel-page-feed.ts --country US --min-reviews 50
 */

loadDotEnv();

type CityRow = {
  slug: string;
  name: string;
  country_code: string;
};

type IntentRow = {
  slug: string;
  label: string;
};

type HotelRow = {
  external_id: number;
  name: string;
  city_name: string | null;
  country_code: string | null;
  star_rating: number | null;
  reviews: number | null;
};

const PAGE_SIZE = 1000;
const siteDomain = process.env.VITE_SITE_DOMAIN ?? "cheap-stays.com";

const { values: args } = parseArgs({
  options: {
    limit: { type: "string", default: "0" },
    country: { type: "string" },
    "min-reviews": { type: "string" },
    "hotels-only": { type: "boolean", default: false },
    "no-hotels": { type: "boolean", default: false },
    out: { type: "string", default: join("data", "feeds", "hotel-page-feed.csv") },
  },
});

const limit = Number(args.limit) || 0;
const minReviews = Number(args["min-reviews"]) || 0;
const country = args.country?.trim().toUpperCase();

const csvField = (value: string): string =>
  /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

const pushRow = (
  lines: string[],
  path: string,
  labels: string[]
): void => {
  lines.push(
    `https://${siteDomain}${path},${csvField(labels.filter(Boolean).join("; "))}`
  );
};

const addCityAndIntentRows = async (lines: string[]): Promise<number> => {
  let cities = await selectRows<CityRow>(
    "cities",
    "select=slug,name,country_code&order=slug.asc"
  );
  const intents = await selectRows<IntentRow>(
    "landing_page_intents",
    "select=slug,label&active=eq.true&order=slug.asc"
  );

  if (country) {
    cities = cities.filter(
      (city) => city.country_code.toUpperCase() === country
    );
  }

  let count = 0;
  for (const city of cities) {
    pushRow(lines, buildCityPath(city.slug), [
      "type_city",
      `country_${city.country_code.toLowerCase()}`,
      `city_${city.slug}`,
    ]);
    count += 1;

    for (const intent of intents) {
      pushRow(lines, buildIntentPath(city.slug, intent.slug), [
        "type_intent",
        `country_${city.country_code.toLowerCase()}`,
        `city_${city.slug}`,
        `intent_${intent.slug}`,
      ]);
      count += 1;
    }
  }

  return count;
};

const buildHotelFilter = (): string => {
  const parts = [
    "select=external_id,name,city_name,country_code,star_rating,reviews",
    "order=reviews.desc.nullslast,external_id.asc",
  ];
  if (country) parts.push(`country_code=eq.${encodeURIComponent(country)}`);
  if (minReviews > 0) parts.push(`reviews=gte.${minReviews}`);
  return parts.join("&");
};

const addHotelRows = async (lines: string[]): Promise<number> => {
  const baseQuery = buildHotelFilter();
  const bestByPath = new Map<string, HotelRow>();
  let offset = 0;
  let fetched = 0;

  for (;;) {
    const pageLimit =
      limit > 0 ? Math.min(PAGE_SIZE, limit - fetched) : PAGE_SIZE;
    if (pageLimit <= 0) break;

    const rows = await selectRows<HotelRow>(
      "staging_hotels",
      `${baseQuery}&limit=${pageLimit}&offset=${offset}`
    );

    for (const row of rows) {
      const path = buildHotelPath(row.city_name, row.name);
      const existing = bestByPath.get(path);
      if (!existing || (row.reviews ?? 0) > (existing.reviews ?? 0)) {
        bestByPath.set(path, row);
      }
    }

    fetched += rows.length;
    if (rows.length < pageLimit) break;
    offset += rows.length;
    if (offset % 10000 === 0) {
      console.log(`Fetched ${offset} hotels...`);
    }
  }

  for (const [path, row] of bestByPath) {
    pushRow(lines, path, [
      "type_hotel",
      row.country_code ? `country_${row.country_code.toLowerCase()}` : "",
      row.city_name ? `city_${slugifyName(row.city_name)}` : "",
      row.star_rating ? `stars_${row.star_rating}` : "",
    ]);
  }

  return bestByPath.size;
};

const main = async () => {
  const lines = ["Page URL,Custom label"];
  let cityIntentCount = 0;
  let hotelCount = 0;

  if (!args["hotels-only"]) {
    cityIntentCount = await addCityAndIntentRows(lines);
    console.log(`Added ${cityIntentCount} city and intent page URL(s)`);
  }

  if (!args["no-hotels"]) {
    hotelCount = await addHotelRows(lines);
    console.log(`Added ${hotelCount} hotel page URL(s)`);
  }

  const outPath = args.out as string;
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${lines.join("\n")}\n`);
  console.log(`Wrote ${lines.length - 1} total page URL(s) to ${outPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
