import { getStoredAdsParams } from "@/lib/adsTracking";
import { siteConfig } from "@/lib/siteConfig";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const CONVERSION_REDIRECT_TIMEOUT_MS = 2000;

type TrackGoogleAdsConversionOptions = {
  /** Dedupes conversions in Google Ads when provided. */
  clickId?: string;
  /**
   * When set, navigates after the conversion hit is sent (Google's
   * recommended click-out pattern). Omit for new-tab exits.
   */
  redirectUrl?: string;
};

/**
 * Fires the Google Ads conversion for partner click-outs.
 * Mirrors gtag_report_conversion when redirectUrl is provided.
 */
export const trackGoogleAdsConversion = (
  options: TrackGoogleAdsConversionOptions | string = {}
): void => {
  // Back-compat: older call sites passed clickId as a bare string.
  const normalized =
    typeof options === "string" ? { clickId: options } : options;
  const { clickId, redirectUrl } = normalized;

  const conversionId = siteConfig.googleAdsId;
  const conversionLabel = siteConfig.googleAdsConversionLabel;

  const navigate = (): void => {
    if (redirectUrl) {
      window.location.assign(redirectUrl);
    }
  };

  if (!conversionId || !conversionLabel || typeof window.gtag !== "function") {
    navigate();
    return;
  }

  let navigated = false;
  const safeNavigate = (): void => {
    if (navigated || !redirectUrl) return;
    navigated = true;
    navigate();
  };

  const adsParams = getStoredAdsParams();
  const eventParams: Record<string, unknown> = {
    send_to: `${conversionId}/${conversionLabel}`,
  };

  if (clickId) {
    eventParams.transaction_id = clickId;
  }
  if (adsParams.gclid) {
    eventParams.gclid = adsParams.gclid;
  }
  if (redirectUrl) {
    eventParams.event_callback = safeNavigate;
    eventParams.event_timeout = CONVERSION_REDIRECT_TIMEOUT_MS;
    window.setTimeout(safeNavigate, CONVERSION_REDIRECT_TIMEOUT_MS);
  }

  window.gtag("event", "conversion", eventParams);
};
