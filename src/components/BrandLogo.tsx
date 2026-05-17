import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  textClassName?: string;
  iconClassName?: string;
  variant?: "light" | "dark";
  compact?: boolean;
}

const BrandLogo = ({
  className,
  textClassName,
  iconClassName,
  variant = "dark",
  compact = false,
}: BrandLogoProps) => {
  const wordmarkClass =
    "font-display font-bold leading-none tracking-tight text-booking-yellow";

  return (
    <span
      aria-label="Secret Bookings"
      className={cn(
        "inline-flex items-center leading-none",
        !compact && ["gap-2 text-[2.625rem] md:gap-3 md:text-[3.825rem]", textClassName],
        className
      )}
    >
      {!compact ? (
        <>
          <span className={wordmarkClass} aria-hidden>
            Secret
          </span>
          <img
            src="/logo-icon.png"
            width={180}
            height={180}
            alt=""
            aria-hidden
            className={cn(
              "h-[1em] w-[1em] shrink-0 self-center bg-transparent object-contain",
              iconClassName
            )}
          />
          <span className={wordmarkClass} aria-hidden>
            Bookings
          </span>
        </>
      ) : (
        <img
          src="/logo-icon.png"
          width={180}
          height={180}
          alt=""
          role="img"
          aria-label="Secret Bookings"
          className={cn(
            "h-[1em] w-[1em] shrink-0 self-center bg-transparent object-contain",
            iconClassName
          )}
        />
      )}
    </span>
  );
};

export default BrandLogo;
