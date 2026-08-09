import { describe, expect, it } from "vitest";
import {
  computeCityStats,
  formatCityStatsSummary,
  formatHotelCountLabel,
} from "../../lib/landing-page/cityStats";

describe("computeCityStats", () => {
  it("returns null for empty rows", () => {
    expect(computeCityStats([])).toBeNull();
  });

  it("aggregates count, rating, dominant stars, and top types", () => {
    const stats = computeCityStats(
      [
        { type: "hotel", star_rating: 4, rating: 8 },
        { type: "Hotel", star_rating: 4, rating: 9 },
        { type: "apartment", star_rating: 3, rating: 7 },
        { type: null, star_rating: null, rating: null },
      ],
      { airportCode: "CDG" }
    );

    expect(stats).toEqual({
      hotelCount: 4,
      hotelCountCapped: false,
      avgRating: 8,
      dominantStarRating: 4,
      topTypes: ["Hotel", "Apartment"],
      airportCode: "CDG",
    });
  });

  it("marks count as capped at the sample limit", () => {
    const rows = Array.from({ length: 3 }, () => ({
      type: "hotel" as string | null,
      star_rating: 4 as number | null,
      rating: 8 as number | null,
    }));
    const stats = computeCityStats(rows, { sampleLimit: 3 });
    expect(stats?.hotelCountCapped).toBe(true);
    expect(formatHotelCountLabel(stats!)).toBe("3+ stays");
  });
});

describe("formatCityStatsSummary", () => {
  it("builds a quiet summary line", () => {
    expect(
      formatCityStatsSummary({
        hotelCount: 1240,
        hotelCountCapped: false,
        avgRating: 8.4,
        dominantStarRating: 4,
        topTypes: ["Hotel", "Apartment"],
        airportCode: "CDG",
      })
    ).toBe(
      "1,240 stays · avg guest rating 8.4 · mostly 4-star · hotels & apartments · near CDG"
    );
  });
});
