import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  MapPin,
  Users,
  Minus,
  Plus,
  Plane,
  BedDouble,
  Building2,
  Landmark,
  Map,
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import {
  requestHotelDestinationAutocomplete,
  requestHotelRedirectUrl,
} from "@/lib/hotelAffiliateApi";
import { getOrCreateClickId, getOrCreateLandingId } from "@/lib/tracking";
import type { HotelDestinationSuggestion } from "@/types/hotels";

/** Bold the first case-insensitive match of `query` inside `text` (autocomplete mirror). */
const HighlightQuery = ({ text, query }: { text: string; query: string }) => {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <strong className="font-bold">{text.slice(idx, idx + q.length)}</strong>
      {text.slice(idx + q.length)}
    </>
  );
};

const SearchForm = () => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(today.getDate() + 2);

  const [destination, setDestination] = useState("");
  const [range, setRange] = useState<DateRange | undefined>({
    from: tomorrow,
    to: dayAfter,
  });
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<HotelDestinationSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<HotelDestinationSuggestion | null>(null);
  const [isDestinationLocked, setIsDestinationLocked] = useState(false);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  /** Wrapper for destination field + dropdown; used to scroll above mobile keyboard. */
  const destinationFieldRef = useRef<HTMLDivElement>(null);

  const alignDestinationFieldToVisualViewport = useCallback(() => {
    const el = destinationFieldRef.current;
    if (!el || typeof window === "undefined") return;

    const vv = window.visualViewport;
    const padding = 12;
    if (vv) {
      const rect = el.getBoundingClientRect();
      const targetTop = vv.offsetTop + padding;
      const delta = rect.top - targetTop;
      if (Math.abs(delta) > 2) {
        window.scrollTo({
          top: window.scrollY + delta,
          behavior: "auto",
        });
      }
    } else {
      el.scrollIntoView({ block: "start", behavior: "auto", inline: "nearest" });
    }
  }, []);

  const scrollDestinationFieldIntoMobileView = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;

    alignDestinationFieldToVisualViewport();
    requestAnimationFrame(alignDestinationFieldToVisualViewport);
    window.setTimeout(alignDestinationFieldToVisualViewport, 50);
    window.setTimeout(alignDestinationFieldToVisualViewport, 200);
    window.setTimeout(alignDestinationFieldToVisualViewport, 450);
  }, [alignDestinationFieldToVisualViewport]);

  const suggestionIcon = (type: string) => {
    const normalizedType = type.toLowerCase();
    if (normalizedType === "ap" || normalizedType.includes("airport")) {
      return Plane;
    }
    if (normalizedType.includes("hotel") || normalizedType.includes("hostel")) {
      return BedDouble;
    }
    if (
      normalizedType === "city" ||
      normalizedType === "ct" ||
      normalizedType.includes("destination")
    ) {
      return Building2;
    }
    if (normalizedType === "reg" || normalizedType.includes("state")) {
      return Map;
    }
    if (normalizedType === "lm" || normalizedType.includes("landmark")) {
      return Landmark;
    }
    return MapPin;
  };

  const suggestionTypeLabel = (type: string) => {
    const normalizedType = type.toLowerCase();
    if (normalizedType === "reg") return "State";
    if (normalizedType === "ap") return "Airport";
    if (normalizedType === "lm") return "Landmark";
    if (normalizedType === "ct") return "City";
    return normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1);
  };

  const handleSuggestionSelect = (suggestion: HotelDestinationSuggestion) => {
    setDestination(suggestion.label);
    setSelectedSuggestion(suggestion);
    setIsDestinationLocked(true);
    setSuggestions([]);
    setIsDropdownOpen(false);
    setIsAutocompleteLoading(false);
    setActiveSuggestionIndex(-1);
  };

  const readRawString = (raw: Record<string, unknown> | undefined, key: string) => {
    const value = raw?.[key];
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  };

  useEffect(() => {
    if (isDestinationLocked) {
      setIsAutocompleteLoading(false);
      setIsDropdownOpen(false);
      return;
    }

    const query = destination.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      setIsAutocompleteLoading(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    let isCancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setIsAutocompleteLoading(true);
      try {
        const results = await requestHotelDestinationAutocomplete({
          query,
          locale: "en",
          country: "US",
        });

        if (isCancelled) return;
        setSuggestions(results.slice(0, 10));
        setIsDropdownOpen(results.length > 0);
        setActiveSuggestionIndex(-1);
      } catch {
        if (isCancelled) return;
        setSuggestions([]);
        setIsDropdownOpen(false);
      } finally {
        if (!isCancelled) {
          setIsAutocompleteLoading(false);
        }
      }
    }, 300);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [destination, isDestinationLocked]);

  useEffect(() => {
    if (selectedSuggestion && selectedSuggestion.label !== destination.trim()) {
      setSelectedSuggestion(null);
    }
  }, [destination, selectedSuggestion]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const onViewportChange = () => {
      if (document.activeElement !== destinationInputRef.current) return;
      if (!window.matchMedia("(max-width: 767px)").matches) return;
      alignDestinationFieldToVisualViewport();
    };

    vv.addEventListener("resize", onViewportChange);
    vv.addEventListener("scroll", onViewportChange);
    return () => {
      vv.removeEventListener("resize", onViewportChange);
      vv.removeEventListener("scroll", onViewportChange);
    };
  }, [alignDestinationFieldToVisualViewport]);

  useEffect(() => {
    if (!isDropdownOpen || suggestions.length === 0) return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    const id = window.requestAnimationFrame(() => scrollDestinationFieldIntoMobileView());
    return () => window.cancelAnimationFrame(id);
  }, [isDropdownOpen, suggestions.length, scrollDestinationFieldIntoMobileView]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim() || !range?.from || !range?.to) return;

    setIsLoading(true);
    try {
      const deriveCountry = () => {
        const rawCountry = readRawString(selectedSuggestion?.raw, "country");
        if (rawCountry) return rawCountry;
        const candidate = selectedSuggestion?.subtitle || selectedSuggestion?.label || destination;
        const parts = candidate
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean);
        return parts.length > 0 ? parts[parts.length - 1] : "US";
      };

      const destinationId =
        readRawString(selectedSuggestion?.raw, "city_id") ?? selectedSuggestion?.id;
      const hotelId = readRawString(selectedSuggestion?.raw, "hotel_id");
      const airportPlaceId = readRawString(selectedSuggestion?.raw, "place_id");
      const airportCode =
        readRawString(selectedSuggestion?.raw, "airport_code") ??
        readRawString(selectedSuggestion?.raw, "apicode");
      const airportName = readRawString(selectedSuggestion?.raw, "airport_name");
      const cityName =
        readRawString(selectedSuggestion?.raw, "city") ??
        selectedSuggestion?.label.split(",")[0]?.trim();
      const stateName = readRawString(selectedSuggestion?.raw, "state");

      const response = await requestHotelRedirectUrl({
        search: {
          destination: destination.trim(),
          destinationId,
          hotelId,
          airportPlaceId,
          airportCode,
          airportName,
          cityName,
          stateName,
          countryName: deriveCountry(),
          checkIn: format(range.from, "yyyy-MM-dd"),
          checkOut: format(range.to, "yyyy-MM-dd"),
          adults,
          children,
          // TODO: Replace with explicit child age picker once available.
          childrenAges: children > 0 ? Array.from({ length: children }, () => 8) : [],
          rooms,
          locale: "en",
          country: deriveCountry(),
        },
        clickId: getOrCreateClickId(),
        landingId: getOrCreateLandingId(),
        affiliateSource: "kayak",
        metadata: {
          surface: "search_form",
          destination_type: selectedSuggestion?.type ?? "free_text",
          destination_id: selectedSuggestion?.id ?? "",
        },
      });

      window.open(response.redirectUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not open hotel results.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const guestSummary = `${adults + children} guest${
    adults + children !== 1 ? "s" : ""
  } · ${rooms} room${rooms !== 1 ? "s" : ""}`;

  const Stepper = ({
    label,
    sub,
    value,
    onChange,
    min = 0,
    max,
  }: {
    label: string;
    sub?: string;
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
  }) => (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-6 text-center font-medium">{value}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onChange(value + 1)}
          disabled={typeof max === "number" ? value >= max : false}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-2xl bg-booking-yellow p-3 shadow-search md:p-4"
    >
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[1.5fr_1.5fr_1fr_auto]">
        {/* Destination */}
        <div
          ref={destinationFieldRef}
          className="relative rounded-xl border border-border bg-background px-4 py-3 transition-smooth hover:border-primary/40"
        >
          <Label
            htmlFor="search-destination"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Where
          </Label>
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <input
              id="search-destination"
              ref={destinationInputRef}
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              readOnly={isDestinationLocked}
              spellCheck={false}
              onClick={() => {
                if (!isDestinationLocked) return;
                setIsDestinationLocked(false);
                setSelectedSuggestion(null);
                setActiveSuggestionIndex(-1);
                destinationInputRef.current?.focus();
              }}
              onFocus={() => {
                if (isDestinationLocked) return;
                scrollDestinationFieldIntoMobileView();
                if (destination.trim().length >= 3 && suggestions.length > 0) {
                  setIsDropdownOpen(true);
                }
              }}
              onBlur={() => {
                window.setTimeout(() => {
                  setIsDropdownOpen(false);
                  setActiveSuggestionIndex(-1);
                }, 120);
              }}
              onKeyDown={(event) => {
                if (!isDropdownOpen || suggestions.length === 0) {
                  if (event.key === "Escape") {
                    setIsDropdownOpen(false);
                  }
                  return;
                }

                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveSuggestionIndex((current) =>
                    Math.min(current + 1, suggestions.length - 1)
                  );
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveSuggestionIndex((current) => Math.max(current - 1, 0));
                } else if (event.key === "Enter" && activeSuggestionIndex >= 0) {
                  event.preventDefault();
                  handleSuggestionSelect(suggestions[activeSuggestionIndex]);
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  setIsDropdownOpen(false);
                  setActiveSuggestionIndex(-1);
                }
              }}
              placeholder="City, stay, or destination"
              autoComplete="off"
              className={cn(
                "min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-foreground shadow-none outline-none",
                "placeholder:text-muted-foreground",
                "focus-visible:ring-0 focus-visible:ring-offset-0"
              )}
              required
            />
          </div>
          {isAutocompleteLoading && (
            <p className="mt-2 text-xs text-muted-foreground">Finding destinations...</p>
          )}
          {isDropdownOpen && destination.trim().length >= 3 && suggestions.length > 0 && (
            <div className="absolute top-full left-0 z-50 mt-2 w-full rounded-xl border border-border bg-popover p-1 shadow-elevated">
              <ul role="listbox" className="max-h-72 overflow-auto">
                {suggestions.map((suggestion, index) => (
                  <li key={`${suggestion.type}-${suggestion.id}-${index}`}>
                    <button
                      type="button"
                      onMouseDown={() => handleSuggestionSelect(suggestion)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-smooth",
                        activeSuggestionIndex === index
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/70"
                      )}
                    >
                      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        {(() => {
                          const Icon = suggestionIcon(suggestion.type);
                          return <Icon className="h-4 w-4" />;
                        })()}
                      </span>
                      <span className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          <HighlightQuery text={suggestion.label} query={destination} />
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          <span className="capitalize">
                            <HighlightQuery
                              text={suggestionTypeLabel(suggestion.type)}
                              query={destination}
                            />
                          </span>
                          {suggestion.subtitle ? (
                            <>
                              <span> · </span>
                              <HighlightQuery text={suggestion.subtitle} query={destination} />
                            </>
                          ) : null}
                        </p>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Dates */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="rounded-xl border border-border bg-background px-4 py-3 text-left transition-smooth hover:border-primary/40"
            >
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                When
              </Label>
              <div className="mt-1 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 shrink-0 text-primary" />
                <span
                  className={cn(
                    "text-base",
                    !range?.from && "text-muted-foreground"
                  )}
                >
                  {range?.from ? (
                    range.to ? (
                      <>
                        {format(range.from, "MMM d")} —{" "}
                        {format(range.to, "MMM d, yyyy")}
                      </>
                    ) : (
                      format(range.from, "MMM d, yyyy")
                    )
                  ) : (
                    "Add dates"
                  )}
                </span>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              numberOfMonths={2}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {/* Guests */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="rounded-xl border border-border bg-background px-4 py-3 text-left transition-smooth hover:border-primary/40"
            >
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Who
              </Label>
              <div className="mt-1 flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-base">{guestSummary}</span>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="start">
            <Stepper
              label="Adults"
              sub="Age 13+"
              value={adults}
              onChange={setAdults}
              min={1}
              max={6}
            />
            <Stepper
              label="Children"
              sub="Age 0–12"
              value={children}
              onChange={setChildren}
              max={6}
            />
            <Stepper
              label="Rooms"
              value={rooms}
              onChange={setRooms}
              min={1}
            />
          </PopoverContent>
        </Popover>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
          className="h-12 rounded-xl bg-gradient-primary px-8 text-xl font-semibold shadow-elevated transition-smooth hover:opacity-95 active:scale-[0.99] md:h-auto md:px-8 md:text-2xl"
        >
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </div>
    </form>
  );
};

export default SearchForm;
