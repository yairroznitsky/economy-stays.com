export const readEnv = (key: string): string | undefined => {
  const value = process.env[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
};

const DEFAULT_KAYAK_AFFILIATE_ID = "kan_317716_594040";

export const getKayakAffiliateConfig = () => ({
  affiliateId: readEnv("KAYAK_AFFILIATE_ID") ?? DEFAULT_KAYAK_AFFILIATE_ID,
  deeplinkBase: readEnv("KAYAK_DEEPLINK_BASE") ?? "https://www.kayak.com/in",
  utmMedium: readEnv("KAYAK_UTM_MEDIUM") ?? "affiliate",
});

export const getBookingAffiliateConfig = () => ({
  tid: readEnv("BOOKING_AFFILIATE_TID") ?? "1321636",
  auth: readEnv("BOOKING_AFFILIATE_AUTH") ?? "ofxbqjcsboet",
  baseUrl:
    readEnv("BOOKING_AFFILIATE_BASE_URL") ?? "https://selfashelookedrou.com/brands_redirect",
  currency: "USD",
  lang: "en-us",
});

export const getKayakAutocompleteConfig = () => ({
  baseUrl:
    readEnv("KAYAK_AUTOCOMPLETE_BASE_URL") ??
    "https://www.kayak.com/mvm/smartyv2/search",
  size: Number(readEnv("KAYAK_AUTOCOMPLETE_SIZE") ?? "50"),
  botName: readEnv("BOT_NAME")?.trim() ?? "AffiliateBot",
  siteDomain: readEnv("SITE_DOMAIN")?.trim() ?? readEnv("VITE_SITE_DOMAIN")?.trim() ?? "",
  supabaseUrl: readEnv("SUPABASE_URL") ?? readEnv("VITE_SUPABASE_URL") ?? "",
});
