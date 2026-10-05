"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";

// Reusable error state per audit 001 F-02 / master checklist §22:
// communicates what happened, what the user can do, and offers a retry.
export function ErrorState({
  message,
  onRetry,
  retrying = false,
  title = "Couldn't load this data",
}: {
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
  title?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-center"
    >
      <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {message ?? "The request failed."} Check your connection and try again — your locally
          stored data is unaffected.
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
