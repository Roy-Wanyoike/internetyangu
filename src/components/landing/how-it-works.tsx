"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MonitorSmartphone, ShieldCheck, Database } from "lucide-react";

const TIERS = [
  {
    icon: MonitorSmartphone,
    tier: "Tier 1",
    title: "Browser core",
    perms: "No sensitive permissions",
    tone: "secondary" as const,
    body: "The PWA you are using now: live latency probes, manual bills, SMS paste parsing and the provider directory — all client-side.",
  },
  {
    icon: ShieldCheck,
    tier: "Tier 2",
    title: "Android shell",
    perms: "SSID + SMS permissions",
    tone: "default" as const,
    body: "An optional lightweight wrapper that reads billing SMS as they arrive and reads the connected SSID, so tracking happens automatically instead of manually.",
  },
  {
    icon: Database,
    tier: "Tier 3",
    title: "Encrypted sync + registry",
    perms: "Opt-in only",
    tone: "secondary" as const,
    body: "Encrypted backup across devices, community-maintained ISP adapters, and an optional local router agent for always-on monitoring.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-y border-border/60 bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Architecture</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Local-first by design — privacy is the feature
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Your bills and outage history are yours. The core product works with zero sensitive
            permissions; anything deeper is opt-in and anything shared is encrypted.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TIERS.map((t) => (
            <Card key={t.tier} className="border-border/80 bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <t.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <Badge variant={t.tone}>{t.tier}</Badge>
                </div>
                <CardTitle className="mt-4 text-lg">{t.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                <p>{t.body}</p>
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  {t.perms}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
