import type { BrowseHotel } from "@/types/landingPage";

interface CityMapProps {
  hotels: BrowseHotel[];
  cityName: string;
}

const SVG_W = 600;
const SVG_H = 380;
const PAD = 28;

/**
 * Project lat/lng into SVG coordinates.
 * Latitude increases upward in geo, so we flip Y.
 */
function project(
  lat: number,
  lng: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
) {
  const { minLat, maxLat, minLng, maxLng } = bounds;
  const latRange = maxLat - minLat || 0.01;
  const lngRange = maxLng - minLng || 0.01;
  const x = PAD + ((lng - minLng) / lngRange) * (SVG_W - 2 * PAD);
  const y = SVG_H - PAD - ((lat - minLat) / latRange) * (SVG_H - 2 * PAD);
  return { x, y };
}

const CityMap = ({ hotels, cityName }: CityMapProps) => {
  const located = hotels.filter(
    (h) => h.latitude != null && h.longitude != null
  );

  if (located.length === 0) return null;

  const lats = located.map((h) => h.latitude!);
  const lngs = located.map((h) => h.longitude!);
  const bounds = {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-secondary/60">
      <div className="px-4 pt-4 pb-2">
        <p className="text-sm font-semibold text-foreground">
          Hotel map — {cityName}
        </p>
        <p className="text-xs text-muted-foreground">{located.length} properties plotted</p>
      </div>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        height="100%"
        style={{ display: "block", aspectRatio: `${SVG_W}/${SVG_H}` }}
        aria-label={`Map of hotels in ${cityName}`}
        role="img"
      >
        {/* background */}
        <rect width={SVG_W} height={SVG_H} fill="hsl(36,25%,93%)" />
        {located.map((hotel) => {
          const { x, y } = project(hotel.latitude!, hotel.longitude!, bounds);
          const color =
            hotel.rating != null && hotel.rating >= 8.5
              ? "hsl(150,62%,26%)"
              : "hsl(28,88%,54%)";
          return (
            <g key={hotel.id}>
              <circle cx={x} cy={y} r={5} fill={color} opacity={0.85} />
              <title>{hotel.name}{hotel.starRating ? ` · ${hotel.starRating}★` : ""}</title>
            </g>
          );
        })}
      </svg>
      <p className="px-4 pb-3 text-[10px] text-muted-foreground">
        <span className="mr-2">
          <span className="inline-block h-2 w-2 rounded-full bg-primary mr-1" aria-hidden />
          Rating ≥ 8.5
        </span>
        <span>
          <span className="inline-block h-2 w-2 rounded-full bg-accent mr-1" aria-hidden />
          Other
        </span>
      </p>
    </div>
  );
};

export default CityMap;
