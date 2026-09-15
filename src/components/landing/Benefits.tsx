import { Tag, Globe2, ShieldCheck } from "lucide-react";
import type { LandingPageBenefit } from "@/types/landingPage";

const benefitIcons = [Tag, Globe2, ShieldCheck] as const;

type BenefitsProps = {
  benefits: LandingPageBenefit[];
};

const Benefits = ({ benefits }: BenefitsProps) => {
  if (benefits.length === 0) return null;

  return (
    <section className="border-b border-border bg-background py-16 md:py-20">
      <div className="container">
        <div className="grid gap-6 md:grid-cols-3">
          {benefits.map((benefit, index) => {
            const Icon = benefitIcons[index % benefitIcons.length];
            return (
              <div
                key={benefit.title}
                className="rounded-xl border border-border bg-card p-7 shadow-soft"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">{benefit.title}</h2>
                <p className="mt-2 text-muted-foreground">{benefit.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
