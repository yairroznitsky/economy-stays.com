import { useEffect } from "react";
import { LandingTrackingService } from "@/lib/landingTrackingService";

export const useLandingTracker = () => {
  useEffect(() => {
    const landingIdFromQuery = new URLSearchParams(window.location.search).get(
      "landing_id"
    );
    if (landingIdFromQuery) {
      LandingTrackingService.setExistingLandingId(landingIdFromQuery);
    }

    LandingTrackingService.getOrCreateLandingId().catch(() => {});
  }, []);
};
