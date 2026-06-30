import SitePageLayout from "@/components/SitePageLayout";
import { siteConfig } from "@/lib/siteConfig";

const Contact = () => {
  return (
    <SitePageLayout title="Contact us">
      <p>
        Have a question about {siteConfig.name}, need help with a search, or want to report an
        issue? We are happy to hear from you.
      </p>

      <h2>Email</h2>
      <p>
        Reach us at{" "}
        <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>. We aim to
        respond within a few business days.
      </p>

      <h2>Booking support</h2>
      <p>
        {siteConfig.name} is a search and comparison service. Reservations, changes, and
        cancellations are handled directly by the booking partner where you completed your
        purchase. Please contact that partner for booking-specific questions.
      </p>
    </SitePageLayout>
  );
};

export default Contact;
