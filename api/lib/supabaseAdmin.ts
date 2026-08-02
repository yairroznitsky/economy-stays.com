import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readEnv } from "./env";

let cached: SupabaseClient | null = null;

export const getSupabaseAdmin = (): SupabaseClient => {
  if (cached) return cached;

  const url = readEnv("SUPABASE_URL") ?? readEnv("VITE_SUPABASE_URL");
  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL (or VITE_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
};

export const getSourceApp = (): string =>
  readEnv("SITE_SLUG")?.trim() ||
  readEnv("VITE_SITE_SLUG")?.trim() ||
  "cheap-stays";
