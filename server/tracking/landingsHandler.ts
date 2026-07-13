import { getClientIp, getReferrer, getUserAgent, type RequestLike } from "./requestMeta";
import { getSourceApp, getSupabaseAdmin } from "./supabaseAdmin";

export interface LandingInsertBody {
  landing_id?: unknown;
  url_params?: unknown;
  metadata?: unknown;
}

export interface TrackingHandlerResult {
  status: number;
  body: Record<string, unknown>;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const handleLandingsInsert = async (
  req: RequestLike,
  body: LandingInsertBody
): Promise<TrackingHandlerResult> => {
  const landingId =
    typeof body.landing_id === "string" ? body.landing_id.trim() : "";
  if (!landingId) {
    return { status: 400, body: { error: "landing_id is required" } };
  }

  const urlParams =
    typeof body.url_params === "string" ? body.url_params : "";

  const clientMeta = isPlainObject(body.metadata) ? body.metadata : {};
  const clientReferrer =
    typeof clientMeta.referrer === "string" ? clientMeta.referrer : "";

  const metadata: Record<string, unknown> = {
    ...clientMeta,
    user_agent: getUserAgent(req),
    referrer: clientReferrer || getReferrer(req),
    timestamp: new Date().toISOString(),
    ip: getClientIp(req),
    source_app: getSourceApp(),
  };

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("landings").insert({
      landing_id: landingId,
      url_params: urlParams,
      metadata,
    });

    if (error) {
      return { status: 500, body: { error: error.message } };
    }

    return { status: 201, body: { ok: true, landing_id: landingId } };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to insert landing";
    return { status: 500, body: { error: message } };
  }
};
