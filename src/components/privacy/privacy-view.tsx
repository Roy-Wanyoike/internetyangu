"use client";

// Privacy Center (ISS-015 / Master Directive §16–17) — one place where a user
// can see, control, and erase what InternetYangu holds. Everything on this
// page describes only what the code actually does today (Addendum §21):
// local-first storage in this app's own SQLite file plus a few localStorage
// keys, no accounts, no third parties, no telemetry.

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  CheckCircle2,
  Database,
  Download,
  EyeOff,
  FileClock,
  Loader2,
  Radio,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { ErrorState } from "@/components/app/error-state";
import { relativeTime } from "@/lib/format";
import { CONSENT_LABELS, CONSENT_PURPOSES } from "@/lib/consent";
import { useConsent } from "@/hooks/use-consent";
import { getContributorKey, rotateContributorKey } from "@/lib/contributor";
import { clearRuntimeApiCaches } from "@/lib/pwa";

// Allowlist copied from Addendum §21 (Contributor Intelligence) — the exact
// fields a consent-gated contribution flow could ever upload, and the fields
// it must never touch.
const SHARED_FIELDS = [
  "provider",
  "approximate area",
  "network type",
  "speed",
  "latency",
  "packet loss",
  "timestamp",
];
const NEVER_SHARED_FIELDS = [
  "name",
  "phone",
  "email",
  "exact address",
  "raw SMS",
  "account credentials",
  "exact personal history",
];

interface PurgeResponse {
  purgedAt: string;
  deleted: {
    billingEntries: number;
    outageEvents: number;
    pingSamples: number;
  };
}

type PurgePhase = "idle" | "running" | "done" | "error";

