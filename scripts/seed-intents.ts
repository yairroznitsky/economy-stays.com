import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { intentSeedSchema } from "./lib/contentSchema.ts";
import { loadDotEnv, upsertRows } from "./lib/supabaseAdmin.ts";

loadDotEnv();

const main = async () => {
  const { values } = parseArgs({
    options: {
      file: { type: "string", default: "data/intents.json" },
    },
  });

  const raw = readFileSync(values.file!, "utf8");
  const intents = JSON.parse(raw) as unknown[];
  const rows = intents.map((intent) => intentSeedSchema.parse(intent));

  await upsertRows(
    "landing_page_intents",
    rows.map((intent) => ({
      slug: intent.slug,
      label: intent.label,
      category: intent.category,
      star_rating: intent.star_rating ?? null,
      amenities: intent.amenities ?? null,
      audience: intent.audience ?? null,
      prompt_notes: intent.prompt_notes ?? null,
      priority: intent.priority,
      active: intent.active,
    })),
    "slug"
  );

  console.log(`Seeded ${rows.length} intents`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
