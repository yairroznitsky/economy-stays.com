import { describe, expect, it } from "vitest";
import { buildTemplateContent } from "../../scripts/lib/templateContent.ts";

describe("buildTemplateContent", () => {
  it("builds intent page copy from city and intent labels", () => {
    const content = buildTemplateContent(
      { name: "Paris", country: "France" },
      { slug: "cheap-hotels", label: "Cheap Hotels" }
    );

    expect(content.h1).toBe("Cheap Hotels in Paris");
    expect(content.metaTitle).toContain("Paris");
    expect(content.faqs.length).toBeGreaterThanOrEqual(2);
    expect(content.introText.length).toBeGreaterThanOrEqual(120);
  });

  it("builds base city page copy without an intent", () => {
    const content = buildTemplateContent(
      { name: "Boston", country: "United States" },
      null
    );

    expect(content.h1).toBe("Hotels in Boston");
    expect(content.ctaText).toBe("Compare hotel rates in Boston");
  });
});
