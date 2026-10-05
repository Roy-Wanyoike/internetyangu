"use client";

// App-shell offline banner (ISS-010 / Addendum §31). Rendered under the
// dashboard header whenever the browser reports no network connection.
// Honest by design: it states exactly what the user can expect (cached
// shell, stale-labelled data) without pretending anything is live.

import { WifiOff } from "lucide-react";

export function OfflineBanner({ offline }: { offline: boolean }) {
  if (!offline) return null;
  return (
    <div
      role="status"
      className="border-b border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200"
    >
      <p className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-xs font-medium sm:px-6">
        <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        You are offline — this is a cached copy. Data below is labelled with when it was last
        updated, and nothing new can be measured or saved until you reconnect.
      </p>
    </div>
  );
}
