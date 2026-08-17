import { describe, expect, it } from "vitest";
import { buildCjBookingUrl } from "@/lib/cjBooking";
import { buildBookingSearchResultsUrl } from "@/lib/bookingHotels";

const TEST_CJ_CONFIG = {
  clickDomain: "kqzyfj.com",
  pid: "101841809",
  aid: "17293132",
};

const baseInput = {
  query: "New York",
  checkin: "2026-06-10",
  checkout: "2026-06-11",
  rooms: 1,
  adults: 2,
  children: 0,
  children_ages: [] as number[],
  click_id: "test-click-123",
};

describe("buildCjBookingUrl", () => {
  it("uses correct CJ click domain, PID and AID in path", () => {
    const url = buildCjBookingUrl(baseInput, TEST_CJ_CONFIG);
    const parsed = new URL(url);

    expect(parsed.origin).toBe("https://www.kqzyfj.com");
    expect(parsed.pathname).toBe("/click-101841809-17293132");
  });

  it("encodes inner Booking.com URL as ?url param", () => {
    const url = buildCjBookingUrl(baseInput, TEST_CJ_CONFIG);
    const parsed = new URL(url);
    const innerUrl = parsed.searchParams.get("url");

    expect(innerUrl).toBeTruthy();
    expect(innerUrl).toContain("https://www.booking.com/searchresults.html");
    // URLSearchParams encodes spaces as + signs
    expect(innerUrl).toContain("ss=New+York");
    expect(innerUrl).toContain("checkin=2026-06-10");
    expect(innerUrl).toContain("checkout=2026-06-11");
  });

  it("sets sid to click_id (not landing_id)", () => {
    const url = buildCjBookingUrl(baseInput, TEST_CJ_CONFIG);
    const parsed = new URL(url);
    expect(parsed.searchParams.get("sid")).toBe("test-click-123");
  });

  it("inner URL includes USD currency and en-us lang", () => {
    const url = buildCjBookingUrl(baseInput, TEST_CJ_CONFIG);
    const parsed = new URL(url);
    const innerUrl = parsed.searchParams.get("url")!;
    const inner = new URL(innerUrl);

    expect(inner.searchParams.get("selected_currency")).toBe("USD");
    expect(inner.searchParams.get("lang")).toBe("en-us");
  });

  it("inner URL includes lat/lng when valid coordinates provided", () => {
    const url = buildCjBookingUrl(
      { ...baseInput, latitude: 40.7128, longitude: -74.006 },
      TEST_CJ_CONFIG
    );
    const parsed = new URL(url);
    const innerUrl = parsed.searchParams.get("url")!;
    const inner = new URL(innerUrl);

    expect(inner.searchParams.get("latitude")).toBe("40.7128");
    expect(inner.searchParams.get("longitude")).toBe("-74.006");
  });

  it("inner URL omits lat/lng when coordinates are absent", () => {
    const url = buildCjBookingUrl(baseInput, TEST_CJ_CONFIG);
    const parsed = new URL(url);
    const innerUrl = parsed.searchParams.get("url")!;
    const inner = new URL(innerUrl);

    expect(inner.searchParams.has("latitude")).toBe(false);
    expect(inner.searchParams.has("longitude")).toBe(false);
  });

  it("repeats age param for each child in inner URL", () => {
    const url = buildCjBookingUrl(
      { ...baseInput, children: 2, children_ages: [3, 7] },
      TEST_CJ_CONFIG
    );
    const parsed = new URL(url);
    const innerUrl = parsed.searchParams.get("url")!;
    const inner = new URL(innerUrl);

    expect(inner.searchParams.get("group_children")).toBe("2");
    expect(inner.searchParams.getAll("age")).toEqual(["3", "7"]);
  });

  it("strips protocol and www from clickDomain", () => {
    const url = buildCjBookingUrl(baseInput, {
      ...TEST_CJ_CONFIG,
      clickDomain: "https://www.kqzyfj.com",
    });
    const parsed = new URL(url);
    expect(parsed.origin).toBe("https://www.kqzyfj.com");
  });

  it("produces same inner URL as buildBookingSearchResultsUrl", () => {
    const cjUrl = buildCjBookingUrl(baseInput, TEST_CJ_CONFIG);
    const parsed = new URL(cjUrl);
    const innerFromCj = parsed.searchParams.get("url")!;
    const innerDirect = buildBookingSearchResultsUrl(baseInput);

    expect(innerFromCj).toBe(innerDirect);
  });
});
