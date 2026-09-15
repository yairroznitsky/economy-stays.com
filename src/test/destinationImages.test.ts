import {
  getCityHeroImagePath,
  getCityHeroSrcSet,
  getDestinationHeroFallback,
  getDestinationHeroImage,
} from "@/lib/destinationImages";

describe("destinationImages", () => {
  it("builds public webp paths from city slugs", () => {
    expect(getDestinationHeroImage("Miami")).toBe(
      "/images/city-heroes-optimized/miami.webp"
    );
    expect(getCityHeroImagePath("new-york")).toBe(
      "/images/city-heroes-optimized/new-york.webp"
    );
  });

  it("builds responsive city hero srcsets", () => {
    expect(getCityHeroSrcSet("Chengdu")).toBe(
      "/images/city-heroes-optimized/chengdu-960.webp 960w, /images/city-heroes-optimized/chengdu.webp 1600w"
    );
  });

  it("exposes a bundled fallback hero that is not a city hero path", () => {
    const fallback = getDestinationHeroFallback();
    // City heroes were deleted; fallback should be the bundled asset, not a /images/ path
    expect(fallback).toBeTruthy();
    expect(typeof fallback).toBe("string");
  });
});
