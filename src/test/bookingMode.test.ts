import { describe, expect, it, afterEach } from "vitest";
import { getHotelAffiliateRouting, is2PopMode } from "@/lib/bookingMode";

describe("bookingMode", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("defaults to Kayak affiliate routing when no flag is set", () => {
    expect(getHotelAffiliateRouting()).toEqual({
      affiliateSource: "kayak",
      partner: "kayak-hotels",
    });
  });

  it("routes to Kayak when ?k=1", () => {
    window.history.replaceState({}, "", "/?k=1");
    expect(getHotelAffiliateRouting()).toEqual({
      affiliateSource: "kayak",
      partner: "kayak-hotels",
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

  it("returns false when dpop param is absent", () => {
    expect(is2PopMode()).toBe(false);
  });

  it("returns false when dpop=0", () => {
    window.history.replaceState({}, "", "/?dpop=0");
    expect(is2PopMode()).toBe(false);
  });

  it("returns true when ?dpop=1 and no FB traffic signals", () => {
    window.history.replaceState({}, "", "/?dpop=1");
    expect(is2PopMode()).toBe(true);
  });

  it("returns false when ?dpop=1 but fbclid is present", () => {
    window.history.replaceState({}, "", "/?dpop=1&fbclid=abc123");
    expect(is2PopMode()).toBe(false);
  });

  it("returns false when ?dpop=1 but utm_source=facebook", () => {
    window.history.replaceState({}, "", "/?dpop=1&utm_source=facebook");
    expect(is2PopMode()).toBe(false);
  });

  it("returns false when ?dpop=1 but utm_source=meta", () => {
    window.history.replaceState({}, "", "/?dpop=1&utm_source=meta");
    expect(is2PopMode()).toBe(false);
  });

  it("returns false when ?dpop=1 but utm_source=instagram", () => {
    window.history.replaceState({}, "", "/?dpop=1&utm_source=instagram");
    expect(is2PopMode()).toBe(false);
  });

  it("returns true when ?dpop=1 with non-FB utm_source", () => {
    window.history.replaceState({}, "", "/?dpop=1&utm_source=google");
    expect(is2PopMode()).toBe(true);
  });
});
