import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/siteConfig";

interface BrandLogoProps {
  className?: string;
  textClassName?: string;
  iconClassName?: string;
  variant?: "light" | "dark";
  compact?: boolean;
}

/** Scales wordmark + icon to fit typical container padding (2rem per side) on narrow viewports. */
const fluidWordmarkSize =
  "text-[clamp(1.125rem,calc((100vw-4rem)/14),2.775rem)] md:text-[3.825rem]";

const BrandLogo = ({
  className,
  textClassName,
  iconClassName,
  variant = "dark",
  compact = false,
}: BrandLogoProps) => {
  const wordmarkClass = cn(
    "font-brand whitespace-nowrap text-[1.05em] font-extrabold leading-none tracking-[-0.02em]",
    variant === "light" ? "text-primary-foreground" : "text-primary"
  );

  return (
    <span
      aria-label={siteConfig.name}
      className={cn(
        "inline-flex max-w-full items-center justify-center leading-none",
        !compact && ["gap-[0.0875rem]", fluidWordmarkSize, "md:gap-[0.175rem]", textClassName],
        className
      )}
    >
      {!compact ? (
        <>
          <img
            src="/logo-icon.png"
            width={180}
            height={180}
            alt=""
            aria-hidden
            className={cn(
              "-ml-1 h-[1.94em] w-[1.94em] shrink-0 self-center bg-transparent object-contain md:-ml-1.5",
              iconClassName
            )}
          />
          <span className={wordmarkClass} aria-hidden>
            {siteConfig.wordmark}
          </span>
        </>
      ) : (
        <img
          src="/logo-icon.png"
          width={180}
          height={180}
          alt=""
          role="img"
          aria-label={siteConfig.name}
          className={cn(
            "h-[1.94em] w-[1.94em] shrink-0 self-center bg-transparent object-contain",
            iconClassName
          )}
        />
      )}
    </span>
  );
};

export default BrandLogo;
