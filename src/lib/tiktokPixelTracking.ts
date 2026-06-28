import { siteConfig } from "@/lib/siteConfig";
import type { HotelSearchInput } from "@/types/hotels";

const inferTrafficType = (): "tiktok" | "unknown" => {
  const params = new URLSearchParams(window.location.search);
  const ttclid = params.get("ttclid");
  const utmSource = (params.get("utm_source") ?? "").toLowerCase();
  return ttclid || utmSource === "tiktok" ? "tiktok" : "unknown";
};

export const buildTikTokSearchParams = (
  search: HotelSearchInput
): Record<string, unknown> => {
  const params: Record<string, unknown> = {
    brand: siteConfig.trackingBrand,
    vertical: "hotels",
    source_site: siteConfig.slug,
    funnel_step: "search",
    traffic_type: inferTrafficType(),
  };

  if (search.destination) {
    params.search_string = search.destination;
    params.destination = search.destination;
  }
  if (search.checkIn) params.check_in = search.checkIn;
  if (search.checkOut) params.check_out = search.checkOut;

  if (search.adults != null || search.children != null) {
    const guests = (search.adults ?? 0) + (search.children ?? 0);
    if (guests > 0) params.guests = guests;
  }
  if (search.rooms != null) params.rooms = search.rooms;

  return params;
};

/** Fires TikTok Pixel Search once per call. */
export const trackTikTokSearch = (search: HotelSearchInput): void => {
  const params = buildTikTokSearchParams(search);

  if (typeof window.ttq?.track === "function") {
    window.ttq.track("Search", params);
  }

  if (import.meta.env.DEV) {
    console.log("TIKTOK SEARCH FIRED", params);
  }
};
