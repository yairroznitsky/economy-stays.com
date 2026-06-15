import { describe, expect, it } from "vitest";
import { getHotelAffiliateRouting, isBookingMode } from "@/lib/bookingMode";

describe("bookingMode", () => {
  it("detects booking=1 in the query string", () => {
    window.history.replaceState({}, "", "/?booking=1");
    expect(isBookingMode()).toBe(true);
    expect(getHotelAffiliateRouting()).toEqual({
      affiliateSource: "booking",
      partner: "booking-hotels",
    });
  });

  it("defaults to skyscanner when booking param is absent", () => {
    window.history.replaceState({}, "", "/");
    expect(isBookingMode()).toBe(false);
    expect(getHotelAffiliateRouting()).toEqual({
      affiliateSource: "skyscanner",
      partner: "skyscanner-hotels",
    });
  });

  it("ignores other booking query values", () => {
    window.history.replaceState({}, "", "/?booking=0");
    expect(isBookingMode()).toBe(false);
  });
});
