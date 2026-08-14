import type { SitelinkPageConfig } from "@/lib/sitelinkPages";

type SitelinkArticleProps = {
  page: SitelinkPageConfig;
};

const SitelinkArticle = ({ page }: SitelinkArticleProps) => {
  return (
    <article className="border-b border-border bg-background py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl">
          <header className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Guide
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">
              {page.description2}
            </h2>
            <p className="mt-4 text-muted-foreground">{page.intro}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              <time dateTime={page.dateModified}>Updated {page.dateModified}</time>
            </p>
          </header>

          <div className="space-y-10">
            {page.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-4 text-muted-foreground">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 64)} className="leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-12">
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
              {page.howTo.name}
            </h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-muted-foreground">
              {page.howTo.steps.map((step) => (
                <li key={step} className="leading-relaxed pl-1">
                  {step}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </article>
  );
};

export default SitelinkArticle;
