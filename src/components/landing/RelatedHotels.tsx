import { useRef, useState } from "react";
import { ExternalLink, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLuxuryRoomImage, getLuxuryRoomImageAlt } from "@/lib/luxuryRoomImages";
import { useLandingI18n } from "@/i18n/landing";
import { getDefaultHotelStayDateStrings } from "@/lib/kayakDestinationSearch";
import {
  runHotelCompareRedirect,
  handleHotelCompareError,
} from "@/lib/hotelCompareRedirect";
import type {
  LandingPageCity,
  LandingPageRelatedHotel,
  LandingPageTracking,
} from "@/types/landingPage";

type RelatedHotelsProps = {
  city: LandingPageCity;
  hotels: LandingPageRelatedHotel[];
  intentLabel?: string;
  tracking: LandingPageTracking;
};

const formatReviews = (count: number): string =>
  count >= 1000 ? `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(count);

const RelatedHotels = ({ city, hotels, intentLabel, tracking }: RelatedHotelsProps) => {
  const { t } = useLandingI18n();
  const [openingHotelId, setOpeningHotelId] = useState<string | null>(null);
  const compareInFlightRef = useRef(false);

  if (hotels.length === 0) return null;

  const heading = intentLabel
    ? `Popular ${intentLabel.toLowerCase()} in ${city.name}`
    : `Popular hotels in ${city.name}`;

  const openHotelCompare = async (hotel: LandingPageRelatedHotel) => {
    if (openingHotelId || compareInFlightRef.current) return;

    compareInFlightRef.current = true;
    setOpeningHotelId(hotel.id);

    const { checkIn, checkOut } = getDefaultHotelStayDateStrings();

    const trackingExtras: Record<string, string> = {
      surface: "related_hotels",
      source_hotel: hotel.name,
      source_hotel_id: hotel.id,
    };
    if (tracking.landingPageId) trackingExtras.landing_page_id = tracking.landingPageId;
    if (tracking.cityId) trackingExtras.city_id = tracking.cityId;
    if (tracking.intentId) trackingExtras.intent_id = tracking.intentId;

    try {
      await runHotelCompareRedirect({
        hotelName: hotel.name,
        cityName: city.name,
        countryName: city.country,
        checkIn,
        checkOut,
        trackingExtras,
      });
    } catch (error) {
      handleHotelCompareError(error, t, hotel.name);
    } finally {
      compareInFlightRef.current = false;
      setOpeningHotelId(null);
    }
  };

  return (
    <section className="border-b border-border bg-muted/30 py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            {heading}
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Compare live rates for top stays in {city.name} on our booking partners.
          </p>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {hotels.map((hotel) => {
              const imageSrc = getLuxuryRoomImage(hotel.id || hotel.path);
              const isOpening = openingHotelId === hotel.id;
              return (
                <li key={hotel.id}>
                  <button
                    type="button"
                    disabled={openingHotelId !== null}
                    aria-busy={isOpening}
                    onClick={() => void openHotelCompare(hotel)}
                    className={cn(
                      "group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-0 text-left shadow-soft transition",
                      "hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:opacity-60"
                    )}
                  >
                    <div className="relative h-40 overflow-hidden bg-muted">
                      <img
                        src={imageSrc}
                        alt={getLuxuryRoomImageAlt(hotel.name)}
                        width={640}
                        height={360}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="line-clamp-2 font-display text-lg font-semibold leading-snug text-white drop-shadow-sm">
                          {hotel.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        {hotel.type ? (
                          <span className="capitalize">{hotel.type}</span>
                        ) : null}
                        {hotel.starRating ? (
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden />
                            {hotel.starRating}-star
                          </span>
                        ) : null}
                        {hotel.rating != null && hotel.reviews ? (
                          <span>
                            {hotel.rating}/10 · {formatReviews(hotel.reviews)} reviews
                          </span>
                        ) : null}
                      </div>
                      <span className="mt-auto inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity group-hover:opacity-90">
                        {isOpening ? (
                          t.search.comparingRates
                        ) : (
                          <>
                            {t.search.comparePrices}
                            <ExternalLink className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                          </>
                        )}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default RelatedHotels;
