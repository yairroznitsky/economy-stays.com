import { useCallback, useEffect, useRef, useState } from "react";
import { format, isBefore, isSameDay, startOfDay } from "date-fns";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FORM_DESKTOP_BREAKPOINT, useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import {
  requestHotelDestinationAutocomplete,
  requestHotelRedirectUrl,
} from "@/lib/hotelAffiliateApi";
import {
  DESTINATION_PICK_LIST_TOAST,
  isDestinationPickRequiredMessage,
  isSearchValidationMessage,
} from "@/lib/hotelSearchErrors";
import { resolveFirstDestinationSuggestion } from "@/lib/hotelSearchDestination";
import {
  buildHotelSearchInputFromSuggestion,
  getDeviceSkyscannerContext,
} from "@/lib/skyscannerDestinationSearch";
import { validateHotelSearch } from "@/lib/skyscannerHotels";
import { generateClickId, LandingTrackingService } from "@/lib/landingTrackingService";
import {
  buildHotelClickSearchParams,
  trackPartnerExit,
} from "@/lib/partnerClickTracking";
import { trackMetaSearch } from "@/lib/metaPixelTracking";
import { trackTikTokSearch } from "@/lib/tiktokPixelTracking";
import type { HotelDestinationSuggestion } from "@/types/hotels";

