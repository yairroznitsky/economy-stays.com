import { parseArgs } from "node:util";
import { buildLandingPagePath } from "./lib/paths.ts";
import { loadDotEnv, selectRows, supabaseFetch } from "./lib/supabaseAdmin.ts";

loadDotEnv();

type CityRow = {
  id: string;
  slug: string;
  name: string;
  priority: number;
  active: boolean;
};

type IntentRow = {
  id: string;
  slug: string;
  label: string;
  active: boolean;
  priority: number;
};

type LandingPageRow = {
  id: string;
  city_id: string;
  intent_id: string | null;
  path: string;
};

const PAGE_SIZE = 1000;

const parseList = (value: string | undefined): string[] | null => {
  if (!value || value === "all") return null;
  return value.split(",").map((item) => item.trim()).filter(Boolean);
};

const fetchAllExistingPages = async (): Promise<LandingPageRow[]> => {
  const rows: LandingPageRow[] = [];
  let offset = 0;
  for (;;) {
    const page = await selectRows<LandingPageRow>(
      "landing_pages",
      `select=id,city_id,intent_id,path&limit=${PAGE_SIZE}&offset=${offset}`
    );
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += page.length;
  }
  return rows;
};

const isDuplicateKeyError = (text: string): boolean =>
  text.includes("23505") || /duplicate key/i.test(text);

const insertRowsSkipDuplicates = async (
  table: string,
  rows: Record<string, unknown>[]
): Promise<{ created: number; skipped: number }> => {
  let created = 0;
  let skipped = 0;
  for (const row of rows) {
    const response = await supabaseFetch(encodeURIComponent(table), {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(row),
    });
    if (!response.ok) {
      const text = await response.text();
      if (isDuplicateKeyError(text)) {
        skipped += 1;
        continue;
      }
      throw new Error(`Insert ${table} failed: ${text || response.statusText}`);
    }
    created += 1;
  }
  return { created, skipped };
};

const main = async () => {
  const { values } = parseArgs({
    options: {
      cities: { type: "string", default: "all" },
      intents: { type: "string", default: "base,cheap-hotels,family-hotels,4-star-hotels,hotels-with-breakfast" },
      "top-cities": { type: "string" },
    },
  });

  const cityFilter = parseList(values.cities);
  const intentFilter = parseList(values.intents);
  const topCities = values["top-cities"]
    ? Number.parseInt(values["top-cities"], 10)
    : null;

  const cities = await selectRows<CityRow>(
    "cities",
    "select=id,slug,name,priority,active&active=eq.true&order=priority.desc"
  );

  const intents = await selectRows<IntentRow>(
    "landing_page_intents",
    "select=id,slug,label,active,priority&active=eq.true&order=priority.desc"
  );

  const existingPages = await fetchAllExistingPages();

  const existingKeys = new Set(
    existingPages.map((page) => `${page.city_id}:${page.intent_id ?? "base"}`)
  );
  const existingPaths = new Set(existingPages.map((page) => page.path));

  let selectedCities = cities;
  if (cityFilter) {
    selectedCities = cities.filter((city) => cityFilter.includes(city.slug));
  } else if (topCities) {
    selectedCities = cities.slice(0, topCities);
  }

  const includeBase = !intentFilter || intentFilter.includes("base");
  const selectedIntents = intentFilter
    ? intents.filter((intent) => intentFilter.includes(intent.slug))
    : intents;

  const rows: Record<string, unknown>[] = [];
  let skipped = 0;

  for (const city of selectedCities) {
    if (includeBase) {
      const key = `${city.id}:base`;
      const path = buildLandingPagePath(city.slug);
      if (existingKeys.has(key) || existingPaths.has(path)) {
        skipped += 1;
      } else {
        existingKeys.add(key);
        existingPaths.add(path);
        rows.push({
          city_id: city.id,
          intent_id: null,
          path,
          status: "draft",
          noindex: true,
        });
      }
    }

    for (const intent of selectedIntents) {
      const key = `${city.id}:${intent.id}`;
      const path = buildLandingPagePath(city.slug, intent.slug);
      if (existingKeys.has(key) || existingPaths.has(path)) {
        skipped += 1;
        continue;
      }
      existingKeys.add(key);
      existingPaths.add(path);
      rows.push({
        city_id: city.id,
        intent_id: intent.id,
        path,
        status: "draft",
        noindex: true,
      });
    }
  }

  if (rows.length === 0) {
    console.log(`No new landing pages to create (skipped=${skipped})`);
    return;
  }

  const { created, skipped: insertSkipped } = await insertRowsSkipDuplicates(
    "landing_pages",
    rows
  );
  console.log(
    `Created ${created} landing page row(s), skipped ${skipped + insertSkipped}`
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
