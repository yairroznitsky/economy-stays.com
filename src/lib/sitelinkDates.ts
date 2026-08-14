import { format } from "date-fns";

export type SitelinkDatePreset = "tonight" | "tomorrow" | "weekend";

export type SitelinkStayDefaults = {
  nightsOffsetDays: number;
  stayNights: number;
};

/** Days from `from` until the coming Friday (0 if `from` is already Friday). */
export const nightsUntilNextFriday = (from: Date = new Date()): number => {
  const day = from.getDay();
  return (5 - day + 7) % 7;
};

export const getSitelinkStayDefaults = (
  preset: SitelinkDatePreset,
  from: Date = new Date()
): SitelinkStayDefaults => {
  if (preset === "tonight") {
    return { nightsOffsetDays: 0, stayNights: 1 };
  }
  if (preset === "weekend") {
    return { nightsOffsetDays: nightsUntilNextFriday(from), stayNights: 2 };
  }
  return { nightsOffsetDays: 1, stayNights: 1 };
};

export const getSitelinkStayDateStrings = (
  preset: SitelinkDatePreset,
  from: Date = new Date()
): { checkIn: string; checkOut: string } => {
  const { nightsOffsetDays, stayNights } = getSitelinkStayDefaults(preset, from);
  const checkIn = new Date(from);
  checkIn.setDate(checkIn.getDate() + nightsOffsetDays);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + stayNights);
  return {
    checkIn: format(checkIn, "yyyy-MM-dd"),
    checkOut: format(checkOut, "yyyy-MM-dd"),
  };
};
