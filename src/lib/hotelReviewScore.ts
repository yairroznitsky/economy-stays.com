/** Booking.com-style guest review score wording (0–10 scale). */
export const getReviewScoreLabel = (rating: number): string => {
  if (rating >= 9.5) return "Exceptional";
  if (rating >= 9) return "Wonderful";
  if (rating >= 8.5) return "Excellent";
  if (rating >= 8) return "Very Good";
  if (rating >= 7) return "Good";
  if (rating >= 6) return "Pleasant";
  return "Review score";
};

/** High-performing properties get a Guest favourite-style highlight. */
export const isGuestFavourite = (rating: number, reviews: number): boolean =>
  rating >= 8.5 && reviews >= 50;

export const formatReviewCount = (count: number): string =>
  count >= 1000 ? `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(count);

export const formatReviewCountLong = (count: number): string =>
  count.toLocaleString("en-US");
