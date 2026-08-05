/**
 * Placeholder landing page copy for city and city×intent URLs.
 * Shared by the API handler (on-demand) and content-generation scripts.
 */

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

const truncate = (value: string, max: number): string =>
  value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;

const genericFaqs = (cityName: string) => [
  {
    q: `How does ${readSiteName()} help me compare hotels in ${cityName}?`,
    a: "Enter your destination, dates, and guests to see hotel options from established travel partners. You can adjust your search before continuing to a partner site to book.",
  },
  {
    q: "Do I complete my booking on this site?",
    a: "No. We help you compare options across partner travel sites. When you are ready, you continue to the partner site to finish your reservation.",
  },
  {
    q: "Can I change dates and guest counts before I search?",
    a: "Yes. Update check-in, check-out, adults, children, and rooms in the search form to match your trip before comparing hotel options.",
  },
];

const genericBenefits = () => [
  {
    title: "Compare multiple sites",
    text: "See hotel options from trusted travel partners in one search.",
  },
  {
    title: "Search by your dates",
    text: "Adjust check-in, check-out, guests, and rooms to match your trip.",
  },
  {
    title: "Book with partners you know",
    text: "Continue to established booking sites to complete your reservation.",
  },
];

export const buildTemplateContent = (
  city: TemplateCity,
  intent: TemplateIntent | null
): TemplateContent => {
  const brand = readSiteName();
  const intentPhrase = intent ? intent.label.toLowerCase() : "hotel";

  const h1 = intent
    ? `${intent.label} in ${city.name}`
    : `Hotels in ${city.name}`;

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
        `Looking for ${intentPhrase} in ${city.name}? Comparing rates across multiple booking sites can help you find options that fit your plans while keeping your preferred dates and guest count in mind.`,
        `Use the search above to compare ${intentPhrase} for your travel dates, then continue to a partner site when you are ready to book.`,
      ].join("\n\n")
    : [
        `${city.name} is a popular destination for travelers comparing hotel options before they book. Searching across multiple travel sites can help you review locations, amenities, and availability for your dates.`,
        `Start with the search above to compare hotel rates in ${city.name}, then continue to a partner booking site to complete your reservation.`,
      ].join("\n\n");

  const ctaText = intent
    ? `Compare ${intentPhrase} in ${city.name}`
    : `Compare hotel rates in ${city.name}`;

  return {
    h1,
    subtitle,
    metaTitle,
    metaDescription,
    introText,
    faqs: genericFaqs(city.name),
    benefits: genericBenefits(),
    ctaText,
  };
};
