import type { AffiliateSource } from "@/types/hotels";

export const getHotelAffiliateRouting = (): {
  affiliateSource: AffiliateSource;
  partner: string;
} => ({
  affiliateSource: "booking",
  partner: "booking-hotels",
});
