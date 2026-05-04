import BrandLogo from "@/components/BrandLogo";

const Header = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-20">
      <div className="container flex items-center py-5 md:py-6">
        <a href="/" className="leading-none">
          <BrandLogo
            variant="light"
            textClassName="text-[1.45rem] md:text-[1.6rem] text-primary-foreground"
            iconClassName="h-9 w-9 md:h-10 md:w-10"
          />
        </a>
      </div>
    </header>
  );
};

export default Header;
