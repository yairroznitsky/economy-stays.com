import BrandLogo from "@/components/BrandLogo";

const Header = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-20">
      <div className="container flex w-full items-center py-5 md:py-6">
        <div className="mx-auto leading-none">
          <BrandLogo
            variant="light"
            textClassName="text-[2.775rem] md:text-[3.6rem]"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
