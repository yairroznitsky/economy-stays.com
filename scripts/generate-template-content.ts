import { parseArgs } from "node:util";
import { buildTemplateContent } from "./lib/templateContent.ts";
import { loadDotEnv, patchRows, selectRows, insertRows } from "./lib/supabaseAdmin.ts";

loadDotEnv();

type PageRow = {
  id: string;
  path: string;
  status: string;
  city_id: string;
  intent_id: string | null;
};

type CityRow = {
  id: string;
  slug: string;
  name: string;
  country: string;
};

type IntentRow = {
  id: string;
  slug: string;
  label: string;
};

type ContentRow = {
  landing_page_id: string;
  version: number;
};

const buildSearchDefaults = (city: CityRow) => ({
  destinationQuery: city.name,
  nightsOffsetDays: 7,
  stayNights: 2,
  adults: 2,
  rooms: 1,
});

const PAGE_CHUNK = 200;

const loadPagesNeedingContent = async (options: {
  status: string;
  intentsOnly: boolean;
  batchSize: number;
  force: boolean;
  pageId?: string;
  currentByPage: Set<string>;
}): Promise<PageRow[]> => {
  if (options.pageId) {
    return selectRows<PageRow>(
      "landing_pages",
      `select=id,path,status,city_id,intent_id&id=eq.${options.pageId}`
    );
  }

  const candidates: PageRow[] = [];
  let offset = 0;

  while (candidates.length < options.batchSize) {
    let query =
      `select=id,path,status,city_id,intent_id&status=eq.${options.status}` +
      `&order=created_at.asc&limit=${PAGE_CHUNK}&offset=${offset}`;

    if (options.intentsOnly) {
      query += "&intent_id=not.is.null";
    }

    const chunk = await selectRows<PageRow>("landing_pages", query);
    if (chunk.length === 0) break;

    for (const page of chunk) {
      if (options.force || !options.currentByPage.has(page.id)) {
        candidates.push(page);
        if (candidates.length >= options.batchSize) break;
      }
    }

    offset += chunk.length;
    if (chunk.length < PAGE_CHUNK) break;
  }

  return candidates;
};

const main = async () => {
  const { values } = parseArgs({
    options: {
      status: { type: "string", default: "draft" },
      batch: { type: "string", default: "200" },
      page: { type: "string" },
      force: { type: "boolean", default: false },
      "intents-only": { type: "boolean", default: true },
      "include-base": { type: "boolean", default: false },
    },
  });

  const batchSize = Number.parseInt(values.batch!, 10);
  const intentsOnly = values["intents-only"] && !values["include-base"];

  const existingContent = await selectRows<ContentRow>(
    "landing_page_content",
    "select=landing_page_id,version&is_current=eq.true"
  );
  const currentByPage = new Set(existingContent.map((row) => row.landing_page_id));

  const pages = await loadPagesNeedingContent({
    status: values.status!,
    intentsOnly,
    batchSize,
    force: values.force ?? false,
    pageId: values.page,
    currentByPage,
  });

  const cities = await selectRows<CityRow>(
    "cities",
    "select=id,slug,name,country"
  );
  const intents = await selectRows<IntentRow>(
    "landing_page_intents",
    "select=id,slug,label"
  );

  const cityById = new Map(cities.map((city) => [city.id, city]));
  const intentById = new Map(intents.map((intent) => [intent.id, intent]));

  let generated = 0;

  for (const page of pages) {
    const city = cityById.get(page.city_id);
    if (!city) continue;

    const intent = page.intent_id ? intentById.get(page.intent_id) ?? null : null;
    if (intentsOnly && !intent) continue;

    const content = buildTemplateContent(city, intent);

    const versions = await selectRows<ContentRow>(
      "landing_page_content",
      `select=landing_page_id,version&landing_page_id=eq.${page.id}&order=version.desc&limit=1`
    );
    const nextVersion = (versions[0]?.version ?? 0) + 1;

    if (values.force && versions.length > 0) {
      await patchRows(
        "landing_page_content",
        `landing_page_id=eq.${page.id}&is_current=eq.true`,
        { is_current: false }
      );
    }

    await insertRows("landing_page_content", [
      {
        landing_page_id: page.id,
        version: nextVersion,
        is_current: true,
        h1: content.h1,
        subtitle: content.subtitle,
        meta_title: content.metaTitle,
        meta_description: content.metaDescription,
        intro_text: content.introText,
        faqs: content.faqs,
        benefits: content.benefits,
        cta_text: content.ctaText,
        search_defaults: buildSearchDefaults(city),
        model: "template",
      },
    ]);

    generated += 1;
    console.log(`Templated content for ${page.path}`);
  }

  console.log(`Generated ${generated} page(s)`);
  if (generated === 0 && !values.page) {
    console.log("No draft intent pages left without content.");
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
