import { useState, useMemo } from "react";
import { Star, Map as MapIcon, List, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShortlist } from "@/hooks/useShortlist";
import CityMap from "@/components/landing/CityMap";
import { getLuxuryRoomImage, getLuxuryRoomImageAlt } from "@/lib/luxuryRoomImages";
import type { BrowseHotel } from "@/types/landingPage";

interface HotelDirectoryProps {
  hotels: BrowseHotel[];
  cityName: string;
}

type ViewMode = "list" | "map";

const STAR_OPTIONS = [2, 3, 4, 5];
const TYPE_OPTIONS = ["Hotel", "Apartment", "Resort", "Hostel"];

const formatReviews = (count: number): string =>
  count >= 1000 ? `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(count);

const HotelDirectory = ({ hotels, cityName }: HotelDirectoryProps) => {
  const { toggle, has } = useShortlist();
  const [view, setView] = useState<ViewMode>("list");
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);

  const filtered = useMemo(() => {
    let result = hotels;
    if (starFilter !== null) {
      result = result.filter((h) => h.starRating === starFilter);
    }
    if (typeFilter !== null) {
      result = result.filter(
        (h) => h.type?.toLowerCase() === typeFilter.toLowerCase()
      );
    }
    if (minRating !== null) {
      result = result.filter((h) => (h.rating ?? 0) >= minRating);
    }
    return result;
  }, [hotels, starFilter, typeFilter, minRating]);

  if (hotels.length === 0) return null;

  const FilterBtn = ({
    label,
    active,
    onClick,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary/50"
      )}
    >
      {label}
    </button>
  );

  return (
    <section className="border-b border-border bg-background py-16 md:py-20">
      <div className="container">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
              Browse hotels in {cityName}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtered.length} of {hotels.length} properties
            </p>
          </div>
          {/* view toggle */}
          <div className="flex rounded-lg border border-border bg-card p-0.5">
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                view === "list"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-3.5 w-3.5" aria-hidden />
              List
            </button>
            <button
              type="button"
              onClick={() => setView("map")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                view === "map"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MapIcon className="h-3.5 w-3.5" aria-hidden />
              Map
            </button>
          </div>
        </div>

        {/* filter strip */}
        <div className="mb-6 flex flex-wrap gap-2">
          <FilterBtn
            label="All stars"
            active={starFilter === null}
            onClick={() => setStarFilter(null)}
          />
          {STAR_OPTIONS.map((s) => (
            <FilterBtn
              key={s}
              label={`${s}★`}
              active={starFilter === s}
              onClick={() => setStarFilter(starFilter === s ? null : s)}
            />
          ))}
          <span className="w-px self-stretch bg-border" aria-hidden />
          {TYPE_OPTIONS.map((type) => (
            <FilterBtn
              key={type}
              label={type}
              active={typeFilter === type}
              onClick={() => setTypeFilter(typeFilter === type ? null : type)}
            />
          ))}
          <span className="w-px self-stretch bg-border" aria-hidden />
          <FilterBtn
            label="Rating 8+"
            active={minRating === 8}
            onClick={() => setMinRating(minRating === 8 ? null : 8)}
          />
          <FilterBtn
            label="Rating 9+"
            active={minRating === 9}
            onClick={() => setMinRating(minRating === 9 ? null : 9)}
          />
        </div>

        {view === "map" ? (
          <CityMap hotels={filtered} cityName={cityName} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((hotel) => {
              const shortlisted = has(hotel.id);
              return (
                <li key={hotel.id}>
                  <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-soft hover:shadow-elevated transition">
                    <div className="relative h-36 overflow-hidden bg-muted">
                      <img
                        src={getLuxuryRoomImage(hotel.id)}
                        alt={getLuxuryRoomImageAlt(hotel.name)}
                        width={640}
                        height={360}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      <p className="absolute bottom-2 left-3 right-8 line-clamp-2 text-sm font-semibold text-white drop-shadow-sm">
                        {hotel.name}
                      </p>
                      {/* shortlist button */}
                      <button
                        type="button"
                        aria-label={
                          shortlisted
                            ? `Remove ${hotel.name} from shortlist`
                            : `Add ${hotel.name} to shortlist`
                        }
                        onClick={() =>
                          toggle({
                            id: hotel.id,
                            name: hotel.name,
                            type: hotel.type,
                            starRating: hotel.starRating,
                            rating: hotel.rating,
                            cityName,
                          })
                        }
                        className={cn(
                          "absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                          shortlisted
                            ? "bg-accent text-white"
                            : "bg-black/40 text-white/80 hover:bg-accent hover:text-white"
                        )}
                      >
                        <Heart
                          className="h-3.5 w-3.5"
                          fill={shortlisted ? "currentColor" : "none"}
                          aria-hidden
                        />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 pt-2.5 pb-3 text-xs text-muted-foreground">
                      {hotel.type ? (
                        <span className="capitalize">{hotel.type}</span>
                      ) : null}
                      {hotel.starRating ? (
                        <span className="inline-flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-accent text-accent" aria-hidden />
                          {hotel.starRating}-star
                        </span>
                      ) : null}
                      {hotel.rating != null && hotel.reviews ? (
                        <span>
                          {hotel.rating}/10 · {formatReviews(hotel.reviews)} reviews
                        </span>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No hotels match those filters. Try removing some.
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default HotelDirectory;
