import { parseArgs } from "node:util";
import { slugifyName } from "../api/_lib/hotelSlug.ts";
import { loadDotEnv, selectRows, upsertRows } from "./lib/supabaseAdmin.ts";

/**
 * Populates staging_hotels.city_slug from city_name using the same slugify
 * rules as landing page URLs. Run after CSV import or migration:
 *
 *   npm run backfill:hotel-city-slugs
 *   npm run backfill:hotel-city-slugs -- --batch 5000
 */

loadDotEnv();

type HotelRow = {
  external_id: number;
  city_name: string | null;
  city_slug: string | null;
};

const PAGE_SIZE = 1000;
const UPSERT_SIZE = 500;

const { values: args } = parseArgs({
  options: {
    batch: { type: "string", default: "0" },
    force: { type: "boolean", default: false },
  },
});

const maxRows = Number(args.batch) || 0;

const probeColumn = async (): Promise<void> => {
  try {
    await selectRows("staging_hotels", "select=city_slug&limit=1");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("city_slug") && message.includes("42703")) {
      throw new Error(
        "staging_hotels.city_slug is missing. Run the SQL in supabase/migrations/20260805180000_staging_hotels_city_slug.sql in the Supabase SQL editor first."
      );
    }
    throw error;
  }
};

const flushUpsert = async (
  rows: Record<string, unknown>[]
): Promise<void> => {
  if (rows.length === 0) return;
  await upsertRows("staging_hotels", rows, "external_id");
};

const main = async () => {
  await probeColumn();

  let offset = 0;
  let updated = 0;
  let skipped = 0;
  let pending: Record<string, unknown>[] = [];

  for (;;) {
    if (maxRows > 0 && updated + skipped >= maxRows) break;

    const pageLimit =
      maxRows > 0
        ? Math.min(PAGE_SIZE, maxRows - updated - skipped)
        : PAGE_SIZE;
    if (pageLimit <= 0) break;

    let query =
      `select=external_id,city_name,city_slug&order=external_id.asc&limit=${pageLimit}&offset=${offset}`;
    if (!args.force) {
      query += "&city_slug=is.null";
    }

    const rows = await selectRows<HotelRow>("staging_hotels", query);
    if (rows.length === 0) break;

    for (const row of rows) {
      const nextSlug = slugifyName(row.city_name ?? "");
      if (!args.force && row.city_slug === nextSlug) {
        skipped += 1;
        continue;
      }

      pending.push({ external_id: row.external_id, city_slug: nextSlug });
      updated += 1;

      if (pending.length >= UPSERT_SIZE) {
        await flushUpsert(pending);
        pending = [];
      }
    }

    if (pending.length > 0) {
      await flushUpsert(pending);
      pending = [];
    }

    offset += rows.length;
    if (offset % 10000 === 0) {
      console.log(`Processed ${offset} rows (${updated} updated)...`);
    }
    if (rows.length < pageLimit) break;
  }

  console.log(`Done. Updated ${updated} row(s), skipped ${skipped}.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
