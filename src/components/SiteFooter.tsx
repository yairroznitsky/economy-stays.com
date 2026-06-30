import { Link } from "react-router-dom";
import { appendLandingIdQuery } from "@/lib/landingTrackingService";
import { siteConfig } from "@/lib/siteConfig";

const footerLinks = [
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/privacy", label: "Privacy" },
] as const;

const SiteFooter = () => {
  return (
    <footer className="border-t border-border bg-background py-10">
      <div className="container flex flex-col items-center gap-4 text-center text-sm text-muted-foreground">
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {footerLinks.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={appendLandingIdQuery(to)}
                  className="text-foreground/80 transition-colors hover:text-primary"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p>
          © {new Date().getFullYear()} {siteConfig.operator || siteConfig.name}. All rights reserved.
          {siteConfig.operator ? ` ${siteConfig.name} is operated by ${siteConfig.operator}.` : null}
        </p>
        <p className="max-w-2xl">
          {siteConfig.name} may receive a commission when you book through partner links.
        </p>
      </div>
    </footer>
  );
};

export default SiteFooter;
