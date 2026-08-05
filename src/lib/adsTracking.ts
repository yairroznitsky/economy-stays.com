const ADS_PARAM_KEYS = [
  "gclid",
  "gbraid",
  "wbraid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

export type AdsParamKey = (typeof ADS_PARAM_KEYS)[number];
export type AdsParams = Partial<Record<AdsParamKey, string>>;

const STORAGE_KEY = "cheap_stays_ads_params";

export const parseAdsParams = (
  search = typeof window !== "undefined" ? window.location.search : ""
): AdsParams => {
  const params = new URLSearchParams(search);
  const result: AdsParams = {};

  for (const key of ADS_PARAM_KEYS) {
    const value = params.get(key)?.trim();
    if (value) result[key] = value;
  }

  return result;
};

export const captureAdsParams = (): AdsParams => {
  const incoming = parseAdsParams();
  const hasIncoming = Object.keys(incoming).length > 0;

  if (hasIncoming) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(incoming));
    return incoming;
  }

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AdsParams) : {};
  } catch {
    return {};
  }
};

export const getStoredAdsParams = (): AdsParams => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AdsParams) : {};
  } catch {
    return {};
  }
};

export const appendAdsParams = (params: Record<string, string>): Record<string, string> => ({
  ...getStoredAdsParams(),
  ...params,
});
