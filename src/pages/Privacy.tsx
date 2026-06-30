import { Link } from "react-router-dom";
import SitePageLayout from "@/components/SitePageLayout";
import { appendLandingIdQuery } from "@/lib/landingTrackingService";
import { siteConfig } from "@/lib/siteConfig";

const Privacy = () => {
  const lastUpdated = "June 30, 2026";

  return (
    <SitePageLayout title="Privacy policy">
      <p className="text-sm">Last updated: {lastUpdated}</p>

      <p>
        This policy describes how {siteConfig.operator || siteConfig.name} ("we", "us") collects,
        uses, and shares information when you use {siteConfig.name} at{" "}
        <a href={siteConfig.siteUrl()}>{siteConfig.domain}</a>.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong className="text-foreground">Search details</strong> — destination, dates, guest
          count, and related preferences you enter to find accommodation.
        </li>
        <li>
          <strong className="text-foreground">Usage data</strong> — pages viewed, clicks,
          referring URLs, device and browser type, and general location derived from IP address.
        </li>
        <li>
          <strong className="text-foreground">Identifiers</strong> — cookies, session IDs, and
          similar technologies used for analytics, attribution, and site functionality.
        </li>
      </ul>

      <h2>How we use information</h2>
      <p>We use collected information to:</p>
      <ul>
        <li>Provide search results and redirect you to booking partners</li>
        <li>Measure site performance and improve our service</li>
        <li>Attribute partner referrals and comply with affiliate program requirements</li>
        <li>Detect abuse, fraud, or technical issues</li>
        <li>Respond to inquiries you send us</li>
      </ul>

      <h2>Analytics and advertising</h2>
      <p>
        We may use third-party analytics and advertising tools (such as Meta and TikTok pixels)
        that collect information about your visit. These providers may use cookies and similar
        technologies according to their own privacy policies. You can manage cookies through your
        browser settings and, where available, opt out of interest-based advertising through
        platform controls.
      </p>

      <h2>Sharing with partners</h2>
      <p>
        When you search or click to book, we share relevant details with travel partners so they
        can show offers and complete bookings. We may also share data with service providers who
        help us operate the site (hosting, analytics, security). We do not sell your personal
        information.
      </p>

      <h2>Data retention</h2>
      <p>
        We retain information only as long as needed for the purposes above, unless a longer
        period is required by law or legitimate business needs such as dispute resolution.
      </p>

      <h2>Your choices</h2>
      <p>
        You may disable cookies in your browser, though some features may not work correctly.
        Depending on where you live, you may have rights to access, correct, or delete personal
        information. Contact us to make a request.
      </p>

      <h2>Children</h2>
      <p>
        {siteConfig.name} is not directed at children under 16, and we do not knowingly collect
        their personal information.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy from time to time. The "Last updated" date at the top reflects
        the most recent revision.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy? Email{" "}
        <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a> or visit our{" "}
        <Link to={appendLandingIdQuery("/contact")}>contact page</Link>.
      </p>
    </SitePageLayout>
  );
};

export default Privacy;
