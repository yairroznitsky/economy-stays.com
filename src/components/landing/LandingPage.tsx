import SiteFooter from "@/components/SiteFooter";
import Benefits from "@/components/landing/Benefits";
import CTASection from "@/components/landing/CTASection";
import DestinationContent from "@/components/landing/DestinationContent";
import FAQ from "@/components/landing/FAQ";
import LandingHero from "@/components/landing/LandingHero";
import LandingPageMeta from "@/components/landing/LandingPageMeta";
import type { SearchFormProps } from "@/components/SearchForm";
import type { LandingPageConfig } from "@/types/landingPage";
import { useMemo } from "react";

type LandingPageProps = {
  config: LandingPageConfig;
};

const LandingPage = ({ config }: LandingPageProps) => {
  const searchFormProps = useMemo((): Pick<
    SearchFormProps,
    "defaults" | "trackingContext"
  > => ({
    defaults: config.hotel
      ? {
          // Hotel pages search for the property itself; Kayak autocomplete
          // resolves the hotel name (disambiguated by city + country).
          destinationQuery: config.hotel.name,
          nightsOffsetDays: config.searchDefaults.nightsOffsetDays,
          stayNights: config.searchDefaults.stayNights,
          adults: config.searchDefaults.adults,
          rooms: config.searchDefaults.rooms,
          cityName: config.hotel.name,
          countryName: `${config.city.name}, ${config.city.country}`,
          lockDestination: true,
        }
      : {
          destinationQuery: config.city.name,
          nightsOffsetDays: config.searchDefaults.nightsOffsetDays,
          stayNights: config.searchDefaults.stayNights,
          adults: config.searchDefaults.adults,
          rooms: config.searchDefaults.rooms,
          kayakDestinationId: config.city.kayakDestinationId,
          kayakCitySlug: config.city.kayakCitySlug,
          cityName: config.city.name,
          countryName: config.city.country,
          lockDestination: true,
        },
    trackingContext: {
      landingPageId: config.tracking.landingPageId,
      cityId: config.tracking.cityId,
      intentId: config.tracking.intentId,
      surface: "hotel_landing",
    },
  }), [config]);

  return (
    <div className="min-h-screen bg-background">
      <LandingPageMeta config={config} />
      <LandingHero config={config} searchFormProps={searchFormProps} />
      <Benefits benefits={config.content.benefits} />
      <DestinationContent config={config} />
      <FAQ faqs={config.content.faqs} />
      <CTASection ctaText={config.content.ctaText} cityName={config.city.name} />
      <SiteFooter />
    </div>
  );
};

export default LandingPage;
