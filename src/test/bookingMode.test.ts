import { describe, expect, it } from "vitest";
import { getHotelAffiliateRouting } from "@/lib/bookingMode";

describe("bookingMode", () => {
  it("routes all clickouts to booking.com", () => {
    expect(getHotelAffiliateRouting()).toEqual({
      affiliateSource: "booking",
      partner: "booking-hotels",
    });
  });
});
