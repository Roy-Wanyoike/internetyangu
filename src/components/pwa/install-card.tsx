"use client";

// Custom install card (ISS-010 / Addendum §32) — the polite alternative to
// the browser's raw install prompt. Rendered inside the dashboard after
// meaningful engagement (2nd dashboard visit, tracked in localStorage).
// Install triggers the captured beforeinstallprompt event; "Not now" hides
// the card for the rest of the session. The product works perfectly without
// installing, so the card is always dismissible and never blocks anything.

import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

export function InstallCard({
  visible,
  onInstall,
  onDecline,
}: {
  visible: boolean;
  onInstall: () => void;
  onDecline: () => void;
}) {
  if (!visible) return null;

  return (
    <aside
      aria-label="Install InternetYangu"
      className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          aria-hidden="true"
        >
          <Download className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Install InternetYangu on this device</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Open it from your home screen like an app: faster access, your dashboard and quick
            tests one tap away, and the shell keeps working when the network drops. Optional —
            everything already works right here in the browser.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1.5" onClick={onInstall}>
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Install
            </Button>
            <Button size="sm" variant="outline" className="h-8" onClick={onDecline}>
              Not now
            </Button>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 shrink-0 p-0"
          onClick={onDecline}
          aria-label="Dismiss install suggestion"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </aside>
  );
}
