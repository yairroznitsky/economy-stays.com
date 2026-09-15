import { buildLandingPath, normalizeLandingPath } from "@/lib/landingPages";

describe("landingPages paths", () => {
  it("normalizes trailing slashes and casing", () => {
    expect(normalizeLandingPath("/Stay/FR/Paris/")).toBe("/stay/fr/paris");
  });

  it("builds base and theme paths with country code", () => {
    expect(buildLandingPath("paris", undefined, "fr")).toBe("/stay/fr/paris");
    expect(buildLandingPath("paris", "boutique-hotels", "fr")).toBe(
      "/stay/fr/paris/boutique-hotels"
    );
  });

  it("falls back to xx country code when none provided", () => {
    expect(buildLandingPath("paris")).toBe("/stay/xx/paris");
    expect(buildLandingPath("new-york", "top-rated")).toBe(
      "/stay/xx/new-york/top-rated"
    );
  });
});
