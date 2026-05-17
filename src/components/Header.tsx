import BrandLogo from "@/components/BrandLogo";

const Header = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-20">
      <div className="container flex w-full items-center justify-center py-4 md:py-6">
        <div className="w-full max-w-full leading-none">
          <BrandLogo variant="light" className="w-full" textClassName="md:text-[3.6rem]" />
        </div>
      </div>
    </header>
  );
};

export default Header;
