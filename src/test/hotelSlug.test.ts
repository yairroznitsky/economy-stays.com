import { describe, expect, it } from "vitest";
import {
  buildCityPath,
  buildHotelPath,
  buildIntentPath,
  parseLandingPath,
  slugifyName,
} from "../../lib/landing-page/hotelSlug";

describe("slugifyName", () => {
  it("lowercases and hyphenates", () => {
    expect(slugifyName("Waldorf Astoria Dubai International Financial Centre")).toBe(
      "waldorf-astoria-dubai-international-financial-centre"
    );
  });

  it("strips diacritics", () => {
    expect(slugifyName("Malé")).toBe("male");
    expect(slugifyName("Hôtel Café de la Paix")).toBe("hotel-cafe-de-la-paix");
  });

  it("falls back for names with no latin characters", () => {
    expect(slugifyName("東京ホテル")).toBe("hotel");
  });
});

describe("landing path builders", () => {
  it("builds city and intent paths with country code", () => {
    expect(buildCityPath("fr", "paris")).toBe("/stay/fr/paris");
    expect(buildIntentPath("fr", "paris", "boutique-hotels")).toBe(
      "/stay/fr/paris/boutique-hotels"
    );
  });

  it("builds hotel paths under /hotels/ (hotel pages keep legacy prefix)", () => {
    expect(buildHotelPath("Dubai", "Waldorf Astoria DIFC")).toBe(
      "/hotels/dubai/waldorf-astoria-difc"
    );
  });

  it("parses /stay/ city-only and nested paths", () => {
    expect(parseLandingPath("/stay/fr/paris")).toEqual({
      countryCode: "fr",
      citySlug: "paris",
      segmentSlug: undefined,
    });
    expect(parseLandingPath("/stay/fr/paris/boutique-hotels")).toEqual({
      countryCode: "fr",
      citySlug: "paris",
      segmentSlug: "boutique-hotels",
    });
    expect(parseLandingPath("/stay/ae/dubai")).toEqual({
      countryCode: "ae",
      citySlug: "dubai",
      segmentSlug: undefined,
    });
  });

  it("returns null for non-matching paths", () => {
    expect(parseLandingPath("/hotels/paris")).toBeNull();
    expect(parseLandingPath("/stay/france/paris")).toBeNull();
  });
});
