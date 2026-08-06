import { handleLandingPageGet } from "../lib/landing-page/landingPageHandler";

interface ApiRequest {
  method?: string;
  url?: string;
  query?: { path?: string | string[] };
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
}

const readPathParam = (req: ApiRequest): string | undefined => {
  const raw = req.query?.path;
  if (raw) return Array.isArray(raw) ? raw[0] : raw;
  if (!req.url) return undefined;
  const query = req.url.split("?")[1] ?? "";
  return new URLSearchParams(query).get("path") ?? undefined;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
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

    const result = await handleLandingPageGet(readPathParam(req));
    res.setHeader("Cache-Control", result.cacheControl);
    res.status(result.status).json(result.body);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Landing page lookup failed";
    res.status(500).json({ error: message });
  }
}
