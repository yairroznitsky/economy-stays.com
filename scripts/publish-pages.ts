import { parseArgs } from "node:util";
import { loadDotEnv, patchRows, selectRows } from "./lib/supabaseAdmin.ts";

loadDotEnv();

type ContentPageRow = {
  landing_page_id: string;
};

const main = async () => {
  const { values } = parseArgs({
    options: {
      ids: { type: "string" },
      status: { type: "string", default: "published" },
      "all-drafts": { type: "boolean", default: false },
      "with-content": { type: "boolean", default: false },
    },
  });

  const patch: Record<string, unknown> = {
    status: values.status,
  };

  if (values.status === "published") {
    patch.published_at = new Date().toISOString();
    patch.noindex = true;
  }

  if (values["with-content"]) {
    const contentRows = await selectRows<ContentPageRow>(
      "landing_page_content",
      "select=landing_page_id&is_current=eq.true"
    );
    const ids = [...new Set(contentRows.map((row) => row.landing_page_id))];
    for (const id of ids) {
      await patchRows("landing_pages", `id=eq.${id}`, patch);
      console.log(`Published landing page ${id}`);
    }
    console.log(`Published ${ids.length} page(s) with generated content`);
    return;
  }

  if (values["all-drafts"]) {
    await patchRows("landing_pages", "status=eq.draft", patch);
    console.log("Published all draft landing pages");
    return;
  }

  if (!values.ids) {
    throw new Error("Provide --ids <uuid,...> or --all-drafts");
  }

  const ids = values.ids.split(",").map((id) => id.trim()).filter(Boolean);
  for (const id of ids) {
    await patchRows("landing_pages", `id=eq.${id}`, patch);
    console.log(`Updated landing page ${id} -> ${values.status}`);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
