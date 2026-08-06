import { describe, expect, it } from "vitest";
import {
  buildRelatedHotelCityFilters,
  dedupeRelatedHotels,
  type RelatedHotelRow,
} from "../../api/_lib/relatedHotels";

describe("buildRelatedHotelCityFilters", () => {
  it("prefers city_slug then exact and wildcard city_name matches", () => {
    expect(buildRelatedHotelCityFilters("paris", "Paris")).toEqual([
      "city_slug=eq.paris",
      "city_name=ilike.Paris",
      "city_name=ilike.*Paris*",
    ]);
  });

  it("dedupes city name candidates", () => {
    expect(buildRelatedHotelCityFilters("paris", "Paris")).toHaveLength(3);
  });

  it("falls back to slug-derived city name when city row name is missing", () => {
    expect(buildRelatedHotelCityFilters("abu-dhabi", null)).toEqual([
      "city_slug=eq.abu-dhabi",
      "city_name=ilike.Abu%20Dhabi",
      "city_name=ilike.*Abu%20Dhabi*",
    ]);
  });
});

describe("dedupeRelatedHotels", () => {
  const row = (
    id: number,
    name: string,
    city: string,
    reviews: number
  ): RelatedHotelRow => ({
    external_id: id,
    name,
    city_name: city,
    star_rating: 4,
    rating: 8.5,
    reviews,
  });

  it("keeps the highest-reviewed hotel per path and limits to six", () => {
    const results = dedupeRelatedHotels([
      row(1, "Grand Hotel", "Paris", 100),
      row(2, "Grand Hotel", "Paris", 500),
      row(3, "Boutique Stay", "Paris", 250),
      row(4, "Harbor Inn", "Paris", 200),
      row(5, "City Lodge", "Paris", 150),
      row(6, "Garden Hotel", "Paris", 120),
      row(7, "Skyline Hotel", "Paris", 110),
      row(8, "River View", "Paris", 90),
    ]);

    expect(results).toHaveLength(6);
    expect(results[0].external_id).toBe(2);
  });
});
