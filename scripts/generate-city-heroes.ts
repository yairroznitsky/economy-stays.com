import { execFileSync } from "node:child_process";
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

/** Disambiguated Wikipedia titles for US state capitals (and similar collisions). */
const WIKIPEDIA_TITLES: Record<string, string> = {
  montgomery: "Montgomery, Alabama",
  juneau: "Juneau, Alaska",
  "little-rock": "Little Rock, Arkansas",
  sacramento: "Sacramento, California",
  hartford: "Hartford, Connecticut",
  dover: "Delaware Legislative Hall",
  tallahassee: "Florida State Capitol",
  boise: "Idaho State Capitol",
  springfield: "Illinois State Capitol",
  indianapolis: "Indianapolis",
  "des-moines": "Des Moines, Iowa",
  topeka: "Kansas State Capitol",
  frankfort: "Kentucky State Capitol",
  "baton-rouge": "Louisiana State Capitol",
  augusta: "Augusta, Maine",
  annapolis: "Annapolis, Maryland",
  lansing: "Michigan State Capitol",
  "saint-paul": "Saint Paul, Minnesota",
  jackson: "Mississippi State Capitol",
  "jefferson-city": "Missouri State Capitol",
  helena: "Montana State Capitol",
  lincoln: "Nebraska State Capitol",
  "carson-city": "Nevada State Capitol",
  concord: "New Hampshire State House",
  trenton: "New Jersey State House",
  "santa-fe": "New Mexico State Capitol",
  albany: "New York State Capitol",
  raleigh: "Raleigh, North Carolina",
  bismarck: "North Dakota State Capitol",
  columbus: "Columbus, Ohio",
  "oklahoma-city": "Oklahoma City",
  salem: "Oregon State Capitol",
  harrisburg: "Harrisburg, Pennsylvania",
  providence: "Providence, Rhode Island",
  columbia: "South Carolina State House",
  pierre: "South Dakota State Capitol",
  montpelier: "Vermont State House",
  richmond: "Richmond, Virginia",
  olympia: "Washington State Capitol",
  "charleston-wv": "West Virginia State Capitol",
  madison: "Wisconsin State Capitol",
  cheyenne: "Wyoming State Capitol",
};

const wikipediaTitleFor = (city: CityRow & { slug: string }): string =>
  WIKIPEDIA_TITLES[city.slug] ?? `${city.name}`;

const WIKI_HEADERS = {
  "Api-User-Agent": "EconomyStays/1.0 (city-heroes; https://economy-stays.com)",
  Accept: "application/json",
};

const fetchWithRetry = async (
  url: string,
  init: RequestInit,
  label: string
): Promise<Response> => {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(url, init);
    lastStatus = response.status;
    if (response.status !== 429 && response.status !== 503) return response;
    if (attempt === 0) {
      console.warn(`${label} rate-limited (${response.status}), retrying in 3000ms`);
      await sleep(3000);
    }
  }
  throw new Error(`${label} failed (${lastStatus})`);
};

const downloadBinary = async (url: string, label: string): Promise<Buffer> => {
  try {
    const response = await fetchWithRetry(url, { headers: WIKI_HEADERS }, label);
    if (response.ok) {
      return Buffer.from(await response.arrayBuffer());
    }
  } catch {
    // Node fetch is often rate-limited on upload.wikimedia.org; curl usually works.
  }
  const curl = process.platform === "win32" ? "curl.exe" : "curl";
  return execFileSync(
    curl,
    ["-L", "-sS", "--fail", "--user-agent", WIKI_HEADERS["Api-User-Agent"], url],
    { maxBuffer: 40 * 1024 * 1024 }
  );
};

const fetchOpenverseHero = async (
  city: CityRow & { slug: string }
): Promise<Buffer> => {
  const title = wikipediaTitleFor(city);
  const queries = [`${title} downtown`, `${city.name} capitol`, city.name];
  let imageUrl: string | undefined;

  for (const query of queries) {
    const searchResponse = await fetchWithRetry(
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=8&license=cc0,pdm,by,by-sa`,
      { headers: WIKI_HEADERS },
      `Openverse search for ${query}`
    );
    if (!searchResponse.ok) {
      throw new Error(`Openverse search failed for ${query} (${searchResponse.status})`);
    }
    const payload = (await searchResponse.json()) as {
      results?: Array<{ url?: string; width?: number }>;
    };
    imageUrl =
      payload.results?.find((row) => row.url && (row.width ?? 0) >= 800)?.url ??
      payload.results?.find((row) => row.url)?.url;
    if (imageUrl) break;
  }

  if (!imageUrl) {
    throw new Error(`Openverse has no image for ${title}`);
  }
  return downloadBinary(imageUrl, `Openverse image for ${title}`);
};

const fetchFallbackHero = async (
  city: CityRow & { slug: string }
): Promise<Buffer> => {
  try {
    return await fetchOpenverseHero(city);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Openverse failed for ${city.slug}: ${message}`);
  }

  const title = wikipediaTitleFor(city);
  const apiUrl =
    "https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=original&titles=" +
    encodeURIComponent(title);
  const apiResponse = await fetchWithRetry(
    apiUrl,
    { headers: WIKI_HEADERS },
    `Wikipedia pageimage for ${title}`
  );
  if (!apiResponse.ok) {
    throw new Error(`Wikipedia pageimage failed for ${title} (${apiResponse.status})`);
  }
  const payload = (await apiResponse.json()) as {
    query?: {
      pages?: Record<string, { original?: { source?: string } }>;
    };
  };
  const imageUrl = Object.values(payload.query?.pages ?? {}).find(
    (page) => page.original?.source
  )?.original?.source;
  if (!imageUrl) {
    throw new Error(`Wikipedia has no image for ${title}`);
  }
  return downloadBinary(imageUrl, `Wikipedia image for ${title}`);
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

  const client = apiKey ? new OpenAI({ apiKey }) : null;
  const manifest = loadManifest();

  let migrated = 0;
  let skipped = 0;
  let generated = 0;
  let wikiFetched = 0;
  let failed = 0;
  let skipOpenAi = !client;

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
      let buffer: Buffer | null = null;

      if (!skipOpenAi && client) {
        try {
          ({ buffer } = await generateImage(client, city, values.model!));
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (/\b401\b/.test(message) || /incorrect api key/i.test(message)) {
            skipOpenAi = true;
          }
          console.warn(`OpenAI failed for ${city.slug}: ${message}`);
        }
      }

      if (!buffer) {
        buffer = await fetchFallbackHero(city);
        wikiFetched += 1;
        console.log(`Used stock photo for ${city.slug}`);
      }

      await saveHeroImage(buffer, outputPath);
      manifest.add(city.slug);
      generated += 1;
      console.log(`Saved ${outputPath}`);
      if (delayMs > 0 && !skipOpenAi) {
        await sleep(delayMs);
      } else if (skipOpenAi) {
        await sleep(400);
      }
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed ${city.slug}: ${message}`);
    }
  }

  saveManifest(manifest);
  console.log(
    `Done. generated=${generated}, wikipedia=${wikiFetched}, migrated=${migrated}, skipped=${skipped}, failed=${failed}, total=${targets.length}`
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
