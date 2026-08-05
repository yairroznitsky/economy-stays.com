import { parseArgs } from "node:util";
import { buildLandingPagePath } from "./lib/paths.ts";
import { loadDotEnv, selectRows, insertRows } from "./lib/supabaseAdmin.ts";

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

const parseList = (value: string | undefined): string[] | null => {
  if (!value || value === "all") return null;
  return value.split(",").map((item) => item.trim()).filter(Boolean);
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

  const existingPages = await selectRows<LandingPageRow>(
    "landing_pages",
    "select=id,city_id,intent_id,path"
  );

  const existingKeys = new Set(
    existingPages.map((page) => `${page.city_id}:${page.intent_id ?? "base"}`)
  );

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

  for (const city of selectedCities) {
    if (includeBase) {
      const key = `${city.id}:base`;
      if (!existingKeys.has(key)) {
        rows.push({
          city_id: city.id,
          intent_id: null,
          path: buildLandingPagePath(city.slug),
          status: "draft",
          noindex: true,
        });
      }
    }

    for (const intent of selectedIntents) {
      const key = `${city.id}:${intent.id}`;
      if (existingKeys.has(key)) continue;
      rows.push({
        city_id: city.id,
        intent_id: intent.id,
        path: buildLandingPagePath(city.slug, intent.slug),
        status: "draft",
        noindex: true,
      });
    }
  }

  if (rows.length === 0) {
    console.log("No new landing pages to create");
    return;
  }

  await insertRows("landing_pages", rows);
  console.log(`Created ${rows.length} landing page rows`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
