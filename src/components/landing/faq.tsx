"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  {
    q: "How is InternetYangu different from Dishylink?",
    a: "Dishylink is a brilliant open-source monitor — but only for Starlink. InternetYangu takes the same local-first, privacy-first philosophy and generalizes it to every network East Africans actually use: Safaricom Fiber, Faiba, Zuku, Airtel, Poa, Mawingu, Starlink and more. It adds a spend-tracking layer built on mobile-money billing SMS, which is how the region actually pays for internet.",
  },
  {
    q: "Do you read my SMS or see my M-Pesa PIN?",
    a: "No. The core web app never touches SMS — you paste a payment message and it is parsed entirely in your browser, then only the parsed fields (amount, reference, provider) are saved to your own local database. SMS auto-reading exists only in the optional Android shell (Tier 2), which you explicitly install and grant permissions to.",
  },
  {
    q: "Which providers are supported?",
    a: "The provider directory ships with ten operators across Kenya, Tanzania, Uganda and Rwanda. Because the adapter layer is community-driven, adding a new ISP is a data change, not a product change — this is the moat: a billing-format registry nobody else is building.",
  },
  {
    q: "What happens to my outage evidence?",
    a: "Nothing, unless you choose to share it. Evidence packs (timestamps, latency history, duration) export as JSON/CSV from your device. You can attach them to a Communications Authority complaint or an operator support ticket yourself — or opt in to anonymized community benchmarks later.",
  },
  {
    q: "What is the business model?",
    a: "A free consumer tier funded by an optional Pro plan (advanced history, evidence packs, multi-home), commission from provider switches completed through the app, SME monitoring dashboards, and anonymized QoS insights sold to operators — never your personal data.",
  },
  {
    q: "Is the code open source?",
    a: "Yes — inspired by Dishylink's open-source model, the core is developed in the open on GitHub. Issues and pull requests are public and every change is traceable.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 border-t border-border/60 bg-secondary/40">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">FAQ</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Questions, answered honestly</h2>
        </div>
        <Accordion type="single" collapsible className="mt-10">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base font-medium">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
