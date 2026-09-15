import { siteConfig } from "@/lib/siteConfig";

/** Base URL for tracking APIs. Empty = same origin (/api/sessions, /api/exits). */
export const trackingApiBase = (
  import.meta.env.VITE_TRACKING_API_BASE?.trim() ?? ""
).replace(/\/$/, "");

export type TrackingApiPath = "/api/sessions" | "/api/exits";

export const trackingApiUrl = (path: TrackingApiPath): string => {
  if (trackingApiBase) {
    return `${trackingApiBase}${path}`;
  }
  return path;
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
    keepalive: options?.keepalive ?? path === "/api/exits",
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
