/**
 * Self-contained Vercel serverless function.
 * Logic lives in ./spiderHandler.ts (same folder) so NFT can bundle it.
 */

import { isValidSpiderToken, runSpiderKayakRedirect } from "./spiderHandler";

interface ApiRequest {
  method?: string;
  query: { token?: string | string[] };
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
}

const getToken = (query: ApiRequest["query"]): string | null => {
  const raw = query.token;
  const token = Array.isArray(raw) ? raw[0] : raw;
  return typeof token === "string" && token.trim().length > 0 ? token.trim() : null;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const token = getToken(req.query);
  if (!isValidSpiderToken(token)) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const result = await runSpiderKayakRedirect();
  if (!result.ok) {
    res.status(502).json({ error: result.error });
    return;
  }

  res.status(302);
  res.setHeader("Location", result.redirectUrl);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  res.end();
}
