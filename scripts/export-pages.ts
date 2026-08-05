import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";
import { buildLandingDataFilePath } from "./lib/paths.ts";
import { loadDotEnv, selectRows } from "./lib/supabaseAdmin.ts";

loadDotEnv();

type ExportPageRow = {
  id: string;
  path: string;
  status: string;
  noindex: boolean;
  city_id: string;
  intent_id: string | null;
};

type CityRow = {
  id: string;
  slug: string;
  name: string;
  country: string;
  country_code: string;
  lat: number;
  lng: number;
  airport_code: string | null;
  kayak_destination_id: string | null;
  kayak_city_slug: string | null;
};

type IntentRow = {
  id: string;
  slug: string;
  label: string;
  category: string;
  star_rating: number | null;
  amenities: string[] | null;
  audience: string | null;
};

type ContentRow = {
  landing_page_id: string;
  h1: string;
  subtitle: string;
  meta_title: string;
  meta_description: string;
  intro_text: string;
  faqs: Array<{ q: string; a: string }>;
  benefits: Array<{ title: string; text: string }>;
  cta_text: string;
  search_defaults: Record<string, unknown>;
};

const siteDomain = process.env.VITE_SITE_DOMAIN ?? "cheap-stays.com";

const writeJson = (filePath: string, payload: unknown) => {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
};

const buildSitemap = (paths: string[]) => {
  const urls = paths
    .map(
      (path) =>
        `  <url>\n    <loc>https://${siteDomain}${path}</loc>\n  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
};

const main = async () => {
  const { values } = parseArgs({
    options: {
      out: { type: "string", default: "public/landing-data" },
      drafts: { type: "boolean", default: false },
      "skip-supabase": { type: "boolean", default: false },
    },
  });

  const outputDir = values.out!;
  const statusFilter = values.drafts ? "draft" : "published";

  if (values["skip-supabase"]) {
    console.log("Skipping Supabase export (--skip-supabase). Existing JSON retained.");
    return;
  }

  try {
    const pages = await selectRows<ExportPageRow>(
      "landing_pages",
      `select=id,path,status,noindex,city_id,intent_id&status=eq.${statusFilter}`
    );

    if (pages.length === 0) {
      console.log(`No ${statusFilter} pages found in Supabase. Keeping existing export.`);
      return;
    }

    const cities = await selectRows<CityRow>(
      "cities",
      "select=id,slug,name,country,country_code,lat,lng,airport_code,kayak_destination_id,kayak_city_slug"
    );
    const intents = await selectRows<IntentRow>(
      "landing_page_intents",
      "select=id,slug,label,category,star_rating,amenities,audience"
    );
    const contentRows = await selectRows<ContentRow>(
      "landing_page_content",
      "select=landing_page_id,h1,subtitle,meta_title,meta_description,intro_text,faqs,benefits,cta_text,search_defaults&is_current=eq.true"
    );

    const cityById = new Map(cities.map((city) => [city.id, city]));
    const intentById = new Map(intents.map((intent) => [intent.id, intent]));
    const contentByPage = new Map(contentRows.map((row) => [row.landing_page_id, row]));

    if (existsSync(outputDir)) {
      rmSync(outputDir, { recursive: true, force: true });
    }
    mkdirSync(outputDir, { recursive: true });

    const manifestPages: Record<string, string> = {};
    const indexablePaths: string[] = [];

    for (const page of pages) {
      const city = cityById.get(page.city_id);
      const content = contentByPage.get(page.id);
      if (!city || !content) continue;

      const intent = page.intent_id ? intentById.get(page.intent_id) : undefined;
      const dataPath = buildLandingDataFilePath(city.slug, intent?.slug);
      manifestPages[page.path] = dataPath;

      const payload = {
        id: page.id,
        path: page.path,
        city: {
          id: city.id,
          slug: city.slug,
          name: city.name,
          country: city.country,
          countryCode: city.country_code,
          lat: city.lat,
          lng: city.lng,
          airportCode: city.airport_code ?? undefined,
          kayakDestinationId: city.kayak_destination_id ?? undefined,
          kayakCitySlug: city.kayak_city_slug ?? undefined,
        },
        intent: intent
          ? {
              id: intent.id,
              slug: intent.slug,
              label: intent.label,
              category: intent.category,
              starRating: intent.star_rating ?? undefined,
              amenities: intent.amenities ?? undefined,
              audience: intent.audience ?? undefined,
            }
          : undefined,
        content: {
          h1: content.h1,
          subtitle: content.subtitle,
          metaTitle: content.meta_title,
          metaDescription: content.meta_description,
          introText: content.intro_text,
          faqs: content.faqs,
          benefits: content.benefits,
          ctaText: content.cta_text,
        },
        searchDefaults: content.search_defaults,
        seo: {
          noindex: page.noindex,
          canonical: page.path,
        },
        tracking: {
          landingPageId: page.id,
          cityId: city.id,
          intentId: intent?.id,
        },
      };

      writeJson(join(outputDir, dataPath), payload);
      if (!page.noindex) indexablePaths.push(page.path);
    }

    writeJson(join(outputDir, "manifest.json"), {
      pages: manifestPages,
      generatedAt: new Date().toISOString(),
    });

    writeFileSync(join("public", "sitemap.xml"), buildSitemap(indexablePaths));
    console.log(`Exported ${Object.keys(manifestPages).length} pages to ${outputDir}`);
  } catch (error) {
    console.warn("Supabase export failed; keeping existing landing-data files.", error);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
