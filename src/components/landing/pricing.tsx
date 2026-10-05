"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: "KES 0",
    cadence: "forever",
    desc: "Everything most households need.",
    features: ["Live latency & uptime", "Manual bills + SMS paste parsing", "Cost-per-GB truth", "Provider directory", "7-day history"],
    cta: "Open Dashboard",
    highlight: false,
  },
  {
    name: "Pro",
    price: "KES 200",
    cadence: "per month",
    desc: "For households juggling networks.",
    features: ["Unlimited history & exports", "Outage evidence packs", "Auto SMS tracking (Android shell)", "Multi-home / multi-router", "Switch-comparison advisor"],
    cta: "Start with Free",
    highlight: true,
  },
  {
    name: "Business",
    price: "KES 1,500",
    cadence: "per month",
    desc: "For cyber cafés, apartments & SMEs.",
    features: ["Multiple connections in one view", "Uptime SLA reporting", "Cost allocation per line", "API access", "Priority adapter requests"],
    cta: "Talk to us",
    highlight: false,
  },
];

export function Pricing({ onLaunch }: { onLaunch: () => void }) {
  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Pricing</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Priced like a utility bill, not a luxury</h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Pro costs less than one top-up bundle. If InternetYangu saves you one bad renewal or one
          wasted top-up, it has paid for itself.
        </p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {PLANS.map((p) => (
          <Card
            key={p.name}
            className={
              p.highlight
                ? "relative border-primary shadow-md ring-1 ring-primary/20"
                : "relative border-border/80"
            }
          >
            {p.highlight && (
              <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                Most popular
              </Badge>
            )}
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">{p.name}</CardTitle>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.cadence}</span>
              </div>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-chart-1" aria-hidden="true" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={p.highlight || p.name === "Free" ? onLaunch : undefined}
                className="mt-6 w-full"
                variant={p.highlight ? "default" : "outline"}
              >
                {p.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
