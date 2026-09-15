import { useEffect } from "react";
import { LandingTrackingService } from "@/lib/landingTrackingService";

export const useLandingTracker = () => {
  useEffect(() => {
    // Accept both visit_id (new) and landing_id (legacy) from query params
    const params = new URLSearchParams(window.location.search);
    const landingIdFromQuery = params.get("visit_id") ?? params.get("landing_id");
    if (landingIdFromQuery) {
      LandingTrackingService.setExistingLandingId(landingIdFromQuery);
    }

    LandingTrackingService.getOrCreateLandingId().catch(() => {});
  }, []);
};
