import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import OpenAI from "openai";
import sharp from "sharp";
import { slugify } from "./lib/paths.ts";
import { loadDotEnv } from "./lib/supabaseAdmin.ts";

/**
 * Generate optimized city hero images for landing pages via OpenAI Images API.
 * Outputs resized WebP variants into public/images/city-heroes-optimized.
 *
 * Usage:
 *   npm run generate:city-heroes
 *   npm run generate:city-heroes -- --slug miami
 *   npm run generate:city-heroes -- --force --limit 5
 */

loadDotEnv();

type CityRow = {
  name: string;
  country: string;
  country_code: string;
};

const OUTPUT_DIR = join("public", "images", "city-heroes-optimized");
const LEGACY_ASSET_DIR = join("src", "assets", "destinations");
const CSV_PATH = "data/cities-top200.csv";
const MANIFEST_PATH = join(OUTPUT_DIR, "manifest.json");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseCsv = (raw: string): CityRow[] => {
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const [headerLine, ...rows] = lines;
  const headers = headerLine.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));

  return rows
    .map((line) => {
      const values = line.match(/(".*?"|[^,]+)(?=,|$)/g)?.map((value) =>
        value.trim().replace(/^"|"$/g, "")
      );
      if (!values) return null;
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = values[index] ?? "";
      });
      return {
        name: record.name,
        country: record.country,
        country_code: record.country_code,
      };
    })
    .filter((row): row is CityRow => Boolean(row?.name));
};

const buildPrompt = (city: CityRow): string =>
  [
    `Wide cinematic travel photograph of ${city.name}, ${city.country}.`,
    "Iconic skyline or recognizable landmark at golden hour, warm natural light,",
    "photorealistic, empty scene with no people, no text, no logos, no watermark.",
    "Horizontal composition for a hotel booking website hero banner.",
  ].join(" ");

const DESKTOP_WIDTH = 1600;
const MOBILE_WIDTH = 960;
const WEBP_QUALITY = 72;

const encodeHeroVariants = async (input: Buffer | string) => {
  const buffer = typeof input === "string" ? await sharp(input).toBuffer() : input;
  const desktop = await sharp(buffer)
    .rotate()
    .resize({
      width: DESKTOP_WIDTH,
      withoutEnlargement: true,
      fit: "inside",
    })
    .webp({ quality: WEBP_QUALITY, effort: 6 })
    .toBuffer();
  const mobile = await sharp(buffer)
    .rotate()
    .resize({
      width: MOBILE_WIDTH,
      withoutEnlargement: true,
      fit: "inside",
    })
    .webp({ quality: WEBP_QUALITY, effort: 6 })
    .toBuffer();
  return { desktop, mobile };
};

const writeHeroVariants = async (
  input: Buffer | string,
  outputPath: string
): Promise<void> => {
  const { desktop, mobile } = await encodeHeroVariants(input);
  writeFileSync(outputPath, desktop);
  writeFileSync(outputPath.replace(/\.webp$/i, "-960.webp"), mobile);
};

const migrateLegacyAsset = async (
  slug: string,
  outputPath: string
): Promise<boolean> => {
  for (const ext of [".jpg", ".jpeg", ".png", ".webp"]) {
    const legacyPath = join(LEGACY_ASSET_DIR, `${slug}${ext}`);
    if (!existsSync(legacyPath)) continue;
    try {
      await writeHeroVariants(legacyPath, outputPath);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Legacy migrate failed for ${slug}: ${message}`);
      return false;
    }
  }
  return false;
};

const generateImage = async (
  client: OpenAI,
  city: CityRow,
  model: string
): Promise<{ buffer: Buffer; isWebp: boolean }> => {
  const prompt = buildPrompt(city);
  const isGptImage = model.startsWith("gpt-image");

  const response = await client.images.generate({
    model,
    prompt,
    n: 1,
    size: isGptImage ? "1536x1024" : "1024x1024",
    ...(isGptImage
      ? { quality: "low", output_format: "webp" as const }
      : {}),
  });

  const b64 = response.data?.[0]?.b64_json;
  if (b64) {
    return {
      buffer: Buffer.from(b64, "base64"),
      isWebp: isGptImage,
    };
  }

  const url = response.data?.[0]?.url;
  if (!url) {
    throw new Error("OpenAI returned no image data");
  }

  const imageResponse = await fetch(url);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download generated image (${imageResponse.status})`);
  }
  return {
    buffer: Buffer.from(await imageResponse.arrayBuffer()),
    isWebp: false,
  };
};

const saveHeroImage = async (
  buffer: Buffer,
  outputPath: string
): Promise<void> => {
  await writeHeroVariants(buffer, outputPath);
};

const loadManifest = (): Set<string> => {
  if (!existsSync(MANIFEST_PATH)) return new Set();
  try {
    const parsed = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as {
      slugs?: string[];
    };
    return new Set(parsed.slugs ?? []);
  } catch {
    return new Set();
  }
};

const saveManifest = (slugs: Set<string>): void => {
  writeFileSync(
    MANIFEST_PATH,
    `${JSON.stringify({ slugs: [...slugs].sort(), updatedAt: new Date().toISOString() }, null, 2)}\n`
  );
};

const main = async () => {
  const { values } = parseArgs({
    options: {
      file: { type: "string", default: CSV_PATH },
      slug: { type: "string" },
      limit: { type: "string" },
      force: { type: "boolean", default: false },
      model: { type: "string", default: "gpt-image-1" },
      delay: { type: "string", default: "15000" },
    },
  });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const cities = parseCsv(readFileSync(values.file!, "utf8"));
  const slugFilter = values.slug?.trim().toLowerCase();
  const limit = values.limit ? Number.parseInt(values.limit, 10) : cities.length;
  const delayMs = Number.parseInt(values.delay!, 10);

  let targets = cities.map((city) => ({ ...city, slug: slugify(city.name) }));
  if (slugFilter) {
    targets = targets.filter((city) => city.slug === slugFilter);
  }
  targets = targets.slice(0, limit);

  const client = new OpenAI({ apiKey });
  const manifest = loadManifest();

  let migrated = 0;
  let skipped = 0;
  let generated = 0;
  let failed = 0;

  for (const city of targets) {
    const outputPath = join(OUTPUT_DIR, `${city.slug}.webp`);

    if (existsSync(outputPath) && !values.force) {
      manifest.add(city.slug);
      skipped += 1;
      continue;
    }

    if (!values.force && (await migrateLegacyAsset(city.slug, outputPath))) {
      manifest.add(city.slug);
      migrated += 1;
      console.log(`Migrated legacy asset for ${city.slug}`);
      continue;
    }

    try {
      console.log(`Generating ${city.slug} (${city.name}, ${city.country})...`);
      const { buffer } = await generateImage(client, city, values.model!);
      await saveHeroImage(buffer, outputPath);
      manifest.add(city.slug);
      generated += 1;
      console.log(`Saved ${outputPath}`);
      if (delayMs > 0) {
        await sleep(delayMs);
      }
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed ${city.slug}: ${message}`);
    }
  }

  saveManifest(manifest);
  console.log(
    `Done. generated=${generated}, migrated=${migrated}, skipped=${skipped}, failed=${failed}, total=${targets.length}`
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
