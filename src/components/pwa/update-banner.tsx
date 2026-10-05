"use client";

// Dismissible "Update available" banner (ISS-010 / Addendum §32).
//
// Appears only when a new service worker is waiting. "Refresh" is the sole
// path that activates it (skipWaiting on explicit user confirmation);
// dismissal keeps the old version running until the next full reload.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";

export function UpdateBanner({
  visible,
  onApply,
}: {
  visible: boolean;
  onApply: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (!visible || dismissed) return null;

  return (
    <div
      role="status"
      className="border-b border-border/60 bg-secondary/70"
    >
      <p className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 text-xs sm:px-6">
        <RefreshCw className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
        <span className="font-medium">Update available</span>
        <span className="text-muted-foreground">
          A new version of InternetYangu is ready. Refresh to apply it now, or keep using this
          version.
        </span>
        <span className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            className="h-7 gap-1.5 px-3 text-xs"
            onClick={onApply}
            aria-label="Refresh now to apply the update"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss update notice"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </span>
      </p>
    </div>
  );
}
