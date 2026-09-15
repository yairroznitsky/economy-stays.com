import { readSiteName } from "./env";
import { fetchBrowseIntents } from "./browseIntents";
import { fetchCityStats } from "./cityStats";
import {
  buildCityPath,
  buildHotelPath,
  buildIntentPath,
  parseLandingPath,
  slugifyName,
  slugToCityName,
} from "./hotelSlug";
import { fetchRelatedHotels } from "./relatedHotels";
import { buildTemplateContent } from "./templateContent";
import { selectRows } from "./supabaseRest";

/**
 * On-demand landing page config lookup.
 *
 * Lookup order (first hit wins):
 * 1. Published landing_pages with curated content
 * 2. Template city or city×intent pages (every city × active intent)
 * 3. Template hotel pages (slug match against staging_hotels in that city)
 */

const LANDING_PATH_PATTERN = /^\/stay\/[a-z]{2}\/[a-z0-9-]+(\/[a-z0-9-]+)?$/;

export interface LandingPageHandlerResult {
  status: number;
  body: Record<string, unknown>;
  cacheControl: string;
}

type PageRow = {
  id: string;
  path: string;
  noindex: boolean;
  city: CityRow;
  intent: IntentRow | null;
  content: Array<{
    h1: string;
    subtitle: string;
    meta_title: string;
    meta_description: string;
    intro_text: string;
    faqs: Array<{ q: string; a: string }>;
    benefits: Array<{ title: string; text: string }>;
    cta_text: string;
    search_defaults: Record<string, unknown>;
  }>;
};

type CityRow = {
  id: string;
  slug: string;
  name: string;
  country: string;
  country_code: string;
  lat: number;
  lng: number;
  airport_code: string | null;
  kayak_destination_id: string | null;
  kayak_city_slug: string | null;
};

type IntentRow = {
  id: string;
  slug: string;
  label: string;
  category: string;
  star_rating: number | null;
  amenities: string[] | null;
  audience: string | null;
};

type HotelRow = {
  external_id: number;
  name: string;
  type: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  city_name: string | null;
  country_name: string | null;
  country_code: string | null;
  star_rating: number | null;
  rating: number | null;
  reviews: number | null;
};

const CITY_SELECT =
  "id,slug,name,country,country_code,lat,lng,airport_code,kayak_destination_id,kayak_city_slug";

const INTENT_SELECT =
  "id,slug,label,category,star_rating,amenities,audience";

const HOTEL_SELECT =
  "external_id,name,type,address,latitude,longitude,city_name,country_name,country_code,star_rating,rating,reviews";

const PAGE_SELECT = [
  "id",
  "path",
  "noindex",
  `city:cities(${CITY_SELECT})`,
  `intent:landing_page_intents(${INTENT_SELECT})`,
  "content:landing_page_content!inner(h1,subtitle,meta_title,meta_description,intro_text,faqs,benefits,cta_text,search_defaults)",
].join(",");

const HIT_CACHE = "public, s-maxage=3600, stale-while-revalidate=86400";
const MISS_CACHE = "public, s-maxage=300";
const NO_CACHE = "no-store";
const HOTEL_PAGE_SIZE = 1000;

export const normalizeLandingPath = (raw: string): string => {
  let path = raw.trim();
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/+$/, "") || "/";
  return path.toLowerCase();
};

const mapCity = (city: CityRow) => ({
  id: city.id,
  slug: city.slug,
  name: city.name,
  country: city.country,
  countryCode: city.country_code,
  lat: city.lat,
  lng: city.lng,
  airportCode: city.airport_code ?? undefined,
  kayakDestinationId: city.kayak_destination_id ?? undefined,
  kayakCitySlug: city.kayak_city_slug ?? undefined,
});

