"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, ArrowRight, MapPin, Satellite, Wifi, Signal, Gauge } from "lucide-react";

const SCOPE_CHIPS = [
  { icon: Signal, label: "Mobile & fixed wireless" },
  { icon: Wifi, label: "Home fiber" },
  { icon: Satellite, label: "Satellite" },
];

export function Hero({ onLaunch, onFind }: { onLaunch: () => void; onFind: () => void }) {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* decorative lumen glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(720px 320px at 78% 8%, color-mix(in srgb, var(--chart-2) 16%, transparent), transparent 70%), radial-gradient(560px 280px at 12% 0%, color-mix(in srgb, var(--chart-1) 10%, transparent), transparent 70%)",
        }}
      />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-28 lg:pt-24">
        <div>
          <Badge variant="secondary" className="mb-5 gap-1.5 px-3 py-1 text-xs font-medium">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            Built for Kenya &amp; East Africa — every network, not just satellite
          </Badge>
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            Know your internet.{" "}
            <span className="text-primary">Choose better. Pay smarter.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            InternetYangu is a privacy-first connectivity &amp; spend monitor: it measures your
            connection quality, turns billing SMS into cost-per-GB truth, and shows which providers
            actually perform best in your area. Built for Safaricom, Faiba, Zuku, Airtel, Poa,
            Mawingu, Starlink and beyond — every network East Africans actually use.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button onClick={onLaunch} size="lg" className="gap-2">
              <Gauge className="h-4 w-4" aria-hidden="true" />
              Monitor my internet
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button onClick={onFind} size="lg" variant="outline" className="gap-2">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Find the best internet near you
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {SCOPE_CHIPS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
              >
                <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Live pulse card */}
        <div className="relative">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
                Network pulse
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 animate-pulse rounded-full bg-chart-2" aria-hidden="true" />
                live
              </span>
            </div>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-5xl font-bold tracking-tight text-primary">2.84M</span>
              <span className="pb-1.5 text-sm text-muted-foreground">
                fixed internet lines in Kenya
                <br />
                (+32.4% YoY — CA, Jun 2026)
              </span>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-5 text-center">
              <div>
                <div className="text-lg font-semibold">37.9M</div>
                <div className="text-xs text-muted-foreground">M-Pesa actives</div>
              </div>
              <div>
                <div className="text-lg font-semibold">KES 1,999</div>
                <div className="text-xs text-muted-foreground">Airtel fixed entry</div>
              </div>
              <div>
                <div className="text-lg font-semibold">~19.5K</div>
                <div className="text-xs text-muted-foreground">Starlink KE subs</div>
              </div>
            </div>
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              Millions of households juggle multiple networks — yet nobody shows them what they
              actually pay per GB, or proves what the outage cost them. InternetYangu does.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
