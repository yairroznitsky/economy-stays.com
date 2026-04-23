import { ShieldCheck, Tag, Globe2, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-hotel.jpg";
import Header from "@/components/Header";
import SearchForm from "@/components/SearchForm";
import { requestHotelRedirectUrl } from "@/lib/hotelAffiliateApi";
import { getOrCreateClickId, getOrCreateLandingId } from "@/lib/tracking";
import { toast } from "sonner";
import { format } from "date-fns";

const destinations = [
  { name: "Paris", country: "France", emoji: "🗼" },
  { name: "Bali", country: "Indonesia", emoji: "🌴" },
  { name: "New York", country: "USA", emoji: "🗽" },
  { name: "Tokyo", country: "Japan", emoji: "🗾" },
  { name: "Dubai", country: "UAE", emoji: "🏙️" },
  { name: "Santorini", country: "Greece", emoji: "🏖️" },
  { name: "Rome", country: "Italy", emoji: "🏛️" },
  { name: "Maldives", country: "Maldives", emoji: "🏝️" },
];

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
  const openDestination = async (destinationName: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    try {
      const response = await requestHotelRedirectUrl({
        search: {
          destination: destinationName,
          checkIn: format(tomorrow, "yyyy-MM-dd"),
          checkOut: format(dayAfter, "yyyy-MM-dd"),
          adults: 2,
          children: 0,
          rooms: 1,
        },
        clickId: getOrCreateClickId(),
        landingId: getOrCreateLandingId(),
        affiliateSource: "kayak",
        metadata: {
          surface: "trending_destinations",
          source_destination: destinationName,
        },
      });

      window.open(response.redirectUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to open destination deals.";
      toast.error(message);
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

        <div className="container relative z-10 flex min-h-[100svh] flex-col items-center justify-start pt-16 pb-10 text-center md:min-h-[760px] md:justify-center md:pt-24 md:pb-32">
          <span className="mb-4 hidden items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-1.5 text-xs font-medium text-primary-foreground backdrop-blur-md sm:inline-flex md:mb-5">
            <Sparkles className="h-3.5 w-3.5" />
            Members-only deals on 2M+ stays
          </span>
          <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.08] text-primary-foreground drop-shadow-lg md:max-w-4xl md:text-7xl md:leading-[1.05]">
            Unlock the world's<br />best-kept stay deals
          </h1>
          <p className="mt-4 max-w-xl text-base text-primary-foreground/90 md:mt-6 md:max-w-2xl md:text-xl">
            Search and compare hotels, homes, and apartments worldwide.
            Save up to 60% on your next trip.
          </p>

          <div className="mt-7 w-full max-w-5xl md:mt-12">
            <SearchForm />
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
                className="rounded-2xl border border-border bg-card p-7 shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-elevated"
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

      {/* Destinations */}
      <section id="destinations" className="bg-secondary/40 py-20">
        <div className="container">
          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-end">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                Trending destinations
              </h2>
              <p className="mt-2 text-muted-foreground">
                Popular spots travelers love right now.
              </p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {destinations.map((d) => (
              <button
                key={d.name}
                type="button"
                onClick={() => void openDestination(d.name)}
                className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-smooth hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated"
              >
                <div className="text-3xl">{d.emoji}</div>
                <p className="mt-3 font-semibold text-foreground group-hover:text-primary">
                  {d.name}
                </p>
                <p className="text-sm text-muted-foreground">{d.country}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section id="deals" className="relative overflow-hidden bg-gradient-primary py-16">
        <div className="container text-center">
          <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
            Ready to discover your next stay?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">
            Scroll up and start your search — your ideal stay is just a few clicks away.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-10">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Secret Stays. All rights reserved.</p>
          <p>
            Secret Stays may earn a commission from qualifying Kayak-powered stay referrals.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
