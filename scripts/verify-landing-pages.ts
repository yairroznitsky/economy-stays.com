import { parseArgs } from "node:util";
import { loadDotEnv, selectRows } from "./lib/supabaseAdmin.ts";

loadDotEnv();

const baseUrl = process.env.LANDING_VERIFY_BASE ?? "http://localhost:8080";

type PageRow = {
  path: string;
};

const main = async () => {
  const { values } = parseArgs({
    options: {
      limit: { type: "string", default: "50" },
      path: { type: "string" },
    },
  });

  const limit = Number.parseInt(values.limit!, 10);

  const paths = values.path
    ? [values.path]
    : (
        await selectRows<PageRow>(
          "landing_pages",
          `select=path&status=eq.published&order=published_at.desc&limit=${limit}`
        )
      ).map((row) => row.path);

  if (paths.length === 0) {
    console.log("No published landing pages found in Supabase.");
    return;
  }

  const failures: string[] = [];

  for (const path of paths) {
    try {
      const configResponse = await fetch(
        `${baseUrl}/api/landing-page?path=${encodeURIComponent(path)}`
      );
      if (!configResponse.ok) {
        failures.push(`${path} -> config HTTP ${configResponse.status}`);
        continue;
      }

      const config = (await configResponse.json()) as { path?: string };
      if (config.path !== path) {
        failures.push(`${path} -> config path mismatch (${config.path})`);
      }

      const pageResponse = await fetch(`${baseUrl}${path}`, { redirect: "follow" });
      if (!pageResponse.ok) {
        failures.push(`${path} -> page HTTP ${pageResponse.status}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${path} -> ${message}`);
    }
  }

  console.log(`Checked ${paths.length} landing page(s) at ${baseUrl}`);

  if (failures.length > 0) {
    console.error("\nFailures:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("All sampled landing pages are reachable.");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