export function PrivacyView({ onExit }: { onExit: () => void }) {
  const { consent, grant, revoke, reset } = useConsent();

  // Deletion flow: open the confirm dialog (interaction 1), confirm there
  // (interaction 2) — then the result replaces the card. Two interactions, no
  // dark patterns, no re-confirmation after that.
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [phase, setPhase] = useState<PurgePhase>("idle");
  const [result, setResult] = useState<PurgeResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Arriving via a plain #privacy anchor keeps the landing scroll offset.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const purge = useCallback(async () => {
    setPhase("running");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/data/purge", {
        method: "DELETE",
        // The pseudonymous key is the only identity a purge is keyed on. It is
        // sent once, in a header, and never logged anywhere.
        headers: { "X-Contributor-Key": getContributorKey() },
        cache: "no-store",
      });
      const payload = (await res.json().catch(() => null)) as
        | (PurgeResponse & { error?: string })
        | null;
      if (!res.ok) {
        throw new Error(payload?.error ?? `the request failed (HTTP ${res.status})`);
      }
      if (!payload || !payload.deleted) {
        throw new Error("the server response was malformed");
      }
      // Client-side propagation (Directive §17): drop the stored consent
      // record, rotate the pseudonymous contributor key so future rows can
      // never be correlated with the purged ones, and evict the service
      // worker's cached API responses.
      reset();
      rotateContributorKey();
      clearRuntimeApiCaches();
      setResult(payload);
      setPhase("done");
      setConfirmOpen(false);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "the request failed");
      setPhase("error");
    }
  }, [reset]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onExit} aria-label="Back to site">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-lg font-semibold tracking-tight">
                Privacy <span className="text-primary">Center</span>
              </span>
            </span>
          </div>
          <Badge variant="outline" className="hidden text-xs text-muted-foreground sm:inline-flex">
            Local-first · accountless
          </Badge>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8 sm:px-6">
        <p className="text-sm leading-relaxed text-muted-foreground">
          InternetYangu has no accounts and no sign-up. This page shows exactly what is
          stored, who can see it, how to switch optional things off, and how to erase
          everything — in two interactions, without asking us first.
        </p>

        {/* --- Consent controls (Directive §16) -------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              Your choices
            </CardTitle>
            <CardDescription>
              Both are off by default. Nothing optional runs until you switch it on, and
              switching it off again stops it immediately. Your choice is saved in this
              browser only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {CONSENT_PURPOSES.map((purpose, index) => {
              const record = consent.purposes[purpose];
              return (
              <div key={purpose}>
                {index > 0 && <Separator className="mb-5" />}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{CONSENT_LABELS[purpose].title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {CONSENT_LABELS[purpose].description}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Current state:{" "}
                      <span className="font-medium text-foreground">
                        {record.granted ? "On" : "Off"}
                      </span>
                      {" · "}
                      {record.updatedAt
                        ? `last changed ${relativeTime(record.updatedAt)}`
                        : "never changed"}
                    </p>
                  </div>
                  <Switch
                    checked={record.granted}
                    onCheckedChange={(checked) =>
                      checked ? grant(purpose) : revoke(purpose)
                    }
                    aria-label={CONSENT_LABELS[purpose].title}
                    className="mt-0.5"
                  />
                </div>
              </div>
              );
            })}
          </CardContent>
        </Card>

        {/* --- Delete my data (Directive §17) ---------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
              Delete my data
            </CardTitle>
            <CardDescription>
              Erases your records from the app&rsquo;s database and this browser. This
              cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {phase === "done" && result ? (
              <div
                role="status"
                className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-5"
              >
                <p className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
                  Your data has been deleted.
                </p>
                <p className="text-sm text-muted-foreground">
                  Removed on {new Date(result.purgedAt).toLocaleString()}:
                </p>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center justify-between gap-3 sm:justify-start sm:gap-6">
                    <span className="text-muted-foreground">Billing entries</span>
                    <span className="font-semibold tabular-nums">{result.deleted.billingEntries}</span>
                  </li>
                  <li className="flex items-center justify-between gap-3 sm:justify-start sm:gap-6">
                    <span className="text-muted-foreground">Outage events</span>
                    <span className="font-semibold tabular-nums">{result.deleted.outageEvents}</span>
                  </li>
                  <li className="flex items-center justify-between gap-3 sm:justify-start sm:gap-6">
                    <span className="text-muted-foreground">Latency samples</span>
                    <span className="font-semibold tabular-nums">{result.deleted.pingSamples}</span>
                  </li>
                </ul>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Your consent switches were reset to off, the pseudonymous key this
                  browser used was replaced with a fresh one, and cached copies of the
                  deleted data were cleared. Nothing was deleted from the pre-loaded
                  provider directory, which contains no personal data.
                </p>
              </div>
            ) : phase === "error" ? (
              <ErrorState
                title="Deletion failed"
                message={`Nothing was deleted — ${errorMsg}.`}
                onRetry={() => {
                  setPhase("idle");
                  setConfirmOpen(true);
                }}
                retrying={false}
              />
            ) : (
              <>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Pressing the button deletes, in one step:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>every billing entry and outage event in the app&rsquo;s database — on this install these logs belong to this device, and the dashboard lists exactly these records;</li>
                  <li>every latency sample this browser tagged with its pseudonymous key, plus keyless samples generated by this device&rsquo;s monitor and test center;</li>
                  <li>this browser&rsquo;s stored consent choices (back to off) and its pseudonymous key, which is replaced so old and new records can never be linked.</li>
                </ul>
                <AlertDialog
                  open={confirmOpen}
                  onOpenChange={(open) => {
                    if (phase === "running") return;
                    setConfirmOpen(open);
                  }}
                >
                  <Button
                    variant="destructive"
                    className="mt-4 min-h-11 gap-2"
                    onClick={() => setConfirmOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete my data
                  </Button>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete everything InternetYangu holds?</AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                          <p>
                            This permanently removes every billing entry, outage event and
                            latency sample this device created, and resets your privacy
                            choices. It cannot be undone.
                          </p>
                          <p>
                            The pre-loaded provider directory stays — it is shared,
                            anonymous reference data with nothing personal in it.
                          </p>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={phase === "running"}>Keep my data</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={phase === "running"}
                        onClick={(e) => {
                          // Keep the dialog open while the purge runs so the
                          // spinner is visible and the action can't double-fire.
                          e.preventDefault();
                          void purge();
                        }}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        {phase === "running" ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                            Deleting…
                          </>
                        ) : (
                          "Delete everything"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </CardContent>
        </Card>

        {/* --- Export my data (Directive §17) ----------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-4 w-4 text-primary" aria-hidden="true" />
              Export my data
            </CardTitle>
            <CardDescription>
              Take your records with you, as files you keep.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Every outage in your evidence log has an{" "}
              <span className="font-medium text-foreground">Export</span> button that
              downloads its full record — provider, start, end, duration and your notes —
              as a JSON file. That is the export that exists today; exports for billing
              entries and measurement history will follow as those features mature.
            </p>
            <Button asChild variant="outline" className="min-h-11 gap-2">
              <a href="#dashboard/outages" aria-label="Open the Outages evidence log to export JSON files">
                <Download className="h-4 w-4" aria-hidden="true" />
                Open the Outages evidence log
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* --- Plain-language disclosure ---------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4 text-primary" aria-hidden="true" />
              What is stored, and where
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm font-medium">The app&rsquo;s own database (SQLite file on the machine running InternetYangu)</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>Billing entries you log: provider, plan, amount, data, month, and an optional payment reference or note if you type one.</li>
                <li>Outage events you log: provider, start and end time, and any notes you write.</li>
                <li>Latency samples your browser measures: round-trip time, success flag, connection type, stability flag, and timestamp. Each sample can carry a pseudonymous key — a random code generated in this browser (not an account, phone number, email or IP) — so &ldquo;Delete my data&rdquo; can find them again.</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium">This browser (localStorage)</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li><code className="break-all text-xs">internetyangu.consent.v1</code> — your two choices above and when you last changed them.</li>
                <li><code className="break-all text-xs">internetyangu.contributorKey</code> — the random pseudonymous code described above.</li>
                <li><code className="break-all text-xs">internetyangu.dashboard.visits</code> and <code className="break-all text-xs">internetyangu.install.declined</code> — UI counters so the install prompt is offered politely. These contain no personal data and are not part of &ldquo;Delete my data&rdquo;.</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium">What never happens</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                There is no sign-up, no analytics, no advertising, and no third-party
                service in this product. Requests go only to the InternetYangu app itself,
                on the machine serving this page. Nothing is sent to its developers or to
                anyone else.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileClock className="h-4 w-4 text-primary" aria-hidden="true" />
              How long it is kept
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Indefinitely, until you delete it — there is no automatic expiry and there
              are no backups, archives or separate analytics stores today. &ldquo;Delete
              my data&rdquo; removes the rows immediately in a single transaction, so
              there is nothing else to wait for. If backups are ever introduced, their
              retention and expiry will be documented here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <EyeOff className="h-4 w-4 text-primary" aria-hidden="true" />
              What would ever be shared
            </CardTitle>
            <CardDescription>
              The &ldquo;Share anonymous measurements&rdquo; switch gates contributing to
              area and provider intelligence. That feature does not exist yet — nothing is
              contributed today — but this is the complete list of what it could ever
              upload, agreed in advance and binding on the implementation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm font-medium">Could be shared, only while the switch is on</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SHARED_FIELDS.map((field) => (
                  <Badge key={field} variant="secondary" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium">Never shared, by any feature, ever</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {NEVER_SHARED_FIELDS.map((field) => (
                  <Badge key={field} variant="outline" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              One honest clarification: your bills, outage notes and latency history are
              not on either list because they are never shared at all — they exist only in
              the app&rsquo;s own database on the machine running it, and only &ldquo;Delete
              my data&rdquo; or your own dashboard actions ever touch them.
            </p>
          </CardContent>
        </Card>
      </main>

      <footer className="mt-auto border-t border-border/60 bg-card">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:px-6">
          <p className="inline-flex items-center gap-1.5">
            <Radio className="h-3 w-3" aria-hidden="true" />
            InternetYangu v0.1.0 · Privacy Center
          </p>
          <a
            href="#dashboard"
            className="inline-flex items-center gap-1.5 underline-offset-2 transition-colors hover:text-foreground hover:underline"
          >
            Back to my dashboard
          </a>
        </div>
      </footer>
    </div>
  );
}
