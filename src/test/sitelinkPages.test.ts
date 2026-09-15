import {
  getSitelinkPage,
  SITELINK_SLUGS,
} from "@/lib/sitelinkPages";
import { getSitelinkBrowseLinks } from "@/lib/sitelinkBrowse";

describe("sitelinkPages", () => {
  it("exposes the six Ads sitelink slugs", () => {
    expect(SITELINK_SLUGS).toEqual([
      "tonight-stays",
      "unsold-rooms-tonight",
      "stays-under-100",
      "half-price-stays",
      "stays-near-me",
      "weekend-away",
    ]);
  });

  it("links tonight-stays to top-rated city intent pages", () => {
    const page = getSitelinkPage("tonight-stays");
    expect(page?.browseIntentSlug).toBe("top-rated");
    expect(getSitelinkBrowseLinks(page!)).toEqual(
      expect.arrayContaining([
        { name: "Paris", path: "/stay/fr/paris/top-rated" },
        { name: "London", path: "/stay/gb/london/top-rated" },
      ])
    );
  });

  it("links stays-under-100 to under-150 city intent pages", () => {
    const under100 = getSitelinkPage("stays-under-100");
    expect(under100?.browseIntentSlug).toBe("under-150");
    expect(getSitelinkBrowseLinks(under100!)[0]).toEqual({
      name: "Paris",
      path: "/stay/fr/paris/under-150",
    });
  });

  it("links weekend-away to boutique-hotels city intent pages", () => {
    const weekend = getSitelinkPage("weekend-away");
    expect(weekend?.browseIntentSlug).toBe("boutique-hotels");
    expect(getSitelinkBrowseLinks(weekend!)[0]).toEqual({
      name: "Paris",
      path: "/stay/fr/paris/boutique-hotels",
    });
  });

  it("pages without a browseIntentSlug link to city pages", () => {
    const nearMe = getSitelinkPage("stays-near-me");
    expect(nearMe?.browseIntentSlug).toBeUndefined();
    expect(getSitelinkBrowseLinks(nearMe!)[0]).toEqual({
      name: "Paris",
      path: "/stay/fr/paris",
    });
  });

  it("uses tonight dates for tonight and unsold pages", () => {
    expect(getSitelinkPage("tonight-stays")?.datePreset).toBe("tonight");
    expect(getSitelinkPage("unsold-rooms-tonight")?.datePreset).toBe("tonight");
  });

  it("uses nextWeekend dates for weekend and half-price pages", () => {
    expect(getSitelinkPage("weekend-away")?.datePreset).toBe("nextWeekend");
    expect(getSitelinkPage("half-price-stays")?.datePreset).toBe("nextWeekend");
  });

  it("ships unique meta titles and article sections per sitelink", () => {
    const titles = SITELINK_SLUGS.map((slug) => getSitelinkPage(slug)?.metaTitle);
    expect(new Set(titles).size).toBe(SITELINK_SLUGS.length);
    expect(getSitelinkPage("tonight-stays")?.sections.length).toBeGreaterThan(2);
  });
});
