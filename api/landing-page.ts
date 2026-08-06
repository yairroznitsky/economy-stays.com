/**
 * Self-contained Vercel serverless function.
 * Do not import from ../lib — Vercel NFT often fails to bundle those modules.
 */

interface ApiRequest {
  method?: string;
  url?: string;
  query?: { path?: string | string[] };
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
}

type LandingPageHandlerResult = {
  status: number;
  body: Record<string, unknown>;
  cacheControl: string;
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

type RelatedHotelRow = {
  external_id: number;
  name: string;
  city_name: string | null;
  star_rating: number | null;
  rating: number | null;
  reviews: number | null;
};

type LandingPathRef = {
  citySlug: string;
  segmentSlug?: string;
};

const LANDING_PATH_PATTERN = /^\/hotels\/[a-z0-9-]+(\/[a-z0-9-]+)?$/;
const PATH_PARSE_PATTERN = /^\/hotels\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?$/;

const CITY_SELECT =
  "id,slug,name,country,country_code,lat,lng,airport_code,kayak_destination_id,kayak_city_slug";
const INTENT_SELECT =
  "id,slug,label,category,star_rating,amenities,audience";
const HOTEL_SELECT =
  "external_id,name,type,address,latitude,longitude,city_name,country_name,country_code,star_rating,rating,reviews";
const RELATED_HOTEL_SELECT =
  "external_id,name,city_name,star_rating,rating,reviews";
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
const RELATED_HOTELS_LIMIT = 6;

const readEnv = (key: string): string | undefined => {
  const value = process.env[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
};

const readSiteName = (): string =>
  readEnv("VITE_SITE_NAME")?.trim() || "Cheap Stays";

const getSupabaseConfig = (): { url: string; key: string } => {
  const url = readEnv("SUPABASE_URL") ?? readEnv("VITE_SUPABASE_URL");
  const key = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL (or VITE_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return { url, key };
};

const selectRows = async <T>(table: string, query: string): Promise<T[]> => {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(
    `${url}/rest/v1/${encodeURIComponent(table)}?${query}`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Select ${table} failed: ${text || response.statusText || `HTTP ${response.status}`}`
    );
  }
  return (await response.json()) as T[];
};

const truncate = (value: string, max: number): string =>
  value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;

const slugifyName = (value: string): string => {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "hotel";
};

const slugToCityName = (slug: string): string =>
  slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const buildCityPath = (citySlug: string): string => `/hotels/${citySlug}`;

const buildIntentPath = (citySlug: string, intentSlug: string): string =>
  `/hotels/${citySlug}/${intentSlug}`;

const buildHotelPath = (
  cityName: string | null | undefined,
  hotelName: string
): string =>
  `/hotels/${slugifyName(cityName || "city")}/${slugifyName(hotelName)}`;

const normalizeLandingPath = (raw: string): string => {
  let path = raw.trim();
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/+$/, "") || "/";
  return path.toLowerCase();
};

const parseLandingPath = (path: string): LandingPathRef | null => {
  const match = PATH_PARSE_PATTERN.exec(path);
  if (!match) return null;
  return { citySlug: match[1], segmentSlug: match[2] };
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

const buildTemplateContent = (
  city: { name: string; country: string },
  intent: { label: string; slug: string } | null
) => {
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

const defaultSearchDefaults = (cityName: string) => ({
  destinationQuery: cityName,
  nightsOffsetDays: 7,
  stayNights: 2,
  adults: 2,
  rooms: 1,
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
    subtitle: `Compare rates for ${hotel.name}, a ${stars}${type} in ${cityName}, across leading travel sites.`,
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

const mapRelatedHotel = (row: RelatedHotelRow) => ({
  id: String(row.external_id),
  name: row.name,
  path: buildHotelPath(row.city_name, row.name),
  starRating: row.star_rating ?? undefined,
  rating: row.rating ?? undefined,
  reviews: row.reviews ?? undefined,
});

const buildRelatedHotelCityFilters = (
  citySlug: string,
  cityName: string | null | undefined
): string[] => {
  const filters = [`city_slug=eq.${encodeURIComponent(citySlug)}`];
  const names = [cityName, slugToCityName(citySlug)].filter(
    (name, index, all): name is string =>
      Boolean(name) && all.indexOf(name) === index
  );
  for (const name of names) {
    filters.push(`city_name=ilike.${encodeURIComponent(name)}`);
    filters.push(`city_name=ilike.*${encodeURIComponent(name)}*`);
  }
  return filters;
};

const dedupeRelatedHotels = (rows: RelatedHotelRow[]): RelatedHotelRow[] => {
  const bestByPath = new Map<string, RelatedHotelRow>();
  for (const row of rows) {
    const path = buildHotelPath(row.city_name, row.name);
    const existing = bestByPath.get(path);
    if (!existing || (row.reviews ?? 0) > (existing.reviews ?? 0)) {
      bestByPath.set(path, row);
    }
  }
  return [...bestByPath.values()]
    .sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0))
    .slice(0, RELATED_HOTELS_LIMIT);
};

const safeSelectRelatedHotels = async (
  query: string
): Promise<RelatedHotelRow[]> => {
  try {
    return await selectRows<RelatedHotelRow>("staging_hotels", query);
  } catch {
    return [];
  }
};

const fetchRelatedHotels = async (
  citySlug: string,
  cityName: string | null | undefined,
  intent: IntentRow | null
) => {
  const buildQuery = (cityFilter: string): string => {
    const parts = [
      `select=${RELATED_HOTEL_SELECT}`,
      cityFilter,
      "order=reviews.desc.nullslast,external_id.asc",
      "limit=500",
    ];
    if (intent?.star_rating) {
      parts.push(`star_rating=eq.${intent.star_rating}`);
    }
    return parts.join("&");
  };

  let rows: RelatedHotelRow[] = [];
  for (const filter of buildRelatedHotelCityFilters(citySlug, cityName)) {
    if (rows.length > 0) break;
    rows = await safeSelectRelatedHotels(buildQuery(filter));
  }

  return dedupeRelatedHotels(rows).map(mapRelatedHotel);
};

const lookupPublishedPage = async (path: string): Promise<PageRow | null> => {
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

const lookupCityBySlug = async (citySlug: string): Promise<CityRow | null> => {
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

const lookupHotelBySlug = async (
  citySlug: string,
  hotelSlug: string
): Promise<HotelRow | null> => {
  const best = await findHotelInCity(
    `city_slug=eq.${encodeURIComponent(citySlug)}`,
    hotelSlug
  );
  if (best) return best;

  return findHotelInCity(
    `city_name=ilike.${encodeURIComponent(slugToCityName(citySlug))}`,
    hotelSlug
  );
};

const attachRelatedHotels = async (
  body: Record<string, unknown>,
  citySlug: string,
  cityName: string | null | undefined,
  intent: IntentRow | null
): Promise<void> => {
  if (body.hotel) return;
  const relatedHotels = await fetchRelatedHotels(citySlug, cityName, intent);
  if (relatedHotels.length > 0) {
    body.relatedHotels = relatedHotels;
  }
};

const handleLandingPageGet = async (
  rawPath: string | undefined
): Promise<LandingPageHandlerResult> => {
  const path = normalizeLandingPath(rawPath ?? "");
  if (!LANDING_PATH_PATTERN.test(path)) {
    return {
      status: 400,
      body: {
        error: "path must look like /hotels/{city} or /hotels/{city}/{slug}",
      },
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
      await attachRelatedHotels(
        body,
        published.city.slug,
        published.city.name,
        published.intent
      );
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
      const body = buildTemplateConfig(city, null, buildCityPath(city.slug));
      await attachRelatedHotels(body, city.slug, city.name, null);
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
        buildIntentPath(city.slug, intent.slug)
      );
      await attachRelatedHotels(body, city.slug, city.name, intent);
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

const readPathParam = (req: ApiRequest): string | undefined => {
  const raw = req.query?.path;
  if (raw) return Array.isArray(raw) ? raw[0] : raw;
  if (!req.url) return undefined;
  const query = req.url.split("?")[1] ?? "";
  return new URLSearchParams(query).get("path") ?? undefined;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.status(204).end();
      return;
    }

    if (req.method !== "GET") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const result = await handleLandingPageGet(readPathParam(req));
    res.setHeader("Cache-Control", result.cacheControl);
    res.status(result.status).json(result.body);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Landing page lookup failed";
    res.status(500).json({ error: message });
  }
}
