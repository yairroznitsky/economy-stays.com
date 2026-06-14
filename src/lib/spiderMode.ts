export { pickRandomSpiderDestination, SPIDER_TOURIST_CITIES } from "@/lib/spiderTouristCities";

export const SPIDER_DEADLINE_MS = 2000;

export const isSpiderMode = (): boolean => {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("spider") === "1";
};
