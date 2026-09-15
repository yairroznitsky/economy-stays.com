/**
 * Placeholder landing page copy for city and city×intent URLs.
 * Shared by the API handler (on-demand) and content-generation scripts.
 */

import {
  formatHotelCountLabel,
  type LandingCityStats,
} from "./cityStats";
import { readSiteName } from "./env";

export interface TemplateContent {
  h1: string;
  subtitle: string;
  metaTitle: string;
  metaDescription: string;
  introText: string;
  faqs: Array<{ q: string; a: string }>;
  benefits: Array<{ title: string; text: string }>;
  ctaText: string;
}

type TemplateCity = {
  name: string;
  country: string;
};

type TemplateIntent = {
  label: string;
  slug: string;
};

export type TemplateContentOptions = {
  stats?: LandingCityStats | null;
};

const truncate = (value: string, max: number): string =>
  value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;

const inventorySentence = (
  cityName: string,
  stats: LandingCityStats | null | undefined
): string | null => {
  if (!stats || stats.hotelCount <= 0) return null;
  const countLabel = formatHotelCountLabel(stats);
  const ratingBit =
    stats.avgRating != null
      ? ` with an average guest rating around ${stats.avgRating}/10`
      : "";
  const starBit =
    stats.dominantStarRating != null
      ? ` Many listed stays are ${stats.dominantStarRating}-star properties.`
      : "";
  return `Our catalog currently includes ${countLabel} in ${cityName}${ratingBit}.${starBit}`;
};

const genericFaqs = (
  cityName: string,
  stats?: LandingCityStats | null
) => {
  const inventory = inventorySentence(cityName, stats);
  return [
    {
      q: `How does ${readSiteName()} help me find a hotel in ${cityName}?`,
      a: inventory
        ? `${inventory} Enter your dates, destination and guest count to browse hotel options from established travel partners. When you find a stay you like, continue to the partner site to book.`
        : "Enter your dates, destination and guest count to browse hotel options from established travel partners. When you find a stay you like, continue to the partner site to book.",
    },
    {
      q: "Do I book directly on this site?",
      a: "No. Economy Stays helps you browse and compare accommodation options. When you're ready to reserve, you're taken to a trusted booking partner to complete your stay.",
    },
    {
      q: "Can I filter by star rating or property type?",
      a: "Yes. Use the browse panel to filter results by star rating, property type and guest score before comparing rates on partner sites.",
    },
  ];
};

const genericBenefits = () => [
  {
    title: "Browse by what matters",
    text: "Filter accommodation by star rating, property type and guest score in one place.",
  },
  {
    title: "Set your exact dates",
    text: "Adjust check-in, check-out, number of guests and rooms to match your itinerary.",
  },
  {
    title: "Book with names you know",
    text: "When you find the right stay, continue to an established booking partner to complete your reservation.",
  },
];

export const buildTemplateContent = (
  city: TemplateCity,
  intent: TemplateIntent | null,
  options?: TemplateContentOptions
): TemplateContent => {
  const brand = readSiteName();
  const intentPhrase = intent ? intent.label.toLowerCase() : "hotel";
  const stats = options?.stats ?? null;
  const inventory = inventorySentence(city.name, stats);

  const h1 = intent
    ? `${intent.label} in ${city.name}`
    : `Hotels in ${city.name}`;

  // Keep hero subtitle short — do not inject inventory facts here.
  const subtitle = intent
    ? `Compare ${intentPhrase} rates across travel sites for your ${city.name} trip.`
    : `Search hotel rates in ${city.name}, ${city.country} across leading travel sites and pick the stay that fits your trip.`;

  const metaTitle = truncate(
    intent
      ? `${intent.label} in ${city.name} | Compare Rates | ${brand}`
      : `Hotels in ${city.name} | Compare Rates | ${brand}`,
    70
  );

  const metaDescription = truncate(
    intent
      ? `Compare ${intentPhrase} in ${city.name}, ${city.country} across leading travel sites. Search by dates and guests to find a stay that fits your trip.`
      : `Compare hotel rates in ${city.name}, ${city.country} across leading travel sites. Search by dates and guests to find a stay that fits your trip.`,
    160
  );

  const introText = intent
    ? [
        `Searching for ${intentPhrase} in ${city.name}? Browsing across multiple booking sites lets you compare property styles, locations and availability for your exact dates before you commit.`,
        inventory,
        `Set your check-in and check-out dates above to browse ${intentPhrase} in ${city.name}, then head to a partner site when you're ready to reserve.`,
      ]
        .filter(Boolean)
        .join("\n\n")
    : [
        `${city.name} draws visitors year-round, and finding the right place to stay means weighing location, style and availability together. Browsing across multiple booking sites gives you a clearer picture before you commit.`,
        inventory,
        `Use the search above to explore hotel options in ${city.name} and continue to a trusted booking partner when you've found the stay that fits your trip.`,
      ]
        .filter(Boolean)
        .join("\n\n");

  const ctaText = intent
    ? `Compare ${intentPhrase} in ${city.name}`
    : `Compare hotel rates in ${city.name}`;

  return {
    h1,
    subtitle,
    metaTitle,
    metaDescription,
    introText,
    faqs: genericFaqs(city.name, stats),
    benefits: genericBenefits(),
    ctaText,
  };
};
