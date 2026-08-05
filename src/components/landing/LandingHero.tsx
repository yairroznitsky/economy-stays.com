import Header from "@/components/Header";
import SearchForm, { type SearchFormProps } from "@/components/SearchForm";
import { getDestinationHeroImage } from "@/lib/destinationImages";
import type { LandingPageConfig } from "@/types/landingPage";

type LandingHeroProps = {
  config: LandingPageConfig;
  searchFormProps?: Pick<SearchFormProps, "defaults" | "trackingContext">;
};

const LandingHero = ({ config, searchFormProps }: LandingHeroProps) => {
  const heroImage = getDestinationHeroImage(config.city.slug);

  return (
    <section className="relative min-h-[85svh] w-full md:min-h-[680px]">
      <img
        src={heroImage}
        alt={`Hotels in ${config.city.name}, ${config.city.country}`}
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-primary/15 to-primary/70" />

      <Header />

      <div className="container relative z-10 flex min-h-[85svh] flex-col items-center justify-start pt-24 pb-10 text-center md:min-h-[680px] md:justify-center md:pt-16 md:pb-24">
        <p className="mt-2 text-sm font-medium uppercase tracking-widest text-accent md:mt-0">
          {config.city.name}, {config.city.country}
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-2xl font-bold leading-[1.15] text-white drop-shadow-md md:max-w-4xl md:text-5xl md:leading-[1.1]">
          {config.content.h1}
        </h1>
        <p className="mt-4 max-w-2xl text-base text-white/85 md:text-lg">
          {config.content.subtitle}
        </p>
        <div className="mt-7 w-full max-w-5xl desktop:mt-10 desktop:max-w-[73.6rem]">
          <SearchForm {...searchFormProps} />
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
