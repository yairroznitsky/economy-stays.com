import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";
import { useLandingI18n } from "@/i18n/landing";

interface HeaderProps {
  /** Force the solid (scrolled) style — use on non-hero pages */
  solid?: boolean;
}

const Header = ({ solid = false }: HeaderProps) => {
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLandingI18n();

  const isSolid = solid || scrolled;

  useEffect(() => {
    if (solid) return;
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [solid]);

  return (
    <header
      className={[
        "fixed top-0 left-0 right-0 z-30 transition-all duration-300",
        isSolid
          ? "bg-background/95 backdrop-blur-sm shadow-soft"
          : "bg-transparent",
      ].join(" ")}
    >
      <div className="container flex items-center justify-between py-4">
        <Link to="/" aria-label="Economy Stays – home">
          <BrandLogo variant={isSolid ? "dark" : "light"} />
        </Link>
        <nav aria-label="Site navigation">
          <ul className="flex items-center gap-6 text-sm font-medium">
            <li>
              <Link
                to="/about"
                className={[
                  "transition-colors hover:text-accent",
                  isSolid ? "text-foreground/80" : "text-white/90",
                ].join(" ")}
              >
                {t.footer.about}
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className={[
                  "transition-colors hover:text-accent",
                  isSolid ? "text-foreground/80" : "text-white/90",
                ].join(" ")}
              >
                {t.footer.contact}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
