import { ShieldCheck, Tag, Globe2 } from "lucide-react";
import heroImage from "@/assets/hero-hotel.jpg";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import SearchForm from "@/components/SearchForm";
import TrendingDestinations from "@/components/TrendingDestinations";
import { getDefaultHotelStayDateStrings } from "@/lib/kayakDestinationSearch";
import { siteConfig } from "@/lib/siteConfig";
import {
  LandingLocaleProvider,
  type LandingLocale,
  useLandingI18n,
} from "@/i18n/landing";

const featureIcons = [Tag, Globe2, ShieldCheck] as const;

const IndexContent = () => {
  const { t } = useLandingI18n();
  const { checkIn, checkOut } = getDefaultHotelStayDateStrings();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative min-h-[88svh] w-full overflow-hidden md:min-h-[720px]">
        <img
          src={heroImage}
          alt={t.heroImageAlt}
          width={1920}
          height={1280}
          fetchPriority="high"
          decoding="async"
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
              {t.heroEyebrow}
            </p>
            <h1 className="mt-3 max-w-3xl font-display text-2xl font-bold leading-[1.15] text-white drop-shadow-md md:mt-4 md:max-w-3xl md:text-5xl md:leading-[1.1]">
              {t.heroTitle}
            </h1>
            <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-white/85 md:mt-4 md:text-lg">
              {t.heroSubtitle}
            </p>
          </div>
          <div className="mt-6 w-full max-w-5xl shrink-0 opacity-0 motion-safe:animate-hero-rise motion-safe:[animation-delay:140ms] motion-reduce:opacity-100 desktop:mt-8 desktop:max-w-[73.6rem]">
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how" className="border-b border-border bg-background py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              {t.featuresTitle(siteConfig.name)}
            </h2>
            <p className="mt-3 text-muted-foreground">{t.featuresSubtitle}</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {t.features.map((f, index) => {
              const Icon = featureIcons[index];
              return (
                <div
                  key={f.title}
                  className="rounded-2xl border border-border bg-card p-7 shadow-soft"
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-muted-foreground">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <TrendingDestinations
        title={t.destinationsTitle}
        subtitle={t.destinationsSubtitle}
        checkIn={checkIn}
        checkOut={checkOut}
        surface="trending_destinations"
      />

      {/* CTA strip */}
      <section id="deals" className="relative overflow-hidden bg-primary py-16">
        <div className="container text-center">
          <h2 className="font-display text-4xl font-bold text-primary-foreground md:text-5xl">
            {t.ctaTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-primary-foreground/90 md:text-lg">
            {t.ctaSubtitle}
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

type IndexProps = {
  locale?: LandingLocale;
};

const Index = ({ locale = "en" }: IndexProps) => (
  <LandingLocaleProvider locale={locale}>
    <IndexContent />
  </LandingLocaleProvider>
);

export default Index;
