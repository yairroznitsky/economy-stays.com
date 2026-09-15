import SitePageLayout from "@/components/SitePageLayout";
import { siteConfig } from "@/lib/siteConfig";

const About = () => {
  return (
    <SitePageLayout title={`About ${siteConfig.name}`}>
      <p>
        {siteConfig.name} is an independent hotel search and browse service. We help travellers
        find accommodation — hotels, boutique properties, apartments and rentals — by browsing
        across trusted booking partners from a single search.
      </p>

      <h2>What we do</h2>
      <p>
        Enter a destination, your travel dates and the number of guests. {siteConfig.name} surfaces
        options from established booking partners so you can compare properties by star rating,
        guest score and type before you decide. We don't operate hotels or hold reservations —
        bookings are completed on a partner's platform, at their current rate.
      </p>

      <h2>How we approach search</h2>
      <p>
        We think the best way to find a good stay is to browse rather than chase a single metric.
        {siteConfig.name} is built to let you filter by what genuinely matters to you — location,
        star rating, property style, cancellation policy — so the comparison is yours to make,
        not an algorithm's to make for you.
      </p>

      <h2>Who we are</h2>
      <p>
        {siteConfig.name} is operated by {siteConfig.operator || siteConfig.name}. We build hotel
        search tools focused on giving travellers a clearer, more browsable view of available
        accommodation worldwide.
      </p>

      <h2>Affiliate disclosure</h2>
      <p>
        {siteConfig.name} may earn a commission when you click through and complete a booking with
        one of our partners. That does not affect the rate you're shown — the price is set by the
        property and the booking platform, not by us.
      </p>
    </SitePageLayout>
  );
};

export default About;
