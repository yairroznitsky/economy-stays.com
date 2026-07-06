import type { AffiliateSource } from "@/types/hotels";

const readQueryFlag = (name: string): boolean => {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get(name) === "1";
};

export const getHotelAffiliateRouting = (): {
  affiliateSource: AffiliateSource;
  partner: string;
} => {
  if (readQueryFlag("booking")) {
    return { affiliateSource: "booking", partner: "booking-hotels" };
  }
  if (readQueryFlag("skyscanner")) {
    return { affiliateSource: "skyscanner", partner: "skyscanner-hotels" };
  }
  return { affiliateSource: "kayak", partner: "kayak-hotels" };
};
