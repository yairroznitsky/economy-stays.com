import {
  getSitelinkPage,
  SITELINK_SLUGS,
} from "@/lib/sitelinkPages";
import { getSitelinkBrowseLinks } from "@/lib/sitelinkBrowse";

describe("sitelinkPages", () => {
  it("exposes the six Ads sitelink slugs", () => {
    expect(SITELINK_SLUGS).toEqual([
      "last-minute-hotel-deals",
      "unsold-room-deals",
      "hotels-under-100",
      "60-off-hotel-deals",
      "cheap-hotels-near-you",
      "weekend-hotel-deals",
    ]);
  });

  it("links last-minute sitelinks to last-minute city intent pages", () => {
    const page = getSitelinkPage("last-minute-hotel-deals");
    expect(page?.browseIntentSlug).toBe("last-minute-hotels");
    expect(getSitelinkBrowseLinks(page!)).toEqual(
      expect.arrayContaining([
        { name: "Paris", path: "/hotels/paris/last-minute-hotels" },
        { name: "London", path: "/hotels/london/last-minute-hotels" },
      ])
    );
  });

  it("links budget sitelinks to cheap-hotels city pages", () => {
    const under100 = getSitelinkPage("hotels-under-100");
    const nearYou = getSitelinkPage("cheap-hotels-near-you");
    expect(under100?.browseIntentSlug).toBe("cheap-hotels");
    expect(nearYou?.browseIntentSlug).toBe("cheap-hotels");
    expect(getSitelinkBrowseLinks(under100!)[0]).toEqual({
      name: "Paris",
      path: "/hotels/paris/cheap-hotels",
    });
  });

  it("links weekend and deal sitelinks to city pages", () => {
    const weekend = getSitelinkPage("weekend-hotel-deals");
    const off = getSitelinkPage("60-off-hotel-deals");
    const unsold = getSitelinkPage("unsold-room-deals");
    expect(weekend?.browseIntentSlug).toBeUndefined();
    expect(off?.browseIntentSlug).toBeUndefined();
    expect(unsold?.browseIntentSlug).toBeUndefined();
    expect(getSitelinkBrowseLinks(weekend!)[0]).toEqual({
      name: "Paris",
      path: "/hotels/paris",
    });
  });

  it("uses tonight dates for last-minute and unsold pages", () => {
    expect(getSitelinkPage("last-minute-hotel-deals")?.datePreset).toBe("tonight");
    expect(getSitelinkPage("unsold-room-deals")?.datePreset).toBe("tonight");
  });

  it("uses weekend dates only for the weekend sitelink", () => {
    expect(getSitelinkPage("weekend-hotel-deals")?.datePreset).toBe("weekend");
    expect(getSitelinkPage("hotels-under-100")?.datePreset).toBe("tomorrow");
  });

  it("ships unique meta titles and article sections per sitelink", () => {
    const titles = SITELINK_SLUGS.map((slug) => getSitelinkPage(slug)?.metaTitle);
    expect(new Set(titles).size).toBe(SITELINK_SLUGS.length);
    expect(getSitelinkPage("last-minute-hotel-deals")?.sections.length).toBeGreaterThan(3);
  });
});
