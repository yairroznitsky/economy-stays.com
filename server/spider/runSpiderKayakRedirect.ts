import { randomBytes } from "node:crypto";
import { pickRandomSpiderDateRange } from "../../src/lib/spiderDates";
import { pickRandomSpiderDestination } from "../../src/lib/spiderTouristCities";
import { handleKayakAutocomplete } from "../edge/kayakAutocomplete";
import { getKayakAffiliateConfig } from "../edge/env";
import {
  buildKayakDeeplink,
  type KayakDeeplinkInput,
} from "../../supabase/functions/hotel-affiliate-router/kayakDeeplink";

const ID_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const SPIDER_LOCALE = "en";
const SPIDER_MARKET_COUNTRY = "US";
const SPIDER_ADULTS = 2;
const SPIDER_CHILDREN = 0;
const SPIDER_ROOMS = 1;

interface SpiderSuggestion {
  id: string;
  label: string;
  type: string;
  raw?: Record<string, unknown>;
}

export type SpiderKayakRedirectResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; error: string };

export type RunSpiderKayakRedirectOptions = {
  random?: () => number;
  now?: Date;
  clickId?: string;
  destinationQuery?: string;
};

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const generateClickId = (): string => {
  const bytes = randomBytes(10);
  return Array.from(bytes, (byte) => ID_CHARS[byte % ID_CHARS.length]).join("");
};

const readRawId = (
  raw: Record<string, unknown> | undefined,
  key: string
): string | undefined => {
  const value = raw?.[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return undefined;
};

const readRawString = (
  raw: Record<string, unknown> | undefined,
  key: string
): string | undefined => {
  const value = raw?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

export const pickSpiderSuggestion = (
  suggestions: SpiderSuggestion[]
): SpiderSuggestion | null => {
  if (suggestions.length === 0) return null;

  const cityOrRegion = suggestions.find((suggestion) => {
    const type = suggestion.type.toLowerCase();
    const hasCityId = Boolean(readRawId(suggestion.raw, "city_id"));
    return (type.includes("city") || type.includes("region")) && hasCityId;
  });
  if (cityOrRegion) return cityOrRegion;

  const withUsableId = suggestions.find((suggestion) => {
    return (
      readRawId(suggestion.raw, "city_id") ??
      readRawId(suggestion.raw, "id") ??
      suggestion.id.trim()
    );
  });

  return withUsableId ?? null;
};

const parseSuggestions = (body: Record<string, unknown>): SpiderSuggestion[] => {
  const rawSuggestions = body.suggestions;
  if (!Array.isArray(rawSuggestions)) return [];

  return rawSuggestions
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : "";
      const label = typeof record.label === "string" ? record.label : "";
      const type = typeof record.type === "string" ? record.type : "";
      if (!id || !label) return null;
      const raw =
        record.raw && typeof record.raw === "object"
          ? (record.raw as Record<string, unknown>)
          : undefined;
      return { id, label, type, raw };
    })
    .filter((entry): entry is SpiderSuggestion => entry !== null);
};

const buildKayakInputFromSuggestion = (
  suggestion: SpiderSuggestion,
  checkin: string,
  checkout: string,
  clickId: string
): KayakDeeplinkInput | null => {
  const raw = suggestion.raw ?? {};
  const destinationId =
    readRawId(raw, "city_id") ?? readRawId(raw, "id") ?? suggestion.id.trim();
  if (!destinationId) return null;

  const cityName =
    readRawString(raw, "city") ?? suggestion.label.split(",")[0]?.trim() ?? suggestion.label;
  const stateName = readRawString(raw, "state");
  const countryName = readRawString(raw, "country");

  return {
    query: suggestion.label.trim(),
    destination_id: destinationId,
    hotel_id: readRawId(raw, "hotel_id"),
    city_name: cityName,
    state_name: stateName,
    country_name: countryName,
    checkin,
    checkout,
    rooms: SPIDER_ROOMS,
    adults: SPIDER_ADULTS,
    children: SPIDER_CHILDREN,
    children_ages: [],
    click_id: clickId,
    country: countryName ?? SPIDER_MARKET_COUNTRY,
  };
};

export const runSpiderKayakRedirect = async (
  options: RunSpiderKayakRedirectOptions = {}
): Promise<SpiderKayakRedirectResult> => {
  const random = options.random ?? Math.random;
  const destinationQuery =
    options.destinationQuery?.trim() || pickRandomSpiderDestination();
  const dateRange = pickRandomSpiderDateRange(options.now ?? new Date(), random);
  const checkin = formatLocalDate(dateRange.from);
  const checkout = formatLocalDate(dateRange.to);
  const clickId = options.clickId ?? generateClickId();

  const autocomplete = await handleKayakAutocomplete({
    query: destinationQuery,
    locale: SPIDER_LOCALE,
    country: SPIDER_MARKET_COUNTRY,
  });

  if (autocomplete.status !== 200) {
    return { ok: false, error: "Kayak autocomplete failed" };
  }

  const body = autocomplete.body;
  if (body.success === false) {
    return { ok: false, error: "Kayak autocomplete unavailable" };
  }

  const suggestions = parseSuggestions(body);
  const suggestion = pickSpiderSuggestion(suggestions);
  if (!suggestion) {
    return { ok: false, error: "No usable Kayak destination suggestion" };
  }

  const kayakInput = buildKayakInputFromSuggestion(
    suggestion,
    checkin,
    checkout,
    clickId
  );
  if (!kayakInput) {
    return { ok: false, error: "Could not map Kayak suggestion to deeplink input" };
  }

  const redirectUrl = buildKayakDeeplink(
    kayakInput,
    { destination_id: kayakInput.destination_id },
    getKayakAffiliateConfig()
  );

  return { ok: true, redirectUrl };
};
