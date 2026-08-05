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
