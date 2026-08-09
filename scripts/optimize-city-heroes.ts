import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

/**
 * Resize + recompress city hero WebPs for LCP-friendly delivery.
 *
 * Reads from public/images/city-heroes and writes to
 * public/images/city-heroes-optimized:
 *   {slug}.webp      — max width 1600 (desktop / src default)
 *   {slug}-960.webp  — max width 960  (mobile srcset)
 *
 * Usage:
 *   npm run optimize:city-heroes
 *   npm run optimize:city-heroes -- --slug chengdu
 */

const INPUT_DIR = join("public", "images", "city-heroes");
const OUTPUT_DIR = join("public", "images", "city-heroes-optimized");
const DESKTOP_WIDTH = 1600;
const MOBILE_WIDTH = 960;
const WEBP_QUALITY = 72;

const parseSlugFilter = (): string | undefined => {
  const idx = process.argv.indexOf("--slug");
  if (idx === -1) return undefined;
  return process.argv[idx + 1]?.trim().toLowerCase();
};

const encodeHero = async (buffer: Buffer, width: number) =>
  sharp(buffer)
    .rotate()
    .resize({
      width,
      withoutEnlargement: true,
      fit: "inside",
    })
    .webp({ quality: WEBP_QUALITY, effort: 6 })
    .toBuffer({ resolveWithObject: true });

const main = async () => {
  const slugFilter = parseSlugFilter();
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = readdirSync(INPUT_DIR)
    .filter(
      (name) =>
        name.endsWith(".webp") &&
        !name.includes("-960") &&
        !name.endsWith(".tmp") &&
        name !== "manifest.json"
    )
    .filter((name) => (slugFilter ? name === `${slugFilter}.webp` : true))
    .sort();

  if (files.length === 0) {
    console.log("No hero images matched.");
    return;
  }

  let totalBefore = 0;
  let totalAfter = 0;
  let failed = 0;

  for (const file of files) {
    const slug = file.replace(/\.webp$/i, "");
    const inputPath = join(INPUT_DIR, file);

    try {
      const buffer = await sharp(inputPath).toBuffer();
      const desktop = await encodeHero(buffer, DESKTOP_WIDTH);
      const mobile = await encodeHero(buffer, MOBILE_WIDTH);

      writeFileSync(join(OUTPUT_DIR, `${slug}.webp`), desktop.data);
      writeFileSync(join(OUTPUT_DIR, `${slug}-960.webp`), mobile.data);

      totalBefore += buffer.length;
      totalAfter += desktop.info.size + mobile.info.size;

      console.log(
        `${slug}: ${(buffer.length / 1024).toFixed(1)}KB → ${(desktop.info.size / 1024).toFixed(1)}KB (1600) + ${(mobile.info.size / 1024).toFixed(1)}KB (960)`
      );
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed ${slug}: ${message}`);
    }
  }

  console.log(
    `Done. optimized=${files.length - failed}, failed=${failed}. ${(totalBefore / 1024 / 1024).toFixed(1)}MB → ${(totalAfter / 1024 / 1024).toFixed(1)}MB (desktop+mobile)`
  );
  console.log(`Output: ${OUTPUT_DIR}`);
  if (failed > 0) process.exit(1);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
