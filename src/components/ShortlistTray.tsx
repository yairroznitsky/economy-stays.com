import { X, Heart } from "lucide-react";
import { useShortlist } from "@/hooks/useShortlist";
import { cn } from "@/lib/utils";

const ShortlistTray = () => {
  const { items, remove, clear } = useShortlist();

  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 z-50 w-[min(92vw,640px)] -translate-x-1/2",
        "rounded-xl bg-primary shadow-elevated text-primary-foreground"
      )}
      role="region"
      aria-label="Shortlisted hotels"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <Heart className="h-4 w-4 shrink-0 fill-accent text-accent" aria-hidden />
        <p className="flex-1 truncate text-sm font-semibold">
          {items.length} hotel{items.length !== 1 ? "s" : ""} shortlisted
        </p>
        <button
          type="button"
          onClick={clear}
          className="rounded px-2 py-0.5 text-xs font-medium text-primary-foreground/70 hover:text-primary-foreground transition-colors"
        >
          Clear
        </button>
      </div>
      <ul className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-none">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs"
          >
            <span className="max-w-[140px] truncate font-medium">{item.name}</span>
            {item.starRating ? (
              <span className="text-white/60">·{item.starRating}★</span>
            ) : null}
            <button
              type="button"
              onClick={() => remove(item.id)}
              aria-label={`Remove ${item.name} from shortlist`}
              className="ml-1 text-white/60 hover:text-white transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ShortlistTray;
