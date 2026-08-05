import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import {
  buildCityPath,
  buildHotelPath,
  buildIntentPath,
} from "../api/lib/hotelSlug.ts";
import { loadDotEnv, selectRows } from "./lib/supabaseAdmin.ts";

/**
 * Writes a sitemap index at public/sitemap.xml pointing at:
 * - sitemap-cities.xml    — city + city×intent template pages
 * - sitemap-hotels-N.xml  — hotel slug pages (deduped)
 *
 * Pass --no-hotels to skip the hotel catalog (faster local builds).
 */

loadDotEnv();

type CityRow = { slug: string; country_code: string };
type IntentRow = { slug: string };
type HotelRow = {
  external_id: number;
  name: string;
  city_name: string | null;
  reviews: number | null;
};

const siteDomain = process.env.VITE_SITE_DOMAIN ?? "cheap-stays.com";
const PAGE_SIZE = 1000;
const URLS_PER_SITEMAP = 45000;

const { values: args } = parseArgs({
  options: {
    "no-hotels": { type: "boolean", default: false },
  },
});

const buildUrlset = (paths: string[]): string => {
  const urls = paths
    .map((path) => `  <url>\n    <loc>https://${siteDomain}${path}</loc>\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
};

const buildIndex = (files: string[]): string => {
  const entries = files
    .map((file) => `  <sitemap>\n    <loc>https://${siteDomain}/${file}</loc>\n  </sitemap>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>\n`;
};

const fetchAll = async <T>(table: string, query: string): Promise<T[]> => {
  const rows: T[] = [];
  let offset = 0;
  for (;;) {
    const page = await selectRows<T>(
      table,
      `${query}&limit=${PAGE_SIZE}&offset=${offset}`
    );
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
    offset += page.length;
  }
};

const main = async () => {
  const files: string[] = [];

  try {
    const [cities, intents] = await Promise.all([
      fetchAll<CityRow>("cities", "select=slug,country_code&order=slug.asc"),
      fetchAll<IntentRow>(
        "landing_page_intents",
        "select=slug&active=eq.true&order=slug.asc"
      ),
    ]);

    const cityIntentPaths: string[] = [];
    for (const city of cities) {
      cityIntentPaths.push(buildCityPath(city.slug));
      for (const intent of intents) {
        cityIntentPaths.push(buildIntentPath(city.slug, intent.slug));
      }
    }

    writeFileSync(
      join("public", "sitemap-cities.xml"),
      buildUrlset(cityIntentPaths)
    );
    files.push("sitemap-cities.xml");
    console.log(
      `Wrote sitemap-cities.xml with ${cityIntentPaths.length} city/intent page(s)`
    );

    if (!args["no-hotels"]) {
      const hotels = await fetchAll<HotelRow>(
        "staging_hotels",
        "select=external_id,name,city_name,reviews&order=reviews.desc.nullslast,external_id.asc"
      );

      const bestByPath = new Map<string, string>();
      for (const row of hotels) {
        const path = buildHotelPath(row.city_name, row.name);
        if (!bestByPath.has(path)) {
          bestByPath.set(path, path);
        }
      }
      const hotelPaths = [...bestByPath.keys()].sort();

      for (let i = 0; i * URLS_PER_SITEMAP < hotelPaths.length; i += 1) {
        const chunk = hotelPaths.slice(
          i * URLS_PER_SITEMAP,
          (i + 1) * URLS_PER_SITEMAP
        );
        const file = `sitemap-hotels-${i + 1}.xml`;
        writeFileSync(join("public", file), buildUrlset(chunk));
        files.push(file);
      }
      console.log(
        `Wrote ${files.length - 1} hotel sitemap file(s) covering ${hotelPaths.length} hotel(s)`
      );
    }

    writeFileSync(join("public", "sitemap.xml"), buildIndex(files));
    console.log(`Wrote sitemap.xml index referencing ${files.length} file(s)`);
  } catch (error) {
    console.warn("Sitemap: Supabase unavailable, keeping existing sitemap files.", error);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
