import type { LandingPageIntent } from "@/types/landingPage";
import { Sparkles, Star } from "lucide-react";

type IntentBadgesProps = {
  intent: LandingPageIntent;
};

const formatAmenity = (value: string): string =>
  value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const IntentBadges = ({ intent }: IntentBadgesProps) => {
  const badges: string[] = [];

  if (intent.starRating) {
    badges.push(`${intent.starRating}-star`);
  }
  if (intent.audience) {
    badges.push(formatAmenity(intent.audience));
  }
  if (intent.amenities?.length) {
    badges.push(...intent.amenities.slice(0, 2).map(formatAmenity));
  }
  if (intent.category && badges.length < 3) {
    badges.push(formatAmenity(intent.category));
  }

  if (badges.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
      {badges.slice(0, 4).map((badge) => (
        <span
          key={badge}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/90 backdrop-blur-sm md:text-sm"
        >
          {badge.includes("star") ? (
            <Star className="h-3 w-3 fill-accent text-accent" aria-hidden />
          ) : (
            <Sparkles className="h-3 w-3 text-accent" aria-hidden />
          )}
          {badge}
        </span>
      ))}
    </div>
  );
};

export default IntentBadges;
