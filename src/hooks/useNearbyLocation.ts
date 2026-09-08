import { useEffect, useRef, useState } from "react";
import { fetchNearby, type NearbyData } from "@/lib/nearbyLocation";

export type NearbyStatus = "idle" | "loading" | "loaded" | "none" | "error";

export interface UseNearbyLocationReturn {
  status: NearbyStatus;
  data: NearbyData | null;
}

const ipResolved = (result: NearbyData): boolean => result.source !== "none";

const applyResult = (
  result: NearbyData,
  setData: (data: NearbyData) => void,
  setStatus: (status: NearbyStatus) => void
) => {
  setData(result);
  setStatus(result.source === "none" ? "none" : "loaded");
};

export function useNearbyLocation(
  opts: { enabled?: boolean } = {}
): UseNearbyLocationReturn {
  const { enabled = true } = opts;
  const [status, setStatus] = useState<NearbyStatus>("idle");
  const [data, setData] = useState<NearbyData | null>(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!enabled || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    setStatus("loading");

    const finish = (result: NearbyData) => applyResult(result, setData, setStatus);

    const tryGpsFallback = () => {
      if (!("geolocation" in navigator)) {
        setStatus("none");
        return;
      }
      // Soft backup only when IP did not resolve — one prompt, no retry on deny.
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchNearby({ lat: latitude, lng: longitude })
            .then(finish)
            .catch(() => setStatus("none"));
        },
        () => setStatus("none"),
        { timeout: 8_000, maximumAge: 300_000, enableHighAccuracy: false }
      );
    };

    fetchNearby()
      .then((result) => {
        if (ipResolved(result)) {
          finish(result);
          return;
        }
        tryGpsFallback();
      })
      .catch(() => tryGpsFallback());
  }, [enabled]);

  return { status, data };
}
