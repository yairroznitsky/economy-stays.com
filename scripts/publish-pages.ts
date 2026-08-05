import { parseArgs } from "node:util";
import { loadDotEnv, patchRows } from "./lib/supabaseAdmin.ts";

loadDotEnv();

const main = async () => {
  const { values } = parseArgs({
    options: {
      ids: { type: "string" },
      status: { type: "string", default: "published" },
      "all-drafts": { type: "boolean", default: false },
    },
  });

  const patch: Record<string, unknown> = {
    status: values.status,
  };

  if (values.status === "published") {
    patch.published_at = new Date().toISOString();
    patch.noindex = true;
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
