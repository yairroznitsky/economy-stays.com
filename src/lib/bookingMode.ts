import type { AffiliateSource } from "@/types/hotels";

export const isBookingMode = (): boolean => {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("booking") === "1";
};

export const getHotelAffiliateRouting = (): {
  affiliateSource: AffiliateSource;
  partner: string;
} =>
  isBookingMode()
    ? { affiliateSource: "booking", partner: "booking-hotels" }
    : { affiliateSource: "kayak", partner: "kayak-hotels" };
