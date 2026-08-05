import { readEnv } from "./env";

export const getSourceApp = (): string =>
  readEnv("SITE_SLUG")?.trim() ||
  readEnv("VITE_SITE_SLUG")?.trim() ||
  "cheap-stays";

const getSupabaseConfig = (): { url: string; key: string } => {
  const url = readEnv("SUPABASE_URL") ?? readEnv("VITE_SUPABASE_URL");
  const key = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL (or VITE_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return { url, key };
};

export const selectRows = async <T>(
  table: string,
  query: string
): Promise<T[]> => {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(
    `${url}/rest/v1/${encodeURIComponent(table)}?${query}`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Select ${table} failed: ${text || response.statusText || `HTTP ${response.status}`}`
    );
  }
  return (await response.json()) as T[];
};

export const insertRow = async (
  table: string,
  row: Record<string, unknown>
): Promise<{ error: string | null }> => {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${encodeURIComponent(table)}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return { error: text || response.statusText || `HTTP ${response.status}` };
  }
  return { error: null };
};
