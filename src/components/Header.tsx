import BrandLogo from "@/components/BrandLogo";

const Header = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-20">
      <div className="container flex w-full items-center justify-start py-4 md:py-5">
        <BrandLogo variant="light" compact={false} textClassName="text-2xl md:text-3xl" />
      </div>
    </header>
  );
};

export default Header;
