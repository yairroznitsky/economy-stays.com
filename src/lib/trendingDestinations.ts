import { getDestinationHeroImage } from "@/lib/destinationImages";

export type TrendingDestination = {
  /** Card heading */
  title: string;
  /** Card subheading (usually the country) */
  subtitle: string;
  /** Autocomplete query: city segment */
  city: string;
  /** Autocomplete query: region/state segment (optional for international cities) */
  state?: string;
  /** Autocomplete query: country segment (full name) */
  country: string;
  image: string;
  imageAlt: string;
  /** CSS `object-position` so the crop matches the landmark (e.g. skyline vs sign). */
  imageObjectPosition?: string;
  /** Landing-page city slug under /hotels/{slug} */
  slug: string;
};

/** Popular international leisure markets — autocomplete + affiliate `query` use `city, [region,] country`. */
export const TRENDING_DESTINATIONS: readonly TrendingDestination[] = [
  {
    title: "Paris",
    slug: "paris",
    subtitle: "France",
    city: "Paris",
    state: "Île-de-France",
    country: "France",
    image: getDestinationHeroImage("paris"),
    imageAlt: "The Eiffel Tower at sunset above the Trocadéro fountains in Paris",
  },
  {
    title: "London",
    slug: "london",
    subtitle: "United Kingdom",
    city: "London",
    state: "England",
    country: "United Kingdom",
    image: getDestinationHeroImage("london"),
    imageAlt: "Tower Bridge over the River Thames at dusk in London",
  },
  {
    title: "Tokyo",
    slug: "tokyo",
    subtitle: "Japan",
    city: "Tokyo",
    country: "Japan",
    image: getDestinationHeroImage("tokyo"),
    imageAlt: "Tokyo skyline at dusk with the illuminated Tokyo Tower",
  },
  {
    title: "Rome",
    slug: "rome",
    subtitle: "Italy",
    city: "Rome",
    state: "Lazio",
    country: "Italy",
    image: getDestinationHeroImage("rome"),
    imageAlt: "The Colosseum at golden-hour sunset in Rome",
  },
  {
    title: "Barcelona",
    slug: "barcelona",
    subtitle: "Spain",
    city: "Barcelona",
    state: "Catalonia",
    country: "Spain",
    image: getDestinationHeroImage("barcelona"),
    imageAlt: "The Sagrada Família basilica against a clear blue sky in Barcelona",
  },
  {
    title: "Dubai",
    slug: "dubai",
    subtitle: "United Arab Emirates",
    city: "Dubai",
    country: "United Arab Emirates",
    image: getDestinationHeroImage("dubai"),
    imageAlt: "The Dubai skyline with the Burj Khalifa at sunset",
  },
  {
    title: "Sydney",
    slug: "sydney",
    subtitle: "Australia",
    city: "Sydney",
    state: "New South Wales",
    country: "Australia",
    image: getDestinationHeroImage("sydney"),
    imageAlt: "Sydney Opera House and Harbour Bridge across the blue harbour",
  },
  {
    title: "Bangkok",
    slug: "bangkok",
    subtitle: "Thailand",
    city: "Bangkok",
    country: "Thailand",
    image: getDestinationHeroImage("bangkok"),
    imageAlt: "Wat Arun temple glowing at sunset beside the river in Bangkok",
  },
];

export const trendingAutocompleteQuery = (d: TrendingDestination): string =>
  [d.city, d.state, d.country].filter(Boolean).join(", ");
