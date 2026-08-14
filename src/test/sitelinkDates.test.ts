import {
  getSitelinkStayDateStrings,
  getSitelinkStayDefaults,
  nightsUntilNextFriday,
} from "@/lib/sitelinkDates";

describe("sitelinkDates", () => {
  it("returns 0 nights until Friday when the date is already Friday", () => {
    expect(nightsUntilNextFriday(new Date(2026, 7, 14))).toBe(0); // Fri Aug 14
  });

  it("counts forward to the next Friday from other weekdays", () => {
    expect(nightsUntilNextFriday(new Date(2026, 7, 13))).toBe(1); // Thu
    expect(nightsUntilNextFriday(new Date(2026, 7, 15))).toBe(6); // Sat
    expect(nightsUntilNextFriday(new Date(2026, 7, 16))).toBe(5); // Sun
    expect(nightsUntilNextFriday(new Date(2026, 7, 10))).toBe(4); // Mon
  });

  it("uses tonight as a 1-night stay starting today", () => {
    expect(getSitelinkStayDefaults("tonight")).toEqual({
      nightsOffsetDays: 0,
      stayNights: 1,
    });
  });

  it("uses tomorrow as a 1-night stay starting tomorrow", () => {
    expect(getSitelinkStayDefaults("tomorrow")).toEqual({
      nightsOffsetDays: 1,
      stayNights: 1,
    });
  });

  it("uses the coming Friday–Sunday for weekend stays", () => {
    const thursday = new Date(2026, 7, 13);
    expect(getSitelinkStayDefaults("weekend", thursday)).toEqual({
      nightsOffsetDays: 1,
      stayNights: 2,
    });
    expect(getSitelinkStayDateStrings("weekend", thursday)).toEqual({
      checkIn: "2026-08-14",
      checkOut: "2026-08-16",
    });
  });

  it("keeps this weekend when today is Friday", () => {
    const friday = new Date(2026, 7, 14);
    expect(getSitelinkStayDateStrings("weekend", friday)).toEqual({
      checkIn: "2026-08-14",
      checkOut: "2026-08-16",
    });
  });

  it("formats tonight as a same-calendar-day check-in", () => {
    const wednesday = new Date(2026, 7, 12, 15, 30);
    expect(getSitelinkStayDateStrings("tonight", wednesday)).toEqual({
      checkIn: "2026-08-12",
      checkOut: "2026-08-13",
    });
  });
});
