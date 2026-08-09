import type { LandingPageCityStats } from "@/types/landingPage";

type CityInventoryStripProps = {
  cityName: string;
  stats: LandingPageCityStats;
};

const formatSummary = (stats: LandingPageCityStats): string => {
  const count = stats.hotelCount.toLocaleString("en-US");
  const parts: string[] = [
    stats.hotelCountCapped ? `${count}+ stays` : `${count} stays`,
  ];
  if (stats.avgRating != null) {
    parts.push(`avg guest rating ${stats.avgRating}`);
  }
  if (stats.dominantStarRating != null) {
    parts.push(`mostly ${stats.dominantStarRating}-star`);
  }
  if (stats.topTypes[0]) {
    const types =
      stats.topTypes.length === 1
        ? `${stats.topTypes[0].toLowerCase()}s`
        : stats.topTypes
            .slice(0, 2)
            .map((type) => `${type.toLowerCase()}s`)
            .join(" & ");
    parts.push(types);
  }
  if (stats.airportCode) {
    parts.push(`near ${stats.airportCode}`);
  }
  return parts.join(" · ");
};

const CityInventoryStrip = ({ cityName, stats }: CityInventoryStripProps) => {
  if (stats.hotelCount <= 0) return null;

  return (
    <section className="border-b border-border bg-background py-12 md:py-14">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            Stays listed for {cityName}
          </h2>
          <p className="mt-3 text-muted-foreground">{formatSummary(stats)}</p>
        </div>
      </div>
    </section>
  );
};

export default CityInventoryStrip;
