import { siteConfig } from "@/lib/siteConfig";

/** Base URL for tracking APIs. Empty = same origin (/api/landings, /api/search). */
export const trackingApiBase = (
  import.meta.env.VITE_TRACKING_API_BASE?.trim() ?? ""
).replace(/\/$/, "");

export const trackingApiUrl = (path: "/landings" | "/search"): string => {
  if (trackingApiBase) {
    // e.g. https://api.cheap-stays.com/landings (Vercel rewrites → /api/landings)
    return `${trackingApiBase}${path}`;
  }
  return `/api${path}`;
};

export const postTrackingJson = async (
  path: "/landings" | "/search",
  body: Record<string, unknown>
): Promise<void> => {
  if (!siteConfig.enableDbTracking) return;

  const response = await fetch(trackingApiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) detail = payload.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(`Tracking ${path} failed: ${detail}`);
  }
};
