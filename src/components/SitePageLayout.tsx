import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

interface SitePageLayoutProps {
  title: string;
  children: React.ReactNode;
}

const SitePageLayout = ({ title, children }: SitePageLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Sticky header — non-photo pages use it in solid mode immediately */}
      <div className="relative">
        {/* Thin cream bar behind the fixed header so the page doesn't jump on load */}
        <div className="h-16 bg-background border-b border-border" />
        <Header solid />
      </div>

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
