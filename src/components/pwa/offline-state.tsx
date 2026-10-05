"use client";

// Offline / staleness states for data sections (ISS-010 / Addendum §31).
//
// Two honest patterns, never mixed up:
//  1. StaleDataNotice  — we HAVE data, but it is not current: served from the
//     service-worker cache fallback, or the last refresh failed while offline.
//     Always shows "last updated <time>".
//  2. OfflineEmptyState — we have NOTHING to show and we are offline: an
//     explicit offline empty-state with a retry affordance (§31).

import { Button } from "@/components/ui/button";
import { CloudOff, Loader2, RefreshCw } from "lucide-react";
import { relativeTime } from "@/lib/format";

export function StaleDataNotice({ asOf, offline }: { asOf: string | null; offline: boolean }) {
  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-900 dark:text-amber-200"
    >
      <CloudOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {offline
        ? `Offline — showing last updated ${asOf ? relativeTime(asOf) : "unknown"}`
        : `Couldn't reach the network — showing cached data from ${asOf ? relativeTime(asOf) : "earlier"}`}
    </div>
  );
}

export function OfflineEmptyState({
  onRetry,
  retrying = false,
  title = "Offline — nothing to show yet",
}: {
  onRetry?: () => void;
  retrying?: boolean;
  title?: string;
}) {
  return (
    <div
      role="status"
      className="flex flex-col items-center gap-3 rounded-lg border border-border/60 bg-muted/40 px-4 py-6 text-center"
    >
      <CloudOff className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
          You are offline and this section has no data yet. Reconnect and refresh to load it —
          nothing was invented to fill the gap.
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} disabled={retrying} className="gap-2">
          {retrying ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          )}
          Retry
        </Button>
      )}
    </div>
  );
}
