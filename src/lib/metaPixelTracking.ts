import { generateClickId } from "@/lib/landingTrackingService";
import type { HotelSearchInput } from "@/types/hotels";

const inferTrafficType = (): "facebook" | "unknown" => {
  const params = new URLSearchParams(window.location.search);
  return params.get("fbclid") ? "facebook" : "unknown";
};

export const buildMetaSearchParams = (
  search: HotelSearchInput
): Record<string, string | number> => {
  const params: Record<string, string | number> = {
    brand: "secret_bookings",
    vertical: "hotels",
    source_site: "secret-bookings",
    funnel_step: "search",
    traffic_type: inferTrafficType(),
  };

  if (search.destination) params.destination = search.destination;
  if (search.checkIn) params.check_in = search.checkIn;
  if (search.checkOut) params.check_out = search.checkOut;

  if (search.adults != null || search.children != null) {
    const guests = (search.adults ?? 0) + (search.children ?? 0);
    if (guests > 0) params.guests = guests;
  }
  if (search.rooms != null) params.rooms = search.rooms;

  return params;
};

/** Fires Meta Pixel Search once per call. Returns event_id for optional CAPI dedup. */
export const trackMetaSearch = (search: HotelSearchInput): string => {
  const eventId = generateClickId();
  const params = buildMetaSearchParams(search);

  if (typeof window.fbq === "function") {
    window.fbq("track", "Search", params, { eventID: eventId });
  }

  if (import.meta.env.DEV) {
    console.log("META SEARCH FIRED", eventId, params);
  }

  return eventId;
};
