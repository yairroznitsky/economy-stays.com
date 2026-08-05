import { parseArgs } from "node:util";
import { loadDotEnv, selectRows } from "./lib/supabaseAdmin.ts";

loadDotEnv();

type RentalClickRow = {
  click_id: string;
  landing_id: string | null;
  partner: string;
  search_params: Record<string, string> | null;
  timestamp: string;
};

const main = async () => {
  const { values } = parseArgs({
    options: {
      gclid: { type: "string" },
      limit: { type: "string", default: "20" },
    },
  });

  const limit = Number.parseInt(values.limit!, 10);
  const query = `select=click_id,landing_id,partner,search_params,timestamp&order=timestamp.desc&limit=${limit}`;

  const clicks = await selectRows<RentalClickRow>("rental_clicks", query);
  const filtered = values.gclid
    ? clicks.filter((click) => click.search_params?.gclid === values.gclid)
    : clicks;

  if (filtered.length === 0) {
    console.log("No rental_clicks found.");
    return;
  }

  console.table(
    filtered.map((click) => ({
      click_id: click.click_id,
      landing_id: click.landing_id,
      partner: click.partner,
      gclid: click.search_params?.gclid ?? null,
      surface: click.search_params?.surface ?? null,
      landing_page_id: click.search_params?.landing_page_id ?? null,
      timestamp: click.timestamp,
    }))
  );

  const landingPages = filtered.filter(
    (click) => click.search_params?.surface === "hotel_landing"
  ).length;
  console.log(`Summary: total=${filtered.length}, hotel_landing=${landingPages}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
