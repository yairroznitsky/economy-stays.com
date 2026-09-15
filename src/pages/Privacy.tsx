import { Link } from "react-router-dom";
import SitePageLayout from "@/components/SitePageLayout";
import { appendLandingIdQuery } from "@/lib/landingTrackingService";
import { siteConfig } from "@/lib/siteConfig";

const Privacy = () => {
  const lastUpdated = "September 1, 2026";

  return (
    <SitePageLayout title="Privacy policy">
      <p className="text-sm">Last updated: {lastUpdated}</p>

      <p>
        This policy explains how {siteConfig.operator || siteConfig.name} ("we", "us", "our")
        handles information collected when you use {siteConfig.name} at{" "}
        <a href={siteConfig.siteUrl()}>{siteConfig.domain}</a>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong className="text-foreground">Search inputs</strong> — destination, travel dates,
          guest count and any other details you enter when looking for accommodation.
        </li>
        <li>
          <strong className="text-foreground">Technical data</strong> — pages visited, links
          clicked, your device and browser type, and a general location derived from your IP
          address.
        </li>
        <li>
          <strong className="text-foreground">Session identifiers</strong> — cookies and similar
          technologies used to keep the site functional, measure performance, and attribute
          referrals to booking partners.
        </li>
        <li>
          <strong className="text-foreground">Shortlist data</strong> — if you use the shortlist
          feature, your saved properties are stored locally in your browser only and are not
          sent to our servers.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To display search results and route you to booking partners</li>
        <li>To measure how the site performs and identify improvements</li>
        <li>To attribute partner referrals as required by our affiliate agreements</li>
        <li>To detect misuse or technical problems</li>
        <li>To respond when you contact us</li>
      </ul>

      <h2>Analytics and advertising</h2>
      <p>
        We may use third-party analytics and advertising tools — including conversion tracking
        pixels — that collect information about your visit using cookies and similar
        technologies. These providers operate under their own privacy policies. You can manage
        cookie preferences through your browser settings and, where applicable, opt out of
        interest-based advertising through the relevant platform controls.
      </p>

      <h2>Sharing with third parties</h2>
      <p>
        When you search or follow a link to a booking partner, relevant details are shared
        with that partner so they can serve accurate results and complete bookings. We also
        work with service providers (hosting, analytics, security) who are bound to handle
        data on our behalf only. We do not sell personal information.
      </p>

      <h2>Retention</h2>
      <p>
        We keep information for as long as is needed to deliver the service or meet legal
        obligations. Server logs and analytics data are typically retained for a limited
        period and then deleted or anonymised.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on where you live, you may have rights to access, correct or request deletion
        of personal information we hold about you. You can also disable cookies in your browser,
        though this may affect parts of the site. To make a request, contact us at the address
        below.
      </p>

      <h2>Children</h2>
      <p>
        {siteConfig.name} is not intended for use by anyone under 16, and we do not knowingly
        collect personal information from children.
      </p>

      <h2>Policy changes</h2>
      <p>
        We may revise this policy. The "Last updated" date at the top will reflect any
        changes. Continued use of the site after a revision constitutes acceptance of the
        updated policy.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions? Email{" "}
        <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a> or use
        our{" "}
        <Link to={appendLandingIdQuery("/contact")}>contact page</Link>.
      </p>
    </SitePageLayout>
  );
};

export default Privacy;
