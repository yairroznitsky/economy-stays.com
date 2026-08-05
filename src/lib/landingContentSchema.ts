import { z } from "zod";

export const generatedContentSchema = z.object({
  h1: z.string().min(8).max(120),
  subtitle: z.string().min(20).max(220),
  metaTitle: z.string().min(20).max(70),
  metaDescription: z.string().min(50).max(160),
  introText: z.string().min(120).max(1200),
  faqs: z
    .array(
      z.object({
        q: z.string().min(8).max(140),
        a: z.string().min(20).max(400),
      })
    )
    .min(2)
    .max(5),
  benefits: z
    .array(
      z.object({
        title: z.string().min(4).max(60),
        text: z.string().min(20).max(220),
      })
    )
    .min(2)
    .max(4),
  ctaText: z.string().min(8).max(90),
});

export type GeneratedLandingContent = z.infer<typeof generatedContentSchema>;

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const normalizeFaq = (item: unknown): { q: string; a: string } | null => {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  const q = readString(record.q ?? record.question ?? record.questionText);
  const a = readString(record.a ?? record.answer ?? record.answerText);
  if (!q || !a) return null;
  return { q, a };
};

const normalizeBenefit = (
  item: unknown,
  index: number
): { title: string; text: string } | null => {
  if (typeof item === "string") {
    const text = item.trim();
    if (!text) return null;
    const split = text.split(/(?<=[.!?])\s+/);
    if (split.length >= 2 && split[0].length <= 60) {
      return { title: split[0].replace(/[.!?]+$/, ""), text: split.slice(1).join(" ") };
    }
    return { title: `Benefit ${index + 1}`, text };
  }

  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  const title = readString(record.title ?? record.heading ?? record.name);
  const text = readString(record.text ?? record.description ?? record.body);
  if (!title || !text) return null;
  return { title, text };
};

/** Coerce common OpenAI JSON variants into the schema we validate against. */
export const normalizeGeneratedContent = (raw: unknown): unknown => {
  if (!raw || typeof raw !== "object") return raw;
  const record = raw as Record<string, unknown>;

  const faqs = (Array.isArray(record.faqs) ? record.faqs : [])
    .map(normalizeFaq)
    .filter((item): item is { q: string; a: string } => item !== null)
    .slice(0, 5);

  const benefits = (Array.isArray(record.benefits) ? record.benefits : [])
    .map(normalizeBenefit)
    .filter((item): item is { title: string; text: string } => item !== null)
    .slice(0, 4);

  return {
    h1: readString(record.h1 ?? record.headline ?? record.title),
    subtitle: readString(record.subtitle ?? record.subHeading),
    metaTitle: readString(record.metaTitle ?? record.meta_title),
    metaDescription: readString(record.metaDescription ?? record.meta_description),
    introText: readString(record.introText ?? record.intro_text ?? record.intro),
    faqs,
    benefits,
    ctaText: readString(record.ctaText ?? record.cta_text ?? record.cta),
  };
};

export const parseGeneratedContent = (raw: unknown): GeneratedLandingContent =>
  generatedContentSchema.parse(normalizeGeneratedContent(raw));

const bannedPatterns = [
  /\bcheapest\b/i,
  /\bbest price\b/i,
  /\blowest price\b/i,
  /\b\d+%\s*(off|savings|discount)\b/i,
  /\$\d+/,
  /€\d+/,
  /£\d+/,
];

export const validateMarketingClaims = (content: GeneratedLandingContent): string[] => {
  const blob = JSON.stringify(content);
  return bannedPatterns
    .filter((pattern) => pattern.test(blob))
    .map((pattern) => pattern.source);
};

export const cityImportSchema = z.object({
  name: z.string().min(2),
  country: z.string().min(2),
  country_code: z.string().min(2).max(2),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  airport_code: z.string().optional(),
  priority: z.coerce.number().default(0),
});

export const intentSeedSchema = z.object({
  slug: z.string().min(2),
  label: z.string().min(2),
  category: z.enum(["price", "audience", "star", "amenity", "location"]),
  star_rating: z.number().int().min(1).max(5).optional(),
  amenities: z.array(z.string()).optional(),
  audience: z.string().optional(),
  prompt_notes: z.string().optional(),
  priority: z.number().int().default(0),
  active: z.boolean().default(true),
});
