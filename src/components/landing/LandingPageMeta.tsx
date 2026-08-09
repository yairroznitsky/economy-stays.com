import { useEffect } from "react";
import {
  CITY_HERO_SIZES,
  getCityHeroImagePath,
  getCityHeroSrcSet,
} from "@/lib/destinationImages";
import { siteConfig } from "@/lib/siteConfig";
import type { LandingPageConfig } from "@/types/landingPage";

type LandingPageMetaProps = {
  config: LandingPageConfig;
};

const HERO_PRELOAD_ATTR = "data-city-hero-preload";

const upsertMeta = (selector: string, attr: "name" | "property", key: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`
  );
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.content = content;
};

const upsertLink = (rel: string, href: string) => {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
};

const upsertHeroPreload = (citySlug: string) => {
  let element = document.head.querySelector<HTMLLinkElement>(
    `link[${HERO_PRELOAD_ATTR}]`
  );
  if (!element) {
    element = document.createElement("link");
    element.setAttribute(HERO_PRELOAD_ATTR, "true");
    document.head.appendChild(element);
  }
  element.rel = "preload";
  element.as = "image";
  element.href = getCityHeroImagePath(citySlug);
  element.setAttribute("imagesrcset", getCityHeroSrcSet(citySlug));
  element.setAttribute("imagesizes", CITY_HERO_SIZES);
  element.setAttribute("fetchpriority", "high");
};

const LandingPageMeta = ({ config }: LandingPageMetaProps) => {
  useEffect(() => {
    const canonical = config.seo.canonical.startsWith("http")
      ? config.seo.canonical
      : `https://${siteConfig.domain}${config.seo.canonical}`;

    document.title = config.content.metaTitle;

    upsertMeta("", "name", "description", config.content.metaDescription);
    upsertMeta("", "name", "robots", config.seo.noindex ? "noindex,follow" : "index,follow");
    upsertLink("canonical", canonical);
    upsertHeroPreload(config.city.slug);

    upsertMeta("", "property", "og:title", config.content.metaTitle);
    upsertMeta("", "property", "og:description", config.content.metaDescription);
    upsertMeta("", "property", "og:url", canonical);
    upsertMeta("", "property", "og:type", "website");

    return () => {
      document.title = siteConfig.name;
      document.head.querySelector(`link[${HERO_PRELOAD_ATTR}]`)?.remove();
    };
  }, [config]);

  return null;
};

export default LandingPageMeta;
