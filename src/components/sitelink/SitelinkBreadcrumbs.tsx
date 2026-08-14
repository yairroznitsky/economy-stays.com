import { Link } from "react-router-dom";
import type { SitelinkPageConfig } from "@/lib/sitelinkPages";

type SitelinkBreadcrumbsProps = {
  page: SitelinkPageConfig;
};

const SitelinkBreadcrumbs = ({ page }: SitelinkBreadcrumbsProps) => (
  <nav aria-label="Breadcrumb" className="border-b border-border bg-background">
    <ol className="container flex flex-wrap items-center gap-2 py-3 text-sm text-muted-foreground">
      <li>
        <Link to="/" className="underline-offset-4 hover:text-foreground hover:underline">
          Home
        </Link>
      </li>
      <li aria-hidden="true">/</li>
      <li className="text-foreground">
        <span aria-current="page">{page.title}</span>
      </li>
    </ol>
  </nav>
);

export default SitelinkBreadcrumbs;
