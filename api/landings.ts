interface ApiRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body: unknown;
  socket?: { remoteAddress?: string | null };
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
}

const readEnv = (key: string): string | undefined => {
  const value = process.env[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
};

const headerValue = (
  headers: ApiRequest["headers"],
  name: string
): string => {
  if (!headers) return "";
  const raw = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0]?.trim() ?? "";
  return typeof raw === "string" ? raw.trim() : "";
};

const getClientIp = (req: ApiRequest): string => {
  const forwarded = headerValue(req.headers, "x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "";
  const vercelIp = headerValue(req.headers, "x-vercel-forwarded-for");
  if (vercelIp) return vercelIp.split(",")[0]?.trim() ?? "";
  return headerValue(req.headers, "x-real-ip") || req.socket?.remoteAddress?.trim() || "";
};

const getSupabaseConfig = (): { url: string; key: string } => {
  const url = readEnv("SUPABASE_URL") ?? readEnv("VITE_SUPABASE_URL");
  const key = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL (or VITE_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return { url, key };
};

const insertRow = async (
  table: string,
  row: Record<string, unknown>
): Promise<{ error: string | null }> => {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${encodeURIComponent(table)}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return { error: text || response.statusText || `HTTP ${response.status}` };
  }
  return { error: null };
};

const setCors = (res: ApiResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
};

const sendError = (res: ApiResponse, status: number, error: string) => {
  try {
    setCors(res);
    res.status(status).json({ error });
  } catch {
    // Response may already be closed.
  }
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    setCors(res);

    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const body =
      typeof req.body === "object" && req.body !== null
        ? (req.body as Record<string, unknown>)
        : {};

    const landingId =
      typeof body.landing_id === "string" ? body.landing_id.trim() : "";
    if (!landingId) {
      res.status(400).json({ error: "landing_id is required" });
      return;
    }

    const urlParams =
      typeof body.url_params === "string" ? body.url_params : "";

    const clientMeta =
      typeof body.metadata === "object" &&
      body.metadata !== null &&
      !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, unknown>)
        : {};

    const clientReferrer =
      typeof clientMeta.referrer === "string" ? clientMeta.referrer : "";

    const metadata: Record<string, unknown> = {
      ...clientMeta,
      user_agent: headerValue(req.headers, "user-agent"),
      referrer:
        clientReferrer ||
        headerValue(req.headers, "referer") ||
        headerValue(req.headers, "referrer"),
      timestamp: new Date().toISOString(),
      ip: getClientIp(req),
      source_app:
        readEnv("SITE_SLUG")?.trim() ||
        readEnv("VITE_SITE_SLUG")?.trim() ||
        "cheap-stays",
    };

    const { error } = await insertRow("landings", {
      landing_id: landingId,
      url_params: urlParams,
      metadata,
    });

    if (error) {
      res.status(500).json({ error });
      return;
    }

    res.status(201).json({ ok: true, landing_id: landingId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to insert landing";
    sendError(res, 500, message);
  }
}
