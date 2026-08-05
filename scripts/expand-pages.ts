import { parseArgs } from "node:util";
import { loadDotEnv } from "./lib/supabaseAdmin.ts";

loadDotEnv();

const main = async () => {
  const { values } = parseArgs({
    options: {
      cities: { type: "string", default: "all" },
      intents: {
        type: "string",
        default: "cheap-hotels,family-hotels,4-star-hotels,hotels-with-breakfast,luxury-hotels",
      },
      "top-cities": { type: "string", default: "20" },
    },
  });

  console.log("Phase 5 expansion helper");
  console.log("Run the following commands to expand published pages:");
  console.log("");
  console.log(`npm run create:pages -- --cities=${values.cities} --intents=${values.intents} --top-cities=${values["top-cities"]}`);
  console.log("npm run generate:content -- --status draft --batch 50");
  console.log("npm run publish:pages -- --all-drafts");
  console.log("npm run export:pages");
};

main();
