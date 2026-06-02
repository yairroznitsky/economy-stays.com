/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  fbq?: (
    action: string,
    event: string,
    params?: Record<string, string | number>,
    options?: { eventID?: string }
  ) => void;
  ttq?: {
    track: (event: string, params?: Record<string, unknown>) => void;
    page: () => void;
  };
}
