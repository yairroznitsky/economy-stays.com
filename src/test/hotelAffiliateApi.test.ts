import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  requestHotelDestinationAutocomplete,
  requestHotelRedirectUrl,
} from "@/lib/hotelAffiliateApi";
import * as edgeFunctionClient from "@/lib/edgeFunctionClient";

vi.mock("@/lib/edgeFunctionClient", () => ({
  assertEdgeFunctionsAvailable: vi.fn(),
  invokeEdgeFunction: vi.fn(),
}));

describe("requestHotelRedirectUrl", () => {
  it("builds Kayak deeplinks client-side without calling edge functions", async () => {
    const response = await requestHotelRedirectUrl({
      search: {
        destination: "New York, New York, United States",
        destinationId: "12345",
        cityName: "New York",
        stateName: "New York",
        countryName: "United States",
        checkIn: "2026-07-10",
        checkOut: "2026-07-12",
        rooms: 1,
        adults: 2,
        children: 0,
        country: "US",
      },
      clickId: "test-click-abc",
      affiliateSource: "kayak",
    });

    expect(edgeFunctionClient.invokeEdgeFunction).not.toHaveBeenCalled();
    expect(edgeFunctionClient.assertEdgeFunctionsAvailable).not.toHaveBeenCalled();

    const parsed = new URL(response.redirectUrl);
    expect(parsed.origin + parsed.pathname).toBe("https://www.kayak.com/in");
    expect(parsed.searchParams.get("enc_cid")).toBe("test-click-abc");
    expect(parsed.searchParams.get("url")).toBe(
      "/hotels/New-York,New-York,United-States-c12345/2026-07-10/2026-07-12/2adults/1rooms"
    );
    expect(response.entityId).toBe("12345");
    expect(response.provider).toBe("kayak");
  });
});

describe("requestHotelDestinationAutocomplete", () => {
  beforeEach(() => {
    vi.mocked(edgeFunctionClient.invokeEdgeFunction).mockReset();
  });

  it("maps kayak-autocomplete suggestions to HotelDestinationSuggestion", async () => {
    vi.mocked(edgeFunctionClient.invokeEdgeFunction).mockResolvedValue({
      success: true,
      query: "Miami",
      suggestions: [
        {
          id: "12345",
          label: "Miami, Florida, United States",
          type: "ct",
          subtitle: "Florida, United States",
          raw: {
            city_id: "12345",
            city: "Miami",
            state: "Florida",
            country: "United States",
          },
        },
        {
          id: "ap-1",
          label: "Miami International",
          type: "ap",
          subtitle: "Miami, United States",
          raw: {
            city_id: "12345",
            place_id: "777",
            airport_code: "MIA",
            airport_name: "Miami International",
            city: "Miami",
            country: "United States",
          },
        },
      ],
    });

    const results = await requestHotelDestinationAutocomplete({
      query: "Miami",
      locale: "en",
      country: "US",
    });

    expect(edgeFunctionClient.invokeEdgeFunction).toHaveBeenCalledWith(
      "kayak-autocomplete",
      { query: "Miami", locale: "en", country: "US" }
    );
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      id: "12345",
      label: "Miami, Florida, United States",
      type: "city",
      raw: expect.objectContaining({ city_id: "12345" }),
    });
    expect(results[1]).toMatchObject({
      type: "airport",
      raw: expect.objectContaining({
        airport_code: "MIA",
        place_id: "777",
      }),
    });
  });

  it("returns an empty list for queries shorter than 3 characters", async () => {
    const results = await requestHotelDestinationAutocomplete({ query: "Mi" });
    expect(results).toEqual([]);
    expect(edgeFunctionClient.invokeEdgeFunction).not.toHaveBeenCalled();
  });
});
