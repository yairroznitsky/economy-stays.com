import { Link } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";
import SiteFooter from "@/components/SiteFooter";
import { appendLandingIdQuery } from "@/lib/landingTrackingService";

interface SitePageLayoutProps {
  title: string;
  children: React.ReactNode;
}

const SitePageLayout = ({ title, children }: SitePageLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-background">
        <div className="container py-4 md:py-5">
          <Link to={appendLandingIdQuery("/")} className="inline-block">
            <BrandLogo variant="dark" compact={false} textClassName="text-2xl md:text-3xl" />
          </Link>
        </div>
      </header>

      <main className="container flex-1 py-12 md:py-16">
        <article className="mx-auto max-w-3xl">
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">{title}</h1>
          <div className="mt-8 space-y-6 text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-primary/90 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_p]:leading-relaxed [&_ul]:space-y-2">
            {children}
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
};

export default SitePageLayout;
