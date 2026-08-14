import type { SitelinkPageConfig } from "@/lib/sitelinkPages";
import { buildSitelinkJsonLd } from "@/lib/sitelinkSeo";

type SitelinkJsonLdProps = {
  page: SitelinkPageConfig;
  origin: string;
};

const SitelinkJsonLd = ({ page, origin }: SitelinkJsonLdProps) => {
  const jsonLd = buildSitelinkJsonLd(page, origin);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};

export default SitelinkJsonLd;
