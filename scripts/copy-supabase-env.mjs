import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetEnv = path.resolve(root, ".env");

const REQUIRED = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const OPTIONAL = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];

const PLACEHOLDER = /your-|placeholder|changeme/i;

const parseEnv = (text) => {
  const map = new Map();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    map.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
  }
  return map;
};

const upsertEnvLine = (lines, key, value) => {
  const prefix = `${key}=`;
  const index = lines.findIndex(
    (line) => !line.trim().startsWith("#") && line.trim().startsWith(prefix)
  );
  const next = `${prefix}${value}`;
  if (index >= 0) lines[index] = next;
  else lines.push(next);
};

if (!existsSync(targetEnv)) {
  console.error(`Missing ${targetEnv}. Copy .env.example to .env first.`);
  process.exit(1);
}

const source = parseEnv(readFileSync(targetEnv, "utf8"));

const resolve = (key) => {
  const direct = source.get(key)?.trim();
  if (direct && !PLACEHOLDER.test(direct)) return direct;
  return undefined;
};

const missing = REQUIRED.filter((key) => !resolve(key));
if (missing.length > 0) {
  console.error(
    `The following keys are missing or still placeholders in .env:\n` +
    missing.map((k) => `  - ${k}`).join("\n") +
    `\n\nFill them in from your Supabase project dashboard and re-run.`
  );
  process.exit(1);
}

console.log("All required Supabase credentials are present in .env.");
console.log("Restart the dev server if it is running: npm run dev");
