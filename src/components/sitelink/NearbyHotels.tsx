import { useRef, useState } from "react";
import { ExternalLink, MapPin, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLuxuryRoomImage, getLuxuryRoomImageAlt } from "@/lib/luxuryRoomImages";
import { useLandingI18n } from "@/i18n/landing";
import {
  runHotelCompareRedirect,
  handleHotelCompareError,
} from "@/lib/hotelCompareRedirect";
import type { NearbyHotelItem, NearestCity, NearbySource } from "@/lib/nearbyLocation";

interface NearbyHotelsProps {
  hotels: NearbyHotelItem[];
  nearestCity?: NearestCity;
  checkIn: string;
  checkOut: string;
  /** e.g. "sitelink_cheap-hotels-near-you_nearby" */
  surface: string;
  geoSource: NearbySource;
}

const formatReviews = (count: number): string =>
  count >= 1000 ? `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(count);

const formatDistanceKm = (km: number): string => {
  const useMiles =
    typeof navigator !== "undefined" &&
    /^en-(US|GB|AU|CA|IE|NZ|ZA)$/i.test(navigator.language ?? "");

  if (useMiles) {
    const miles = km * 0.621371;
    return miles < 1
      ? `${Math.round(miles * 10) / 10} mi away`
      : `${Math.round(miles)} mi away`;
  }
  return km < 1
    ? `${Math.round(km * 1000)} m away`
    : `${Math.round(km)} km away`;
};

const NearbyHotels = ({
  hotels,
  nearestCity,
  checkIn,
  checkOut,
  surface,
  geoSource,
}: NearbyHotelsProps) => {
  const { t } = useLandingI18n();
  const [openingId, setOpeningId] = useState<number | null>(null);
  const inFlightRef = useRef(false);

  if (hotels.length === 0) return null;

  const rankedHotels = [...hotels].sort((a, b) => {
    const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
    if (ratingDiff !== 0) return ratingDiff;
    return (b.reviews ?? 0) - (a.reviews ?? 0);
  });

  const openHotel = async (hotel: NearbyHotelItem) => {
    if (openingId !== null || inFlightRef.current) return;

    inFlightRef.current = true;
    setOpeningId(hotel.externalId);

    try {
      await runHotelCompareRedirect({
        hotelName: hotel.name,
        cityName: hotel.cityName ?? nearestCity?.name ?? "",
        countryName: hotel.countryName ?? nearestCity?.country ?? "",
        checkIn,
        checkOut,
        trackingExtras: {
          surface,
          source_hotel: hotel.name,
          source_hotel_id: String(hotel.externalId),
          geo_source: geoSource,
          distance_km: String(Math.round(hotel.distanceKm * 10) / 10),
        },
      });
    } catch (error) {
      handleHotelCompareError(error, t, hotel.name);
    } finally {
      inFlightRef.current = false;
      setOpeningId(null);
    }
  };

  const heading = nearestCity?.name
    ? `Up to 70% off near you in ${nearestCity.name} — compare rates`
    : "Up to 70% off near you — compare rates";

  return (
    <section className="relative z-0 border-b border-border bg-secondary/40 py-12 md:py-16">
      <div className="container">
        <h2 className="mb-8 text-center font-display text-2xl font-bold text-foreground md:text-3xl">
          {heading}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3">
          {rankedHotels.map((hotel) => {
            const imgKey = String(hotel.externalId);
            const isOpening = openingId === hotel.externalId;
            return (
              <button
                key={hotel.externalId}
                type="button"
                disabled={openingId !== null}
                aria-busy={isOpening}
                onClick={() => void openHotel(hotel)}
                className={cn(
                  "group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card p-0 text-left shadow-soft transition-smooth",
                  "hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated disabled:pointer-events-none disabled:opacity-60"
                )}
              >
                {/* Image */}
                <div className="relative h-40 w-full overflow-hidden bg-muted">
                  <img
                    src={getLuxuryRoomImage(imgKey)}
                    alt={getLuxuryRoomImageAlt(hotel.name)}
                    width={640}
                    height={360}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="line-clamp-2 font-display text-base font-semibold leading-snug text-white drop-shadow-sm">
                      {hotel.name}
                    </p>
                  </div>
                  {/* Distance badge */}
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                    <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden />
                    {formatDistanceKm(hotel.distanceKm)}
                  </span>
                </div>

                {/* Card body */}
                <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    {hotel.type ? (
                      <span className="capitalize">{hotel.type}</span>
                    ) : null}
                    {hotel.starRating ? (
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-accent text-accent" aria-hidden />
                        {hotel.starRating}-star
                      </span>
                    ) : null}
                    {hotel.rating != null && hotel.reviews ? (
                      <span>
                        {hotel.rating}/10 · {formatReviews(hotel.reviews)} reviews
                      </span>
                    ) : null}
                  </div>
                  <span className="mt-auto inline-flex w-full items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-primary px-2.5 py-2 text-[11px] font-semibold leading-none text-primary-foreground shadow-sm transition-opacity group-hover:opacity-90 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-sm">
                    {isOpening ? (
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
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default NearbyHotels;
