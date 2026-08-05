import { useEffect, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import LandingPage from "@/components/landing/LandingPage";
import { LandingLocaleProvider } from "@/i18n/landing";
import {
  buildLandingPath,
  loadLandingPageConfig,
  normalizeLandingPath,
} from "@/lib/landingPages";
import type { LandingPageConfig } from "@/types/landingPage";
import NotFound from "./NotFound";

const HotelLanding = () => {
  const { citySlug, intentSlug } = useParams<{
    citySlug: string;
    intentSlug?: string;
  }>();
  const location = useLocation();
  const [config, setConfig] = useState<LandingPageConfig | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");

  const canonicalPath = buildLandingPath(citySlug ?? "", intentSlug);
  const normalizedPath = normalizeLandingPath(location.pathname);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    void loadLandingPageConfig(normalizedPath)
      .then((pageConfig) => {
        if (cancelled) return;
        if (!pageConfig) {
          setStatus("missing");
          return;
        }
        setConfig(pageConfig);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("missing");
      });

    return () => {
      cancelled = true;
    };
  }, [normalizedPath]);

  if (normalizedPath !== canonicalPath && citySlug) {
    return <Navigate to={`${canonicalPath}${location.search}`} replace />;
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (status === "missing" || !config) {
    return <NotFound />;
  }

  return (
    <LandingLocaleProvider locale="en">
      <LandingPage config={config} />
    </LandingLocaleProvider>
  );
};

export default HotelLanding;
