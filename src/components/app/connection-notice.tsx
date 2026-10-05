"use client";

// Data-guardrail notice (ISS-012): a small chip in the dashboard header that
// makes the app's metered-connection behavior visible. Two variants:
//   - Data Saver on (saveData=true): "Data Saver active — background tests paused"
//   - Metered link (2g/slow-2g/3g): probes slowed to one per minute
// Dismissing is per-session (sessionStorage) and the chip reappears on the
// next visit. While connection info is unavailable (SSR / unsupported
// browsers) nothing renders.

import { useState } from "react";
import { Gauge, SignalHigh, X } from "lucide-react";
import { useConnectionType } from "@/hooks/use-connection-type";

const DISMISS_KEY = "iy-connection-notice-dismissed";

function dismissedThisSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function ConnectionNotice() {
  const connection = useConnectionType();
  const [dismissed, setDismissed] = useState<boolean>(dismissedThisSession);

  if (dismissed) return null;
  if (connection.saveData) {
    return (
      <span
        role="status"
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground"
      >
        <Gauge className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        Data Saver active — background tests paused
        <button
          type="button"
          onClick={() => {
            try {
              window.sessionStorage.setItem(DISMISS_KEY, "1");
            } catch {
              /* storage unavailable — dismissal just won't persist */
            }
            setDismissed(true);
          }}
          aria-label="Dismiss data saver notice"
          className="ml-0.5 -mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      </span>
    );
  }
  if (connection.metered) {
    return (
      <span
        role="status"
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground"
      >
        <SignalHigh className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        Metered connection ({connection.effectiveType}) — background tests slowed to one per minute
        <button
          type="button"
          onClick={() => {
            try {
              window.sessionStorage.setItem(DISMISS_KEY, "1");
            } catch {
              /* storage unavailable — dismissal just won't persist */
            }
            setDismissed(true);
          }}
          aria-label="Dismiss metered connection notice"
          className="ml-0.5 -mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      </span>
    );
  }
  return null;
}
