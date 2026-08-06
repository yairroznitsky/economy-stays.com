import type { LandingPageHotel } from "@/types/landingPage";
import { MapPin, Star } from "lucide-react";

type HotelFactsStripProps = {
  hotel: LandingPageHotel;
  cityName: string;
};

const formatReviews = (count: number): string =>
  count >= 1000 ? `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(count);

const HotelFactsStrip = ({ hotel, cityName }: HotelFactsStripProps) => {
  const chips: string[] = [];

  if (hotel.type) {
    chips.push(hotel.type.charAt(0).toUpperCase() + hotel.type.slice(1).toLowerCase());
  }
  if (hotel.rating != null && hotel.reviews) {
    chips.push(`${hotel.rating}/10 · ${formatReviews(hotel.reviews)} reviews`);
  }

  if (chips.length === 0 && !hotel.starRating && !hotel.address) return null;

  return (
    <div className="mt-4 flex max-w-2xl flex-col items-center gap-2 text-sm text-white/90 md:text-base">
      {hotel.starRating || chips.length > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          {hotel.starRating ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden />
              {hotel.starRating}-star
            </span>
          ) : null}
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm"
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}
      {hotel.address ? (
        <p className="inline-flex max-w-xl items-start justify-center gap-1.5 text-center text-white/80">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            {hotel.address}, {cityName}
          </span>
        </p>
      ) : null}
    </div>
  );
};

export default HotelFactsStrip;
