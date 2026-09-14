import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceEnv = path.resolve(root, "..", "Cheap-Stays", ".env");
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

if (!existsSync(sourceEnv)) {
  console.error(
    `Missing ${sourceEnv}. Copy Supabase keys into .env manually (see .env.example).`
  );
  process.exit(1);
}

if (!existsSync(targetEnv)) {
  console.error(`Missing ${targetEnv}. Copy .env.example to .env first.`);
  process.exit(1);
}

const source = parseEnv(readFileSync(sourceEnv, "utf8"));

const resolve = (key) => {
  const direct = source.get(key)?.trim();
  if (direct && !PLACEHOLDER.test(direct)) return direct;
  return undefined;
};

const resolved = new Map();
for (const key of REQUIRED) {
  const value = resolve(key);
  if (!value) {
    console.error(`Cheap-Stays .env is missing a real value for ${key}`);
    process.exit(1);
  }
  resolved.set(key, value);
}

resolved.set("SUPABASE_URL", resolve("SUPABASE_URL") ?? resolved.get("VITE_SUPABASE_URL"));
resolved.set(
  "SUPABASE_ANON_KEY",
  resolve("SUPABASE_ANON_KEY") ?? resolved.get("VITE_SUPABASE_ANON_KEY")
);

const lines = readFileSync(targetEnv, "utf8").split(/\r?\n/);
for (const [key, value] of resolved.entries()) {
  upsertEnvLine(lines, key, value);
}

writeFileSync(targetEnv, `${lines.join("\n").replace(/\n?$/, "\n")}`);
console.log("Copied Supabase credentials from ../Cheap-Stays/.env into .env");
console.log("Restart the dev server: npm run dev");
