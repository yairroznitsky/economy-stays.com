const readEnv = (value: string | undefined, fallback: string): string => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
};

const readFlag = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return fallback;
};

const name = readEnv(import.meta.env.VITE_SITE_NAME, "Cheap Stays");
const slug = readEnv(import.meta.env.VITE_SITE_SLUG, "cheap-stays");
const useApiProxy = readFlag(import.meta.env.VITE_USE_API_PROXY, false);

export const siteConfig = {
  name,
  wordmark: readEnv(import.meta.env.VITE_SITE_WORDMARK, name.replace(/\s+/g, "-")),
  slug,
  shortName: readEnv(import.meta.env.VITE_SITE_SHORT_NAME, name.replace(/\s+/g, "")),
  domain: readEnv(import.meta.env.VITE_SITE_DOMAIN, "cheap-stays.com"),
  operator: readEnv(import.meta.env.VITE_SITE_OPERATOR, "Media Smarter"),
  supportEmail: readEnv(import.meta.env.VITE_SITE_SUPPORT_EMAIL, "support@cheap-stays.com"),
  trackingBrand: readEnv(import.meta.env.VITE_TRACKING_BRAND, slug.replace(/-/g, "_")),
  landingIdPrefix: readEnv(import.meta.env.VITE_LANDING_ID_PREFIX, "CS-"),
  metaPixelId: readEnv(import.meta.env.VITE_META_PIXEL_ID, ""),
  tiktokPixelId: readEnv(import.meta.env.VITE_TIKTOK_PIXEL_ID, ""),
  useApiProxy,
  enableDbTracking: useApiProxy
    ? false
    : readFlag(import.meta.env.VITE_ENABLE_DB_TRACKING, true),
  siteUrl: () => {
    const domain = readEnv(import.meta.env.VITE_SITE_DOMAIN, "localhost");
    const protocol = domain === "localhost" ? "http" : "https";
    return `${protocol}://${domain}/`;
  },
  description:
    "A calmer way to compare stays. Search hotels, apartments, and vacation rentals in one place and book through trusted travel partners.",
} as const;
