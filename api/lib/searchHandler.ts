import type { TrackingHandlerResult } from "./landingsHandler";
import { insertRow } from "./supabaseRest";

export interface SearchInsertBody {
  click_id?: unknown;
  landing_id?: unknown;
  partner?: unknown;
  iata_code?: unknown;
  location_id?: unknown;
  pickup_date_new?: unknown;
  pickup_time_new?: unknown;
  dropoff_date_new?: unknown;
  dropoff_time_new?: unknown;
  timestamp?: unknown;
  placement?: unknown;
  redirect_url?: unknown;
  search_params?: unknown;
  auto_params?: unknown;
}

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
    else if (entry == null) continue;
    else out[key] = String(entry);
  }
  return out;
};

export const handleSearchInsert = async (
  body: SearchInsertBody
): Promise<TrackingHandlerResult> => {
  const clickId = typeof body.click_id === "string" ? body.click_id.trim() : "";
  const partner = typeof body.partner === "string" ? body.partner.trim() : "";
  const redirectUrl =
    typeof body.redirect_url === "string" ? body.redirect_url.trim() : "";
  const placement =
    body.placement === "redirect" || body.placement === "new_tab"
      ? body.placement
      : null;

  if (!clickId) {
    return { status: 400, body: { error: "click_id is required" } };
  }
  if (!partner) {
    return { status: 400, body: { error: "partner is required" } };
  }
  if (!redirectUrl) {
    return { status: 400, body: { error: "redirect_url is required" } };
  }
  if (!placement) {
    return {
      status: 400,
      body: { error: 'placement must be "redirect" or "new_tab"' },
    };
  }

  const timestamp =
    typeof body.timestamp === "string" && body.timestamp.trim()
      ? body.timestamp.trim()
      : new Date().toISOString();

  try {
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
      return { status: 500, body: { error } };
    }

    return { status: 201, body: { ok: true, click_id: clickId } };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to insert rental click";
    return { status: 500, body: { error: message } };
  }
};
