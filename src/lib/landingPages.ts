import type { LandingPageConfig } from "@/types/landingPage";

/**
 * Landing page configs are fetched on demand per path from /api/landing-page
 * (CDN-cached, backed by Supabase). No full-catalog download, so the page
 * count can scale to millions of city/intent/hotel combinations.
 */

const configCache = new Map<string, Promise<LandingPageConfig | null>>();

export const normalizeLandingPath = (pathname: string): string => {
  let path = pathname.trim();
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/+$/, "") || "/";
  return path.toLowerCase();
};

export const buildLandingPath = (
  citySlug: string,
  themeSlug?: string,
  countryCode?: string
): string => {
  const cc = (countryCode ?? "xx").trim().toLowerCase();
  const city = citySlug.trim().toLowerCase();
  if (!themeSlug) return `/stay/${cc}/${city}`;
  return `/stay/${cc}/${city}/${themeSlug.trim().toLowerCase()}`;
};

const fetchConfig = async (path: string): Promise<LandingPageConfig | null> => {
  const response = await fetch(
    `/api/landing-page?path=${encodeURIComponent(path)}`
  );

  if (response.status === 404 || response.status === 400) return null;
  if (!response.ok) {
    throw new Error(`Failed to load landing page (${response.status})`);
  }
  return (await response.json()) as LandingPageConfig;
};

export const loadLandingPageConfig = async (
  pathname: string
): Promise<LandingPageConfig | null> => {
  const path = normalizeLandingPath(pathname);

  const cached = configCache.get(path);
  if (cached) return cached;

  const promise = fetchConfig(path).catch((error) => {
    // Don't cache transient failures; allow retry on next navigation.
    configCache.delete(path);
    throw error;
  });

  configCache.set(path, promise);
  return promise;
};

export const preloadLandingPageConfig = (pathname: string): void => {
  void loadLandingPageConfig(pathname).catch(() => {});
};
