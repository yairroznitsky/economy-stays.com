import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Link, Navigate } from "react-router-dom";
import heroImage from "@/assets/hero-hotel.jpg";
import Header from "@/components/Header";
import SearchForm from "@/components/SearchForm";
import SiteFooter from "@/components/SiteFooter";
import TrendingDestinations from "@/components/TrendingDestinations";
import Benefits from "@/components/landing/Benefits";
import FAQ from "@/components/landing/FAQ";
import SitelinkArticle from "@/components/sitelink/SitelinkArticle";
import SitelinkBreadcrumbs from "@/components/sitelink/SitelinkBreadcrumbs";
import SitelinkJsonLd from "@/components/sitelink/SitelinkJsonLd";
import NearbyHotels from "@/components/sitelink/NearbyHotels";
import { LandingLocaleProvider } from "@/i18n/landing";
import { getSitelinkBrowseLinks } from "@/lib/sitelinkBrowse";
import {
  getSitelinkStayDateStrings,
  getSitelinkStayDefaults,
} from "@/lib/sitelinkDates";
import { getSitelinkPage } from "@/lib/sitelinkPages";
import {
  canonicalOriginFromDomain,
  sitelinkMarkdownUrl,
  sitelinkPageUrl,
} from "@/lib/sitelinkSeo";
import { siteConfig } from "@/lib/siteConfig";
import { useNearbyLocation } from "@/hooks/useNearbyLocation";

type SitelinkPageProps = {
  slug: string;
};

