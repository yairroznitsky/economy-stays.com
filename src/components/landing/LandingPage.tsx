import SiteFooter from "@/components/SiteFooter";
import Benefits from "@/components/landing/Benefits";
import CTASection from "@/components/landing/CTASection";
import DestinationContent from "@/components/landing/DestinationContent";
import FAQ from "@/components/landing/FAQ";
import LandingHero from "@/components/landing/LandingHero";
import LandingPageMeta from "@/components/landing/LandingPageMeta";
import type { SearchFormProps } from "@/components/SearchForm";
import { captureAdsParams } from "@/lib/adsTracking";
import { trackLandingPageEvent } from "@/lib/landingPageEvents";
import type { LandingPageConfig } from "@/types/landingPage";
import { useEffect, useMemo } from "react";

type LandingPageProps = {
  config: LandingPageConfig;
};

const LandingPage = ({ config }: LandingPageProps) => {
  const searchFormProps = useMemo((): Pick<
    SearchFormProps,
    "defaults" | "trackingContext"
  > => ({
    defaults: {
      destinationQuery: config.searchDefaults.destinationQuery,
      nightsOffsetDays: config.searchDefaults.nightsOffsetDays,
      stayNights: config.searchDefaults.stayNights,
      adults: config.searchDefaults.adults,
      rooms: config.searchDefaults.rooms,
      kayakDestinationId: config.city.kayakDestinationId,
      kayakCitySlug: config.city.kayakCitySlug,
      cityName: config.city.name,
      countryName: config.city.country,
      lockDestination: Boolean(config.city.kayakDestinationId),
    },
    trackingContext: {
      landingPageId: config.tracking.landingPageId,
      cityId: config.tracking.cityId,
      intentId: config.tracking.intentId,
      surface: "hotel_landing",
    },
  }), [config]);

  useEffect(() => {
    captureAdsParams();
    void trackLandingPageEvent({
      eventType: "page_view",
      landingPageId: config.tracking.landingPageId,
      cityId: config.tracking.cityId,
      intentId: config.tracking.intentId,
      path: config.path,
    });
  }, [config]);

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
