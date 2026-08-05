import { describe, expect, it } from "vitest";
import {
  buildCityPath,
  buildHotelPath,
  buildIntentPath,
  parseLandingPath,
  slugifyName,
} from "../../api/lib/hotelSlug";

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
  it("builds city, intent, and hotel paths without ids", () => {
    expect(buildCityPath("paris")).toBe("/hotels/paris");
    expect(buildIntentPath("paris", "cheap-hotels")).toBe(
      "/hotels/paris/cheap-hotels"
    );
    expect(buildHotelPath("Dubai", "Waldorf Astoria DIFC")).toBe(
      "/hotels/dubai/waldorf-astoria-difc"
    );
  });

  it("parses city-only and nested paths", () => {
    expect(parseLandingPath("/hotels/paris")).toEqual({
      citySlug: "paris",
      segmentSlug: undefined,
    });
    expect(parseLandingPath("/hotels/paris/cheap-hotels")).toEqual({
      citySlug: "paris",
      segmentSlug: "cheap-hotels",
    });
    expect(parseLandingPath("/hotels/dubai/waldorf-astoria-difc")).toEqual({
      citySlug: "dubai",
      segmentSlug: "waldorf-astoria-difc",
    });
  });
});
