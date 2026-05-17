import { useState } from "react";
import { ExternalLink, ShieldCheck, Tag, Globe2, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-hotel.jpg";
import Header from "@/components/Header";
import BrandLogo from "@/components/BrandLogo";
import SearchForm from "@/components/SearchForm";
import {
  requestHotelDestinationAutocomplete,
  requestHotelRedirectUrl,
} from "@/lib/hotelAffiliateApi";
import {
  buildHotelSearchInputFromSuggestion,
  getDefaultHotelStayDateStrings,
  getDeviceKayakAutocompleteContext,
  withTrendingDeeplinkPlace,
} from "@/lib/kayakDestinationSearch";
import { generateClickId, LandingTrackingService } from "@/lib/landingTrackingService";
import {
  buildHotelClickSearchParams,
  trackPartnerExit,
} from "@/lib/partnerClickTracking";
import {
  DESTINATION_PICK_LIST_TOAST,
  isDestinationPickRequiredMessage,
} from "@/lib/hotelSearchErrors";
import { toast } from "sonner";

type TrendingDestination = {
  /** Card heading */
  title: string;
  /** Card subheading (usually state / D.C.) */
  subtitle: string;
  /** Kayak deeplink: city segment */
  city: string;
  /** Kayak deeplink: state segment */
  state: string;
  /** Kayak deeplink: country segment (full name) */
  country: string;
  image: string;
  imageAlt: string;
  /** CSS `object-position` so the crop matches the landmark (e.g. skyline vs sign). */
  imageObjectPosition?: string;
};

const US_COUNTRY = "United States";

/** Top U.S. leisure markets — autocomplete + affiliate `query` use `city, state, country`. */
const destinations: TrendingDestination[] = [
  {
    title: "New York City",
    subtitle: "New York",
    city: "New York City",
    state: "New York",
    country: US_COUNTRY,
    image:
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Manhattan skyline with the Empire State Building",
  },
  {
    title: "Las Vegas",
    subtitle: "Nevada",
    city: "Las Vegas",
    state: "Nevada",
    country: US_COUNTRY,
    image:
      "https://images.pexels.com/photos/4424678/pexels-photo-4424678.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageAlt:
      "Golden-hour sunset on a palm-lined boulevard with resort towers and traffic, evoking the Las Vegas Strip",
    imageObjectPosition: "center 38%",
  },
  {
    title: "Orlando",
    subtitle: "Florida",
    city: "Orlando",
    state: "Florida",
    country: US_COUNTRY,
    image:
      "https://images.pexels.com/photos/1860618/pexels-photo-1860618.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageAlt: "Theme park visitor holding a Universal Orlando Resort guide and tickets",
    imageObjectPosition: "center 45%",
  },
  {
    title: "Los Angeles",
    subtitle: "California",
    city: "Los Angeles",
    state: "California",
    country: US_COUNTRY,
    image:
      "https://images.pexels.com/photos/33642186/pexels-photo-33642186.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageAlt: "Hollywood Sign on the hillside above Los Angeles",
    imageObjectPosition: "center 35%",
  },
  {
    title: "San Francisco",
    subtitle: "California",
    city: "San Francisco",
    state: "California",
    country: US_COUNTRY,
    image:
      "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Golden Gate Bridge and San Francisco Bay",
  },
  {
    title: "Miami",
    subtitle: "Florida",
    city: "Miami",
    state: "Florida",
    country: US_COUNTRY,
    image:
      "https://images.pexels.com/photos/20187867/pexels-photo-20187867.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageAlt:
      "Ocean Drive in South Beach, Miami Beach — palm trees, art deco hotels, and the Atlantic shore",
    imageObjectPosition: "center 42%",
  },
  {
    title: "Washington DC",
    subtitle: "D.C.",
    city: "Washington",
    state: "District of Columbia",
    country: US_COUNTRY,
    image:
      "https://images.unsplash.com/photo-1617581629397-a72507c3de9e?auto=format&fit=crop&w=800&q=80",
    imageAlt: "United States Capitol dome on a clear day",
  },
  {
    title: "Chicago",
    subtitle: "Illinois",
    city: "Chicago",
    state: "Illinois",
    country: US_COUNTRY,
    image:
      "https://images.pexels.com/photos/167200/pexels-photo-167200.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageAlt: "Chicago River and downtown skyscrapers on a clear day",
    imageObjectPosition: "center 30%",
  },
];

const trendingAutocompleteQuery = (d: TrendingDestination) =>
  `${d.city}, ${d.state}, ${d.country}`;

const features = [
  {
    icon: Tag,
    title: "Unbeatable prices",
    desc: "Compare hotels, apartments, and unique stays to unlock deals up to 60% off.",
  },
  {
    icon: Globe2,
    title: "2M+ properties worldwide",
    desc: "From boutique hotels to full homes and serviced apartments in every corner of the globe.",
  },
  {
    icon: ShieldCheck,
    title: "Book with confidence",
    desc: "Flexible options on many stays with trusted partners and reliable support.",
  },
];

const Index = () => {
  const [openingDestination, setOpeningDestination] = useState<string | null>(null);

  const openDestination = async (d: TrendingDestination) => {
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
        toast.error(`No matches for ${d.title}. Try the search above.`);
        return;
      }

      const baseSearch = buildHotelSearchInputFromSuggestion(suggestion, {
        checkIn,
        checkOut,
        adults: 2,
        children: 0,
        rooms: 1,
        locale,
        marketCountry,
        fallbackCountryName: d.country,
      });

      const search = withTrendingDeeplinkPlace(baseSearch, {
        city: d.city,
        state: d.state,
        country: d.country,
      });

      const clickId = generateClickId();
      const landingId = await LandingTrackingService.getOrCreateLandingId();

      const response = await requestHotelRedirectUrl({
        search,
        clickId,
        landingId,
        affiliateSource: "kayak",
        metadata: {
          surface: "trending_destinations",
          source_destination: d.title,
          destination_id: search.destinationId ?? "",
        },
      });

      await trackPartnerExit({
        partner: "kayak",
        redirectUrl: response.redirectUrl,
        placement: "redirect",
        clickId,
        landingId,
        iataCode: search.airportCode ?? null,
        locationId: search.destinationId ?? null,
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
        error instanceof Error ? error.message : "Unable to open destination deals.";
      if (isDestinationPickRequiredMessage(message)) {
        toast.error(DESTINATION_PICK_LIST_TOAST.title, {
          description: DESTINATION_PICK_LIST_TOAST.description,
        });
      } else {
        toast.error("Could not open destination deals", {
          description: "Please try again from the search bar above.",
        });
      }
    } finally {
      setOpeningDestination(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative min-h-[100svh] w-full md:min-h-[760px]">
        <img
          src={heroImage}
          alt="Luxury hotel infinity pool overlooking turquoise ocean at sunset"
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
            Save up to 75%
          </span>
          <h1 className="mt-4 max-w-3xl font-display text-2xl font-bold leading-[1.1] text-primary-foreground drop-shadow-lg md:mt-0 md:max-w-3xl md:text-5xl md:leading-[1.08]">
            Unlock secret stay deals
          </h1>
          <p className="mt-4 hidden max-w-xl text-base text-primary-foreground/90 md:mt-5 md:block md:max-w-xl md:text-lg">
            Hotels and homes worldwide in one search.
          </p>

          <div className="mt-7 w-full max-w-5xl md:mt-12 md:max-w-[73.6rem]">
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section id="destinations" className="bg-secondary/40 py-20">
        <div className="container">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Trending destinations
            </h2>
            <p className="mt-2 text-muted-foreground">
              Popular spots travelers love right now.
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
                      "Opening…"
                    ) : (
                      <>
                        View deals
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
              Why travelers choose us
            </h2>
            <p className="mt-3 text-muted-foreground">
              We hunt the web for the lowest prices so you don't have to.
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
            Ready to discover your next stay?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-primary-foreground/90 md:text-lg">
            Scroll up and start your search. Your ideal stay is just a few clicks away.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-10">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-3">
            <BrandLogo compact variant="dark" className="gap-2" iconClassName="h-[2.6rem] w-[2.6rem] rounded-lg" />
            <p>© {new Date().getFullYear()} Secret Bookings. All rights reserved.</p>
          </div>
          <p>
            Secret Bookings may earn a commission from qualifying Kayak-powered stay referrals.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