const upsertMeta = (
  attr: "name" | "property",
  key: string,
  content: string
) => {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`
  );
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.content = content;
};

const upsertLink = (rel: string, href: string, type?: string) => {
  const selector = type
    ? `link[rel="${rel}"][type="${type}"]`
    : `link[rel="${rel}"]`;
  let element = document.head.querySelector<HTMLLinkElement>(selector);
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    if (type) element.type = type;
    document.head.appendChild(element);
  }
  element.href = href;
};

const NEAR_YOU_SLUG = "cheap-hotels-near-you";

const SitelinkPageContent = ({ slug }: SitelinkPageProps) => {
  const page = getSitelinkPage(slug);
  const isNearYouPage = slug === NEAR_YOU_SLUG;
  const origin = canonicalOriginFromDomain(siteConfig.domain);

  const [defaultsVersion, setDefaultsVersion] = useState(0);
  const [geoCity, setGeoCity] = useState<{
    name: string;
    country: string;
    kayakDestinationId: string | null;
    lat: number;
    lng: number;
  } | null>(null);

  const stayDefaults = useMemo(
    () => (page ? getSitelinkStayDefaults(page.datePreset) : null),
    [page]
  );
  const stayDates = useMemo(
    () => (page ? getSitelinkStayDateStrings(page.datePreset) : null),
    [page]
  );
  const browseLinks = useMemo(
    () => (page ? getSitelinkBrowseLinks(page) : []),
    [page]
  );

  const { data: nearbyData } = useNearbyLocation({ enabled: isNearYouPage });

  const geoCitySlug = nearbyData?.nearest?.slug;
  const prevGeoCitySlugRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const nearest = nearbyData?.nearest;
    if (!nearest || nearest.slug === prevGeoCitySlugRef.current) return;
    prevGeoCitySlugRef.current = nearest.slug;
    setGeoCity({
      name: nearest.name,
      country: nearest.country,
      kayakDestinationId: nearest.kayakDestinationId,
      lat: nearest.lat,
      lng: nearest.lng,
    });
    setDefaultsVersion((v) => v + 1);
  }, [geoCitySlug, nearbyData?.nearest]);

  const searchFormDefaults = useMemo(
    () =>
      stayDefaults
        ? {
            nightsOffsetDays: stayDefaults.nightsOffsetDays,
            stayNights: stayDefaults.stayNights,
            lockDestination: Boolean(geoCity && isNearYouPage),
            ...(geoCity && isNearYouPage
              ? {
                  cityName: geoCity.name,
                  countryName: geoCity.country,
                  kayakDestinationId: geoCity.kayakDestinationId ?? undefined,
                  latitude: geoCity.lat,
                  longitude: geoCity.lng,
                }
              : {}),
            defaultsVersion,
          }
        : undefined,
    [stayDefaults, geoCity, isNearYouPage, defaultsVersion]
  );

  useEffect(() => {
    if (!page) return;

    const canonical = sitelinkPageUrl(origin, page.slug);
    const markdown = sitelinkMarkdownUrl(origin, page.slug);

    document.title = page.metaTitle;
    document.documentElement.lang = "en";
    upsertMeta("name", "description", page.metaDescription);
    upsertMeta("name", "robots", "index,follow,max-image-preview:large,max-snippet:-1");
    upsertMeta("name", "author", siteConfig.operator);
    upsertMeta("property", "og:title", page.metaTitle);
    upsertMeta("property", "og:description", page.metaDescription);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:type", "article");
    upsertMeta("property", "og:site_name", siteConfig.name);
    upsertMeta("property", "article:published_time", page.datePublished);
    upsertMeta("property", "article:modified_time", page.dateModified);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", page.metaTitle);
    upsertMeta("name", "twitter:description", page.metaDescription);
    upsertLink("canonical", canonical);
    upsertLink("alternate", markdown, "text/markdown");

    return () => {
      document.title = siteConfig.name;
    };
  }, [origin, page]);

  if (!page || !stayDefaults || !stayDates || !searchFormDefaults) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <SitelinkJsonLd page={page} origin={origin} />
      <section
        className={cn(
          "relative min-h-[88svh] w-full md:min-h-[720px]",
          isNearYouPage && "z-20 overflow-visible"
        )}
      >
        {/* Clip background only — section stays overflow-visible for autocomplete on near-you */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={heroImage}
            alt={page.heroImageAlt}
            width={1920}
            height={1280}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full min-h-full w-full min-w-full object-cover object-center motion-safe:animate-hero-ken"
          />
          <div className="absolute inset-0 bg-gradient-hero" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/30" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-[12%] bottom-[22%] bg-[radial-gradient(ellipse_at_center,hsl(215_45%_6%/0.42)_0%,transparent_68%)]"
          />
        </div>

        <Header />

        <div className="container relative z-10 flex min-h-[88svh] flex-col items-center pt-24 pb-10 text-center md:min-h-[720px] md:pt-28 md:pb-14">
          <div className="flex w-full flex-1 flex-col items-center justify-center opacity-0 motion-safe:animate-hero-rise motion-reduce:opacity-100">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-accent md:text-xs">
              {siteConfig.name}
            </p>
            <h1 className="mt-3 max-w-3xl font-display text-2xl font-bold leading-[1.15] text-white drop-shadow-md md:mt-4 md:text-5xl md:leading-[1.1]">
              {page.title}
            </h1>
            <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-white/85 md:mt-4 md:text-lg">
              {page.description1}
            </p>
            {isNearYouPage ? (
              <p className="mt-2 text-sm font-medium tracking-wide text-white/70 md:text-base">
                {page.description2}
              </p>
            ) : null}
          </div>
          <div
            className={cn(
              "mt-6 w-full max-w-5xl shrink-0 opacity-0 motion-safe:animate-hero-rise motion-safe:[animation-delay:140ms] motion-reduce:opacity-100 desktop:mt-8 desktop:max-w-[73.6rem]",
              isNearYouPage && "relative z-50"
            )}
          >
            <SearchForm
              defaults={searchFormDefaults}
              trackingContext={{
                surface: `sitelink_${page.slug}`,
              }}
            />
            {!isNearYouPage ? (
              <p className="mt-3 text-sm text-white/80">{page.dateHint}</p>
            ) : null}
          </div>
        </div>
      </section>

      {isNearYouPage ? (
        <NearbyHotels
          hotels={nearbyData?.hotels ?? []}
          nearestCity={nearbyData?.nearest}
          checkIn={stayDates.checkIn}
          checkOut={stayDates.checkOut}
          surface={`sitelink_${page.slug}_nearby`}
          geoSource={nearbyData?.source ?? "none"}
        />
      ) : (
        <>
          <SitelinkBreadcrumbs page={page} />
          <SitelinkArticle page={page} />
          <Benefits benefits={page.benefits} />
          <TrendingDestinations
            title={page.destinationsTitle}
            subtitle={page.destinationsSubtitle}
            checkIn={stayDates.checkIn}
            checkOut={stayDates.checkOut}
            surface={`sitelink_${page.slug}_destinations`}
          />
          <section className="border-b border-border bg-muted/20 py-12 md:py-14">
            <div className="container">
              <div className="mx-auto max-w-3xl">
                <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                  {page.browseTitle}
                </h2>
                <p className="mt-3 text-muted-foreground">{page.browseSubtitle}</p>
                <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-3">
                  {browseLinks.map((city) => (
                    <li key={city.path}>
                      <Link
                        to={city.path}
                        className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        {city.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
          <FAQ faqs={page.faqs} />
        </>
      )}

      <SiteFooter />
    </div>
  );
};

const SitelinkPage = ({ slug }: SitelinkPageProps) => (
  <LandingLocaleProvider locale="en">
    <SitelinkPageContent slug={slug} />
  </LandingLocaleProvider>
);

export default SitelinkPage;
