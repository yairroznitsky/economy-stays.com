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
  const isLight = variant === "light";
  const wordmarkColor = isLight ? "text-primary-foreground" : "text-[#003580]";

  return (
    <span className={cn("inline-flex items-center gap-3 leading-none", className)}>
      <span
        className={cn(
          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-soft",
          iconClassName
        )}
      >
        <svg
          viewBox="0 0 64 64"
          className="h-10 w-10"
          role="img"
          aria-label="Secret Bookings logo icon"
        >
          <rect x="1.5" y="1.5" width="61" height="61" rx="12" fill="#003580" />
          <path
            d="M23 24V19c0-7 4-12 9-12s9 5 9 12v5"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <rect x="13" y="24" width="19" height="30" rx="3" fill="#FFFFFF" />
          <rect x="31" y="24" width="20" height="30" rx="3" fill="#D4A24C" />
          <path d="M25.2 38.2a2.8 2.8 0 1 0-3.8 2.6V45h2.1v-4.2a2.8 2.8 0 0 0 1.7-2.6Z" fill="#003580" />
          <rect x="35.5" y="28.5" width="11.5" height="7.5" rx="1.2" fill="#FFFFFF" opacity="0.92" />
          <rect x="35.5" y="38.5" width="11.5" height="11.5" rx="1.2" fill="#FFFFFF" opacity="0.92" />
          <rect x="37.3" y="40.3" width="3.2" height="3.2" rx="0.4" fill="#D4A24C" />
          <rect x="41.8" y="40.3" width="3.2" height="3.2" rx="0.4" fill="#D4A24C" />
          <rect x="37.3" y="44.8" width="3.2" height="3.2" rx="0.4" fill="#D4A24C" />
          <rect x="41.8" y="44.8" width="3.2" height="3.2" rx="0.4" fill="#D4A24C" />
        </svg>
      </span>
      {!compact && (
        <span
          className={cn(
            "font-display text-[1.55rem] font-bold tracking-tight md:text-[1.7rem]",
            wordmarkColor,
            textClassName
          )}
        >
          Secret Bookings
        </span>
      )}
    </span>
  );
};

export default BrandLogo;
