export interface LpEventsInsertBody {
  event_type?: unknown;
  landing_page_id?: unknown;
  city_id?: unknown;
  intent_id?: unknown;
  session_landing_id?: unknown;
  gclid?: unknown;
  gbraid?: unknown;
  wbraid?: unknown;
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
  utm_term?: unknown;
  utm_content?: unknown;
  click_id?: unknown;
  params?: unknown;
}

export interface TrackingHandlerResult {
  status: number;
  body: Record<string, unknown>;
}

const EVENT_TYPES = new Set(["page_view", "search", "clickout"]);

const readOptionalString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const handleLpEventsInsert = async (
  body: LpEventsInsertBody
): Promise<TrackingHandlerResult> => {
  const eventType = readOptionalString(body.event_type);
  if (!eventType || !EVENT_TYPES.has(eventType)) {
    return { status: 400, body: { error: "event_type must be page_view, search, or clickout" } };
  }

  const { insertRow } = await import("./supabaseRest");

  const { error } = await insertRow("landing_page_events", {
    event_type: eventType,
    landing_page_id: readOptionalString(body.landing_page_id),
    city_id: readOptionalString(body.city_id),
    intent_id: readOptionalString(body.intent_id),
    session_landing_id: readOptionalString(body.session_landing_id),
    gclid: readOptionalString(body.gclid),
    gbraid: readOptionalString(body.gbraid),
    wbraid: readOptionalString(body.wbraid),
    utm_source: readOptionalString(body.utm_source),
    utm_medium: readOptionalString(body.utm_medium),
    utm_campaign: readOptionalString(body.utm_campaign),
    utm_term: readOptionalString(body.utm_term),
    utm_content: readOptionalString(body.utm_content),
    click_id: readOptionalString(body.click_id),
    params: isPlainObject(body.params) ? body.params : {},
  });

  if (error) {
    return { status: 500, body: { error } };
  }

  return { status: 201, body: { ok: true } };
};
