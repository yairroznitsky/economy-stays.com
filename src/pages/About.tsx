import SitePageLayout from "@/components/SitePageLayout";
import { siteConfig } from "@/lib/siteConfig";

const About = () => {
  return (
    <SitePageLayout title={`About ${siteConfig.name}`}>
      <p>
        {siteConfig.name} is an independent hotel and vacation rental search service. We help
        travelers compare stays in one place, then continue to established booking partners to
        complete their reservation.
      </p>

      <h2>What we do</h2>
      <p>
        Enter a destination, travel dates, and guest details — we surface options from trusted
        travel partners so you can review prices and policies before you book. We do not operate
        hotels or process payments ourselves; bookings are completed on partner websites.
      </p>

      <h2>Who operates this site</h2>
      <p>
        {siteConfig.name} is operated by {siteConfig.operator || siteConfig.name}. We build
        search tools that make it easier to discover and compare accommodation options worldwide.
      </p>

      <h2>Affiliate disclosure</h2>
      <p>
        {siteConfig.name} may earn a commission when you click through and book with a partner.
        This does not change the price you pay. Our goal is to present clear comparisons so you
        can choose the stay that fits your trip.
      </p>
    </SitePageLayout>
  );
};

export default About;
