import { Link } from "react-router-dom";
import { useLandingI18n } from "@/i18n/landing";
import { appendLandingIdQuery } from "@/lib/landingTrackingService";
import { siteConfig } from "@/lib/siteConfig";
import BrandLogo from "@/components/BrandLogo";

const SiteFooter = () => {
  const { t } = useLandingI18n();

  const footerLinks = [
    { to: "/about", label: t.footer.about },
    { to: "/contact", label: t.footer.contact },
    { to: "/privacy", label: t.footer.privacy },
  ] as const;

  return (
    <footer className="bg-primary text-primary-foreground py-10">
      <div className="container flex flex-col items-center gap-5 text-center text-sm">
        <BrandLogo variant="light" />
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {footerLinks.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={appendLandingIdQuery(to)}
                  className="text-white/80 transition-colors hover:text-white"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-white/60">
          © {new Date().getFullYear()} {siteConfig.name}.{" "}
          {t.footer.rightsReserved}
        </p>
        <p className="max-w-2xl text-white/50">{t.footer.commission(siteConfig.name)}</p>
      </div>
    </footer>
  );
};

export default SiteFooter;
