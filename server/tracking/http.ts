import type { IncomingMessage, ServerResponse } from "node:http";
import { handleLandingsInsert } from "./landingsHandler";
import { handleLandingPageGet } from "./landingPageHandler";
import { handleSearchInsert } from "./searchHandler";

export type TrackingRoute = "landings" | "search" | "landing-page" | "nearby";

const matchTrackingPath = (url: string | undefined): TrackingRoute | null => {
  if (!url) return null;
  const pathname = url.split("?")[0];
  if (pathname === "/api/sessions" || pathname === "/api/landings" || pathname === "/landings") return "landings";
  if (pathname === "/api/exits" || pathname === "/api/search" || pathname === "/search") return "search";
  if (pathname === "/api/landing-page") return "landing-page";
  if (pathname === "/api/nearby") return "nearby";
  return null;
};

const readRequestBody = (req: IncomingMessage): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });

const sendJson = (res: ServerResponse, status: number, body: Record<string, unknown>) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(JSON.stringify(body));
};

const setCors = (res: ServerResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
};

export const handleTrackingRequest = async (
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> => {
  const route = matchTrackingPath(req.url);
  if (!route) return false;

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    setCors(res);
    res.end();
    return true;
  }

  if (route === "landing-page") {
    if (req.method !== "GET") {
      sendJson(res, 405, { error: "Method not allowed" });
      return true;
    }
    const query = new URLSearchParams(req.url?.split("?")[1] ?? "");
    const result = await handleLandingPageGet(query.get("path") ?? undefined);
    res.setHeader("Cache-Control", result.cacheControl);
    sendJson(res, result.status, result.body);
    return true;
  }

  if (route === "nearby") {
    if (req.method !== "GET") {
      sendJson(res, 405, { error: "Method not allowed" });
      return true;
    }
    // Dev server: return source "none" unless ?lat= & ?lng= are provided with Supabase creds.
    // Locally there are no Vercel geo headers, so IP detection is skipped.
    const qs = new URLSearchParams(req.url?.split("?")[1] ?? "");
    const qLat = parseFloat(qs.get("lat") ?? "");
    const qLng = parseFloat(qs.get("lng") ?? "");
    if (!Number.isFinite(qLat) || !Number.isFinite(qLng)) {
      res.setHeader("Cache-Control", "private, no-store");
      sendJson(res, 200, { source: "none", hotels: [] });
      return true;
    }
    // With explicit coords, proxy to api/nearby logic via dynamic import
    try {
      const { handleNearbyGet } = await import("./nearbyHandler");
      const result = await handleNearbyGet(qLat, qLng);
      res.setHeader("Cache-Control", "private, no-store");
      sendJson(res, 200, result);
    } catch {
      res.setHeader("Cache-Control", "private, no-store");
      sendJson(res, 200, { source: "none", hotels: [] });
    }
    return true;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return true;
  }

  let payload: Record<string, unknown> = {};
  try {
    const raw = await readRequestBody(req);
    payload = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    sendJson(res, 400, { error: "Invalid JSON body" });
    return true;
  }

  const result =
    route === "landings"
      ? await handleLandingsInsert(req, payload)
      : await handleSearchInsert(payload);

  sendJson(res, result.status, result.body);
  return true;
};
