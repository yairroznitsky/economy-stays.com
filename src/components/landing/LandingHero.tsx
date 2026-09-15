import Header from "@/components/Header";
import SearchForm, { type SearchFormProps } from "@/components/SearchForm";
import HotelFactsStrip from "@/components/landing/HotelFactsStrip";
import IntentBadges from "@/components/landing/IntentBadges";
import {
  CITY_HERO_SIZES,
  getCityHeroSrcSet,
  getDestinationHeroFallback,
  getDestinationHeroImage,
} from "@/lib/destinationImages";
import type { LandingPageConfig } from "@/types/landingPage";
import { useState } from "react";

type LandingHeroProps = {
  config: LandingPageConfig;
  searchFormProps?: Pick<SearchFormProps, "defaults" | "trackingContext">;
};

const LandingHero = ({ config, searchFormProps }: LandingHeroProps) => {
  const fallbackHero = getDestinationHeroFallback();
  const primaryHero = getDestinationHeroImage(config.city.slug);
  const [heroImage, setHeroImage] = useState(primaryHero);
  const usingFallback = heroImage === fallbackHero;
  const isHotel = Boolean(config.hotel);
  const imageAlt = isHotel
    ? `${config.hotel!.name} in ${config.city.name}, ${config.city.country}`
    : `Hotels in ${config.city.name}, ${config.city.country}`;

  return (
    <section className="relative h-[70vh] min-h-[520px] max-h-[780px] w-full overflow-hidden">
      <img
        src={heroImage}
        srcSet={usingFallback ? undefined : getCityHeroSrcSet(config.city.slug)}
        sizes={usingFallback ? undefined : CITY_HERO_SIZES}
        alt={imageAlt}
        width={1600}
        height={1067}
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => {
          if (heroImage !== fallbackHero) {
            setHeroImage(fallbackHero);
          }
        }}
      />
      <div className="absolute inset-0 bg-gradient-hero" />

      <Header />

      <div className="container relative z-10 flex h-full flex-col items-center justify-start pt-24 pb-10 text-center md:justify-center md:pt-28 md:pb-14">
        <div className="flex w-full flex-col items-center opacity-0 motion-safe:animate-hero-rise motion-reduce:opacity-100">
          <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-accent md:mt-0 md:text-xs">
            {config.city.name}, {config.city.country}
          </p>
          <h1
            className={
              isHotel
                ? "mt-3 max-w-3xl font-serif text-[2rem] font-semibold leading-[1.12] tracking-[-0.01em] text-white drop-shadow-md sm:text-4xl md:mt-4 md:max-w-4xl md:text-[3.25rem] md:leading-[1.08]"
                : "mt-3 max-w-3xl font-display text-2xl font-bold leading-[1.15] text-white drop-shadow-md md:mt-4 md:max-w-4xl md:text-5xl md:leading-[1.1]"
            }
          >
            {config.content.h1}
          </h1>
          <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-white/85 md:mt-4 md:max-w-2xl md:text-lg">
            {isHotel
              ? "Compare rates across leading travel sites."
              : config.content.subtitle}
          </p>
          {isHotel ? <HotelFactsStrip hotel={config.hotel!} /> : null}
          {config.intent ? <IntentBadges intent={config.intent} /> : null}
          <div className="mt-5 w-full max-w-5xl wide:mt-6 wide:max-w-[73.6rem]">
            <SearchForm {...searchFormProps} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
