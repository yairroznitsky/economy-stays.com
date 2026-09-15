import { handleKayakAutocomplete } from "../../server/edge/kayakAutocomplete";

const ALLOWED_FUNCTIONS = new Set([
  "kayak-autocomplete",
]);

interface ApiRequest {
  method?: string;
  query: { name?: string | string[] };
  body: unknown;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  end: (body?: string) => void;
  setHeader: (name: string, value: string) => void;
}

const getFunctionName = (query: ApiRequest["query"]): string | null => {
  const raw = query.name;
  const name = Array.isArray(raw) ? raw[0] : raw;
  return typeof name === "string" && ALLOWED_FUNCTIONS.has(name) ? name : null;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const functionName = getFunctionName(req.query);
  if (!functionName) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  try {
    const result = await handleKayakAutocomplete(req.body);
    res.status(result.status).json(result.body);
  } catch {
    res.status(502).json({ error: "Upstream request failed" });
  }
}
