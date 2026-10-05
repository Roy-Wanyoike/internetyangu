"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Star } from "lucide-react";
import { formatKes } from "@/lib/format";
import { costPerGb } from "@/lib/format";
import type { Provider } from "@/lib/types";

const COUNTRIES = ["ALL", "KE", "TZ", "UG", "RW"] as const;

export function ProvidersTab() {
  const [providers, setProviders] = useState<Provider[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<(typeof COUNTRIES)[number]>("ALL");

  useEffect(() => {
    fetch("/api/providers")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setProviders)
      .catch((e) => setError(e instanceof Error ? e.message : "failed"));
  }, []);

  const filtered = useMemo(() => {
    if (!providers) return null;
    return providers.filter((p) => {
      const matchesCountry = country === "ALL" || p.country === country;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.technology.toLowerCase().includes(q) ||
        (p.notes ?? "").toLowerCase().includes(q);
      return matchesCountry && matchesQuery;
    });
  }, [providers, query, country]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Provider directory</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Indicative entry plans across East Africa — the comparison lives where your usage data
          lives. Community-verified anchors are marked in notes.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            className="pl-9"
            placeholder="Search provider, technology…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search providers"
          />
        </div>
        <div role="group" aria-label="Filter by country" className="flex gap-1.5">
          {COUNTRIES.map((c) => (
            <button
              key={c}
              onClick={() => setCountry(c)}
              className={
                country === c
                  ? "rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                  : "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }
            >
              {c === "ALL" ? "All" : c}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {error ? (
            <p role="alert" className="py-6 text-center text-sm text-destructive">
              Could not load the directory ({error}). Refresh to retry.
            </p>
          ) : !filtered ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No providers match &ldquo;{query}&rdquo;{country !== "ALL" ? ` in ${country}` : ""}. Try a
              different search.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Technology</TableHead>
                    <TableHead className="text-right">Entry plan</TableHead>
                    <TableHead className="text-right">Typical speed</TableHead>
                    <TableHead className="text-right">Rating</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const cpg = p.dataCapGb > 0 ? costPerGb(p.entryPriceKes, p.dataCapGb) : null;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell><Badge variant="outline">{p.country}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{p.technology}</TableCell>
                        <TableCell className="text-right">
                          <div className="font-medium">{formatKes(p.entryPriceKes)}</div>
                          {cpg != null && (
                            <div className="text-xs text-muted-foreground">{formatKes(cpg, true)}/GB</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          ~{p.avgSpeedMbps} Mbps
                          {p.dataCapGb === 0 && <div className="text-xs">unlimited</div>}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-chart-2 text-chart-2" aria-hidden="true" />
                            {p.rating.toFixed(1)}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-56 truncate text-xs text-muted-foreground" title={p.notes ?? ""}>
                          {p.notes ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Why a directory inside a monitor?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">
          When your outage log shows three dropped evenings in a row, &ldquo;switch&rdquo; is only useful if
          you know what switching costs. This directory turns the Act pillar into a concrete
          comparison: entry price, effective cost per capped GB, and community rating — with your
          own cost-per-GB from the Spend tracker right next to it.
        </CardContent>
      </Card>
    </div>
  );
}
