import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { cityImportSchema } from "./lib/contentSchema.ts";
import { slugify } from "./lib/paths.ts";
import { loadDotEnv, upsertRows } from "./lib/supabaseAdmin.ts";

loadDotEnv();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const resolveKayakDestination = async (
  query: string
): Promise<{ destinationId?: string; citySlug?: string }> => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return {};

  const response = await fetch(`${supabaseUrl}/functions/v1/kayak-autocomplete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, locale: "en-US", country: "US" }),
  });

  if (!response.ok) return {};
  const payload = (await response.json()) as {
    suggestions?: Array<{ id?: string; label?: string; raw?: Record<string, unknown> }>;
  };
  const top = payload.suggestions?.[0];
  if (!top?.id) return {};

  const rawSlug =
    typeof top.raw?.citySlug === "string"
      ? top.raw.citySlug
      : typeof top.raw?.slug === "string"
        ? top.raw.slug
        : top.label?.split(",")[0]?.trim();

  return {
    destinationId: top.id,
    citySlug: rawSlug,
  };
};

const parseCsv = (raw: string) => {
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const [headerLine, ...rows] = lines;
  const headers = headerLine.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));

  return rows.map((line) => {
    const values = line.match(/(".*?"|[^,]+)(?=,|$)/g)?.map((value) =>
      value.trim().replace(/^"|"$/g, "")
    );
    if (!values) return null;
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] ?? "";
    });
    return record;
  }).filter(Boolean) as Record<string, string>[];
};

const main = async () => {
  const { values } = parseArgs({
    options: {
      file: { type: "string", default: "data/cities-top200.csv" },
      "resolve-kayak": { type: "boolean", default: false },
      limit: { type: "string" },
    },
  });

  const raw = readFileSync(values.file!, "utf8");
  const parsed = parseCsv(raw);
  const limit = values.limit ? Number.parseInt(values.limit, 10) : parsed.length;

  const rows = [];
  for (const record of parsed.slice(0, limit)) {
    const city = cityImportSchema.parse(record);
    const slug = slugify(city.name);
    let kayakDestinationId: string | undefined;
    let kayakCitySlug: string | undefined;

    if (values["resolve-kayak"]) {
      const resolved = await resolveKayakDestination(`${city.name}, ${city.country}`);
      kayakDestinationId = resolved.destinationId;
      kayakCitySlug = resolved.citySlug;
      await sleep(250);
    }

    const row: Record<string, unknown> = {
      slug,
      name: city.name,
      country: city.country,
      country_code: city.country_code.toUpperCase(),
      lat: city.lat,
      lng: city.lng,
      airport_code: city.airport_code ?? null,
      priority: city.priority,
      active: true,
    };
    // Only write Kayak fields when resolving so a re-import does not blank them.
    if (values["resolve-kayak"]) {
      if (kayakDestinationId) row.kayak_destination_id = kayakDestinationId;
      if (kayakCitySlug) row.kayak_city_slug = kayakCitySlug;
    }
    rows.push(row);
  }

  await upsertRows("cities", rows, "slug");
  console.log(`Imported ${rows.length} cities from ${values.file}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
