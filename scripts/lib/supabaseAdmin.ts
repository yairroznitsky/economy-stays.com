import { readFileSync } from "node:fs";

const readEnv = (key: string): string | undefined => {
  const value = process.env[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
};

export const getSupabaseAdminConfig = (): { url: string; key: string } => {
  const url = readEnv("SUPABASE_URL") ?? readEnv("VITE_SUPABASE_URL");
  const key = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }
  return { url, key };
};

const adminHeaders = (): Record<string, string> => {
  const { key } = getSupabaseAdminConfig();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
};

export const supabaseFetch = async (
  path: string,
  init?: RequestInit
): Promise<Response> => {
  const { url } = getSupabaseAdminConfig();
  return fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...adminHeaders(),
      ...(init?.headers ?? {}),
    },
  });
};

export const selectRows = async <T>(
  table: string,
  query: string
): Promise<T[]> => {
  const response = await supabaseFetch(`${encodeURIComponent(table)}?${query}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Select ${table} failed: ${text || response.statusText}`);
  }
  return (await response.json()) as T[];
};

export const upsertRows = async (
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string
): Promise<void> => {
  const response = await supabaseFetch(`${encodeURIComponent(table)}?on_conflict=${onConflict}`, {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upsert ${table} failed: ${text || response.statusText}`);
  }
};

export const insertRows = async (
  table: string,
  rows: Record<string, unknown>[]
): Promise<void> => {
  const response = await supabaseFetch(encodeURIComponent(table), {
    method: "POST",
    headers: {
      Prefer: "return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Insert ${table} failed: ${text || response.statusText}`);
  }
};

export const patchRows = async (
  table: string,
  query: string,
  patch: Record<string, unknown>
): Promise<void> => {
  const response = await supabaseFetch(`${encodeURIComponent(table)}?${query}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal",
    },
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Patch ${table} failed: ${text || response.statusText}`);
  }
};

export const loadDotEnv = (): void => {
  try {
    const raw = readFileSync(".env", "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env is optional for scripts when env vars are already set.
  }
};
