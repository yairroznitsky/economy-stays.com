import type { IncomingMessage, ServerResponse } from "node:http";
import { handleLandingsInsert } from "./landingsHandler";
import { handleSearchInsert } from "./searchHandler";

export type TrackingRoute = "landings" | "search";

const matchTrackingPath = (url: string | undefined): TrackingRoute | null => {
  if (!url) return null;
  const pathname = url.split("?")[0];
  if (pathname === "/api/landings" || pathname === "/landings") return "landings";
  if (pathname === "/api/search" || pathname === "/search") return "search";
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
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
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
