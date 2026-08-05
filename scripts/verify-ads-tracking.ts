import { parseArgs } from "node:util";
import { loadDotEnv, selectRows } from "./lib/supabaseAdmin.ts";

loadDotEnv();

type EventRow = {
  event_type: string;
  gclid: string | null;
  click_id: string | null;
  session_landing_id: string | null;
  created_at: string;
};

const main = async () => {
  const { values } = parseArgs({
    options: {
      gclid: { type: "string" },
      limit: { type: "string", default: "20" },
    },
  });

  const limit = Number.parseInt(values.limit!, 10);
  const query = values.gclid
    ? `select=event_type,gclid,click_id,session_landing_id,created_at&gclid=eq.${values.gclid}&order=created_at.desc&limit=${limit}`
    : `select=event_type,gclid,click_id,session_landing_id,created_at&order=created_at.desc&limit=${limit}`;

  const events = await selectRows<EventRow>("landing_page_events", query);
  if (events.length === 0) {
    console.log("No landing_page_events found.");
    return;
  }

  console.table(events);
  const clickouts = events.filter((event) => event.event_type === "clickout").length;
  const searches = events.filter((event) => event.event_type === "search").length;
  const pageViews = events.filter((event) => event.event_type === "page_view").length;
  console.log(`Summary: page_view=${pageViews}, search=${searches}, clickout=${clickouts}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
