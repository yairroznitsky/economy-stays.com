import { describe, expect, it } from "vitest";
import {
  buildKayakDeeplink,
  buildKayakHotelPath,
  resolveKayakRoomCount,
  type KayakAffiliateConfig,
} from "@/lib/kayakDeeplink";

const KAYAK_CONFIG: KayakAffiliateConfig = {
  affiliateId: "kan_317689_594114",
  deeplinkBase: "https://www.kayak.com/in",
  utmMedium: "affiliate",
};

const baseInput = {
  query: "New York, New York, United States",
  destination_id: "12345",
  checkin: "2026-07-10",
  checkout: "2026-07-12",
  rooms: 1,
  adults: 2,
  children: 0,
  children_ages: [] as number[],
  click_id: "test-click-abc",
  country: "US",
  city_name: "New York",
  state_name: "New York",
  country_name: "United States",
};

describe("buildKayakDeeplink", () => {
  const destination = { destination_id: "12345" };

  it("wraps a US city search in the Kayak /in affiliate URL", () => {
    const url = buildKayakDeeplink(baseInput, destination, KAYAK_CONFIG);
    const parsed = new URL(url);

    expect(parsed.origin + parsed.pathname).toBe("https://www.kayak.com/in");
    expect(parsed.searchParams.get("a")).toBe("kan_317689_594114");
    expect(parsed.searchParams.get("enc_cid")).toBe("test-click-abc");
    expect(parsed.searchParams.get("enc_lid")).toBe("hotels");
    expect(parsed.searchParams.get("enc_pid")).toBe("deeplinks");
    expect(parsed.searchParams.get("encoder")).toBe("27_1");
    expect(parsed.searchParams.get("utm_medium")).toBe("affiliate");

    const kayakPath = parsed.searchParams.get("url");
    expect(kayakPath).toBe(
      "/hotels/New-York,New-York,United-States-c12345/2026-07-10/2026-07-12/2adults/1rooms"
    );
  });

  it("builds an international city slug without state", () => {
    const kayakPath = buildKayakHotelPath(
      {
        ...baseInput,
        query: "Paris, France",
        destination_id: "67890",
        city_name: "Paris",
        state_name: undefined,
        country_name: "France",
        country: "FR",
      },
      { destination_id: "67890" }
    );

    expect(kayakPath).toBe(
      "/hotels/Paris,France-c67890/2026-07-10/2026-07-12/2adults/1rooms"
    );
  });

  it("builds a hotel deeplink with hotel id suffix", () => {
    const kayakPath = buildKayakHotelPath(
      {
        ...baseInput,
        query: "The Plaza, New York, New York, United States",
        destination_id: "12345",
        hotel_id: "999",
        city_name: "New York",
        state_name: "New York",
        country_name: "United States",
      },
      { destination_id: "12345" }
    );

    expect(kayakPath).toContain("-c12345-h999");
    expect(kayakPath).toContain("/hotels/The-Plaza,New-York,New-York,United-States-c12345-h999/");
  });

  it("builds an airport deeplink without city id suffix", () => {
    const kayakPath = buildKayakHotelPath(
      {
        ...baseInput,
        query: "Miami, United States, Miami International",
        destination_id: "55555",
        airport_place_id: "777",
        airport_code: "MIA",
        airport_name: "Miami International",
        city_name: "Miami",
        country_name: "United States",
      },
      { destination_id: "55555" }
    );

    expect(kayakPath).toBe(
      "/hotels/Miami,United-States,Miami-International-p777-lMIA/2026-07-10/2026-07-12/2adults/1rooms"
    );
    expect(kayakPath).not.toContain("-c55555");
  });

  it("includes children ages in the guest segment", () => {
    const kayakPath = buildKayakHotelPath(
      {
        ...baseInput,
        children: 1,
        children_ages: [8],
      },
      destination
    );

    expect(kayakPath).toBe(
      "/hotels/New-York,New-York,United-States-c12345/2026-07-10/2026-07-12/2adults/1children-8/1rooms"
    );
  });
});

describe("resolveKayakRoomCount", () => {
  it("requires at least 1 room for up to 4 guests", () => {
    expect(resolveKayakRoomCount(1, 4, 0)).toBe(1);
    expect(resolveKayakRoomCount(1, 2, 2)).toBe(1);
  });

  it("bumps the minimum to 2 rooms for 6 guests", () => {
    expect(resolveKayakRoomCount(1, 6, 0)).toBe(2);
    expect(resolveKayakRoomCount(1, 4, 2)).toBe(2);
  });

  it("respects a higher room count explicitly chosen by the user", () => {
    expect(resolveKayakRoomCount(3, 6, 0)).toBe(3);
  });

  it("requires 3 rooms minimum for 9 guests", () => {
    expect(resolveKayakRoomCount(1, 9, 0)).toBe(3);
    expect(resolveKayakRoomCount(2, 9, 0)).toBe(3);
  });

  it("allows up to 1 room per guest (no upper cap)", () => {
    expect(resolveKayakRoomCount(6, 6, 0)).toBe(6);
    expect(resolveKayakRoomCount(9, 9, 0)).toBe(9);
  });
});

describe("buildKayakHotelPath room count enforcement", () => {
  const destination = { destination_id: "12345" };

  it("raises the rooms segment to the Kayak minimum for 6 guests", () => {
    const kayakPath = buildKayakHotelPath(
      { ...baseInput, rooms: 1, adults: 6, children: 0 },
      destination
    );

    expect(kayakPath).toContain("/6adults/2rooms");
  });

  it("keeps a user-selected room count of 3 for 6 guests", () => {
    const kayakPath = buildKayakHotelPath(
      { ...baseInput, rooms: 3, adults: 6, children: 0 },
      destination
    );

    expect(kayakPath).toContain("/6adults/3rooms");
  });

  it("raises the rooms segment to the Kayak minimum for 9 guests", () => {
    const kayakPath = buildKayakHotelPath(
      { ...baseInput, rooms: 1, adults: 9, children: 0 },
      destination
    );

    expect(kayakPath).toContain("/9adults/3rooms");
  });
});
