import type { LandingPageHotel } from "@/types/landingPage";
import {
  formatReviewCount,
  getReviewScoreLabel,
} from "@/lib/hotelReviewScore";

type HotelFactsStripProps = {
  hotel: LandingPageHotel;
};

const HotelFactsStrip = ({ hotel }: HotelFactsStripProps) => {
  const hasReviewScore = hotel.rating != null && hotel.reviews != null && hotel.reviews > 0;

  const propertyBits: string[] = [];
  if (hotel.starRating) propertyBits.push(`${hotel.starRating}-star`);
  if (hotel.type) {
    propertyBits.push(hotel.type.charAt(0).toUpperCase() + hotel.type.slice(1).toLowerCase());
  } else if (hotel.starRating) {
    propertyBits.push("hotel");
  }

  if (!hasReviewScore && propertyBits.length === 0) return null;

  const scoreDisplay =
    hasReviewScore && Number.isInteger(hotel.rating)
      ? String(hotel.rating)
      : hasReviewScore
        ? hotel.rating!.toFixed(1)
        : null;

  const detailParts: string[] = [];
  if (hasReviewScore) {
    detailParts.push(getReviewScoreLabel(hotel.rating!));
    detailParts.push(`${formatReviewCount(hotel.reviews!)} reviews`);
  }
  if (propertyBits.length > 0) {
    detailParts.push(propertyBits.join(" "));
  }

  return (
    <div className="mt-4 md:mt-5">
      {hasReviewScore ? (
        <p
          className="inline-flex items-center gap-2 text-sm text-white/75"
          aria-label={`${hotel.rating} out of 10, ${getReviewScoreLabel(hotel.rating!)}. ${hotel.reviews} reviews`}
        >
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded bg-primary/85 px-1.5 text-xs font-bold tabular-nums text-primary-foreground">
            {scoreDisplay}
          </span>
          <span>{detailParts.join(" · ")}</span>
        </p>
      ) : (
        <p className="text-sm tracking-wide text-white/75">
          {propertyBits.join(" · ")}
        </p>
      )}
    </div>
  );
};

export default HotelFactsStrip;
