import { ShieldCheck, Tag, Globe2, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-hotel.jpg";
import Header from "@/components/Header";
import SearchForm from "@/components/SearchForm";

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
    desc: "Compare millions of hotels and unlock secret deals up to 60% off.",
  },
  {
    icon: Globe2,
    title: "2M+ properties worldwide",
    desc: "From boutique hideaways to five-star resorts in every corner of the globe.",
  },
  {
    icon: ShieldCheck,
    title: "Book with confidence",
    desc: "Free cancellation on most rooms and 24/7 customer support.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative min-h-[760px] w-full overflow-hidden">
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

        <div className="container relative z-10 flex min-h-[760px] flex-col items-center justify-center pt-24 pb-32 text-center">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-1.5 text-xs font-medium text-primary-foreground backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            Members-only deals on 2M+ hotels
          </span>
          <h1 className="max-w-4xl font-display text-5xl font-bold leading-[1.05] text-primary-foreground drop-shadow-lg md:text-7xl">
            Unlock the world's<br />best-kept hotel deals
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-primary-foreground/90 md:text-xl">
            Search and compare prices across thousands of hotels worldwide.
            Save up to 60% on your next stay.
          </p>

          <div className="mt-12 w-full max-w-5xl">
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
              <a
                key={d.name}
                href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
                  d.name
                )}&aid=YOUR_BOOKING_AID`}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-smooth hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated"
              >
                <div className="text-3xl">{d.emoji}</div>
                <p className="mt-3 font-semibold text-foreground group-hover:text-primary">
                  {d.name}
                </p>
                <p className="text-sm text-muted-foreground">{d.country}</p>
              </a>
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
            Scroll up and start your search — your perfect hotel is just a few clicks away.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-10">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Secret Bookings. All rights reserved.</p>
          <p>
            Secret Bookings is an affiliate partner. We may earn a commission on bookings.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
