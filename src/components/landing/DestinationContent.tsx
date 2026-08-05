import type { LandingPageConfig } from "@/types/landingPage";

type DestinationContentProps = {
  config: LandingPageConfig;
};

const DestinationContent = ({ config }: DestinationContentProps) => {
  const paragraphs = config.content.introText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return null;

  return (
    <section className="border-b border-border bg-background py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            About hotels in {config.city.name}
          </h2>
          <div className="mt-6 space-y-4 text-muted-foreground">
            {paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DestinationContent;
