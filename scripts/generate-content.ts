import OpenAI from "openai";
import { parseArgs } from "node:util";
import {
  parseGeneratedContent,
  validateMarketingClaims,
  type GeneratedLandingContent,
} from "./lib/contentSchema.ts";
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
  prompt_notes: string | null;
};

type ContentRow = {
  landing_page_id: string;
  version: number;
};

const buildPrompt = (city: CityRow, intent: IntentRow | null): string => {
  const intentLine = intent
    ? `Search intent: ${intent.label} (${intent.category}). ${intent.prompt_notes ?? ""}`
    : "Search intent: general hotels in this city.";

  return [
    "Write landing page content for a hotel comparison website.",
    "Rules:",
    "- Do not mention specific prices, percentages off, or savings claims.",
    "- Do not invent landmarks, distances, or facts not provided.",
    "- Be helpful, neutral, and concise.",
    "- Return JSON only.",
    "",
    `City: ${city.name}, ${city.country}`,
    intentLine,
    "Audience: travelers comparing hotel rates before booking on partner sites.",
  ].join("\n");
};

const CONTENT_JSON_EXAMPLE = `{
  "h1": "Compare Hotels in Paris",
  "subtitle": "Search rates across travel sites and pick the stay that fits your trip.",
  "metaTitle": "Hotels in Paris | Compare Rates | Economy Stays",
  "metaDescription": "Compare hotel rates in Paris across leading travel sites. Search by dates and guests to find a stay that fits your trip.",
  "introText": "Two short paragraphs about comparing hotel options in the city. No prices or invented landmarks.",
  "faqs": [
    { "q": "Question one?", "a": "Answer one." },
    { "q": "Question two?", "a": "Answer two." },
    { "q": "Question three?", "a": "Answer three." }
  ],
  "benefits": [
    { "title": "Compare multiple sites", "text": "See hotel options from trusted travel partners in one search." },
    { "title": "Search by your dates", "text": "Adjust check-in, check-out, guests, and rooms to match your trip." },
    { "title": "Book with partners you know", "text": "Continue to established booking sites to complete your reservation." }
  ],
  "ctaText": "Ready to compare hotel rates?"
}`;

const generateWithOpenAI = async (
  client: OpenAI,
  prompt: string,
  model: string
): Promise<GeneratedLandingContent> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await client.chat.completions.create({
        model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "You generate SEO landing page content for hotel comparison pages.",
              "Return JSON only, matching this exact shape:",
              CONTENT_JSON_EXAMPLE,
              "Rules for faqs: each item must use keys q and a (not question/answer).",
              "Rules for benefits: 2-3 items only, each an object with title and text (not plain strings).",
            ].join("\n"),
          },
          { role: "user", content: prompt },
        ],
      });

      const raw = response.choices[0]?.message?.content;
      if (!raw) throw new Error("OpenAI returned empty content");

      const parsed = parseGeneratedContent(JSON.parse(raw));
      const violations = validateMarketingClaims(parsed);
      if (violations.length > 0) {
        throw new Error(`Marketing claim violations: ${violations.join(", ")}`);
      }
      return parsed;
    } catch (error) {
      lastError = error;
      console.warn(`Generation attempt ${attempt} failed`, error);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Content generation failed");
};

const buildSearchDefaults = (city: CityRow) => ({
  destinationQuery: city.name,
  nightsOffsetDays: 7,
  stayNights: 2,
  adults: 2,
  rooms: 1,
});

const main = async () => {
  const { values } = parseArgs({
    options: {
      status: { type: "string", default: "draft" },
      batch: { type: "string", default: "20" },
      page: { type: "string" },
      force: { type: "boolean", default: false },
      model: { type: "string", default: "gpt-4o-mini" },
    },
  });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const client = new OpenAI({ apiKey });
  const batchSize = Number.parseInt(values.batch!, 10);

  const pages = await selectRows<PageRow>(
    "landing_pages",
    values.page
      ? `select=id,path,status,city_id,intent_id&id=eq.${values.page}`
      : `select=id,path,status,city_id,intent_id&status=eq.${values.status}&order=created_at.asc&limit=${batchSize}`
  );

  const cities = await selectRows<CityRow>(
    "cities",
    "select=id,slug,name,country,country_code,lat,lng,airport_code,kayak_destination_id,kayak_city_slug"
  );
  const intents = await selectRows<IntentRow>(
    "landing_page_intents",
    "select=id,slug,label,category,star_rating,amenities,audience,prompt_notes"
  );
  const existingContent = await selectRows<ContentRow>(
    "landing_page_content",
    "select=landing_page_id,version&is_current=eq.true"
  );

  const cityById = new Map(cities.map((city) => [city.id, city]));
  const intentById = new Map(intents.map((intent) => [intent.id, intent]));
  const currentByPage = new Set(existingContent.map((row) => row.landing_page_id));

  let generated = 0;
  let failed = 0;
  for (const page of pages) {
    if (currentByPage.has(page.id) && !values.force) {
      continue;
    }

    const city = cityById.get(page.city_id);
    if (!city) continue;
    const intent = page.intent_id ? intentById.get(page.intent_id) ?? null : null;

    try {
      const content = await generateWithOpenAI(
        client,
        buildPrompt(city, intent),
        values.model!
      );

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
          model: values.model,
        },
      ]);

      generated += 1;
      console.log(`Generated content for ${page.path}`);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to generate ${page.path}: ${message}`);
    }
  }

  console.log(`Generated ${generated} page(s), ${failed} failed`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
