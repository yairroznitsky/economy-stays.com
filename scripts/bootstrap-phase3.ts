/**
 * Phase 3 bootstrap helper.
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env.
 *
 * Creates:
 * - 200 base city pages
 * - 4 intent variants for top 50 cities (~400 total URLs)
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { loadDotEnv } from "./lib/supabaseAdmin.ts";

loadDotEnv();

const run = (command: string) => {
  console.log(`\n> ${command}`);
  execSync(command, { stdio: "inherit" });
};

const main = () => {
  if (!existsSync("data/cities-top200.csv")) {
    run("npm run generate:cities-csv");
  }

  run("npm run import:cities -- --file data/cities-top200.csv");
  run("npm run seed:intents");
  run("npm run create:pages -- --cities=all --intents=base");
  run(
    "npm run create:pages -- --top-cities=50 --intents=cheap-hotels,family-hotels,4-star-hotels,hotels-with-breakfast"
  );

  console.log("\nNext steps:");
  console.log("1. npm run generate:content -- --status draft --batch 50");
  console.log("2. npm run publish:pages -- --all-drafts");
  console.log("3. npm run export:pages");
};

main();
