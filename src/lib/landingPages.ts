import type { LandingPageConfig, LandingPageManifest } from "@/types/landingPage";

const MANIFEST_URL = "/landing-data/manifest.json";

let manifestCache: LandingPageManifest | null = null;
let manifestPromise: Promise<LandingPageManifest> | null = null;

export const normalizeLandingPath = (pathname: string): string => {
  let path = pathname.trim();
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/+$/, "") || "/";
  return path.toLowerCase();
};

export const buildLandingPath = (
  citySlug: string,
  intentSlug?: string
): string => {
  const city = citySlug.trim().toLowerCase();
  if (!intentSlug) return `/hotels/${city}`;
  return `/hotels/${city}/${intentSlug.trim().toLowerCase()}`;
};

export const loadLandingManifest = async (): Promise<LandingPageManifest> => {
  if (manifestCache) return manifestCache;
  if (manifestPromise) return manifestPromise;

  manifestPromise = fetch(MANIFEST_URL, { cache: "no-cache" })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load landing manifest (${response.status})`);
      }
      const manifest = (await response.json()) as LandingPageManifest;
      manifestCache = manifest;
      return manifest;
    })
    .finally(() => {
      manifestPromise = null;
    });

  return manifestPromise;
};

export const resolveLandingDataPath = async (
  pathname: string
): Promise<string | null> => {
  const path = normalizeLandingPath(pathname);
  const manifest = await loadLandingManifest();
  return manifest.pages[path] ?? null;
};

export const loadLandingPageConfig = async (
  pathname: string
): Promise<LandingPageConfig | null> => {
  const dataPath = await resolveLandingDataPath(pathname);
  if (!dataPath) return null;

  const response = await fetch(`/landing-data/${dataPath}`, { cache: "no-cache" });
  if (!response.ok) return null;
  return (await response.json()) as LandingPageConfig;
};

export const preloadLandingPageConfig = (pathname: string): void => {
  void loadLandingPageConfig(pathname);
};
