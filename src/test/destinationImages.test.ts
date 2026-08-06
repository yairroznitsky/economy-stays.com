import {
  getCityHeroImagePath,
  getDestinationHeroFallback,
  getDestinationHeroImage,
} from "@/lib/destinationImages";

describe("destinationImages", () => {
  it("builds public webp paths from city slugs", () => {
    expect(getDestinationHeroImage("Miami")).toBe(
      "/images/city-heroes/miami.webp"
    );
    expect(getCityHeroImagePath("new-york")).toBe(
      "/images/city-heroes/new-york.webp"
    );
  });

  it("exposes a bundled fallback hero", () => {
    expect(getDestinationHeroFallback()).toMatch(/hero-hotel/);
  });
});