const buildConfig = (page: PageRow): Record<string, unknown> => {
  const content = page.content[0];
  return {
    id: page.id,
    path: page.path,
    city: mapCity(page.city),
    intent: page.intent
      ? {
          id: page.intent.id,
          slug: page.intent.slug,
          label: page.intent.label,
          category: page.intent.category,
          starRating: page.intent.star_rating ?? undefined,
          amenities: page.intent.amenities ?? undefined,
          audience: page.intent.audience ?? undefined,
        }
      : undefined,
    content: {
      h1: content.h1,
      subtitle: content.subtitle,
      metaTitle: content.meta_title,
      metaDescription: content.meta_description,
      introText: content.intro_text,
      faqs: content.faqs,
      benefits: content.benefits,
      ctaText: content.cta_text,
    },
    searchDefaults: content.search_defaults,
    seo: {
      noindex: page.noindex,
      canonical: page.path,
    },
    tracking: {
      landingPageId: page.id,
      cityId: page.city.id,
      intentId: page.intent?.id,
    },
  };
};

const truncate = (value: string, max: number): string =>
  value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;

const defaultSearchDefaults = (cityName: string) => ({
  destinationQuery: cityName,
  nightsOffsetDays: 7,
  stayNights: 2,
  adults: 2,
  rooms: 1,
});

const buildTemplateConfig = (
  city: CityRow,
  intent: IntentRow | null,
  path: string
): Record<string, unknown> => {
  const content = buildTemplateContent(
    { name: city.name, country: city.country },
    intent ? { slug: intent.slug, label: intent.label } : null
  );
  const id = intent ? `tpl-${city.slug}-${intent.slug}` : `tpl-${city.slug}`;

  return {
    id,
    path,
    city: mapCity(city),
    intent: intent
      ? {
          id: intent.id,
          slug: intent.slug,
          label: intent.label,
          category: intent.category,
          starRating: intent.star_rating ?? undefined,
          amenities: intent.amenities ?? undefined,
          audience: intent.audience ?? undefined,
        }
      : undefined,
    content: {
      h1: content.h1,
      subtitle: content.subtitle,
      metaTitle: content.metaTitle,
      metaDescription: content.metaDescription,
      introText: content.introText,
      faqs: content.faqs,
      benefits: content.benefits,
      ctaText: content.ctaText,
    },
    searchDefaults: defaultSearchDefaults(city.name),
    seo: {
      noindex: true,
      canonical: path,
    },
    tracking: {
      landingPageId: id,
      cityId: city.id,
      intentId: intent?.id,
    },
  };
};

const buildHotelContent = (
  hotel: HotelRow,
  cityName: string,
  country: string
) => {
  const brand = readSiteName();
  const stars = hotel.star_rating ? `${hotel.star_rating}-star ` : "";
  const type = (hotel.type ?? "hotel").toLowerCase();
  const location = country ? `${cityName}, ${country}` : cityName;
  const ratingSentence =
    hotel.rating && hotel.reviews
      ? ` Guests rate it ${hotel.rating}/10 across ${hotel.reviews} reviews.`
      : "";

  return {
    h1: hotel.name,
    subtitle: "Compare rates across leading travel sites.",
    metaTitle: truncate(`${hotel.name} | ${cityName} | ${brand}`, 70),
    metaDescription: truncate(
      `Compare room rates for ${hotel.name} in ${location}.${ratingSentence} Check availability for your dates and book with a trusted travel partner.`,
      160
    ),
    introText: [
      `${hotel.name} is a ${stars}${type} in ${location}${
        hotel.address ? `, located at ${hotel.address}` : ""
      }.${ratingSentence}`,
      `Use the search above to check availability at ${hotel.name} for your dates, compare rates across booking sites, and continue to a trusted partner to complete your reservation.`,
    ].join("\n\n"),
    faqs: [
      {
        q: truncate(`Where is ${hotel.name} located?`, 140),
        a: `${hotel.name} is in ${location}${
          hotel.address ? `, at ${hotel.address}` : ""
        }. Use the map and details on partner booking sites to confirm the exact location before you reserve.`,
      },
      {
        q: "How do I compare rates for this hotel?",
        a: "Pick your check-in and check-out dates, set guests and rooms, then search to see rates from established travel partners for your stay.",
      },
      {
        q: "Do I complete my booking on this site?",
        a: "No. We help you compare options across partner travel sites. When you are ready, you continue to the partner site to finish your reservation.",
      },
    ],
    benefits: [
      {
        title: "Compare multiple sites",
        text: "See rates for this property from trusted travel partners in one search.",
      },
      {
        title: "Search by your dates",
        text: "Adjust check-in, check-out, guests, and rooms to match your trip.",
      },
      {
        title: "Book with partners you know",
        text: "Continue to established booking sites to complete your reservation.",
      },
    ],
    ctaText: truncate(`Check rates at ${hotel.name}`, 90),
  };
};

