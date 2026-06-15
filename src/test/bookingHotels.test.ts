import { describe, expect, it } from "vitest";
import {
  buildBookingAffiliateRedirectUrl,
  buildBookingSearchResultsUrl,
  parseSkyscannerLocation,
} from "@/lib/bookingHotels";

const TEST_CONFIG = {
  tid: "1321636",
  auth: "ofxbqjcsboet",
  baseUrl: "https://selfashelookedrou.com/brands_redirect",
  currency: "USD",
  lang: "en-us",
} as const;

const baseInput = {
  query: "Athens",
  checkin: "2026-06-10",
  checkout: "2026-06-11",
  rooms: 1,
  adults: 2,
  children: 0,
  children_ages: [] as number[],
  click_id: "test-click-123",
};

describe("parseSkyscannerLocation", () => {
  it("parses comma-separated coordinates", () => {
    expect(parseSkyscannerLocation("38.0033,23.7286")).toEqual({
      lat: "38.0033",
      lng: "23.7286",
    });
  });

  it("parses object coordinates", () => {
    expect(parseSkyscannerLocation({ latitude: 40.7128, longitude: -74.006 })).toEqual({
      lat: "40.7128",
      lng: "-74.006",
    });
  });

  it("returns null for invalid values", () => {
    expect(parseSkyscannerLocation("not-coords")).toBeNull();
    expect(parseSkyscannerLocation(null)).toBeNull();
  });
});

describe("buildBookingSearchResultsUrl", () => {
  it("builds inner URL with Athens coords and guest params", () => {
    const url = buildBookingSearchResultsUrl({
      ...baseInput,
      latitude: 38.0033,
      longitude: 23.7286,
    });

    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("https://www.booking.com/searchresults.html");
    expect(parsed.searchParams.get("ss")).toBe("Athens");
    expect(parsed.searchParams.get("checkin")).toBe("2026-06-10");
    expect(parsed.searchParams.get("checkout")).toBe("2026-06-11");
    expect(parsed.searchParams.get("latitude")).toBe("38.0033");
    expect(parsed.searchParams.get("longitude")).toBe("23.7286");
    expect(parsed.searchParams.get("group_adults")).toBe("2");
    expect(parsed.searchParams.get("group_children")).toBe("0");
    expect(parsed.searchParams.get("no_rooms")).toBe("1");
    expect(parsed.searchParams.get("selected_currency")).toBe("USD");
    expect(parsed.searchParams.get("lang")).toBe("en-us");
  });

  it("omits lat/lng when coordinates are not provided", () => {
    const url = buildBookingSearchResultsUrl(baseInput);
    const parsed = new URL(url);

    expect(parsed.searchParams.get("ss")).toBe("Athens");
    expect(parsed.searchParams.has("latitude")).toBe(false);
    expect(parsed.searchParams.has("longitude")).toBe(false);
  });

  it("repeats age params for each child", () => {
    const url = buildBookingSearchResultsUrl({
      ...baseInput,
      adults: 2,
      children: 2,
      children_ages: [5, 10],
    });
    const parsed = new URL(url);

    expect(parsed.searchParams.get("group_children")).toBe("2");
    expect(parsed.searchParams.getAll("age")).toEqual(["5", "10"]);
  });
});

describe("buildBookingAffiliateRedirectUrl", () => {
  it("wraps inner URL with affiliate params and encoded osr", () => {
    const redirectUrl = buildBookingAffiliateRedirectUrl(
      {
        ...baseInput,
        latitude: 38.0033,
        longitude: 23.7286,
      },
      TEST_CONFIG
    );

    const parsed = new URL(redirectUrl);
    expect(parsed.origin + parsed.pathname).toBe("https://selfashelookedrou.com/brands_redirect");
    expect(parsed.searchParams.get("tid")).toBe("1321636");
    expect(parsed.searchParams.get("auth")).toBe("ofxbqjcsboet");
    expect(parsed.searchParams.get("puid")).toBe("test-click-123");
    expect(parsed.searchParams.get("subid")).toBe("test-click-123");

    const osr = parsed.searchParams.get("osr");
    expect(osr).toBeTruthy();
    expect(osr).toContain("https://www.booking.com/searchresults.html");
    expect(osr).toContain("ss=Athens");
    expect(osr).toContain("latitude=38.0033");
    expect(osr).toContain("longitude=23.7286");
  });

  it("uses URLSearchParams encoding for osr inner URL", () => {
    const redirectUrl = buildBookingAffiliateRedirectUrl(
      {
        ...baseInput,
        query: "New York",
      },
      TEST_CONFIG
    );

    const parsed = new URL(redirectUrl);
    const osr = parsed.searchParams.get("osr");
    expect(osr).toBe(
      "https://www.booking.com/searchresults.html?ss=New+York&checkin=2026-06-10&checkout=2026-06-11&group_adults=2&group_children=0&no_rooms=1&selected_currency=USD&lang=en-us"
    );
  });
});
