type CTASectionProps = {
  ctaText: string;
  cityName: string;
};

const CTASection = ({ ctaText, cityName }: CTASectionProps) => (
  <section className="relative overflow-hidden bg-primary py-16">
    <div className="container text-center">
      <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
        {ctaText}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-base text-primary-foreground/90 md:text-lg">
        Compare hotel rates in {cityName} from multiple travel sites in one search.
      </p>
    </div>
  </section>
);

export default CTASection;
