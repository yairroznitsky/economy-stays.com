import { buildBookingSearchResultsUrl, type BookingDeeplinkInput } from "@/lib/bookingHotels";

export interface CjAffiliateConfig {
  clickDomain: string;
  pid: string;
  aid: string;
}

const normalizeCjDomain = (domain: string): string =>
  domain
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .trim();

export const getDefaultCjConfig = (): CjAffiliateConfig => ({
  clickDomain: import.meta.env.VITE_CJ_CLICK_DOMAIN?.trim() || "kqzyfj.com",
  pid: import.meta.env.VITE_CJ_PID?.trim() || "101841809",
  aid: import.meta.env.VITE_CJ_AID?.trim() || "17293132",
});

/**
 * Wraps a Booking.com search URL in a CJ affiliate click URL.
 * https://www.{domain}/click-{pid}-{aid}?url={bookingUrl}&sid={click_id}
 */
export const buildCjBookingUrl = (
  input: BookingDeeplinkInput,
  config: CjAffiliateConfig = getDefaultCjConfig()
): string => {
  const innerUrl = buildBookingSearchResultsUrl(input);
  const domain = normalizeCjDomain(config.clickDomain);

  const outerParams = new URLSearchParams({
    url: innerUrl,
    sid: input.click_id,
  });

  return `https://www.${domain}/click-${config.pid}-${config.aid}?${outerParams.toString()}`;
};
