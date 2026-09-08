import { useCallback, useEffect, useRef, useState } from "react";
import { format, isBefore, isSameDay, startOfDay } from "date-fns";
import { enUS, es as esLocale, ptBR as ptBRLocale, type Locale } from "date-fns/locale";
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
  isDestinationPickRequiredMessage,
  isSearchValidationMessage,
} from "@/lib/hotelSearchErrors";
import { translateValidationMessage, useLandingI18n } from "@/i18n/landing";
import { resolveFirstDestinationSuggestion } from "@/lib/hotelSearchDestination";
import {
  buildHotelSearchInputFromSuggestion,
  getDeviceKayakAutocompleteContext,
  isIataQuery,
  pickBestIataSuggestion,
  readSuggestionAirportCode,
} from "@/lib/kayakDestinationSearch";
import { validateHotelSearch } from "@/lib/skyscannerHotels";
import { generateClickId, LandingTrackingService } from "@/lib/landingTrackingService";
import {
  buildHotelClickSearchParams,
  recordPartnerClick,
  trackPartnerExit,
} from "@/lib/partnerClickTracking";
import { getHotelAffiliateRouting, is2PopMode } from "@/lib/bookingMode";
import { buildCjBookingUrl } from "@/lib/cjBooking";
import { trackMetaSearch } from "@/lib/metaPixelTracking";
import {
  isSpiderMode,
  pickRandomSpiderDateRange,
  pickRandomSpiderDestination,
  SPIDER_DEADLINE_MS,
} from "@/lib/spiderMode";
import { trackTikTokSearch } from "@/lib/tiktokPixelTracking";
import type { HotelDestinationSuggestion } from "@/types/hotels";

export interface SearchFormDefaults {
  destinationQuery?: string;
  nightsOffsetDays?: number;
  stayNights?: number;
  adults?: number;
  rooms?: number;
  kayakDestinationId?: string;
  kayakCitySlug?: string;
  cityName?: string;
  countryName?: string;
  lockDestination?: boolean;
  latitude?: number;
  longitude?: number;
  /**
   * Increment this to re-apply defaults after the initial mount (e.g. when
   * geo location resolves or the user changes the date chip). Destination is
   * only re-applied if the user has not manually edited the destination field.
   * Callers that omit this field get the existing one-shot behaviour.
   */
  defaultsVersion?: number;
}

export interface SearchFormTrackingContext {
  landingPageId?: string;
  cityId?: string;
  intentId?: string;
  surface?: string;
}

export interface SearchFormProps {
  defaults?: SearchFormDefaults;
  trackingContext?: SearchFormTrackingContext;
}

const dateStepActive =
  "border-primary bg-primary/15 ring-2 ring-primary/40 shadow-sm scale-[1.02]";
const dateStepIdle = "border-border bg-muted/40";
const dateStepDone = "border-border bg-muted/30";

const DateRangeStepHeader = ({
  value,
  phase,
  className,
  labels,
  dateLocale,
}: {
  value: DateRange | undefined;
  phase: "check-in" | "check-out";
  className?: string;
  labels: {
    checkIn: string;
    checkOut: string;
    selectCheckIn: string;
    selectCheckOut: string;
    selectDate: string;
  };
  dateLocale: Locale;
}) => (
  <div className={cn("grid grid-cols-2 gap-2", className)}>
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5 transition-all duration-200",
        phase === "check-in" ? dateStepActive : value?.from ? dateStepDone : dateStepIdle
      )}
    >
      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-wide",
          phase === "check-in" ? "text-primary" : "text-muted-foreground"
        )}
      >
        {labels.checkIn}
      </p>
      <p
        className={cn(
          "mt-0.5 text-sm font-semibold",
          value?.from
            ? "text-foreground"
            : phase === "check-in"
              ? "text-primary"
              : "text-muted-foreground"
        )}
      >
        {value?.from
          ? format(value.from, "MMM d, yyyy", { locale: dateLocale })
          : labels.selectCheckIn}
      </p>
    </div>
    <div
      key={phase === "check-out" ? "check-out-active" : "check-out-idle"}
      className={cn(
        "rounded-xl border px-3 py-2.5 transition-all duration-200",
        phase === "check-out"
          ? cn(dateStepActive, "animate-in zoom-in-95 fade-in-0 duration-300")
          : dateStepIdle,
        !value?.from && "opacity-60"
      )}
    >
      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-wide",
          phase === "check-out" ? "text-primary" : "text-muted-foreground"
        )}
      >
        {labels.checkOut}
      </p>
      <p
        className={cn(
          "mt-0.5 text-sm font-semibold",
          value?.to
            ? "text-foreground"
            : phase === "check-out"
              ? "text-primary"
              : "text-muted-foreground"
        )}
      >
        {value?.to
          ? format(value.to, "MMM d, yyyy", { locale: dateLocale })
          : phase === "check-out"
            ? labels.selectCheckOut
            : labels.selectDate}
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
const searchFieldShell =
  "rounded-xl border bg-background px-4 py-3 text-left transition-smooth hover:border-primary/40 desktop:h-[4.5625rem]";
