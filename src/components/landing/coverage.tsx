"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatKes } from "@/lib/format";
import type { Provider } from "@/lib/types";

export function Coverage() {
  const [providers, setProviders] = useState<Provider[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/providers")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setProviders)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load providers"));
  }, []);

  const rows = (providers ?? []).slice(0, 6);

  return (
    <section id="coverage" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Coverage</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            One monitor for every network in the market
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Starlink monitors only work for Starlink. InternetYangu ships a community provider
            directory — entry plans, typical speeds and effective rates — so the comparison lives
            where your data lives.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Prices indicative · KES equivalent · verified anchors marked</p>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Technology</TableHead>
              <TableHead className="text-right">Entry plan</TableHead>
              <TableHead className="text-right">Typical speed</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-sm text-destructive">
                  Could not load the provider directory ({error}). Refresh to retry.
                </TableCell>
              </TableRow>
            ) : !providers ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full max-w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.country}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.technology}</TableCell>
                  <TableCell className="text-right font-medium">{formatKes(p.entryPriceKes)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">~{p.avgSpeedMbps} Mbps</TableCell>
                  <TableCell className="max-w-64 truncate text-xs text-muted-foreground" title={p.notes ?? ""}>
                    {p.notes ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Full directory — including Tanzania, Uganda and Rwanda — lives inside the dashboard.
      </p>
    </section>
  );
}
