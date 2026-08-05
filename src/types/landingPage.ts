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
  content: LandingPageContent;
  searchDefaults: LandingPageSearchDefaults;
  seo: LandingPageSeo;
  tracking: LandingPageTracking;
}

export interface LandingPageManifest {
  pages: Record<string, string>;
  generatedAt?: string;
}
