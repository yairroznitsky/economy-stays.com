import { getStoredAdsParams } from "@/lib/adsTracking";
import { siteConfig } from "@/lib/siteConfig";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export const trackGoogleAdsConversion = (clickId?: string): void => {
  const conversionId = siteConfig.googleAdsId;
  const conversionLabel = siteConfig.googleAdsConversionLabel;
  if (!conversionId || !conversionLabel || typeof window.gtag !== "function") {
    return;
  }

  const adsParams = getStoredAdsParams();
  window.gtag("event", "conversion", {
    send_to: `${conversionId}/${conversionLabel}`,
    transaction_id: clickId,
    gclid: adsParams.gclid,
  });
};
