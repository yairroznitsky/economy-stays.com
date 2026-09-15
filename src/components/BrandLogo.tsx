import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/siteConfig";

interface BrandLogoProps {
  className?: string;
  variant?: "light" | "dark";
}

/**
 * Kayak-style wordmark: "Economy" in charcoal/white + "Stays" in Kayak orange (#FF690F).
 */
const BrandLogo = ({ className, variant = "dark" }: BrandLogoProps) => {
  const isLight = variant === "light";
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-0 leading-none select-none",
        className
      )}
      aria-label={siteConfig.name}
    >
      <span
        className={cn(
          "font-sans font-bold text-[1.5rem] tracking-tight",
          isLight ? "text-white" : "text-foreground"
        )}
      >
        Economy
      </span>
      <span
        className="font-sans font-bold text-[1.5rem] tracking-tight"
        style={{ color: "#FF690F" }}
      >
        Stays
      </span>
    </span>
  );
};

export default BrandLogo;
