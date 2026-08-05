import { buildLandingPath, normalizeLandingPath } from "@/lib/landingPages";

describe("landingPages paths", () => {
  it("normalizes trailing slashes and casing", () => {
    expect(normalizeLandingPath("/Hotels/Paris/")).toBe("/hotels/paris");
  });

  it("builds base and intent paths", () => {
    expect(buildLandingPath("Paris")).toBe("/hotels/paris");
    expect(buildLandingPath("Paris", "Cheap-Hotels")).toBe(
      "/hotels/paris/cheap-hotels"
    );
  });

  it("builds hotel-style paths under a city", () => {
    expect(buildLandingPath("New-York", "Waldorf-Astoria")).toBe(
      "/hotels/new-york/waldorf-astoria"
    );
  });
});
