import BrandLogo from "@/components/BrandLogo";

const Header = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-20">
      <div className="container flex items-center justify-between py-5 md:py-6">
        <a href="/" className="leading-none">
          <BrandLogo
            variant="light"
            textClassName="text-[1.45rem] md:text-[1.6rem] text-primary-foreground"
            iconClassName="h-9 w-9 md:h-10 md:w-10"
          />
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
