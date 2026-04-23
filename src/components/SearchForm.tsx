import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, MapPin, Users, Search, Minus, Plus } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const AFFILIATE_ID = "YOUR_BOOKING_AID"; // Replace with your Booking.com affiliate ID

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim() || !range?.from || !range?.to) return;

    const params = new URLSearchParams({
      ss: destination.trim(),
      checkin: format(range.from, "yyyy-MM-dd"),
      checkout: format(range.to, "yyyy-MM-dd"),
      group_adults: String(adults),
      group_children: String(children),
      no_rooms: String(rooms),
      aid: AFFILIATE_ID,
    });

    const url = `https://www.booking.com/searchresults.html?${params.toString()}`;
    window.open(url, "_blank", "noopener,noreferrer");
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
  }: {
    label: string;
    sub?: string;
    value: number;
    onChange: (v: number) => void;
    min?: number;
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
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-2xl bg-card p-3 shadow-search md:p-4"
    >
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[1.5fr_1.5fr_1fr_auto]">
        {/* Destination */}
        <div className="relative rounded-xl border border-border bg-background px-4 py-3 transition-smooth hover:border-primary/40">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Where
          </Label>
          <div className="mt-1 flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="City, hotel or destination"
              className="h-auto border-0 bg-transparent p-0 text-base shadow-none focus-visible:ring-0"
              required
            />
          </div>
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
            />
            <Stepper
              label="Children"
              sub="Age 0–12"
              value={children}
              onChange={setChildren}
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
          className="h-auto rounded-xl bg-gradient-primary px-8 text-base font-semibold shadow-elevated transition-smooth hover:opacity-95 md:px-6"
        >
          <Search className="mr-2 h-5 w-5" />
          Search
        </Button>
      </div>
    </form>
  );
};

export default SearchForm;
