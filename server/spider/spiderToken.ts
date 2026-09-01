import { timingSafeEqual } from "node:crypto";

export const readSpiderToken = (): string | undefined => {
  const value = process.env.SPIDER_TOKEN?.trim();
  return value && value.length > 0 ? value : undefined;
};

/** Constant-time compare when lengths match. */
export const tokensMatch = (provided: string, expected: string): boolean => {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
};

export const isValidSpiderToken = (provided: string | undefined | null): boolean => {
  const expected = readSpiderToken();
  if (!expected || !provided) return false;
  return tokensMatch(provided.trim(), expected);
};
