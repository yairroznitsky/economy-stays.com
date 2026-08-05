import { parseGeneratedContent } from "./contentSchema.ts";
import {
  buildTemplateContent as buildTemplateContentRaw,
  type TemplateContent,
} from "../../api/_lib/templateContent.ts";

export type { TemplateContent };

/** Same template copy as the API handler, validated for script inserts. */
export const buildTemplateContent = (
  city: { name: string; country: string },
  intent: { label: string; slug: string } | null
) => parseGeneratedContent(buildTemplateContentRaw(city, intent));
