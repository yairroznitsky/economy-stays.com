import type { SitelinkPageConfig } from "./sitelinkPages";
import { SITELINK_PAGES } from "./sitelinkPages";

export const canonicalOriginFromDomain = (domain: string): string => {
  const host = domain.trim() || "localhost";
  if (/^localhost(:\d+)?$/i.test(host) || /^127\.0\.0\.1/.test(host)) {
    return `http://${host}`;
  }
  const wwwHost = host.startsWith("www.") ? host : `www.${host}`;
  return `https://${wwwHost}`;
};

export const sitelinkPageUrl = (origin: string, slug: string): string =>
  `${origin.replace(/\/$/, "")}/${slug}`;

export const sitelinkMarkdownUrl = (origin: string, slug: string): string =>
  `${sitelinkPageUrl(origin, slug)}.md`;

type JsonLd = Record<string, unknown>;

export const buildSitelinkJsonLd = (
  page: SitelinkPageConfig,
  origin: string
): JsonLd => {
  const pageUrl = sitelinkPageUrl(origin, page.slug);
  const markdownUrl = sitelinkMarkdownUrl(origin, page.slug);
  const orgId = `${origin}/#organization`;
  const websiteId = `${origin}/#website`;
  const pageId = `${pageUrl}#webpage`;
  const articleId = `${pageUrl}#article`;

  const organization: JsonLd = {
    "@type": "Organization",
    "@id": orgId,
    name: "Cheap Stays",
    url: `${origin}/`,
    description:
      "Independent hotel and vacation rental search. Compare stays and continue to a travel site to book.",
  };

  const website: JsonLd = {
    "@type": "WebSite",
    "@id": websiteId,
    url: `${origin}/`,
    name: "Cheap Stays",
    publisher: { "@id": orgId },
    inLanguage: "en",
  };

  const webPage: JsonLd = {
    "@type": "WebPage",
    "@id": pageId,
    url: pageUrl,
    name: page.metaTitle,
    description: page.metaDescription,
    inLanguage: "en",
    isPartOf: { "@id": websiteId },
    about: page.focusKeyword,
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: `${origin}/android-chrome-512x512.png`,
    },
    breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "article h2", "article p"],
    },
    relatedLink: markdownUrl,
    datePublished: page.datePublished,
    dateModified: page.dateModified,
  };

  const article: JsonLd = {
    "@type": "Article",
    "@id": articleId,
    headline: page.title,
    description: page.metaDescription,
    inLanguage: "en",
    mainEntityOfPage: { "@id": pageId },
    author: { "@id": orgId },
    publisher: { "@id": orgId },
    datePublished: page.datePublished,
    dateModified: page.dateModified,
    keywords: page.focusKeyword,
    articleSection: "Travel",
  };

  const faqPage: JsonLd = {
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    url: pageUrl,
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  const howTo: JsonLd = {
    "@type": "HowTo",
    "@id": `${pageUrl}#howto`,
    name: page.howTo.name,
    description: page.intro,
    step: page.howTo.steps.map((text, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: `Step ${index + 1}`,
      text,
    })),
  };

  const breadcrumb: JsonLd = {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${origin}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: page.title,
        item: pageUrl,
      },
    ],
  };

  return {
    "@context": "https://schema.org",
    "@graph": [organization, website, webPage, article, faqPage, howTo, breadcrumb],
  };
};

export const sitelinkPageToMarkdown = (
  page: SitelinkPageConfig,
  origin: string
): string => {
  const pageUrl = sitelinkPageUrl(origin, page.slug);
  const sections = page.sections
    .map((section) => `## ${section.heading}\n\n${section.paragraphs.join("\n\n")}`)
    .join("\n\n");

  const steps = page.howTo.steps
    .map((step, index) => `${index + 1}. ${step}`)
    .join("\n");

  const faqs = page.faqs.map((faq) => `### ${faq.q}\n\n${faq.a}`).join("\n\n");

  return `# ${page.title}

${page.metaDescription}

Canonical: ${pageUrl}

${page.intro}

${sections}

## ${page.howTo.name}

${steps}

## Frequently asked questions

${faqs}

---

Cheap Stays is an independent comparison search. You finish booking on a travel site such as Kayak. Rates and availability change.
`;
};

export const buildLlmsTxt = (origin: string): string => {
  const sitelinkLines = SITELINK_PAGES.map((page) => {
    const url = sitelinkPageUrl(origin, page.slug);
    const md = sitelinkMarkdownUrl(origin, page.slug);
    return `- [${page.title}](${url}): ${page.metaDescription}\n  - Markdown for AI crawlers: ${md}`;
  }).join("\n");

  return `# Cheap Stays

> A calmer way to compare stays. Search hotels, apartments, and vacation rentals in one place and book through travel sites you already know.

## Pages

- [Home](${origin}/): Hotel and stay search
- [Español](${origin}/es): Spanish home page
- [Português (Brasil)](${origin}/br): Brazilian Portuguese home page
- [About](${origin}/about): About Cheap Stays
- [Contact](${origin}/contact): Contact and support
- [Privacy](${origin}/privacy): Privacy policy

## Sitelink guides

${sitelinkLines}

## Optional

- [Sitemap](${origin}/sitemap.xml): Index of city, hotel, and sitelink pages
- [Robots](${origin}/robots.txt): Crawler guidance
`;
};