const buildHotelConfig = (
  hotel: HotelRow,
  cityRow: CityRow | null
): Record<string, unknown> => {
  const cityName = cityRow?.name ?? hotel.city_name ?? "your destination";
  const country = cityRow?.country ?? hotel.country_name ?? "";
  const citySlug = cityRow?.slug ?? slugifyName(hotel.city_name ?? "city");
  const canonical = buildHotelPath(hotel.city_name, hotel.name);
  const id = `hotel-${hotel.external_id}`;

  return {
    id,
    path: canonical,
    city: cityRow
      ? mapCity(cityRow)
      : {
          id: `city-${citySlug}`,
          slug: citySlug,
          name: cityName,
          country,
          countryCode: hotel.country_code ?? "",
          lat: hotel.latitude ?? 0,
          lng: hotel.longitude ?? 0,
        },
    hotel: {
      id: String(hotel.external_id),
      name: hotel.name,
      type: hotel.type ?? undefined,
      address: hotel.address ?? undefined,
      starRating: hotel.star_rating ?? undefined,
      rating: hotel.rating ?? undefined,
      reviews: hotel.reviews ?? undefined,
      latitude: hotel.latitude ?? undefined,
      longitude: hotel.longitude ?? undefined,
    },
    content: buildHotelContent(hotel, cityName, country),
    searchDefaults: {
      destinationQuery: hotel.name,
      nightsOffsetDays: 7,
      stayNights: 2,
      adults: 2,
      rooms: 1,
    },
    seo: {
      noindex: false,
      canonical,
    },
    tracking: {
      landingPageId: id,
      cityId: cityRow?.id ?? citySlug,
    },
  };
};

const lookupPublishedPage = async (
  path: string
): Promise<PageRow | null> => {
  const rows = await selectRows<PageRow>(
    "landing_pages",
    `select=${PAGE_SELECT}` +
      `&path=eq.${encodeURIComponent(path)}` +
      "&status=eq.published" +
      "&content.is_current=eq.true" +
      "&limit=1"
  );
  const page = rows[0];
  if (!page || page.content.length === 0) return null;
  return page;
};

const lookupCityBySlug = async (
  citySlug: string
): Promise<CityRow | null> => {
  const rows = await selectRows<CityRow>(
    "cities",
    `select=${CITY_SELECT}&slug=eq.${encodeURIComponent(citySlug)}&limit=1`
  );
  return rows[0] ?? null;
};

const lookupIntentBySlug = async (
  intentSlug: string
): Promise<IntentRow | null> => {
  const rows = await selectRows<IntentRow>(
    "landing_page_intents",
    `select=${INTENT_SELECT}&slug=eq.${encodeURIComponent(intentSlug)}&active=eq.true&limit=1`
  );
  return rows[0] ?? null;
};

/** Slugify hotel names in JS; on collision keep the most-reviewed property. */
const lookupHotelBySlug = async (
  citySlug: string,
  hotelSlug: string
): Promise<HotelRow | null> => {
  let best = await findHotelInCity(`city_slug=eq.${encodeURIComponent(citySlug)}`, hotelSlug);
  if (best) return best;

  // Until city_slug is backfilled, fall back to a city_name guess.
  return findHotelInCity(
    `city_name=ilike.${encodeURIComponent(slugToCityName(citySlug))}`,
    hotelSlug
  );
};

const findHotelInCity = async (
  cityFilter: string,
  hotelSlug: string
): Promise<HotelRow | null> => {
  let best: HotelRow | null = null;
  let offset = 0;

  for (;;) {
    const query =
      `select=${HOTEL_SELECT}&limit=${HOTEL_PAGE_SIZE}&offset=${offset}` +
      `&${cityFilter}` +
      "&order=reviews.desc.nullslast,external_id.asc";

    const rows = await selectRows<HotelRow>("staging_hotels", query);
    if (rows.length === 0) break;

    for (const row of rows) {
      if (slugifyName(row.name) !== hotelSlug) continue;
      if (!best || (row.reviews ?? 0) > (best.reviews ?? 0)) {
        best = row;
      }
    }

    if (rows.length < HOTEL_PAGE_SIZE) break;
    offset += rows.length;
  }

  return best;
};

