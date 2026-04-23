import { Sparkles } from "lucide-react";

const Header = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-20">
      <div className="container flex items-center justify-between py-6">
        <a href="/" className="flex items-center gap-2 text-primary-foreground">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-elevated">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            Secret Bookings
          </span>
        </a>
        <nav className="hidden items-center gap-8 text-sm font-medium text-primary-foreground/90 md:flex">
          <a href="#deals" className="transition-smooth hover:text-primary-foreground">Deals</a>
          <a href="#destinations" className="transition-smooth hover:text-primary-foreground">Destinations</a>
          <a href="#how" className="transition-smooth hover:text-primary-foreground">How it works</a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
