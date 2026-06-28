import { cn } from "@/lib/utils";

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
  const wordmarkClass =
    "font-brand whitespace-nowrap text-[1.05em] font-extrabold leading-none tracking-[-0.02em] text-booking-yellow";

  return (
    <span
      aria-label="Cheap Stays"
      className={cn(
        "inline-flex max-w-full items-center justify-center leading-none",
        !compact && ["gap-0.5", fluidWordmarkSize, "md:gap-1", textClassName],
        className
      )}
    >
      {!compact ? (
        <>
          <span className={wordmarkClass} aria-hidden>
            Cheap
          </span>
          <img
            src="/logo-icon.png"
            width={180}
            height={180}
            alt=""
            aria-hidden
            className={cn(
              "h-[1.3em] w-[1.3em] shrink-0 self-center bg-transparent object-contain",
              iconClassName
            )}
          />
          <span className={wordmarkClass} aria-hidden>
            Stays
          </span>
        </>
      ) : (
        <img
          src="/logo-icon.png"
          width={180}
          height={180}
          alt=""
          role="img"
          aria-label="Cheap Stays"
          className={cn(
            "h-[1.3em] w-[1.3em] shrink-0 self-center bg-transparent object-contain",
            iconClassName
          )}
        />
      )}
    </span>
  );
};

export default BrandLogo;
