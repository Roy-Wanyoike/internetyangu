"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ReceiptText, Scale, ArrowRight } from "lucide-react";

const PILLARS = [
  {
    icon: Activity,
    num: "01",
    title: "Measure",
    tagline: "Know your connection, continuously",
    points: [
      "Live latency probing every 5 seconds from your browser — no agent, no permissions",
      "Outage log with start/end timestamps you control",
      "Uptime percentage and p50/p95 latency, computed on your own data",
    ],
  },
  {
    icon: ReceiptText,
    num: "02",
    title: "Track",
    tagline: "Turn billing SMS into cost-per-GB truth",
    points: [
      "Paste any M-Pesa / Airtel Money confirmation — parsed on-device, never uploaded",
      "Every bill becomes a cost-per-GB data point across providers",
      "See which network actually gives you the cheapest megabyte you use",
    ],
  },
  {
    icon: Scale,
    num: "03",
    title: "Act",
    tagline: "Complain with evidence, switch with confidence",
    points: [
      "Export outage evidence packs (timestamps + latency history) for CA complaints",
      "Compare entry plans and effective rates across the provider directory",
      "Community adapter registry keeps every East African ISP covered",
    ],
  },
];

export function Pillars() {
  return (
    <section id="product" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">The product</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Three things nobody gives you today — in one place
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Speed-test apps show a moment. Bank apps show a debit. Neither shows whether the network
          you paid for delivered — or what a week of outages actually cost you.
        </p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {PILLARS.map((p) => (
          <Card key={p.num} className="relative overflow-hidden border-border/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <p.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span aria-hidden="true" className="text-4xl font-bold text-accent">
                  {p.num}
                </span>
              </div>
              <CardTitle className="mt-4 text-xl">{p.title}</CardTitle>
              <CardDescription className="text-sm">{p.tagline}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
                {p.points.map((pt) => (
                  <li key={pt} className="flex gap-2">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-chart-2" aria-hidden="true" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
