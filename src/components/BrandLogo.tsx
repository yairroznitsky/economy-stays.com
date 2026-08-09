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
  compact = false,
}: BrandLogoProps) => {
  const wordmarkClass = cn(
    "font-brand whitespace-nowrap text-[1.05em] font-extrabold leading-none tracking-[-0.02em] text-accent"
  );

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center justify-center leading-none",
        !compact && ["gap-[0.0875rem]", fluidWordmarkSize, "md:gap-[0.175rem]", textClassName],
        className
      )}
    >
      {!compact ? (
        <>
          <img
            src="/logo-icon.webp"
            width={96}
            height={96}
            alt=""
            aria-hidden
            decoding="async"
            className={cn(
              "-ml-1 h-[1.94em] w-[1.94em] shrink-0 self-center bg-transparent object-contain md:-ml-1.5",
              iconClassName
            )}
          />
          <span className={wordmarkClass}>{siteConfig.wordmark}</span>
        </>
      ) : (
        <img
          src="/logo-icon.webp"
          width={96}
          height={96}
          alt={siteConfig.name}
          decoding="async"
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
