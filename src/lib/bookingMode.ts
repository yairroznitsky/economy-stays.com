import type { AffiliateSource } from "@/types/hotels";
import { isFacebookAdsTraffic } from "@/lib/facebookTraffic";

const readQueryFlag = (name: string): boolean => {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get(name) === "1";
};

export const getHotelAffiliateRouting = (): {
  affiliateSource: AffiliateSource;
  partner: string;
} => {
  if (readQueryFlag("k")) {
    return { affiliateSource: "kayak", partner: "kayak-hotels" };
  }
  if (readQueryFlag("skyscanner")) {
    return { affiliateSource: "skyscanner", partner: "skyscanner-hotels" };
  }
  // Default: Kayak (primary monetization)
  return { affiliateSource: "kayak", partner: "kayak-hotels" };
};

/**
 * Returns true when the double-popup conversion flow should activate:
 * ?dpop=1 must be present, and the visitor must NOT be from Facebook/Meta ads.
 */
export const is2PopMode = (): boolean => {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("dpop") !== "1") return false;
  return !isFacebookAdsTraffic(params);
};
