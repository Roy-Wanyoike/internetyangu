"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ReceiptText, FileCheck, TrendingUp, MapPin } from "lucide-react";

// The five platform pillars (master directive): one line each.
const PILLARS = [
  {
    icon: MapPin,
    num: "01",
    title: "Discover",
    line: "Compare real, area-level provider performance before you commit — no account needed.",
  },
  {
    icon: Activity,
    num: "02",
    title: "Monitor",
    line: "Live latency probing every 5 seconds straight from your browser — uptime you control.",
  },
  {
    icon: ReceiptText,
    num: "03",
    title: "Understand",
    line: "Turn billing SMS into cost-per-GB truth — parsed on-device, never uploaded.",
  },
  {
    icon: FileCheck,
    num: "04",
    title: "Prove",
    line: "Export outage evidence packs — timestamps plus latency history for CA complaints.",
  },
  {
    icon: TrendingUp,
    num: "05",
    title: "Optimize",
    line: "Switch plans or providers on evidence, not adverts — and keep the receipts.",
  },
];

export function Pillars() {
  return (
    <section id="product" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">The product</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          One engine, five ways it works for you
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Speed-test apps show a moment. Bank apps show a debit. InternetYangu connects measurement,
          spend and area intelligence — so you can choose, prove and optimize with evidence.
        </p>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {PILLARS.map((p) => (
          <Card key={p.num} className="relative overflow-hidden border-border/80">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <p.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span aria-hidden="true" className="text-3xl font-bold text-accent">
                  {p.num}
                </span>
              </div>
              <CardTitle className="mt-4 text-lg">{p.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{p.line}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
