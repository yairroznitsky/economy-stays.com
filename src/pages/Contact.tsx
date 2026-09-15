import SitePageLayout from "@/components/SitePageLayout";
import { siteConfig } from "@/lib/siteConfig";

const Contact = () => {
  return (
    <SitePageLayout title="Get in touch">
      <p>
        Questions about {siteConfig.name}, a problem with the search, or something you'd like us
        to know? We're glad to hear from you.
      </p>

      <h2>Email us</h2>
      <p>
        Write to{" "}
        <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>. We'll
        get back to you within a few working days.
      </p>

      <h2>Booking questions</h2>
      <p>
        {siteConfig.name} is a search and browse service — we don't hold reservations or process
        payments. For anything related to a specific booking (changes, cancellations, refunds),
        contact the booking partner directly. Their contact details are on the confirmation
        email they sent you.
      </p>

      <h2>Feedback</h2>
      <p>
        Found a listing that looks wrong, or a feature you think would help? Drop us a note at the
        email above. We read every message.
      </p>
    </SitePageLayout>
  );
};

export default Contact;
