import SitePageLayout from "@/components/SitePageLayout";
import { siteConfig } from "@/lib/siteConfig";

const About = () => {
  return (
    <SitePageLayout title={`About ${siteConfig.name}`}>
      <p>
        {siteConfig.name} is an independent economy travel search service. We help budget-conscious
        travelers find the most economical stays — hotels, apartments, and rentals — in one place,
        then book through established partners at no extra cost.
      </p>

      <h2>What we do</h2>
      <p>
        Enter a destination, travel dates, and guest details — we surface economy rates from trusted
        travel partners so you can compare prices and policies before you book. We do not operate
        hotels or process payments ourselves; bookings are completed on partner websites at the
        economy rate we found for you.
      </p>

      <h2>Our economy philosophy</h2>
      <p>
        We believe travel should be accessible. {siteConfig.name} is built around one idea:
        surfacing the most economical stay options so your budget goes further, without sacrificing
        comfort or convenience. Economy doesn't mean cutting corners — it means making smarter
        choices.
      </p>

      <h2>Who operates this site</h2>
      <p>
        {siteConfig.name} is operated by {siteConfig.operator || siteConfig.name}. We build
        economy travel search tools that make it easier to discover affordable accommodation
        options worldwide.
      </p>

      <h2>Affiliate disclosure</h2>
      <p>
        {siteConfig.name} may earn a commission when you click through and book with a partner.
        This does not change the economy rate you see — the price you pay is the same. Our goal
        is to surface the most economical options so you can choose the stay that fits your trip
        and your budget.
      </p>
    </SitePageLayout>
  );
};

export default About;
