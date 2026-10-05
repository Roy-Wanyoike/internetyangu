"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ErrorState } from "./error-state";
import { OfflineEmptyState, StaleDataNotice } from "@/components/pwa/offline-state";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { cacheFallbackAt } from "@/lib/pwa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Activity, ReceiptText, AlertTriangle, TrendingDown, RefreshCw } from "lucide-react";
import { useLatency } from "@/hooks/use-latency";
import { formatKes, formatMs, latencyGrade, relativeTime, durationMin } from "@/lib/format";
import type { Stats, OutageEvent } from "@/lib/types";

export function OverviewTab({ onGoToSpend }: { onGoToSpend: () => void }) {
  const { samples, latest, failStreak } = useLatency(true);
  const online = useOnlineStatus();
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsRetrying, setStatsRetrying] = useState(false);
  // Staleness bookkeeping (ISS-010 / §31): when the stats response came from
  // the service-worker cache fallback (or the last refresh failed offline),
  // the data on screen is explicitly labelled with when it was last updated.
  const [statsAsOf, setStatsAsOf] = useState<string | null>(null);
  const [statsStale, setStatsStale] = useState(false);
  const [outages, setOutages] = useState<OutageEvent[] | null>(null);
  const [outagesError, setOutagesError] = useState<string | null>(null);
  const [outagesRetrying, setOutagesRetrying] = useState(false);
  const [outagesAsOf, setOutagesAsOf] = useState<string | null>(null);
  const [outagesStale, setOutagesStale] = useState(false);

  const loadStats = useCallback(async () => {
    setStatsRetrying(true);
    try {
      const res = await fetch("/api/stats", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStats((await res.json()) as Stats);
      setStatsError(null);
      const cachedAt = cacheFallbackAt(res);
      setStatsStale(cachedAt !== null);
      setStatsAsOf(cachedAt ?? new Date().toISOString());
    } catch (e) {
      setStatsError(e instanceof Error ? e.message : "The stats request failed");
      // Offline refresh failure: any data on screen is now known-stale. If we
      // never loaded data, the error branch renders the offline empty-state.
      if (!online) setStatsStale(true);
    } finally {
      setStatsRetrying(false);
    }
  }, [online]);

  const loadOutages = useCallback(async () => {
    setOutagesRetrying(true);
    try {
      const res = await fetch("/api/outages", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setOutages((await res.json()) as OutageEvent[]);
      setOutagesError(null);
      const cachedAt = cacheFallbackAt(res);
      setOutagesStale(cachedAt !== null);
      setOutagesAsOf(cachedAt ?? new Date().toISOString());
    } catch (e) {
      setOutagesError(e instanceof Error ? e.message : "The outage log request failed");
      if (!online) setOutagesStale(true);
    } finally {
      setOutagesRetrying(false);
    }
  }, [online]);

  useEffect(() => {
    void loadStats();
    void loadOutages();
    const id = setInterval(() => void loadStats(), 15000);
    return () => clearInterval(id);
  }, [loadStats, loadOutages]);

  const grade = latencyGrade(latest ? latest.rttMs : failStreak > 0 ? -1 : null);
  const chartData = samples.map((s, i) => ({
    i,
    rtt: s.ok ? s.rttMs : null,
    // failed probes are drawn as destructive markers just under the poor band
    failed: s.ok ? null : 220,
    time: new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  }));
  // ~5 time ticks regardless of window size
  const tickInterval = Math.max(1, Math.floor(chartData.length / 5)) - 1;

  const toneBadge = (): { variant: "default" | "secondary" | "destructive" | "outline"; label: string } => {
    if (failStreak > 0) return { variant: "destructive", label: "Probing failed" };
    switch (grade.tone) {
      case "excellent":
        return { variant: "default", label: "Excellent" };
      case "good":
        return { variant: "default", label: "Good" };
      case "fair":
        return { variant: "secondary", label: "Fair" };
      case "poor":
        return { variant: "secondary", label: "Poor" };
      default:
        return { variant: "outline", label: "Starting…" };
    }
  };
  const conn = toneBadge();

  return (
    <div className="space-y-6">
      {/* KPI row — error state replaces silent eternal loading (F-02);
          offline + no data shows the explicit offline empty-state (§31) */}
      {statsError ? (
        online ? (
          <ErrorState
            title="Dashboard stats unavailable"
            message={`The stats request failed (${statsError}).`}
            onRetry={loadStats}
            retrying={statsRetrying}
          />
        ) : (
          <OfflineEmptyState
            title="Offline — dashboard stats unavailable"
            onRetry={loadStats}
            retrying={statsRetrying}
          />
        )
      ) : (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsStale && (
          <div className="sm:col-span-2 xl:col-span-4">
            <StaleDataNotice asOf={statsAsOf} offline={!online} />
          </div>
        )}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Connection now
            </CardDescription>
            {/* aria-live: connectivity change is the product's core signal — announce it (F-04) */}
            <CardTitle
              className="flex items-baseline gap-2 text-2xl"
              aria-live="polite"
              aria-atomic="true"
            >
              {latest ? formatMs(latest.rttMs) : failStreak > 0 ? "Offline" : "…"}
              <Badge variant={conn.variant} className="translate-y-0.5 text-[10px]">
                {conn.label}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Live RTT to probe endpoint, every 5s
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <ReceiptText className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Spend this month
            </CardDescription>
            <CardTitle className="text-2xl">
              {stats ? formatKes(stats.spendMtdKes) : <Skeleton className="h-7 w-24" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {stats ? `${stats.entriesCount} bills logged · ${stats.currentMonth}` : "loading…"}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Cost per GB
            </CardDescription>
            <CardTitle className="text-2xl">
              {stats ? (stats.avgCostPerGbKes != null ? formatKes(stats.avgCostPerGbKes, true) : "—") : <Skeleton className="h-7 w-20" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Blended average across this month&apos;s bills
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Outages (30d)
            </CardDescription>
            <CardTitle className="text-2xl">
              {stats ? (
                <>
                  {stats.outages30d}
                  {stats.openOutages > 0 && (
                    <Badge variant="destructive" className="ml-2 translate-y-0.5 text-[10px]">
                      {stats.openOutages} open
                    </Badge>
                  )}
                </>
              ) : (
                <Skeleton className="h-7 w-14" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {stats ? `${Math.round(stats.downtimeMin30d)} min downtime recorded` : "loading…"}
          </CardContent>
        </Card>
      </div>
      )}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base">Live latency</CardTitle>
            <CardDescription>Last {chartData.length || 0} probes · pauses when the tab is hidden</CardDescription>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {stats && (
              <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
                <span>
                  p50 <span className="font-medium text-foreground">{formatMs(stats.latencyP50Ms ?? 0)}</span>
                </span>
                <span>
                  p95 <span className="font-medium text-foreground">{formatMs(stats.latencyP95Ms ?? 0)}</span>
                </span>
                <span>
                  uptime <span className="font-medium text-foreground">{stats.uptimePct30d != null ? `${stats.uptimePct30d}%` : "—"}</span>
                </span>
              </div>
            )}
            {/* Deep-dive path (ISS-011): plain hash link — the #test view reacts to hashchange */}
            <Button asChild variant="outline" size="sm" className="gap-2">
              <a href="#test">
                <Activity className="h-4 w-4" aria-hidden="true" />
                Run full test
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Taking the first measurement…
            </div>
          ) : (
            <div
              className="h-48"
              role="img"
              aria-label={`Live latency, last ${chartData.length} probes, median ${stats?.latencyP50Ms ?? "n/a"} milliseconds, ${samples.filter((s) => !s.ok).length} failed`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                  <XAxis
                    dataKey="i"
                    tickFormatter={(i: number) => chartData[i]?.time ?? ""}
                    interval={tickInterval}
                    stroke="currentColor"
                    fontSize={10}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 240]}
                    stroke="currentColor"
                    fontSize={11}
                    className="text-muted-foreground"
                    tickFormatter={(v: number) => `${v}ms`}
                    axisLine={false}
                    tickLine={false}
                  />
                  {/* threshold bands: good/fair at 100ms, fair/poor at 200ms (F-06) */}
                  <ReferenceLine
                    y={100}
                    stroke="var(--chart-2)"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                    label={{ value: "fair", position: "insideBottomRight", fontSize: 9, fill: "var(--muted-foreground)" }}
                  />
                  <ReferenceLine
                    y={200}
                    stroke="var(--destructive)"
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                    label={{ value: "poor", position: "insideBottomRight", fontSize: 9, fill: "var(--muted-foreground)" }}
                  />
                  <RechartsTooltip
                    formatter={
                      ((value: unknown, name: unknown) =>
                        name === "rtt" ? [`${value} ms`, "RTT"] : ["probe failed", "status"]) as React.ComponentProps<
                          typeof RechartsTooltip
                        >["formatter"]
                    }
                    labelFormatter={(_label: string, payload) => {
                      const p = payload?.[0]?.payload as { time?: string } | undefined;
                      return p?.time ?? "";
                    }}
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "var(--popover-foreground)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rtt"
                    name="rtt"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                  {/* failed probes as visible markers, not silent gaps (F-06) */}
                  <Line
                    type="monotone"
                    dataKey="failed"
                    name="failed"
                    stroke="none"
                    dot={{ r: 3, fill: "var(--destructive)", strokeWidth: 0 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent outages */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base">Recent outages</CardTitle>
            <CardDescription>Evidence log you control</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onGoToSpend}>
            Track a bill
          </Button>
        </CardHeader>
        <CardContent>
          {outagesStale && outages && (
            <div className="mb-3">
              <StaleDataNotice asOf={outagesAsOf} offline={!online} />
            </div>
          )}
          {outagesError ? (
            online ? (
              <ErrorState
                title="Outage log unavailable"
                message={`The outage log request failed (${outagesError}).`}
                onRetry={loadOutages}
                retrying={outagesRetrying}
              />
            ) : (
              <OfflineEmptyState
                title="Offline — outage log unavailable"
                onRetry={loadOutages}
                retrying={outagesRetrying}
              />
            )
          ) : !outages ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : outages.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No outages logged yet — when your connection drops, report it and the timestamps will
              build your evidence file.
            </p>
          ) : (
            <ul>
              {outages.slice(0, 4).map((o, i) => (
                <li key={o.id}>
                  {i > 0 && <Separator className="my-3" />}
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{o.providerName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {relativeTime(o.startedAt)}
                        {o.notes ? ` · ${o.notes}` : ""}
                      </p>
                    </div>
                    <Badge variant={o.endedAt ? "outline" : "destructive"}>
                      {o.endedAt
                        ? `${durationMin(o.startedAt, o.endedAt) ?? "?"} min`
                        : "ongoing"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
