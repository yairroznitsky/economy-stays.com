import { describe, expect, it, afterEach } from "vitest";
import { getHotelAffiliateRouting, is2PopMode } from "@/lib/bookingMode";

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

describe("is2PopMode", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("returns false when 2pop param is absent", () => {
    expect(is2PopMode()).toBe(false);
  });

  it("returns false when 2pop=0", () => {
    window.history.replaceState({}, "", "/?2pop=0");
    expect(is2PopMode()).toBe(false);
  });

  it("returns true when ?2pop=1 and no FB traffic signals", () => {
    window.history.replaceState({}, "", "/?2pop=1");
    expect(is2PopMode()).toBe(true);
  });

  it("returns false when ?2pop=1 but fbclid is present", () => {
    window.history.replaceState({}, "", "/?2pop=1&fbclid=abc123");
    expect(is2PopMode()).toBe(false);
  });

  it("returns false when ?2pop=1 but utm_source=facebook", () => {
    window.history.replaceState({}, "", "/?2pop=1&utm_source=facebook");
    expect(is2PopMode()).toBe(false);
  });

  it("returns false when ?2pop=1 but utm_source=meta", () => {
    window.history.replaceState({}, "", "/?2pop=1&utm_source=meta");
    expect(is2PopMode()).toBe(false);
  });

  it("returns false when ?2pop=1 but utm_source=instagram", () => {
    window.history.replaceState({}, "", "/?2pop=1&utm_source=instagram");
    expect(is2PopMode()).toBe(false);
  });

  it("returns true when ?2pop=1 with non-FB utm_source", () => {
    window.history.replaceState({}, "", "/?2pop=1&utm_source=google");
    expect(is2PopMode()).toBe(true);
  });
});
