export interface LandingPageFaq {
  q: string;
  a: string;
}

export interface LandingPageBenefit {
  title: string;
  text: string;
}

export interface LandingPageCity {
  id: string;
  slug: string;
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  airportCode?: string;
  kayakDestinationId?: string;
  kayakCitySlug?: string;
}

export interface LandingPageIntent {
  id: string;
  slug: string;
  label: string;
  category: string;
  starRating?: number;
  amenities?: string[];
  audience?: string;
}

export interface LandingPageHotel {
  id: string;
  name: string;
  type?: string;
  address?: string;
  starRating?: number;
  rating?: number;
  reviews?: number;
  latitude?: number;
  longitude?: number;
}

export interface LandingPageRelatedHotel {
  id: string;
  name: string;
  path: string;
  type?: string;
  starRating?: number;
  rating?: number;
  reviews?: number;
}

export interface LandingPageCityStats {
  hotelCount: number;
  hotelCountCapped: boolean;
  avgRating?: number;
  dominantStarRating?: number;
  topTypes: string[];
  airportCode?: string;
}

export interface LandingPageBrowseIntent {
  slug: string;
  label: string;
  path: string;
}

export interface LandingPageContent {
  h1: string;
  subtitle: string;
  metaTitle: string;
  metaDescription: string;
  introText: string;
  faqs: LandingPageFaq[];
  benefits: LandingPageBenefit[];
  ctaText: string;
}

export interface LandingPageSearchDefaults {
  destinationQuery: string;
  nightsOffsetDays: number;
  stayNights: number;
  adults: number;
  rooms: number;
}

export interface LandingPageSeo {
  noindex: boolean;
  canonical: string;
}

export interface LandingPageTracking {
  landingPageId: string;
  cityId: string;
  intentId?: string;
}

export interface LandingPageConfig {
  id: string;
  path: string;
  city: LandingPageCity;
  intent?: LandingPageIntent;
  /** Present on per-hotel pages resolved from the hotels catalog. */
  hotel?: LandingPageHotel;
  /** Top hotels in the city — city and intent pages only. */
  relatedHotels?: LandingPageRelatedHotel[];
  /** Inventory snapshot from staging_hotels — city and intent pages only. */
  cityStats?: LandingPageCityStats;
  /** Active intent links — base city pages only. */
  browseIntents?: LandingPageBrowseIntent[];
  content: LandingPageContent;
  searchDefaults: LandingPageSearchDefaults;
  seo: LandingPageSeo;
  tracking: LandingPageTracking;
}

