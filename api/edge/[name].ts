const ALLOWED_FUNCTIONS = new Set([
  "hotel-affiliate-router",
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
  end: () => void;
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

  // Prefer server-only names; fall back to VITE_* when those are the only vars on Vercel.
  const supabaseUrl =
    process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
  const anonKey =
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !anonKey) {
    res.status(500).json({ error: "Server configuration missing" });
    return;
  }

  try {
    const upstream = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body ?? {}),
    });

    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "application/json");
    res.end(text);
  } catch {
    res.status(502).json({ error: "Upstream request failed" });
  }
}
