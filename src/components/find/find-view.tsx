"use client";

// Find Internet — the product's second half (Addendum §34): a visitor with no
// account picks an area and gets evidence-backed provider intelligence.
// Privacy: area-level aggregation only — never exact addresses, accounts or
// IPs. Rankings from <5 samples are refused (insufficientData, Addendum §38),
// and the whole dataset currently ships stamped "illustrative-seed", so a
// persistent banner says so.

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorState } from "@/components/app/error-state";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowLeft,
  Award,
  Gauge,
  Info,
  MapPin,
  PiggyBank,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { formatKes, formatMs, relativeTime } from "@/lib/format";
import { DATA_WINDOW_DAYS, METHODOLOGY_VERSION } from "@/lib/intelligence";
import type {
  AreaIntelligenceDto,
  AreaProviderIntel,
  AreaSummaryDto,
  AreasListDto,
} from "@/lib/types";

const MIN_VALUE_UPTIME_PCT = 90; // "reliable enough" bar for the Best value card

function ConfidenceBadge({ tier }: { tier: AreaProviderIntel["confidence"] }) {
  if (tier === "high") {
    return <Badge className="gap-1">High confidence</Badge>;
  }
  if (tier === "medium") {
    return <Badge variant="secondary" className="gap-1">Medium confidence</Badge>;
  }
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      Limited data
    </Badge>
  );
}

