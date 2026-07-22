const FACEBOOK_UTM_SOURCES = new Set(["facebook", "fb", "meta", "instagram"]);

const toSearchParams = (
  search?: string | URLSearchParams | Record<string, string>
): URLSearchParams | null => {
  if (typeof search === "string") {
    const normalized = search.startsWith("?") ? search.slice(1) : search;
    return new URLSearchParams(normalized);
  }

  if (search instanceof URLSearchParams) {
    return search;
  }

  if (search && typeof search === "object") {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(search)) {
      if (value) params.set(key, value);
    }
    return params;
  }

  if (typeof window !== "undefined") {
    return new URLSearchParams(window.location.search);
  }

  return null;
};

/** True when the visit likely came from a Facebook/Meta ad click. */
export const isFacebookAdsTraffic = (
  search?: string | URLSearchParams | Record<string, string>
): boolean => {
  const params = toSearchParams(search);
  if (!params) return false;

  if (params.get("fbclid")) return true;

  const utmSource = (params.get("utm_source") ?? "").toLowerCase();
  return FACEBOOK_UTM_SOURCES.has(utmSource);
};