const searchFieldValueRow = "mt-1 flex min-w-0 items-center justify-start gap-2 text-left";
const searchFieldValueText =
  "min-w-0 flex-1 truncate whitespace-nowrap text-left text-base text-foreground";

const SearchForm = ({ defaults, trackingContext }: SearchFormProps = {}) => {
  const { locale: landingLocale, t } = useLandingI18n();
  const dateLocale =
    landingLocale === "es" ? esLocale : landingLocale === "pt-BR" ? ptBRLocale : enUS;
  const dateLabels = {
    checkIn: t.search.checkIn,
    checkOut: t.search.checkOut,
    selectCheckIn: t.search.selectCheckIn,
    selectCheckOut: t.search.selectCheckOut,
    selectDate: t.search.selectDate,
  };

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
  const formRef = useRef<HTMLFormElement>(null);
  const spiderRanRef = useRef(false);
  const searchSubmitInFlightRef = useRef(false);
  const isMobile = useIsMobile(FORM_DESKTOP_BREAKPOINT);
  const [datesOpen, setDatesOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(range);
  const [calendarMonth, setCalendarMonth] = useState<Date>(range?.from ?? today);
  // Tracks the last applied defaultsVersion (or -1 before first apply).
  const appliedVersionRef = useRef(-1);
  // True once the user has manually typed in the destination field.
  const userEditedDestinationRef = useRef(false);
  const defaultCoordinatesRef = useRef<{ latitude?: number; longitude?: number }>(
    {}
  );

  useEffect(() => {
    if (!defaults) return;
    const version = defaults.defaultsVersion ?? 0;
    if (appliedVersionRef.current === version) return;

    const isFirstApply = appliedVersionRef.current === -1;
    appliedVersionRef.current = version;

    // Always apply dates when version changes (e.g. date chip clicks).
    const offsetDays = defaults.nightsOffsetDays ?? 1;
    const stayNights = defaults.stayNights ?? 1;
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + offsetDays);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + stayNights);
    setRange({ from: checkIn, to: checkOut });

    // Apply guests only on first apply (backward-compatible).
    if (isFirstApply) {
      setAdults(defaults.adults ?? 2);
      setRooms(defaults.rooms ?? 1);
    }

    // Destination: only on first apply or if the user has not manually typed.
    const shouldApplyDestination = isFirstApply || !userEditedDestinationRef.current;
    if (!shouldApplyDestination) return;

    defaultCoordinatesRef.current = {
      latitude: defaults.latitude,
      longitude: defaults.longitude,
    };

    const displayDestination =
      defaults.cityName?.trim() || defaults.destinationQuery || "";
    setDestination(displayDestination);

    setSuggestions([]);
    setIsDropdownOpen(false);
    setIsAutocompleteLoading(false);
    setActiveSuggestionIndex(-1);

    const shouldLock =
      defaults.lockDestination !== false && Boolean(displayDestination);

    if (!shouldLock) return;

    if (defaults.kayakDestinationId) {
      const suggestion: HotelDestinationSuggestion = {
        id: defaults.kayakDestinationId,
        label: displayDestination,
        type: "city",
        subtitle: defaults.countryName,
      };
      setSelectedSuggestion(suggestion);
      setIsDestinationLocked(true);
      return;
    }

    setIsDestinationLocked(true);

    void (async () => {
      try {
        const { locale, marketCountry } = getDeviceKayakAutocompleteContext();
        const query = [defaults.cityName, defaults.countryName]
          .filter(Boolean)
          .join(", ");
        const results = await requestHotelDestinationAutocomplete({
          query,
          locale,
          country: marketCountry,
        });
        const top = results[0];
        if (top) {
          setSelectedSuggestion(top);
        }
      } catch {
        // Submit flow resolves destination if needed.
      } finally {
        setSuggestions([]);
        setIsDropdownOpen(false);
        setIsAutocompleteLoading(false);
      }
    })();
  }, [defaults]);

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
    if (!value?.from) return t.search.pickDates;
    if (!value.to) return format(value.from, "MMM d, yyyy", { locale: dateLocale });
    return `${format(value.from, "MMM d", { locale: dateLocale })} — ${format(value.to, "MMM d, yyyy", { locale: dateLocale })}`;
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
    if (normalizedType === "reg") return t.search.suggestionType.state;
    if (normalizedType === "ap") return t.search.suggestionType.airport;
    if (normalizedType === "lm") return t.search.suggestionType.landmark;
    if (normalizedType === "ct") return t.search.suggestionType.city;
    return normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1);
  };

  const suggestionSubtitle = (suggestion: HotelDestinationSuggestion) => {
    const typeLabel = suggestionTypeLabel(suggestion.type);
    const airportCode = readSuggestionAirportCode(suggestion);
    const parts = [typeLabel];
    if (airportCode) {
      parts.push(airportCode);
    }
    if (suggestion.subtitle) {
      parts.push(suggestion.subtitle);
    }
    return parts.join(" · ");
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
    toast.error(t.destinationPickTitle, {
      description: t.destinationPickDesc,
    });
    destinationInputRef.current?.focus();
    if (destination.trim().length >= 3 && suggestions.length > 0) {
      setIsDropdownOpen(true);
    }
  }, [destination, suggestions.length, t]);

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
        const { locale, marketCountry } = getDeviceKayakAutocompleteContext();
        const results = await requestHotelDestinationAutocomplete({
          query,
          locale,
          country: marketCountry,
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
    const display = destination.trim();
    const prefillCity = defaults?.cityName?.trim();
    if (prefillCity && display === prefillCity) return;
    if (selectedSuggestion.label !== display) {
      setSelectedSuggestion(null);
      setIsDestinationLocked(false);
    }
  }, [destination, selectedSuggestion, defaults?.cityName]);

  useEffect(() => {
    if (spiderRanRef.current || !isSpiderMode()) return;
    spiderRanRef.current = true;

    let cancelled = false;
    let submitted = false;
    const submitSearch = () => {
      if (cancelled || submitted) return;
      submitted = true;
      window.setTimeout(() => {
        if (!cancelled) {
          formRef.current?.requestSubmit();
        }
      }, 0);
    };

    const deadlineTimer = window.setTimeout(submitSearch, SPIDER_DEADLINE_MS);

    const destinationQuery = pickRandomSpiderDestination();
    setDestination(destinationQuery);
    setRange(pickRandomSpiderDateRange());

    void (async () => {
      try {
        const { locale, marketCountry } = getDeviceKayakAutocompleteContext();
        const results = await requestHotelDestinationAutocomplete({
          query: destinationQuery,
          locale,
          country: marketCountry,
        });

        if (cancelled) return;

        const topSuggestion = results[0];
        if (topSuggestion) {
          handleSuggestionSelect(topSuggestion);
        }
      } catch {
        // Fall through to submit; handleSubmit resolves the destination if needed.
      } finally {
        if (!cancelled) {
          window.clearTimeout(deadlineTimer);
          submitSearch();
        }
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(deadlineTimer);
    };
  }, []);

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
      return;
    }

    if (!range?.from || !range?.to) {
      toast.error(t.search.datesRequired, {
        description: t.search.datesRequiredDesc,
      });
      openDatePicker();
      return;
    }

    const trimmedDestination = destination.trim();

    if (trimmedDestination.length < 3) {
      setDestinationError(true);
      toast.error(t.search.destinationTooShort, {
        description: t.search.destinationTooShortDesc,
      });
      if (isDestinationLocked) {
        setIsDestinationLocked(false);
        setSelectedSuggestion(null);
      }
      destinationInputRef.current?.focus();
      return;
    }

    setDestinationError(false);
    searchSubmitInFlightRef.current = true;
    setIsLoading(true);

    // Open a blank tab synchronously (within the user gesture) for 2pop mode so
    // it is never blocked by popup blockers. We fill in the Kayak URL after the
    // async work is complete.
    let twoPopWindow: Window | null = null;
    let twoPopNavigated = false;
    if (is2PopMode()) {
      twoPopWindow = window.open("about:blank", "_blank");
    }

    try {
      const { locale, marketCountry } = getDeviceKayakAutocompleteContext();
      let suggestion = selectedSuggestion;
      if (!suggestion) {
        suggestion = await resolveFirstDestinationSuggestion(
          trimmedDestination,
          suggestions,
          { locale, country: marketCountry }
        );
      }

      if (!suggestion) {
        if (isIataQuery(trimmedDestination)) {
          toast.error(t.search.airportNotFound, {
            description: t.search.airportNotFoundDesc(trimmedDestination.toUpperCase()),
          });
        } else {
          promptPickFromList();
        }
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
        toast.error(translateValidationMessage(landingLocale, validationError));
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
        marketCountry,
      });

      const { latitude, longitude } = defaultCoordinatesRef.current;
      if (
        latitude != null &&
        longitude != null &&
        search.latitude == null &&
        search.longitude == null
      ) {
        search.latitude = latitude;
        search.longitude = longitude;
      }

      const clickId = generateClickId();
      const landingId = await LandingTrackingService.getOrCreateLandingId();
      const { affiliateSource, partner } = getHotelAffiliateRouting();

      const surface = trackingContext?.surface ?? "search_form";
      const trackingExtras: Record<string, string> = {
        surface,
        destination_type: suggestion.type ?? "free_text",
      };
      if (trackingContext?.landingPageId) {
        trackingExtras.landing_page_id = trackingContext.landingPageId;
      }
      if (trackingContext?.cityId) {
        trackingExtras.city_id = trackingContext.cityId;
      }
      if (trackingContext?.intentId) {
        trackingExtras.intent_id = trackingContext.intentId;
      }

      if (twoPopWindow !== null) {
        // 2pop flow: Kayak in new tab + CJ Booking.com in current tab.
        const kayakClickId = generateClickId();
        const cjClickId = generateClickId();

        const kayakResponse = await requestHotelRedirectUrl({
          search,
          clickId: kayakClickId,
          landingId,
          affiliateSource: "kayak",
          metadata: {
            ...trackingExtras,
            destination_id: suggestion.id ?? "",
            two_pop: "1",
          },
        });

        const cjUrl = buildCjBookingUrl({
          query: search.destination!.trim(),
          checkin: search.checkIn!,
          checkout: search.checkOut!,
          rooms: search.rooms ?? 1,
          adults: search.adults ?? 2,
          children: search.children ?? 0,
          children_ages: search.childrenAges ?? [],
          click_id: cjClickId,
          latitude: search.latitude,
          longitude: search.longitude,
        });

        // Navigate the pre-opened tab to the Kayak deeplink.
        twoPopWindow.location.href = kayakResponse.redirectUrl;
        twoPopNavigated = true;

        try {
          trackMetaSearch(search);
          trackTikTokSearch(search);
        } catch {
          // Pixel tracking must not block the redirect.
        }

        // Track the Kayak click (fire-and-forget, no navigation).
        void recordPartnerClick({
          partner: "kayak-hotels",
          redirectUrl: kayakResponse.redirectUrl,
          placement: "new_tab",
          clickId: kayakClickId,
          landingId,
          iataCode: search.airportCode ?? null,
          locationId: kayakResponse.entityId,
          pickupDateNew: search.checkIn ?? null,
          dropoffDateNew: search.checkOut ?? null,
          searchParams: buildHotelClickSearchParams(search, { ...trackingExtras, two_pop: "1" }),
        });

        // Track the CJ click + redirect the current tab.
        await trackPartnerExit({
          partner: "booking-hotels-cj",
          redirectUrl: cjUrl,
          placement: "redirect",
          clickId: cjClickId,
          landingId,
          iataCode: null,
          locationId: search.destination,
          pickupDateNew: search.checkIn ?? null,
          dropoffDateNew: search.checkOut ?? null,
          searchParams: buildHotelClickSearchParams(search, { ...trackingExtras, two_pop: "1" }),
          autoParams: false,
        });
        return;
      }

      const response = await requestHotelRedirectUrl({
        search,
        clickId,
        landingId,
        affiliateSource,
        metadata: {
          ...trackingExtras,
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
        partner,
        redirectUrl: response.redirectUrl,
        placement: "redirect",
        clickId,
        landingId,
        iataCode: search.airportCode ?? null,
        locationId: response.entityId,
        pickupDateNew: search.checkIn ?? null,
        dropoffDateNew: search.checkOut ?? null,
        searchParams: buildHotelClickSearchParams(search, trackingExtras),
        autoParams: false,
      });
    } catch (error) {
      // If a blank tab was opened for 2pop but we errored out before filling it, close it.
      if (twoPopWindow && !twoPopNavigated) {
        try { twoPopWindow.close(); } catch { /* ignore */ }
      }
      const message =
        error instanceof Error ? error.message : "We couldn't load results right now.";
      if (isDestinationPickRequiredMessage(message)) {
        if (isIataQuery(destination.trim())) {
          toast.error(t.search.airportNotFound, {
            description: t.search.airportNotFoundDesc(destination.trim().toUpperCase()),
          });
        } else {
          promptPickFromList();
        }
      } else if (isSearchValidationMessage(message)) {
        toast.error(t.reviewSearch, {
          description: translateValidationMessage(landingLocale, message),
        });
      } else {
        toast.error(t.search.couldNotCompare, {
          description: message || t.search.couldNotCompareDesc,
        });
      }
    } finally {
      searchSubmitInFlightRef.current = false;
      setIsLoading(false);
    }
  };

  const guestSummary = t.search.guestSummary(adults + children, rooms);

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
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="w-full rounded-2xl border border-white/40 bg-card p-3 text-left shadow-elevated desktop:p-[1.15rem]"
    >
      <div className="grid grid-cols-1 gap-2 desktop:grid-cols-[1.5fr_1.5fr_1.35fr_auto] desktop:gap-[0.575rem] desktop:[&>*]:min-w-0">
        {/* Destination */}
        <div
          className={cn(
            "relative",
            searchFieldShell,
            desktopFieldPad,
            destinationError
              ? "border-destructive ring-1 ring-destructive/30 desktop:h-auto"
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
            {t.search.where}
          </Label>
          <div className={searchFieldValueRow}>
            <MapPin className={cn("h-4 w-4 shrink-0 text-primary", desktopFieldIcon)} aria-hidden />
            <input
              id="search-destination"
              ref={destinationInputRef}
              type="text"
              value={destination}
              onChange={(e) => {
                userEditedDestinationRef.current = true;
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
              placeholder={t.search.wherePlaceholder}
              autoComplete="off"
              aria-invalid={destinationError}
              aria-describedby={destinationError ? "search-destination-error" : undefined}
              className={cn(
                "min-w-0 flex-1 truncate border-0 bg-transparent p-0 text-left text-base text-foreground shadow-none outline-none scroll-mt-24 md:scroll-mt-0",
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
              {t.search.whereError}
            </p>
          )}
          {isAutocompleteLoading && (
            <p className="mt-2 text-xs text-muted-foreground">{t.search.loadingSuggestions}</p>
          )}
          {isDropdownOpen && destination.trim().length >= 3 && suggestions.length > 0 && (
            <div className="absolute top-full left-0 z-[100] mt-2 w-full rounded-xl border border-border bg-popover p-1 shadow-elevated">
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
                          <HighlightQuery text={suggestionSubtitle(suggestion)} query={destination} />
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
              className={cn(searchFieldShell, "border-border", desktopFieldPad)}
            >
              <Label
                className={cn(
                  "block text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                  desktopFieldLabel
                )}
              >
                {t.search.when}
              </Label>
              <div className={searchFieldValueRow}>
                <CalendarIcon className={cn("h-4 w-4 shrink-0 text-primary", desktopFieldIcon)} />
                <span
                  className={cn(
                    searchFieldValueText,
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
                <SheetTitle className="text-lg">{t.search.pickYourDates}</SheetTitle>
                <DateRangeStepHeader
                  value={draftRange}
                  phase={datePickerPhase}
                  labels={dateLabels}
                  dateLocale={dateLocale}
                />
                <p
                  className={cn(
                    "text-sm",
                    datePickerPhase === "check-out"
                      ? "font-medium text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {datePickerPhase === "check-in"
                    ? t.search.chooseArrival
                    : t.search.chooseDeparture}
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
                className={cn(searchFieldShell, "border-border", desktopFieldPad)}
              >
                <Label
                  className={cn(
                    "block text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                    desktopFieldLabel
                  )}
                >
                  {t.search.when}
                </Label>
                <div className={searchFieldValueRow}>
                  <CalendarIcon className={cn("h-4 w-4 shrink-0 text-primary", desktopFieldIcon)} />
                  <span
                    className={cn(
                      searchFieldValueText,
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
                <DateRangeStepHeader
                  value={draftRange}
                  phase={datePickerPhase}
                  labels={dateLabels}
                  dateLocale={dateLocale}
                />
                <p
                  className={cn(
                    "mt-2 text-center text-xs",
                    datePickerPhase === "check-out"
                      ? "font-medium text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {datePickerPhase === "check-in"
                    ? t.search.pickCheckInFirst
                    : t.search.nowChooseCheckOut}
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
              className={cn(searchFieldShell, "border-border", desktopFieldPad)}
            >
              <Label
                className={cn(
                  "block text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                  desktopFieldLabel
                )}
              >
                {t.search.who}
              </Label>
              <div className={searchFieldValueRow}>
                <Users className={cn("h-4 w-4 shrink-0 text-primary", desktopFieldIcon)} />
                <span className={cn(searchFieldValueText, desktopFieldText)}>{guestSummary}</span>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="start">
            <Stepper
              label={t.search.adults}
              sub={t.search.adultsSub}
              value={adults}
              onChange={setAdults}
              min={1}
              max={6}
            />
            <Stepper
              label={t.search.children}
              sub={t.search.childrenSub}
              value={children}
              onChange={setChildren}
              max={6}
            />
            <Stepper
              label={t.search.rooms}
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
          className="h-12 rounded-xl bg-primary px-8 text-xl font-semibold shadow-elevated transition-smooth hover:bg-primary/90 active:scale-[0.99] desktop:h-[4.5625rem] desktop:w-max desktop:max-w-full desktop:shrink-0 desktop:px-5 desktop:py-0 desktop:text-[1.5rem] desktop:leading-none"
        >
          {isLoading ? t.search.comparingRates : t.search.comparePrices}
        </Button>
      </div>
    </form>
  );
};

export default SearchForm;
export type { SearchFormDefaults, SearchFormProps, SearchFormTrackingContext };
