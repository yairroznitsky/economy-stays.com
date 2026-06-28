import { useRef, useState } from "react";
import { ExternalLink, ShieldCheck, Tag, Globe2, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-hotel.jpg";
import parisImg from "@/assets/destinations/paris.jpg";
import londonImg from "@/assets/destinations/london.jpg";
import tokyoImg from "@/assets/destinations/tokyo.jpg";
import romeImg from "@/assets/destinations/rome.jpg";
import barcelonaImg from "@/assets/destinations/barcelona.jpg";
import dubaiImg from "@/assets/destinations/dubai.jpg";
import sydneyImg from "@/assets/destinations/sydney.jpg";
import bangkokImg from "@/assets/destinations/bangkok.jpg";
import Header from "@/components/Header";
import SearchForm from "@/components/SearchForm";
import {
  requestHotelDestinationAutocomplete,
  requestHotelRedirectUrl,
} from "@/lib/hotelAffiliateApi";
import {
  buildHotelSearchInputFromSuggestion,
  getDefaultHotelStayDateStrings,
  getDeviceKayakAutocompleteContext,
} from "@/lib/kayakDestinationSearch";
import { generateClickId, LandingTrackingService } from "@/lib/landingTrackingService";
import {
  buildHotelClickSearchParams,
  trackPartnerExit,
} from "@/lib/partnerClickTracking";
import { getHotelAffiliateRouting } from "@/lib/bookingMode";
import { trackMetaSearch } from "@/lib/metaPixelTracking";
import {
  DESTINATION_PICK_LIST_TOAST,
  isDestinationPickRequiredMessage,
  isSearchValidationMessage,
} from "@/lib/hotelSearchErrors";
import { toast } from "sonner";

type TrendingDestination = {
  /** Card heading */
  title: string;
  /** Card subheading (usually the country) */
  subtitle: string;
  /** Autocomplete query: city segment */
  city: string;
  /** Autocomplete query: region/state segment (optional for international cities) */
  state?: string;
  /** Autocomplete query: country segment (full name) */
  country: string;
  image: string;
  imageAlt: string;
  /** CSS `object-position` so the crop matches the landmark (e.g. skyline vs sign). */
  imageObjectPosition?: string;
};

/** Popular international leisure markets — autocomplete + affiliate `query` use `city, [region,] country`. */
const destinations: TrendingDestination[] = [
  {
    title: "Paris",
    subtitle: "France",
    city: "Paris",
    state: "Île-de-France",
    country: "France",
    image: parisImg,
    imageAlt: "The Eiffel Tower at sunset above the Trocadéro fountains in Paris",
  },
  {
    title: "London",
    subtitle: "United Kingdom",
    city: "London",
    state: "England",
    country: "United Kingdom",
    image: londonImg,
    imageAlt: "Tower Bridge over the River Thames at dusk in London",
  },
  {
    title: "Tokyo",
    subtitle: "Japan",
    city: "Tokyo",
    country: "Japan",
    image: tokyoImg,
    imageAlt: "Tokyo skyline at dusk with the illuminated Tokyo Tower",
  },
  {
    title: "Rome",
    subtitle: "Italy",
    city: "Rome",
    state: "Lazio",
    country: "Italy",
    image: romeImg,
    imageAlt: "The Colosseum at golden-hour sunset in Rome",
  },
  {
    title: "Barcelona",
    subtitle: "Spain",
    city: "Barcelona",
    state: "Catalonia",
    country: "Spain",
    image: barcelonaImg,
    imageAlt: "The Sagrada Família basilica against a clear blue sky in Barcelona",
  },
  {
    title: "Dubai",
    subtitle: "United Arab Emirates",
    city: "Dubai",
    country: "United Arab Emirates",
    image: dubaiImg,
    imageAlt: "The Dubai skyline with the Burj Khalifa at sunset",
  },
  {
    title: "Sydney",
    subtitle: "Australia",
    city: "Sydney",
    state: "New South Wales",
    country: "Australia",
    image: sydneyImg,
    imageAlt: "Sydney Opera House and Harbour Bridge across the blue harbour",
  },
  {
    title: "Bangkok",
    subtitle: "Thailand",
    city: "Bangkok",
    country: "Thailand",
    image: bangkokImg,
    imageAlt: "Wat Arun temple glowing at sunset beside the river in Bangkok",
  },
];

const trendingAutocompleteQuery = (d: TrendingDestination) =>
  [d.city, d.state, d.country].filter(Boolean).join(", ");

const features = [
  {
    icon: Tag,
    title: "Lower rates, less hassle",
    desc: "Compare hotels, apartments, and rentals side by side to spot the best price for your dates.",
  },
  {
    icon: Globe2,
    title: "Millions of places to stay",
    desc: "Weekend getaways, beach breaks, or long-stay rentals — options across cities and coastlines worldwide.",
  },
  {
    icon: ShieldCheck,
    title: "Trusted booking partners",
    desc: "Flexible policies on many listings, backed by established travel partners you already know.",
  },
];

const Index = () => {
  const [openingDestination, setOpeningDestination] = useState<string | null>(null);
  const trendingSearchInFlightRef = useRef(false);

  const openDestination = async (d: TrendingDestination) => {
    if (openingDestination || trendingSearchInFlightRef.current) return;

    trendingSearchInFlightRef.current = true;
    setOpeningDestination(d.title);
    const { locale, marketCountry } = getDeviceKayakAutocompleteContext();
    const { checkIn, checkOut } = getDefaultHotelStayDateStrings();

    try {
      const suggestions = await requestHotelDestinationAutocomplete({
        query: trendingAutocompleteQuery(d),
        locale,
        country: marketCountry,
      });
      const suggestion = suggestions[0];
      if (!suggestion) {
        toast.error(`We couldn't find ${d.title}. Try searching manually above.`);
        return;
      }

      const search = buildHotelSearchInputFromSuggestion(suggestion, {
        checkIn,
        checkOut,
        adults: 2,
        children: 0,
        rooms: 1,
        locale,
        marketCountry,
        fallbackCountryName: d.country,
      });

      const clickId = generateClickId();
      const landingId = await LandingTrackingService.getOrCreateLandingId();
      const { affiliateSource, partner } = getHotelAffiliateRouting();

      const response = await requestHotelRedirectUrl({
        search,
        clickId,
        landingId,
        affiliateSource,
        metadata: {
          surface: "trending_destinations",
          source_destination: d.title,
          destination_id: search.destinationId ?? "",
        },
      });

      try {
        trackMetaSearch(search);
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
        searchParams: buildHotelClickSearchParams(search, {
          surface: "trending_destinations",
          source_destination: d.title,
        }),
        autoParams: true,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Rates aren't available for this destination right now.";
      if (isDestinationPickRequiredMessage(message)) {
        toast.error(DESTINATION_PICK_LIST_TOAST.title, {
          description: DESTINATION_PICK_LIST_TOAST.description,
        });
      } else if (isSearchValidationMessage(message)) {
        toast.error("Review your search", { description: message });
      } else {
        toast.error("Rates unavailable right now", {
          description: message || "Please try again using the search bar above.",
        });
      }
    } finally {
      trendingSearchInFlightRef.current = false;
      setOpeningDestination(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative min-h-[100svh] w-full md:min-h-[760px]">
        <img
          src={heroImage}
          alt="Clifftop resort with infinity pool overlooking the ocean at sunset"
          width={1920}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-foreground/10 to-foreground/50" />

        <Header />

        <div className="container relative z-10 flex min-h-[100svh] flex-col items-center justify-start pt-28 pb-10 text-center md:min-h-[760px] md:justify-center md:pt-20 md:pb-32">
          <span className="mb-4 hidden items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-1.5 text-xs font-medium text-primary-foreground backdrop-blur-md sm:inline-flex md:mb-5">
            <Sparkles className="h-3.5 w-3.5" />
            Smart rates on every stay
          </span>
          <h1 className="mt-4 max-w-3xl font-display text-2xl font-bold leading-[1.1] text-primary-foreground drop-shadow-lg md:mt-0 md:max-w-3xl md:text-5xl md:leading-[1.08]">
            Great stays. Better prices.
          </h1>
          <p className="mt-4 hidden max-w-xl text-base text-primary-foreground/90 md:mt-5 md:block md:max-w-xl md:text-lg">
            Compare hotels, apartments, and vacation rentals in seconds.
          </p>

          <div className="mt-7 w-full max-w-5xl desktop:mt-12 desktop:max-w-[73.6rem]">
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section id="destinations" className="bg-secondary/40 py-20">
        <div className="container">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Where people are booking now
            </h2>
            <p className="mt-2 text-muted-foreground">
              Popular cities around the world with strong rates this week.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {destinations.map((d) => (
              <button
                key={d.title}
                type="button"
                disabled={openingDestination !== null}
                aria-busy={openingDestination === d.title}
                onClick={() => void openDestination(d)}
                className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card p-0 text-left shadow-soft transition-smooth hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated disabled:pointer-events-none disabled:opacity-60"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                  <img
                    src={d.image}
                    alt={d.imageAlt}
                    width={800}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    style={
                      d.imageObjectPosition
                        ? { objectPosition: d.imageObjectPosition }
                        : undefined
                    }
                    className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-3 text-left sm:p-4">
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug text-foreground group-hover:text-primary">
                      {d.title}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{d.subtitle}</p>
                  </div>
                  <span className="inline-flex w-full items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-gradient-primary px-2.5 py-2 text-[11px] font-semibold leading-none text-primary-foreground shadow-sm transition-opacity group-hover:opacity-95 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-sm">
                    {openingDestination === d.title ? (
                      "Checking rates…"
                    ) : (
                      <>
                        Compare rates
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-90 sm:h-4 sm:w-4" aria-hidden />
                      </>
                    )}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how" className="border-b border-border bg-background py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Why book with Cheap Stays
            </h2>
            <p className="mt-3 text-muted-foreground">
              One search pulls rates from trusted partners so you can book with confidence.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-7 shadow-soft"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {f.title}
                </h3>
                <p className="mt-2 text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section id="deals" className="relative overflow-hidden bg-gradient-primary py-16">
        <div className="container text-center">
          <h2 className="font-display text-4xl font-bold text-primary-foreground md:text-5xl">
            Your next trip starts here
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-primary-foreground/90 md:text-lg">
            Head back to the search bar above — compare stays and jump to the best rate in a click.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-10">
        <div className="container flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Media Smarter. All rights reserved. Cheap Stays is operated by Media Smarter.
          </p>
          <p className="max-w-2xl">
            Cheap Stays may receive a commission when you book through partner links.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
