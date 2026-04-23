import { Sparkles } from "lucide-react";

const Header = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-20">
      <div className="container flex items-center justify-between py-5 md:py-6">
        <a href="/" className="flex items-center gap-3 text-primary-foreground leading-none">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-elevated">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-[1.6rem] font-bold tracking-tight md:text-[1.7rem]">
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
