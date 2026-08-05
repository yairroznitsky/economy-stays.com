/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SITE_NAME?: string;
  readonly VITE_SITE_WORDMARK?: string;
  readonly VITE_SITE_SLUG?: string;
  readonly VITE_SITE_SHORT_NAME?: string;
  readonly VITE_SITE_DOMAIN?: string;
  readonly VITE_SITE_OPERATOR?: string;
  readonly VITE_TRACKING_BRAND?: string;
  readonly VITE_LANDING_ID_PREFIX?: string;
  readonly VITE_META_PIXEL_ID?: string;
  readonly VITE_TIKTOK_PIXEL_ID?: string;
  readonly VITE_GOOGLE_ADS_ID?: string;
  readonly VITE_GOOGLE_ADS_CONVERSION_LABEL?: string;
  readonly VITE_USE_API_PROXY?: string;
  /** Production: route edge calls via /api/edge (default on). Set "false" for direct Supabase. */
  readonly VITE_USE_EDGE_PROXY?: string;
  readonly VITE_ENABLE_DB_TRACKING?: string;
  readonly VITE_TRACKING_API_BASE?: string;
  readonly VITE_KAYAK_AFFILIATE_ID?: string;
  readonly VITE_KAYAK_DEEPLINK_BASE?: string;
  readonly VITE_KAYAK_UTM_MEDIUM?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  fbq?: {
    (
      action: string,
      event: string,
      params?: Record<string, string | number>,
      options?: { eventID?: string }
    ): void;
    (
      action: "set" | "init" | "track",
      event: string,
      params?: string | Record<string, string | number>,
      options?: { eventID?: string }
    ): void;
    callMethod?: (...args: unknown[]) => void;
    queue: unknown[];
    loaded?: boolean;
    version?: string;
  };
  ttq?: {
    track: (event: string, params?: Record<string, unknown>) => void;
    page: () => void;
    load: (id: string) => void;
    methods: string[];
    setAndDefer: (target: Record<string, unknown>, method: string) => void;
    _i?: Record<string, unknown[]>;
    _t?: Record<string, number>;
    _o?: Record<string, Record<string, unknown>>;
    push?: (args: unknown[]) => void;
  };
}
