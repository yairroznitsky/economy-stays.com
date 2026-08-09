import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import heroImage from "@/assets/hero-hotel.jpg";
import Header from "@/components/Header";
import SearchForm from "@/components/SearchForm";
import SiteFooter from "@/components/SiteFooter";
import { LandingLocaleProvider } from "@/i18n/landing";
import { siteConfig } from "@/lib/siteConfig";
import { getSitelinkPage } from "@/lib/sitelinkPages";

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

const SitelinkPageContent = ({ slug }: SitelinkPageProps) => {
  const page = getSitelinkPage(slug);

  useEffect(() => {
    if (!page) return;

    const title = `${page.title} | ${siteConfig.name}`;
    const description = `${page.description1}. ${page.description2}.`;
    const canonical = `https://${siteConfig.domain}/${page.slug}`;

    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:type", "website");

    let link = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]'
    );
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonical;

    return () => {
      document.title = siteConfig.name;
    };
  }, [page]);

  if (!page) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="relative min-h-[88svh] w-full overflow-hidden md:min-h-[720px]">
        <img
          src={heroImage}
          alt=""
          width={1920}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover motion-safe:animate-hero-ken"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/30" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[12%] bottom-[22%] bg-[radial-gradient(ellipse_at_center,hsl(215_45%_6%/0.42)_0%,transparent_68%)]"
        />

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
          </div>
          <div className="mt-6 w-full max-w-5xl shrink-0 opacity-0 motion-safe:animate-hero-rise motion-safe:[animation-delay:140ms] motion-reduce:opacity-100 desktop:mt-8 desktop:max-w-[73.6rem]">
            <SearchForm
              trackingContext={{
                surface: `sitelink_${page.slug}`,
              }}
            />
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background py-16 md:py-20">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            {page.description2}
          </h2>
          <p className="mt-4 text-muted-foreground">
            Enter your destination and dates above to compare hotel options from
            established travel partners. Bookings are completed on partner sites.
          </p>
        </div>
      </section>

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
