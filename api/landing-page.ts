import { handleLandingPageGet } from "./lib/landingPageHandler";

interface ApiRequest {
  method?: string;
  query: { path?: string | string[] };
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const raw = req.query.path;
  const path = Array.isArray(raw) ? raw[0] : raw;

  const result = await handleLandingPageGet(path);
  res.setHeader("Cache-Control", result.cacheControl);
  res.status(result.status).json(result.body);
}
