import { describe, expect, it, afterEach } from "vitest";
import { getHotelAffiliateRouting } from "@/lib/bookingMode";

describe("bookingMode", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("defaults to Kayak affiliate routing", () => {
    expect(getHotelAffiliateRouting()).toEqual({
      affiliateSource: "kayak",
      partner: "kayak-hotels",
    });
  });

  it("routes to booking when ?booking=1", () => {
    window.history.replaceState({}, "", "/?booking=1");
    expect(getHotelAffiliateRouting()).toEqual({
      affiliateSource: "booking",
      partner: "booking-hotels",
    });
  });

  it("routes to skyscanner when ?skyscanner=1", () => {
    window.history.replaceState({}, "", "/?skyscanner=1");
    expect(getHotelAffiliateRouting()).toEqual({
      affiliateSource: "skyscanner",
      partner: "skyscanner-hotels",
    });
  });
});
