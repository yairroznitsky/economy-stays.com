import { appendAdsParams, getStoredAdsParams } from "@/lib/adsTracking";
import { generateClickId, LandingTrackingService } from "@/lib/landingTrackingService";
import { siteConfig } from "@/lib/siteConfig";
import { postTrackingJson } from "@/lib/trackingApi";

export type LandingPageEventType = "page_view" | "search" | "clickout";

export interface LandingPageEventInput {
  eventType: LandingPageEventType;
  landingPageId?: string;
  cityId?: string;
  intentId?: string;
  path?: string;
  clickId?: string;
  params?: Record<string, string>;
}

export const trackLandingPageEvent = async (
  input: LandingPageEventInput
): Promise<void> => {
  if (!siteConfig.enableDbTracking) return;

  const adsParams = getStoredAdsParams();
  let sessionLandingId: string | null = null;

  try {
    sessionLandingId = LandingTrackingService.getCurrentLandingId();
    if (!sessionLandingId) {
      sessionLandingId = await LandingTrackingService.getOrCreateLandingId();
    }
  } catch {
    sessionLandingId = null;
  }

  const clickId = input.clickId ?? generateClickId();

  try {
    await postTrackingJson("/lp-events", {
      event_type: input.eventType,
      landing_page_id: input.landingPageId ?? null,
      city_id: input.cityId ?? null,
      intent_id: input.intentId ?? null,
      session_landing_id: sessionLandingId,
      click_id: clickId,
      gclid: adsParams.gclid ?? null,
      gbraid: adsParams.gbraid ?? null,
      wbraid: adsParams.wbraid ?? null,
      utm_source: adsParams.utm_source ?? null,
      utm_medium: adsParams.utm_medium ?? null,
      utm_campaign: adsParams.utm_campaign ?? null,
      utm_term: adsParams.utm_term ?? null,
      utm_content: adsParams.utm_content ?? null,
      params: appendAdsParams({
        ...(input.path ? { path: input.path } : {}),
        ...(input.params ?? {}),
      }),
    });
  } catch (error) {
    console.warn("[tracking] landing_page_events insert failed", error);
  }
};

export const trackLandingPageClickout = async (options: {
  landingPageId?: string;
  cityId?: string;
  intentId?: string;
  path?: string;
  clickId: string;
  params?: Record<string, string>;
}): Promise<void> => {
  await trackLandingPageEvent({
    eventType: "clickout",
    ...options,
  });
};
