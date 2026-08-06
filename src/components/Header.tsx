import BrandLogo from "@/components/BrandLogo";

const Header = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-20">
      <div className="container flex w-full items-center justify-center py-5 md:py-6">
        <BrandLogo
          variant="light"
          compact={false}
          textClassName="text-[clamp(1.5rem,3.5vw,2.75rem)] md:text-[2.75rem]"
          className="opacity-0 drop-shadow-[0_2px_16px_rgba(0,0,0,0.35)] motion-safe:animate-hero-fade motion-reduce:opacity-100"
        />
      </div>
    </header>
  );
};

export default Header;
