
import type { SkyscannerProduct } from './products.ts';

export function getRandomUserAgent(userAgents: string[]): string {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

export function getRandomDelay(min = 50, max = 200): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getCacheKey(
  searchTerm: string,
  market: string,
  locale: string,
  product: SkyscannerProduct,
): string {
  return `skyscanner_places_${product}_${market}_${locale}_${searchTerm.toLowerCase()}`;
}

export function isIATACode(searchTerm: string): boolean {
  return /^[A-Za-z]{3,4}$/.test(searchTerm.trim());
}

export const METRO_IATA_TO_CITY: Record<string, string> = {
  NYC: 'New York',
  LON: 'London',
  WAS: 'Washington',
  CHI: 'Chicago',
  TYO: 'Tokyo',
  PAR: 'Paris',
  ROM: 'Rome',
  MIL: 'Milan',
  BJS: 'Beijing',
  SHA: 'Shanghai',
  SEL: 'Seoul',
  SAO: 'São Paulo',
  RIO: 'Rio de Janeiro',
  YMQ: 'Montreal',
  YTO: 'Toronto',
  MOW: 'Moscow',
  BER: 'Berlin',
};

export function resolveSearchTermForIata(searchTerm: string): string {
  const upper = searchTerm.trim().toUpperCase();
  return METRO_IATA_TO_CITY[upper] ?? searchTerm;
}

export function parseSetCookieHeaders(headers: Headers): string {
  const setCookies =
    typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : [headers.get('set-cookie')].filter((value): value is string => Boolean(value));

  return setCookies
    .map((cookie) => cookie.split(';')[0])
    .filter(Boolean)
    .join('; ');
}

export function safeJsonParse(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
