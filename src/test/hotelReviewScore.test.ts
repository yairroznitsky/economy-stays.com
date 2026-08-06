import {
  formatReviewCount,
  formatReviewCountLong,
  getReviewScoreLabel,
  isGuestFavourite,
} from "@/lib/hotelReviewScore";

describe("hotelReviewScore", () => {
  it("maps Booking-style score labels", () => {
    expect(getReviewScoreLabel(9.6)).toBe("Exceptional");
    expect(getReviewScoreLabel(9.1)).toBe("Wonderful");
    expect(getReviewScoreLabel(8.9)).toBe("Excellent");
    expect(getReviewScoreLabel(8.2)).toBe("Very Good");
    expect(getReviewScoreLabel(7.4)).toBe("Good");
    expect(getReviewScoreLabel(6.1)).toBe("Pleasant");
    expect(getReviewScoreLabel(5)).toBe("Review score");
  });

  it("flags guest favourites for strong scores with enough reviews", () => {
    expect(isGuestFavourite(8.9, 146)).toBe(true);
    expect(isGuestFavourite(8.5, 50)).toBe(true);
    expect(isGuestFavourite(8.4, 200)).toBe(false);
    expect(isGuestFavourite(9.2, 20)).toBe(false);
  });

  it("formats review counts", () => {
    expect(formatReviewCount(146)).toBe("146");
    expect(formatReviewCount(1034)).toBe("1k");
    expect(formatReviewCount(1500)).toBe("1.5k");
    expect(formatReviewCountLong(1034)).toBe("1,034");
  });
});
