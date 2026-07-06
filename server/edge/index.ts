import type { IncomingMessage, ServerResponse } from "node:http";
import { handleHotelAffiliateRouter } from "./hotelAffiliateRouter";
import { handleKayakAutocomplete } from "./kayakAutocomplete";

const LOCAL_EDGE_FUNCTIONS = new Set(["hotel-affiliate-router", "kayak-autocomplete"]);

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

export const handleLocalEdgeRequest = async (
  functionName: string,
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> => {
  if (!LOCAL_EDGE_FUNCTIONS.has(functionName)) {
    return false;
  }

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "authorization, content-type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.end();
    return true;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { success: false, error: "Method not allowed. Use POST." });
    return true;
  }

  let payload: unknown = {};
  try {
    const raw = await readRequestBody(req);
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    sendJson(res, 400, { success: false, error: "Invalid JSON body." });
    return true;
  }

  const result =
    functionName === "hotel-affiliate-router"
      ? await handleHotelAffiliateRouter(payload)
      : await handleKayakAutocomplete(payload);

  sendJson(res, result.status, result.body);
  return true;
};

export const isLocalEdgeFunction = (name: string): boolean =>
  LOCAL_EDGE_FUNCTIONS.has(name);
