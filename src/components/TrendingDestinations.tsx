import { useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  requestHotelDestinationAutocomplete,
  requestHotelRedirectUrl,
} from "@/lib/hotelAffiliateApi";
import {
  isDestinationPickRequiredMessage,
  isSearchValidationMessage,
} from "@/lib/hotelSearchErrors";
import { getHotelAffiliateRouting, is2PopMode } from "@/lib/bookingMode";
import { buildCjBookingUrl } from "@/lib/cjBooking";
import {
  buildHotelSearchInputFromSuggestion,
  getDeviceKayakAutocompleteContext,
  withTrendingDeeplinkPlace,
} from "@/lib/kayakDestinationSearch";
import { generateClickId, LandingTrackingService } from "@/lib/landingTrackingService";
import { trackMetaSearch } from "@/lib/metaPixelTracking";
import {
  buildHotelClickSearchParams,
  recordPartnerClick,
  trackPartnerExit,
} from "@/lib/partnerClickTracking";
import {
  TRENDING_DESTINATIONS,
  trendingAutocompleteQuery,
  type TrendingDestination,
} from "@/lib/trendingDestinations";
import { localizeCountryName, useLandingI18n } from "@/i18n/landing";

type TrendingDestinationsProps = {
  title: string;
  subtitle: string;
  checkIn: string;
  checkOut: string;
  surface: string;
};

