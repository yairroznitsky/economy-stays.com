import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate, useLocation, useParams } from "react-router-dom";
import LandingPage from "@/components/landing/LandingPage";
import { LandingLocaleProvider } from "@/i18n/landing";
import {
  buildLandingPath,
  loadLandingPageConfig,
  normalizeLandingPath,
} from "@/lib/landingPages";
import NotFound from "./NotFound";

const HotelLanding = () => {
  const { citySlug, intentSlug } = useParams<{
    citySlug: string;
    intentSlug?: string;
  }>();
  const location = useLocation();

  const canonicalPath = buildLandingPath(citySlug ?? "", intentSlug);
  const normalizedPath = normalizeLandingPath(location.pathname);

  const { data, isFetched } = useQuery({
    queryKey: ["landing-page", normalizedPath],
    queryFn: () => loadLandingPageConfig(normalizedPath),
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  if (normalizedPath !== canonicalPath && citySlug) {
    return <Navigate to={`${canonicalPath}${location.search}`} replace />;
  }

  if (isFetched && data === null) {
    return <NotFound />;
  }

  if (!data) {
    return <div className="min-h-screen bg-background" aria-busy="true" />;
  }

  return (
    <LandingLocaleProvider locale="en">
      <LandingPage config={data} />
    </LandingLocaleProvider>
  );
};

export default HotelLanding;
