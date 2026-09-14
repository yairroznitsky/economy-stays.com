import { SITELINK_PAGES } from "@/lib/sitelinkPages";
import {
  buildLlmsTxt,
  buildSitelinkJsonLd,
  canonicalOriginFromDomain,
  sitelinkPageToMarkdown,
  sitelinkPageUrl,
} from "@/lib/sitelinkSeo";

const ORIGIN = "https://www.economy-stays.com";

describe("sitelinkSeo", () => {
  it("uses www on canonical origins", () => {
    expect(canonicalOriginFromDomain("economy-stays.com")).toBe(
      "https://www.economy-stays.com"
    );
    expect(canonicalOriginFromDomain("www.economy-stays.com")).toBe(
      "https://www.economy-stays.com"
    );
  });

  it("builds FAQ, HowTo, Article, and Breadcrumb JSON-LD for each sitelink", () => {
    for (const page of SITELINK_PAGES) {
      const graph = buildSitelinkJsonLd(page, ORIGIN)["@graph"] as Array<{
        "@type": string;
        "@id"?: string;
      }>;
      const types = graph.map((node) => node["@type"]);
      expect(types).toEqual(
        expect.arrayContaining([
          "Organization",
          "WebSite",
          "WebPage",
          "Article",
          "FAQPage",
          "HowTo",
          "BreadcrumbList",
        ])
      );
      expect(sitelinkPageUrl(ORIGIN, page.slug)).toBe(
        `${ORIGIN}/${page.slug}`
      );
    }
  });

  it("writes markdown with headings, FAQs, and canonical URL", () => {
    const page = SITELINK_PAGES[0];
    const markdown = sitelinkPageToMarkdown(page, ORIGIN);
    expect(markdown).toContain(`# ${page.title}`);
    expect(markdown).toContain(`Canonical: ${ORIGIN}/${page.slug}`);
    expect(markdown).toContain(`## ${page.sections[0].heading}`);
    expect(markdown).toContain(page.faqs[0].q);
    expect(markdown).not.toContain("Related guides");
  });

  it("lists every sitelink in llms.txt with a markdown alternate", () => {
    const llms = buildLlmsTxt(ORIGIN);
    for (const page of SITELINK_PAGES) {
      expect(llms).toContain(`${ORIGIN}/${page.slug}`);
      expect(llms).toContain(`${ORIGIN}/${page.slug}.md`);
    }
  });

  it("gives each sitelink long-form unique sections and FAQs", () => {
    const headings = new Set<string>();
    for (const page of SITELINK_PAGES) {
      expect(page.sections.length).toBeGreaterThanOrEqual(4);
      expect(page.faqs.length).toBeGreaterThanOrEqual(6);
      expect(page.metaDescription.length).toBeGreaterThanOrEqual(50);
      expect(page.metaDescription.length).toBeLessThanOrEqual(170);
      expect(page.metaTitle.length).toBeLessThanOrEqual(70);
      for (const section of page.sections) {
        expect(headings.has(`${page.slug}:${section.heading}`)).toBe(false);
        headings.add(`${page.slug}:${section.heading}`);
      }
    }
  });
});
