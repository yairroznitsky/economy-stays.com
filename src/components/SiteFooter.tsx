import { Link } from "react-router-dom";
import { useLandingI18n } from "@/i18n/landing";
import { appendLandingIdQuery } from "@/lib/landingTrackingService";
import { siteConfig } from "@/lib/siteConfig";

const SiteFooter = () => {
  const { t } = useLandingI18n();

  const footerLinks = [
    { to: "/about", label: t.footer.about },
    { to: "/contact", label: t.footer.contact },
    { to: "/privacy", label: t.footer.privacy },
  ] as const;

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
          © {new Date().getFullYear()} {siteConfig.operator || siteConfig.name}.{" "}
          {t.footer.rightsReserved}
          {siteConfig.operator
            ? ` ${t.footer.operatedBy(siteConfig.name, siteConfig.operator)}`
            : null}
        </p>
        <p className="max-w-2xl">{t.footer.commission(siteConfig.name)}</p>
      </div>
    </footer>
  );
};

export default SiteFooter;
