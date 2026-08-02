interface ApiRequest {
  method?: string;
  body: unknown;
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

const asNullableString = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const asStringRecord = (value: unknown): Record<string, string> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") out[key] = entry;
    else if (entry != null) out[key] = String(entry);
  }
  return out;
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

    const clickId = typeof body.click_id === "string" ? body.click_id.trim() : "";
    const partner = typeof body.partner === "string" ? body.partner.trim() : "";
    const redirectUrl =
      typeof body.redirect_url === "string" ? body.redirect_url.trim() : "";
    const placement =
      body.placement === "redirect" || body.placement === "new_tab"
        ? body.placement
        : null;

    if (!clickId) {
      res.status(400).json({ error: "click_id is required" });
      return;
    }
    if (!partner) {
      res.status(400).json({ error: "partner is required" });
      return;
    }
    if (!redirectUrl) {
      res.status(400).json({ error: "redirect_url is required" });
      return;
    }
    if (!placement) {
      res.status(400).json({
        error: 'placement must be "redirect" or "new_tab"',
      });
      return;
    }

    const timestamp =
      typeof body.timestamp === "string" && body.timestamp.trim()
        ? body.timestamp.trim()
        : new Date().toISOString();

    const { error } = await insertRow("rental_clicks", {
      click_id: clickId,
      landing_id: asNullableString(body.landing_id),
      partner,
      iata_code: asNullableString(body.iata_code),
      location_id: asNullableString(body.location_id),
      pickup_date_new: asNullableString(body.pickup_date_new),
      pickup_time_new: asNullableString(body.pickup_time_new),
      dropoff_date_new: asNullableString(body.dropoff_date_new),
      dropoff_time_new: asNullableString(body.dropoff_time_new),
      timestamp,
      placement,
      redirect_url: redirectUrl,
      search_params: asStringRecord(body.search_params),
      auto_params: Boolean(body.auto_params),
    });

    if (error) {
      res.status(500).json({ error });
      return;
    }

    res.status(201).json({ ok: true, click_id: clickId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to insert rental click";
    sendError(res, 500, message);
  }
}
