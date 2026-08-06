import { cn } from "@/lib/utils";
import { getLuxuryRoomImage, getLuxuryRoomImageAlt } from "@/lib/luxuryRoomImages";
import type { LandingPageRelatedHotel } from "@/types/landingPage";
import { Link } from "react-router-dom";
import { MapPin, Star } from "lucide-react";

type RelatedHotelsProps = {
  cityName: string;
  hotels: LandingPageRelatedHotel[];
  intentLabel?: string;
};

const formatReviews = (count: number): string =>
  count >= 1000 ? `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(count);

const RelatedHotels = ({ cityName, hotels, intentLabel }: RelatedHotelsProps) => {
  if (hotels.length === 0) return null;

  const heading = intentLabel
    ? `Popular ${intentLabel.toLowerCase()} in ${cityName}`
    : `Popular hotels in ${cityName}`;

  return (
    <section className="border-b border-border bg-muted/30 py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            {heading}
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Browse highly reviewed stays in {cityName} and compare rates for your dates.
          </p>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {hotels.map((hotel) => {
              const imageSrc = getLuxuryRoomImage(hotel.id || hotel.path);
              return (
                <li key={hotel.id}>
                  <Link
                    to={hotel.path}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-md"
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
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
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
                      <span
                        className={cn(
                          "mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary",
                          "transition group-hover:underline"
                        )}
                      >
                        <MapPin className="h-3.5 w-3.5" aria-hidden />
                        View rates
                      </span>
                    </div>
                  </Link>
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
