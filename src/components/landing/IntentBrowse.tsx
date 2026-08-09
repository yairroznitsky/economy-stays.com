import type { LandingPageBrowseIntent } from "@/types/landingPage";
import { Link } from "react-router-dom";

type IntentBrowseProps = {
  cityName: string;
  intents: LandingPageBrowseIntent[];
};

const IntentBrowse = ({ cityName, intents }: IntentBrowseProps) => {
  if (intents.length === 0) return null;

  return (
    <section className="border-b border-border bg-muted/20 py-12 md:py-14">
      <div className="container">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            Browse {cityName} by stay type
          </h2>
          <p className="mt-3 text-muted-foreground">
            Explore focused pages for common trip needs in {cityName}.
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-3">
            {intents.map((intent) => (
              <li key={intent.slug}>
                <Link
                  to={intent.path}
                  className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {intent.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default IntentBrowse;
