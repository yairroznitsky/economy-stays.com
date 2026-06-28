import { createClient } from "@supabase/supabase-js";
import { hasSupabaseClientConfig } from "@/lib/apiAvailability";

export const supabase = hasSupabaseClientConfig
  ? createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
  : (null as unknown as ReturnType<typeof createClient>);

export { hasSupabaseClientConfig };
