import { normalizeLandingPath } from "@/lib/landingPages";
import type { LandingPageConfig } from "@/types/landingPage";

const slugToLabel = (slug: string): string =>
  slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

/** Intent slugs use predictable patterns; everything else is treated as a hotel name. */
const isLikelyIntentSlug = (slug: string): boolean =>
  /hotels|star|near-|budget|family|luxury|boutique|pet-|spa-|beach|airport|downtown|waterfront/i.test(
    slug
  );

const genericFaqs = (cityName: string) => [
  {
    q: `How does Cheap Stays help me compare hotels in ${cityName}?`,
    a: "Enter your destination, dates, and guests to see hotel options from established travel partners. You can adjust your search before continuing to a partner site to book.",
  },
  {
    q: "Do I complete my booking on this site?",
    a: "No. We help you compare options across partner travel sites. When you are ready, you continue to the partner site to finish your reservation.",
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

/**
 * Synchronous shell config from URL slugs — renders immediately while the API
 * loads the full page config (same pattern as Next.js loading.tsx + streaming).
 */
export const buildPlaceholderConfig = (
  pathname: string,
  citySlug: string,
  segmentSlug?: string
): LandingPageConfig => {
  const path = normalizeLandingPath(pathname);
  const cityName = slugToLabel(citySlug);
  const segment = segmentSlug?.trim().toLowerCase();
  const segmentLabel = segment ? slugToLabel(segment) : null;
  const isHotel = Boolean(segment && !isLikelyIntentSlug(segment));

  const h1 = !segmentLabel
    ? `Hotels in ${cityName}`
    : isHotel
      ? segmentLabel
      : `${segmentLabel} in ${cityName}`;

  const subtitle = isHotel
    ? `Compare rates for ${segmentLabel} in ${cityName} across leading travel sites.`
    : segmentLabel
      ? `Compare ${segmentLabel.toLowerCase()} rates across travel sites for your ${cityName} trip.`
      : `Search hotel rates in ${cityName} across leading travel sites and pick the stay that fits your trip.`;

  return {
    id: `placeholder:${path}`,
    path,
    city: {
      id: `placeholder:${citySlug}`,
      slug: citySlug.toLowerCase(),
      name: cityName,
      country: "",
      countryCode: "",
      lat: 0,
      lng: 0,
    },
    hotel: isHotel && segmentLabel
      ? { id: "placeholder", name: segmentLabel }
      : undefined,
    intent:
      segment && !isHotel && segmentLabel
        ? {
            id: "placeholder",
            slug: segment,
            label: segmentLabel,
            category: "price",
          }
        : undefined,
    content: {
      h1,
      subtitle,
      metaTitle: h1,
      metaDescription: subtitle,
      introText: subtitle,
      faqs: genericFaqs(cityName),
      benefits: genericBenefits(),
      ctaText: isHotel
        ? `Check rates at ${segmentLabel}`
        : `Compare hotel rates in ${cityName}`,
    },
    searchDefaults: {
      destinationQuery: isHotel && segmentLabel ? segmentLabel : cityName,
      nightsOffsetDays: 7,
      stayNights: 2,
      adults: 2,
      rooms: 1,
    },
    seo: {
      noindex: true,
      canonical: path,
    },
    tracking: {
      landingPageId: `placeholder:${path}`,
      cityId: citySlug,
    },
  };
};