const attachCityPageExtras = async (
  body: Record<string, unknown>,
  city: CityRow,
  intent: IntentRow | null,
  countryCode: string
): Promise<void> => {
  if (body.hotel) return;

  const [relatedHotels, cityStats, browseIntents] = await Promise.all([
    fetchRelatedHotels(city.slug, city.name, intent),
    fetchCityStats(city.slug, city.name, city.airport_code),
    intent ? Promise.resolve([]) : fetchBrowseIntents(countryCode, city.slug),
  ]);

  if (relatedHotels.length > 0) {
    body.relatedHotels = relatedHotels;
  }
  if (cityStats) {
    body.cityStats = cityStats;
  }
  if (browseIntents.length > 0) {
    body.browseIntents = browseIntents;
  }

  // Enrich on-demand template copy only; leave curated published content as-is.
  if (cityStats && String(body.id).startsWith("tpl-")) {
    const content = buildTemplateContent(
      { name: city.name, country: city.country },
      intent ? { slug: intent.slug, label: intent.label } : null,
      { stats: cityStats }
    );
    body.content = {
      h1: content.h1,
      subtitle: content.subtitle,
      metaTitle: content.metaTitle,
      metaDescription: content.metaDescription,
      introText: content.introText,
      faqs: content.faqs,
      benefits: content.benefits,
      ctaText: content.ctaText,
    };
  }
};

export const handleLandingPageGet = async (
  rawPath: string | undefined
): Promise<LandingPageHandlerResult> => {
  const path = normalizeLandingPath(rawPath ?? "");
  if (!LANDING_PATH_PATTERN.test(path)) {
    return {
      status: 400,
      body: { error: "path must look like /stay/{cc}/{city} or /stay/{cc}/{city}/{theme}" },
      cacheControl: NO_CACHE,
    };
  }

  const pathRef = parseLandingPath(path);
  if (!pathRef) {
    return {
      status: 400,
      body: { error: "Invalid landing page path" },
      cacheControl: NO_CACHE,
    };
  }

  try {
    const published = await lookupPublishedPage(path);
    if (published) {
      const body = buildConfig(published);
      await attachCityPageExtras(body, published.city, published.intent, pathRef.countryCode);
      return {
        status: 200,
        body,
        cacheControl: HIT_CACHE,
      };
    }

    const city = await lookupCityBySlug(pathRef.citySlug);

    if (!pathRef.segmentSlug) {
      if (!city) {
        return {
          status: 404,
          body: { error: "Landing page not found" },
          cacheControl: MISS_CACHE,
        };
      }
      const body = buildTemplateConfig(city, null, buildCityPath(pathRef.countryCode, city.slug));
      await attachCityPageExtras(body, city, null, pathRef.countryCode);
      return {
        status: 200,
        body,
        cacheControl: HIT_CACHE,
      };
    }

    const intent = await lookupIntentBySlug(pathRef.segmentSlug);
    if (intent && city) {
      const body = buildTemplateConfig(
        city,
        intent,
        buildIntentPath(pathRef.countryCode, city.slug, intent.slug)
      );
      await attachCityPageExtras(body, city, intent, pathRef.countryCode);
      return {
        status: 200,
        body,
        cacheControl: HIT_CACHE,
      };
    }

    const hotel = await lookupHotelBySlug(
      pathRef.citySlug,
      pathRef.segmentSlug
    );
    if (hotel) {
      return {
        status: 200,
        body: buildHotelConfig(hotel, city),
        cacheControl: HIT_CACHE,
      };
    }

    return {
      status: 404,
      body: { error: "Landing page not found" },
      cacheControl: MISS_CACHE,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Landing page lookup failed";
    return { status: 500, body: { error: message }, cacheControl: NO_CACHE };
  }
};
