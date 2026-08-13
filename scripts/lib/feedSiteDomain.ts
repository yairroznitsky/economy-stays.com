/** Google Ads page feeds use www URLs (e.g. www.cheap-stays.com). */
export const feedSiteDomain = (): string => {
  const raw = process.env.VITE_SITE_DOMAIN?.trim() || "cheap-stays.com";
  if (/^localhost(:\d+)?$/i.test(raw) || /^127\.0\.0\.1/.test(raw)) {
    return raw;
  }
  if (raw.startsWith("www.")) return raw;
  return `www.${raw}`;
};

export const feedPageUrl = (path: string): string =>
  `https://${feedSiteDomain()}${path}`;