const TrendingDestinations = ({
  title,
  subtitle,
  checkIn,
  checkOut,
  surface,
}: TrendingDestinationsProps) => {
  const { t } = useLandingI18n();
  const [openingDestination, setOpeningDestination] = useState<string | null>(null);
  const trendingSearchInFlightRef = useRef(false);

  const openDestination = async (d: TrendingDestination) => {
    if (openingDestination || trendingSearchInFlightRef.current) return;

    trendingSearchInFlightRef.current = true;
    setOpeningDestination(d.title);

    // Open a blank tab synchronously (within the user gesture) for 2pop mode so
    // it is never blocked by popup blockers. Filled in with the Kayak URL below.
    let twoPopWindow: Window | null = null;
    let twoPopNavigated = false;
    if (is2PopMode()) {
      twoPopWindow = window.open("about:blank", "_blank");
    }

    const { locale, marketCountry } = getDeviceKayakAutocompleteContext();

    try {
      const suggestions = await requestHotelDestinationAutocomplete({
        query: trendingAutocompleteQuery(d),
        locale,
        country: marketCountry,
      });
      const suggestion = suggestions[0];
      if (!suggestion) {
        toast.error(t.destinationNotFound(d.title));
        return;
      }

      const search = withTrendingDeeplinkPlace(
        buildHotelSearchInputFromSuggestion(suggestion, {
          checkIn,
          checkOut,
          adults: 2,
          children: 0,
          rooms: 1,
          locale,
          marketCountry,
          fallbackCountryName: d.country,
        }),
        {
          city: d.city,
          state: d.state ?? "",
          country: d.country,
        }
      );

      const landingId = await LandingTrackingService.getOrCreateLandingId();
      const trackingExtras = { surface, source_destination: d.title };

      if (twoPopWindow !== null) {
        // 2pop flow: Kayak in new tab + CJ Booking.com in current tab.
        const kayakClickId = generateClickId();
        const cjClickId = generateClickId();

        const kayakResponse = await requestHotelRedirectUrl({
          search,
          clickId: kayakClickId,
          landingId,
          affiliateSource: "kayak",
          metadata: { ...trackingExtras, destination_id: search.destinationId ?? "", two_pop: "1" },
        });

        const cjUrl = buildCjBookingUrl({
          query: search.destination!.trim(),
          checkin: search.checkIn!,
          checkout: search.checkOut!,
          rooms: search.rooms ?? 1,
          adults: search.adults ?? 2,
          children: search.children ?? 0,
          children_ages: search.childrenAges ?? [],
          click_id: cjClickId,
          latitude: search.latitude,
          longitude: search.longitude,
        });

        twoPopWindow.location.href = kayakResponse.redirectUrl;
        twoPopNavigated = true;

        try { trackMetaSearch(search); } catch { /* non-blocking */ }

        void recordPartnerClick({
          partner: "kayak-hotels",
          redirectUrl: kayakResponse.redirectUrl,
          placement: "new_tab",
          clickId: kayakClickId,
          landingId,
          iataCode: search.airportCode ?? null,
          locationId: kayakResponse.entityId,
          pickupDateNew: search.checkIn ?? null,
          dropoffDateNew: search.checkOut ?? null,
          searchParams: buildHotelClickSearchParams(search, { ...trackingExtras, two_pop: "1" }),
        });

        await trackPartnerExit({
          partner: "booking-hotels-cj",
          redirectUrl: cjUrl,
          placement: "redirect",
          clickId: cjClickId,
          landingId,
          iataCode: null,
          locationId: search.destination,
          pickupDateNew: search.checkIn ?? null,
          dropoffDateNew: search.checkOut ?? null,
          searchParams: buildHotelClickSearchParams(search, { ...trackingExtras, two_pop: "1" }),
          autoParams: false,
        });
        return;
      }

      const clickId = generateClickId();
      const { affiliateSource, partner } = getHotelAffiliateRouting();

      const response = await requestHotelRedirectUrl({
        search,
        clickId,
        landingId,
        affiliateSource,
        metadata: {
          ...trackingExtras,
          destination_id: search.destinationId ?? "",
        },
      });

      try {
        trackMetaSearch(search);
      } catch {
        // Pixel tracking must not block the redirect.
      }

      await trackPartnerExit({
        partner,
        redirectUrl: response.redirectUrl,
        placement: "redirect",
        clickId,
        landingId,
        iataCode: search.airportCode ?? null,
        locationId: response.entityId,
        pickupDateNew: search.checkIn ?? null,
        dropoffDateNew: search.checkOut ?? null,
        searchParams: buildHotelClickSearchParams(search, trackingExtras),
        autoParams: true,
      });
    } catch (error) {
      // If a blank tab was opened for 2pop but we errored before filling it, close it.
      if (twoPopWindow && !twoPopNavigated) {
        try { twoPopWindow.close(); } catch { /* ignore */ }
      }
      const message =
        error instanceof Error
          ? error.message
          : "Rates aren't available for this destination right now.";
      if (isDestinationPickRequiredMessage(message)) {
        toast.error(t.destinationPickTitle, {
          description: t.destinationPickDesc,
        });
      } else if (isSearchValidationMessage(message)) {
        toast.error(t.reviewSearch, { description: message });
      } else {
        toast.error(t.ratesUnavailable, {
          description: message || t.ratesUnavailableDesc,
        });
      }
    } finally {
      trendingSearchInFlightRef.current = false;
      setOpeningDestination(null);
    }
  };

  return (
    <section id="destinations" className="bg-secondary/40 py-20">
      <div className="container">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            {title}
          </h2>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {TRENDING_DESTINATIONS.map((d) => (
            <button
              key={d.title}
              type="button"
              disabled={openingDestination !== null}
              aria-busy={openingDestination === d.title}
              onClick={() => void openDestination(d)}
              className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card p-0 text-left shadow-soft transition-smooth hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated disabled:pointer-events-none disabled:opacity-60"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                <img
                  src={d.image}
                  alt={d.imageAlt}
                  width={800}
                  height={600}
                  loading="lazy"
                  decoding="async"
                  style={
                    d.imageObjectPosition
                      ? { objectPosition: d.imageObjectPosition }
                      : undefined
                  }
                  className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-3 text-left sm:p-4">
                <div className="min-w-0">
                  <p className="font-semibold leading-snug text-foreground group-hover:text-primary">
                    {d.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {localizeCountryName(t, d.subtitle)}
                  </p>
                </div>
                <span className="inline-flex w-full items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-primary px-2.5 py-2 text-[11px] font-semibold leading-none text-primary-foreground shadow-sm transition-opacity group-hover:opacity-90 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-sm">
                  {openingDestination === d.title ? (
                    t.checkingRates
                  ) : (
                    <>
                      {t.compareRates}
                      <ExternalLink
                        className="h-3.5 w-3.5 shrink-0 opacity-90 sm:h-4 sm:w-4"
                        aria-hidden
                      />
                    </>
                  )}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingDestinations;
