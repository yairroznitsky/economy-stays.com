import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { LandingPageFaq } from "@/types/landingPage";

type FAQProps = {
  faqs: LandingPageFaq[];
};

const FAQ = ({ faqs }: FAQProps) => {
  if (faqs.length === 0) return null;

  return (
    <section className="bg-secondary/40 py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-display text-3xl font-bold text-foreground md:text-4xl">
            Frequently asked questions
          </h2>
          <Accordion type="single" collapsible className="mt-8 w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.q} value={`faq-${index}`}>
                <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