const DateRangeStepHeader = ({
  value,
  phase,
  className,
}: {
  value: DateRange | undefined;
  phase: "check-in" | "check-out";
  className?: string;
}) => (
  <div className={cn("grid grid-cols-2 gap-2", className)}>
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5 transition-colors",
        phase === "check-in"
          ? "border-primary bg-primary/5 ring-1 ring-primary/25"
          : value?.from
            ? "border-primary/50 bg-primary/5"
            : "border-border bg-muted/40"
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Check-in
      </p>
      <p
        className={cn(
          "mt-0.5 text-sm font-semibold",
          value?.from ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {value?.from ? format(value.from, "MMM d, yyyy") : "Select date"}
      </p>
    </div>
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5 transition-colors",
        phase === "check-out"
          ? "border-primary bg-primary/5 ring-1 ring-primary/25"
          : "border-border bg-muted/40",
        !value?.from && "opacity-60"
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Check-out
      </p>
      <p
        className={cn(
          "mt-0.5 text-sm font-semibold",
          value?.to ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {value?.to ? format(value.to, "MMM d, yyyy") : "Select date"}
      </p>
    </div>
  </div>
);

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

const desktopFieldPad = "desktop:px-[1.15rem] desktop:py-[0.8625rem]";
const desktopFieldLabel = "desktop:text-[0.8625rem]";
const desktopFieldText = "desktop:text-[1.15rem]";
const desktopFieldIcon = "desktop:h-[1.15rem] desktop:w-[1.15rem]";

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
  const [destinationError, setDestinationError] = useState(false);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  /** Wrapper for destination field + dropdown; used to scroll above mobile keyboard. */
  const destinationFieldRef = useRef<HTMLDivElement>(null);
  const searchSubmitInFlightRef = useRef(false);
  const isMobile = useIsMobile(FORM_DESKTOP_BREAKPOINT);
  const [datesOpen, setDatesOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(range);
  const [calendarMonth, setCalendarMonth] = useState<Date>(range?.from ?? today);

  const startOfToday = startOfDay(new Date());
  const datePickerPhase: "check-in" | "check-out" =
    !draftRange?.from || draftRange?.to ? "check-in" : "check-out";

  const isDateDisabled = useCallback(
    (date: Date) => {
      const day = startOfDay(date);
      if (isBefore(day, startOfToday)) return true;
      if (draftRange?.from && !draftRange?.to) {
        const from = startOfDay(draftRange.from);
        return isBefore(day, from) || isSameDay(day, from);
      }
      return false;
    },
    [draftRange?.from, draftRange?.to, startOfToday]
  );

  const formatDateRangeLabel = (value: DateRange | undefined) => {
    if (!value?.from) return "Add dates";
    if (!value.to) return format(value.from, "MMM d, yyyy");
    return `${format(value.from, "MMM d")} — ${format(value.to, "MMM d, yyyy")}`;
  };

  const openDatePicker = () => {
    setDraftRange(range);
    setCalendarMonth(range?.from ?? today);
    setDatesOpen(true);
  };

  const handleDatesOpenChange = (open: boolean) => {
    if (open) {
      setDraftRange(range);
      setCalendarMonth(range?.from ?? today);
    } else {
      setDraftRange(range);
    }
    setDatesOpen(open);
  };

  const handleRangeDaySelect = useCallback(
    (day: Date) => {
      const clicked = startOfDay(day);
      if (isBefore(clicked, startOfToday)) return;

      const from = draftRange?.from ? startOfDay(draftRange.from) : undefined;
      const to = draftRange?.to ? startOfDay(draftRange.to) : undefined;

      if (!from || to) {
        setDraftRange({ from: clicked, to: undefined });
        return;
      }

      if (isBefore(clicked, from) || isSameDay(clicked, from)) {
        setDraftRange({ from: clicked, to: undefined });
        return;
      }

      const completed = { from, to: clicked };
      setDraftRange(completed);
      setRange(completed);
      setDatesOpen(false);
    },
    [draftRange?.from, draftRange?.to, startOfToday]
  );

  const mobileCalendarClassNames = {
    months: "flex w-full flex-col",
    month: "w-full space-y-3",
    caption: "relative mb-1 flex items-center justify-center pt-1",
    caption_label: "text-base font-semibold",
    nav: "flex items-center gap-1",
    nav_button: cn(
      "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-accent"
    ),
    nav_button_previous: "absolute left-0",
    nav_button_next: "absolute right-0",
    table: "w-full border-collapse",
    head_row: "flex w-full",
    head_cell: "w-[14.28%] text-center text-xs font-medium text-muted-foreground",
    row: "mt-1 flex w-full",
    cell: cn(
      "relative flex h-11 w-[14.28%] items-center justify-center p-0 text-center text-sm",
      "[&:has([aria-selected].day-range-start)]:rounded-l-full",
      "[&:has([aria-selected].day-range-end)]:rounded-r-full",
      "[&:has([aria-selected])]:bg-primary/10"
    ),
    day: cn(
      "h-10 w-10 rounded-full p-0 text-base font-normal transition-colors",
      "aria-selected:opacity-100"
    ),
    day_selected:
      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
    day_today: "bg-primary/15 font-semibold text-primary",
    day_outside: "text-muted-foreground/40 aria-selected:text-muted-foreground",
    day_disabled: "text-muted-foreground/25 opacity-35",
    day_range_start:
      "day-range-start rounded-full bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
    day_range_end:
      "day-range-end rounded-full bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
    day_range_middle: "rounded-none bg-primary/15 aria-selected:bg-primary/15",
  };

  const dateRangeCalendar = (
    <Calendar
      mode="range"
      selected={draftRange}
      onDayClick={handleRangeDaySelect}
      numberOfMonths={isMobile ? 1 : 2}
      month={calendarMonth}
      onMonthChange={setCalendarMonth}
      disabled={isDateDisabled}
      className={cn("pointer-events-auto", isMobile ? "p-2" : "p-3")}
      classNames={isMobile ? mobileCalendarClassNames : undefined}
    />
  );

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

  const promptPickFromList = useCallback(() => {
    setDestinationError(true);
    setIsDestinationLocked(false);
    setSelectedSuggestion(null);
    toast.error(DESTINATION_PICK_LIST_TOAST.title, {
      description: DESTINATION_PICK_LIST_TOAST.description,
    });
    destinationInputRef.current?.focus();
    scrollDestinationFieldIntoMobileView();
    if (destination.trim().length >= 2 && suggestions.length > 0) {
      setIsDropdownOpen(true);
    }
  }, [destination, suggestions.length, scrollDestinationFieldIntoMobileView]);

  useEffect(() => {
    if (isDestinationLocked) {
      setIsAutocompleteLoading(false);
      setIsDropdownOpen(false);
      return;
    }

    const query = destination.trim();
    if (query.length < 2) {
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
        const { market, locale } = getDeviceSkyscannerContext();
        const results = await requestHotelDestinationAutocomplete({
          query,
          locale,
          country: market,
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
    if (!selectedSuggestion) return;
    if (selectedSuggestion.label !== destination.trim()) {
      setSelectedSuggestion(null);
      setIsDestinationLocked(false);
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

    if (isLoading || searchSubmitInFlightRef.current) return;

    if (!destination.trim()) {
      setDestinationError(true);
      if (isDestinationLocked) {
        setIsDestinationLocked(false);
        setSelectedSuggestion(null);
      }
      destinationInputRef.current?.focus();
      scrollDestinationFieldIntoMobileView();
      return;
    }

    if (!range?.from || !range?.to) {
      toast.error("Add your travel dates", {
        description: "Choose check-in and check-out so we can find the right stays.",
      });
      openDatePicker();
      return;
    }

    const trimmedDestination = destination.trim();

    if (trimmedDestination.length < 2) {
      setDestinationError(true);
      toast.error("Keep typing your destination", {
        description: "Enter at least 2 characters, then choose a match from the list.",
      });
      if (isDestinationLocked) {
        setIsDestinationLocked(false);
        setSelectedSuggestion(null);
      }
      destinationInputRef.current?.focus();
      scrollDestinationFieldIntoMobileView();
      return;
    }

    setDestinationError(false);
    searchSubmitInFlightRef.current = true;
    setIsLoading(true);
    try {
      const { market, locale } = getDeviceSkyscannerContext();
      let suggestion = selectedSuggestion;
      if (!suggestion) {
        suggestion = await resolveFirstDestinationSuggestion(
          trimmedDestination,
          suggestions,
          { locale, country: market }
        );
      }

      if (!suggestion) {
        promptPickFromList();
        return;
      }

      const checkIn = format(range.from, "yyyy-MM-dd");
      const checkOut = format(range.to, "yyyy-MM-dd");
      const validationError = validateHotelSearch({
        checkin: checkIn,
        checkout: checkOut,
        adults,
        rooms,
      });
      if (validationError) {
        toast.error(validationError);
        return;
      }

      if (!selectedSuggestion) {
        setDestination(suggestion.label);
        setSelectedSuggestion(suggestion);
        setIsDestinationLocked(true);
        setSuggestions([]);
        setIsDropdownOpen(false);
      }

      const search = buildHotelSearchInputFromSuggestion(suggestion, {
        checkIn,
        checkOut,
        adults,
        children,
        rooms,
        locale,
        market,
      });

      const clickId = generateClickId();
      const landingId = await LandingTrackingService.getOrCreateLandingId();

      const response = await requestHotelRedirectUrl({
        search,
        clickId,
        landingId,
        affiliateSource: "skyscanner",
        metadata: {
          surface: "search_form",
          destination_type: suggestion.type ?? "free_text",
          destination_id: suggestion.id ?? "",
        },
      });

      try {
        trackMetaSearch(search);
        trackTikTokSearch(search);
      } catch {
        // Pixel tracking must not block the redirect.
      }

      await trackPartnerExit({
        partner: "skyscanner-hotels",
        redirectUrl: response.redirectUrl,
        placement: "redirect",
        clickId,
        landingId,
        iataCode: search.airportCode ?? null,
        locationId: response.entityId,
        pickupDateNew: search.checkIn ?? null,
        dropoffDateNew: search.checkOut ?? null,
        searchParams: buildHotelClickSearchParams(search, {
          surface: "search_form",
          destination_type: suggestion.type ?? "free_text",
        }),
        autoParams: false,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not open hotel results.";
      if (isDestinationPickRequiredMessage(message)) {
        promptPickFromList();
      } else if (isSearchValidationMessage(message)) {
        toast.error("Check your search details", { description: message });
      } else {
        toast.error("Could not open hotel results", {
          description: message || "Please try again or pick a destination from the list.",
        });
      }
    } finally {
      searchSubmitInFlightRef.current = false;
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
      noValidate
      className="w-full rounded-2xl bg-booking-yellow p-3 text-left shadow-search desktop:p-[1.15rem]"
    >
      <div className="grid grid-cols-1 gap-2 desktop:grid-cols-[1.5fr_1.5fr_1fr_auto] desktop:gap-[0.575rem]">
        {/* Destination */}
        <div
          ref={destinationFieldRef}
          className={cn(
            "relative rounded-xl border bg-background px-4 py-3 text-left transition-smooth hover:border-primary/40",
            desktopFieldPad,
            destinationError
              ? "border-destructive ring-1 ring-destructive/30"
              : "border-border"
          )}
        >
          <Label
            htmlFor="search-destination"
            className={cn(
              "block text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
              desktopFieldLabel
            )}
          >
            Where
          </Label>
          <div className="mt-1 flex min-w-0 items-center justify-start gap-2 text-left">
            <MapPin className={cn("h-4 w-4 shrink-0 text-primary", desktopFieldIcon)} aria-hidden />
            <input
              id="search-destination"
              ref={destinationInputRef}
              type="text"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                if (destinationError) setDestinationError(false);
              }}
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
                if (destination.trim().length >= 2 && suggestions.length > 0) {
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
              aria-invalid={destinationError}
              aria-describedby={destinationError ? "search-destination-error" : undefined}
              className={cn(
                "min-w-0 flex-1 border-0 bg-transparent p-0 text-left text-base text-foreground shadow-none outline-none",
                desktopFieldText,
                "placeholder:text-left placeholder:text-muted-foreground",
                "focus-visible:ring-0 focus-visible:ring-offset-0"
              )}
            />
          </div>
          {destinationError && (
            <p
              id="search-destination-error"
              className="mt-2 text-xs font-medium text-destructive"
              role="alert"
            >
              Add a destination to continue
            </p>
          )}
          {isAutocompleteLoading && (
            <p className="mt-2 text-xs text-muted-foreground">Finding destinations...</p>
          )}
          {isDropdownOpen && destination.trim().length >= 2 && suggestions.length > 0 && (
            <div className="absolute top-full left-0 z-50 mt-2 w-full rounded-xl border border-border bg-popover p-1 shadow-elevated">
              <ul
                role="listbox"
                className="max-h-60 overflow-auto desktop:max-h-72"
              >
                {suggestions.map((suggestion, index) => (
                  <li key={`${suggestion.type}-${suggestion.id}-${index}`}>
                    <button
                      type="button"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        handleSuggestionSelect(suggestion);
                      }}
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
        {isMobile ? (
          <>
            <button
              type="button"
              onClick={openDatePicker}
              className={cn(
                "rounded-xl border border-border bg-background px-4 py-3 text-left transition-smooth hover:border-primary/40",
                desktopFieldPad
              )}
            >
              <Label
                className={cn(
                  "block text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                  desktopFieldLabel
                )}
              >
                When
              </Label>
              <div className="mt-1 flex items-center justify-start gap-2 text-left">
                <CalendarIcon className={cn("h-4 w-4 shrink-0 text-primary", desktopFieldIcon)} />
                <span
                  className={cn(
                    "text-left text-base",
                    desktopFieldText,
                    !range?.from && "text-muted-foreground"
                  )}
                >
                  {formatDateRangeLabel(range)}
                </span>
              </div>
            </button>
          <Sheet open={datesOpen} onOpenChange={handleDatesOpenChange}>
            <SheetContent
              side="bottom"
              className="max-h-[92dvh] gap-0 rounded-t-2xl px-0 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3"
            >
              <SheetHeader className="space-y-3 px-4 text-left">
                <SheetTitle className="text-lg">Select dates</SheetTitle>
                <DateRangeStepHeader value={draftRange} phase={datePickerPhase} />
                <p className="text-sm text-muted-foreground">
                  {datePickerPhase === "check-in"
                    ? "Tap your check-in date"
                    : "Tap your check-out date"}
                </p>
              </SheetHeader>
              <div className="flex justify-center overflow-x-auto px-2 py-2">
                {dateRangeCalendar}
              </div>
            </SheetContent>
          </Sheet>
          </>
        ) : (
          <Popover open={datesOpen} onOpenChange={handleDatesOpenChange}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                "rounded-xl border border-border bg-background px-4 py-3 text-left transition-smooth hover:border-primary/40",
                desktopFieldPad
              )}
              >
                <Label
                  className={cn(
                    "block text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                    desktopFieldLabel
                  )}
                >
                  When
                </Label>
                <div className="mt-1 flex items-center justify-start gap-2 text-left">
                  <CalendarIcon className={cn("h-4 w-4 shrink-0 text-primary", desktopFieldIcon)} />
                  <span
                    className={cn(
                      "text-left text-base",
                      desktopFieldText,
                      !range?.from && "text-muted-foreground"
                    )}
                  >
                    {formatDateRangeLabel(range)}
                  </span>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="border-b border-border p-3">
                <DateRangeStepHeader value={draftRange} phase={datePickerPhase} />
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {datePickerPhase === "check-in"
                    ? "Select check-in, then check-out"
                    : "Select check-out to finish"}
                </p>
              </div>
              {dateRangeCalendar}
            </PopoverContent>
          </Popover>
        )}

        {/* Guests */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "rounded-xl border border-border bg-background px-4 py-3 text-left transition-smooth hover:border-primary/40",
                desktopFieldPad
              )}
            >
              <Label
                className={cn(
                  "block text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                  desktopFieldLabel
                )}
              >
                Who
              </Label>
              <div className="mt-1 flex items-center justify-start gap-2 text-left">
                <Users className={cn("h-4 w-4 shrink-0 text-primary", desktopFieldIcon)} />
                <span className={cn("text-left text-base", desktopFieldText)}>{guestSummary}</span>
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
          className="h-12 rounded-xl bg-gradient-primary px-8 text-xl font-semibold shadow-elevated transition-smooth hover:opacity-95 active:scale-[0.99] desktop:h-auto desktop:px-[2.3rem] desktop:py-4 desktop:text-[1.725rem]"
        >
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </div>
    </form>
  );
};

export default SearchForm;