export function FindView({ onExit }: { onExit: () => void }) {
  const [areas, setAreas] = useState<AreaSummaryDto[] | null>(null);
  const [areasError, setAreasError] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [intel, setIntel] = useState<AreaIntelligenceDto | null>(null);
  const [intelLoading, setIntelLoading] = useState(false);
  const [intelError, setIntelError] = useState<string | null>(null);

  const loadAreas = useCallback(async () => {
    try {
      const res = await fetch("/api/intelligence/areas", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as AreasListDto;
      setAreas(data.areas);
      setAreasError(null);
      // Land on the best-covered area so the first render shows real value.
      setSelectedSlug((prev) => {
        if (prev || !data.areas.length) return prev;
        const best = [...data.areas].sort((a, b) => b.sampleCount - a.sampleCount)[0];
        return best ? best.slug : prev;
      });
    } catch (e) {
      setAreasError(e instanceof Error ? e.message : "The area list request failed");
    }
  }, []);

  const loadIntel = useCallback(async (slug: string) => {
    setIntelLoading(true);
    try {
      const res = await fetch(`/api/intelligence/areas/${encodeURIComponent(slug)}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setIntel((await res.json()) as AreaIntelligenceDto);
      setIntelError(null);
    } catch (e) {
      setIntelError(e instanceof Error ? e.message : "The area intelligence request failed");
    } finally {
      setIntelLoading(false);
    }
  }, []);

  // Load the area list once on mount.
  useEffect(() => {
    void loadAreas();
  }, [loadAreas]);

  // Arriving via a plain #find anchor keeps the landing scroll offset — reset.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    if (selectedSlug) void loadIntel(selectedSlug);
  }, [selectedSlug, loadIntel]);

  const selectedArea = areas?.find((a) => a.slug === selectedSlug) ?? null;

  const recommendations = useMemo(() => {
    if (!intel || intel.insufficientData) return null;
    const eligible = intel.providers.filter((p) => p.confidence !== "limited" && p.score != null);
    if (!eligible.length) return null;
    const bestOverall = [...eligible].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
    const bestLatency = [...eligible]
      .filter((p) => p.medianLatencyMs != null)
      .sort((a, b) => (a.medianLatencyMs ?? 1e9) - (b.medianLatencyMs ?? 1e9))[0];
    const reliable = eligible.filter((p) => (p.uptimePct ?? 0) >= MIN_VALUE_UPTIME_PCT);
    const valuePool = reliable.length ? reliable : eligible;
    const bestValue = [...valuePool]
      .filter((p) => p.entryPriceKes != null)
      .sort((a, b) => (a.entryPriceKes ?? 1e9) - (b.entryPriceKes ?? 1e9))[0];
    return { bestOverall, bestLatency, bestValue, valueWasRelaxed: !reliable.length };
  }, [intel]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onExit} aria-label="Back to site">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-lg font-semibold tracking-tight">
                Find <span className="text-primary">Internet</span>
              </span>
            </span>
            <span className="ml-1 hidden rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground sm:inline-block">
              No account needed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={onExit} size="sm" variant="outline" className="hidden sm:inline-flex">
              Back to site
            </Button>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Which internet is best <span className="text-primary">here?</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Pick an area to see how providers actually perform in it — median latency, uptime and
            how much evidence sits behind each ranking. Public intelligence, no sign-up.
          </p>
        </div>

        {/* Persistent honesty banner (Addendum §38) — visible on every screen of this view */}
        <div
          role="note"
          aria-label="Dataset notice"
          className="mt-5 flex items-start gap-2.5 rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-secondary-foreground"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            <span className="font-semibold">Illustrative dataset</span> — rankings generated from
            seeded demo measurements, not live network data.
          </p>
        </div>

        {/* Area selector — explicit choice, never faked geolocation (Addendum §35) */}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="area-selector" className="text-sm font-medium sm:w-40 sm:shrink-0">
            Choose your area
          </label>
          <Select value={selectedSlug} onValueChange={setSelectedSlug}>
            <SelectTrigger id="area-selector" className="w-full sm:max-w-sm" aria-label="Choose your area">
              <SelectValue placeholder={areasError ? "Area list unavailable" : "Select an area…"} />
            </SelectTrigger>
            <SelectContent>
              {(areas ?? []).map((a) => (
                <SelectItem key={a.slug} value={a.slug}>
                  {a.name}
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    ({a.sampleCount} measurements)
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results region — live region so updates are announced (ISS-014 AC) */}
        <div
          className="mt-6"
          aria-live="polite"
          aria-busy={intelLoading}
          aria-label="Area intelligence results"
        >
          {intelLoading ? (
            <div className="space-y-4" aria-hidden="true">
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
              </div>
              <Skeleton className="h-64 rounded-xl" />
            </div>
          ) : intelError ? (
            <ErrorState
              title="Area intelligence unavailable"
              message={`The request failed (${intelError}).`}
              onRetry={selectedSlug ? () => void loadIntel(selectedSlug) : undefined}
              retrying={intelLoading}
            />
          ) : intel && intel.insufficientData ? (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  Insufficient local data in {intel.area.name}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {intel.notice ?? "Measurements are too few to produce a fair ranking."} This area
                  has {intel.totalSamples} measurement{intel.totalSamples === 1 ? "" : "s"} in the
                  last {intel.dataWindow.days} days; at least {intel.minimumSamples} are needed
                  before any ranking is shown. Check back as contributions grow.
                </CardDescription>
              </CardHeader>
              {intel.fallbackArea && (
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const target = intel.fallbackArea;
                      if (target) setSelectedSlug(target.slug);
                    }}
                  >
                    View {intel.fallbackArea.name} instead (
                    {intel.fallbackArea.sampleCount} measurements)
                  </Button>
                </CardContent>
              )}
            </Card>
          ) : intel && recommendations ? (
            <div className="space-y-6">
              {/* Recommendation cards — each WHY is derived from the response data */}
              <div className="grid gap-4 md:grid-cols-3">
                <RecommendationCard
                  icon={Award}
                  kicker="Best overall"
                  provider={recommendations.bestOverall}
                  why={`${recommendations.bestOverall.uptimePct?.toFixed(1)}% uptime and ${formatMs(
                    recommendations.bestOverall.medianLatencyMs ?? 0,
                  )} median latency across ${recommendations.bestOverall.sampleCount} measurements from ${recommendations.bestOverall.contributorProxyCount} contributor${recommendations.bestOverall.contributorProxyCount === 1 ? "" : "s"}.`}
                />
                <RecommendationCard
                  icon={PiggyBank}
                  kicker="Best value"
                  provider={recommendations.bestValue}
                  why={
                    recommendations.valueWasRelaxed
                      ? `Lowest entry price here — from ${formatKes(
                          recommendations.bestValue.entryPriceKes ?? 0,
                        )}/mo; note reliability evidence is thinner (${recommendations.bestValue.uptimePct?.toFixed(
                          1,
                        )}% uptime across ${recommendations.bestValue.sampleCount} measurements).`
                      : `Cheapest reliable option here — from ${formatKes(
                          recommendations.bestValue.entryPriceKes ?? 0,
                        )}/mo with ${recommendations.bestValue.uptimePct?.toFixed(1)}% uptime across ${recommendations.bestValue.sampleCount} measurements.`
                  }
                />
                <RecommendationCard
                  icon={Zap}
                  kicker="Best for latency"
                  provider={recommendations.bestLatency}
                  why={`Fastest responses in this area — ${formatMs(
                    recommendations.bestLatency.medianLatencyMs ?? 0,
                  )} median latency with ${recommendations.bestLatency.uptimePct?.toFixed(
                    1,
                  )}% uptime across ${recommendations.bestLatency.sampleCount} measurements.`}
                />
              </div>

              {/* Provider ranking table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    Provider rankings in {intel.area.name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Sorted by combined score (uptime {`+`} latency) · {intel.totalSamples}{" "}
                    measurements in the last {intel.dataWindow.days} days · illustrative dataset
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-4 sm:pl-6">#</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead className="text-right">Median latency</TableHead>
                          <TableHead className="text-right">Uptime</TableHead>
                          <TableHead className="text-right">Samples</TableHead>
                          <TableHead className="pr-4 text-right sm:pr-6">Confidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {intel.providers.map((p, i) => (
                          <TableRow key={p.providerId}>
                            <TableCell className="pl-4 font-medium text-muted-foreground sm:pl-6">
                              {i + 1}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{p.name}</span>
                              <span className="block text-xs text-muted-foreground">
                                {p.technology ?? "—"}
                                {p.entryPriceKes != null
                                  ? ` · from ${formatKes(p.entryPriceKes)}/mo`
                                  : ""}
                              </span>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatMs(p.medianLatencyMs ?? 0)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {p.uptimePct != null ? `${p.uptimePct.toFixed(1)}%` : "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {p.sampleCount}
                            </TableCell>
                            <TableCell className="pr-4 text-right sm:pr-6">
                              <ConfidenceBadge tier={p.confidence} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Per-provider "Check before you buy" panel */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Check before you buy</CardTitle>
                  <CardDescription className="text-sm">
                    What each ranking rests on — methodology, evidence and freshness per provider.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {intel.providers.map((p) => (
                      <AccordionItem key={p.providerId} value={p.providerId}>
                        <AccordionTrigger className="text-left text-sm sm:text-base">
                          <span className="flex flex-wrap items-center gap-2 pr-2">
                            {p.name}
                            <ConfidenceBadge tier={p.confidence} />
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                            <Detail label="Last measured">
                              {p.lastMeasuredAt ? relativeTime(p.lastMeasuredAt) : "—"}
                            </Detail>
                            <Detail label="Sample count">
                              {p.sampleCount} in the last {intel.dataWindow.days} days
                            </Detail>
                            <Detail label="Confidence">
                              {p.confidence === "high"
                                ? `High (≥100 samples)`
                                : p.confidence === "medium"
                                  ? `Medium (≥25 samples)`
                                  : `Limited (<25 samples)`}
                            </Detail>
                            <Detail label="Contributor proxies">
                              {p.contributorProxyCount} independent session
                              {p.contributorProxyCount === 1 ? "" : "s"}
                            </Detail>
                            <Detail label="Median latency">
                              {formatMs(p.medianLatencyMs ?? 0)}
                            </Detail>
                            <Detail label="Uptime">{p.uptimePct != null ? `${p.uptimePct.toFixed(1)}%` : "—"}</Detail>
                            <Detail label="Entry plan">
                              {p.entryPriceKes != null
                                ? `${formatKes(p.entryPriceKes)}/mo · ${p.technology ?? "—"}`
                                : "—"}
                            </Detail>
                            <Detail label="Methodology">
                              v{METHODOLOGY_VERSION.replace("v", "")} · {intel.dataWindow.days}-day
                              window
                            </Detail>
                          </dl>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Privacy: measurements are aggregated per area only — never tied to an exact
                    address, account or IP address.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : intel && !recommendations ? (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">Not enough reliable data for recommendations</CardTitle>
                <CardDescription>
                  Every provider in {intel.area.name} is below the medium-confidence bar
                  (&lt;25 samples each), so InternetYangu won&apos;t recommend one yet — see the
                  raw evidence below as it accumulates.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : areasError ? (
            <ErrorState
              title="Area list unavailable"
              message={`The area list request failed (${areasError}).`}
              onRetry={() => void loadAreas()}
            />
          ) : null}
        </div>

        {selectedArea && (
          <p className="mt-6 text-xs text-muted-foreground">
            Showing {selectedArea.name} · {selectedArea.sampleCount} measurements in the last{" "}
            {DATA_WINDOW_DAYS} days · methodology v{METHODOLOGY_VERSION.replace("v", "")}
          </p>
        )}
      </main>

      <footer className="mt-auto border-t border-border/60 bg-card">
        <div className="mx-auto max-w-5xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
          InternetYangu v0.1.0 · Find Internet — public area intelligence, no account required ·
          <span className="ml-1 inline-flex items-center gap-1">
            <Gauge className="h-3 w-3" aria-hidden="true" /> Monitor your own line under My Internet
          </span>
        </div>
      </footer>
    </div>
  );
}

function RecommendationCard({
  icon: Icon,
  kicker,
  provider,
  why,
}: {
  icon: typeof Award;
  kicker: string;
  provider: AreaProviderIntel;
  why: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
            <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
            {kicker}
          </CardDescription>
          <ConfidenceBadge tier={provider.confidence} />
        </div>
        <CardTitle className="mt-1 text-lg">{provider.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-muted-foreground">{why}</p>
      </CardContent>
    </Card>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  );
}
