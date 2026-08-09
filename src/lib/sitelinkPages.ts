/** Google Ads sitelink landing pages — superficial promo surfaces at /{slug}. */

export type SitelinkPageConfig = {
  slug: string;
  /** Sitelink link text / H1 */
  title: string;
  /** Sitelink description line 1 — hero subtitle */
  description1: string;
  /** Sitelink description line 2 — body lead */
  description2: string;
};

export const SITELINK_PAGES: readonly SitelinkPageConfig[] = [
  {
    slug: "last-minute-hotel-deals",
    title: "Last Minute Hotel Deals",
    description1: "Find last minute hotel deals",
    description2: "Compare available rates today",
  },
  {
    slug: "unsold-room-deals",
    title: "Unsold Room Deals",
    description1: "Search unsold hotel rooms",
    description2: "Find deals for your next stay",
  },
  {
    slug: "hotels-under-100",
    title: "Hotels Under $100",
    description1: "Find affordable hotel stays",
    description2: "Compare deals for your trip",
  },
  {
    slug: "60-off-hotel-deals",
    title: "60% Off Hotel Deals",
    description1: "Find discounted hotel rates",
    description2: "Search & compare hotel deals",
  },
  {
    slug: "cheap-hotels-near-you",
    title: "Cheap Hotels Near You",
    description1: "Find hotel deals near you",
    description2: "Compare prices in seconds",
  },
  {
    slug: "weekend-hotel-deals",
    title: "Weekend Hotel Deals",
    description1: "Save on your weekend stay",
    description2: "Compare hotels before you book",
  },
] as const;

export const SITELINK_SLUGS = SITELINK_PAGES.map((page) => page.slug);

export const getSitelinkPage = (slug: string): SitelinkPageConfig | undefined =>
  SITELINK_PAGES.find((page) => page.slug === slug);
