import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SITELINK_PAGES } from "../src/lib/sitelinkPages.ts";
import {
  buildLlmsTxt,
  canonicalOriginFromDomain,
  sitelinkPageToMarkdown,
} from "../src/lib/sitelinkSeo.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const origin = canonicalOriginFromDomain(
  process.env.VITE_SITE_DOMAIN ?? "cheap-stays.com"
);

mkdirSync(join(root, "public"), { recursive: true });

for (const page of SITELINK_PAGES) {
  const file = join(root, "public", `${page.slug}.md`);
  writeFileSync(file, sitelinkPageToMarkdown(page, origin));
  console.log(`Wrote ${page.slug}.md`);
}

writeFileSync(join(root, "public", "llms.txt"), buildLlmsTxt(origin));
console.log("Wrote llms.txt");
