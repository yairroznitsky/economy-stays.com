import { siteConfig } from "@/lib/siteConfig";

/** Base URL for tracking APIs. Empty = same origin (/api/landings, /api/search). */
export const trackingApiBase = (
  import.meta.env.VITE_TRACKING_API_BASE?.trim() ?? ""
).replace(/\/$/, "");

export type TrackingApiPath = "/landings" | "/search";

export const trackingApiUrl = (path: TrackingApiPath): string => {
  if (trackingApiBase) {
    // e.g. https://api.cheap-stays.com/landings (Vercel rewrites → /api/landings)
    return `${trackingApiBase}${path}`;
  }
  return `/api${path}`;
};

export const postTrackingJson = async (
  path: TrackingApiPath,
  body: Record<string, unknown>,
  options?: { keepalive?: boolean }
): Promise<void> => {
  if (!siteConfig.enableDbTracking) return;

  const response = await fetch(trackingApiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // Landings fire on page load; keepalive on unload can replay the same POST.
    keepalive: options?.keepalive ?? path === "/search",
  });

  if (!response.ok) {
    let detail = response.statusText || `HTTP ${response.status}`;
    try {
      const text = await response.text();
      try {
        const payload = JSON.parse(text) as { error?: string };
        if (payload.error) detail = payload.error;
        else if (text.trim()) detail = text.trim().slice(0, 300);
      } catch {
        if (text.trim()) detail = text.trim().slice(0, 300);
      }
    } catch {
      // ignore body read errors
    }
    throw new Error(`Tracking ${path} failed: ${detail}`);
  }
};
