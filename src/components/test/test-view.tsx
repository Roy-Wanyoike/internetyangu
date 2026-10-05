"use client";

// Connection Test Center (ISS-011 / Addendum §6–8, §20).
//
// A deliberate "Test my internet" experience — not the passive 5s probe:
//   - states what is tested and the estimated data usage BEFORE the run (§7);
//   - measures latency, jitter (stddev of probes), download, upload and
//     packet loss (failed-probe ratio) with size-bounded, cancellable
//     transfers against /api/test/transfer;
//   - captures connection type from the Network Information API via
//     useConnectionType and never claims Wi-Fi scanning (§8);
//   - offers an explicit "Save to my history" that writes ONE validated
//     sample (with connection type + stability flag) through the hardened
//     POST /api/ping path — with a confirmation first when the link looks
//     metered. Nothing is persisted without that explicit action (§20, §21).
//
// Latency probes reuse the exact measurement used by the live monitor
// (`measureRtt` from use-latency.ts) so both always agree.

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ErrorState } from "@/components/app/error-state";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  Ban,
  CircleCheck,
  Gauge,
  Info,
  Loader2,
  Play,
  RefreshCw,
  Save,
  Smartphone,
  Timer,
  Wallet,
} from "lucide-react";
import { measureRtt } from "@/hooks/use-latency";
import { useConnectionType } from "@/hooks/use-connection-type";
import {
  TEST_DATA_BUDGET_MB,
  LATENCY_PROBE_COUNT,
  TRANSFER_PASSES,
  TRANSFER_BYTES_PER_PASS,
  jitterMsOf,
  lossPctOf,
  makeTransferPayload,
  medianMs,
  mbpsOf,
  stabilityFlag,
  downloadStatus,
  uploadStatus,
  latencyStatus,
  jitterStatus,
  lossStatus,
  connectionTypeForApi,
  connectionTypeLabel,
  type MetricStatus,
} from "@/lib/test-quality";

type Phase = "idle" | "running" | "done" | "error" | "cancelled";
type Step = "latency" | "download" | "upload";

interface TestResult {
  latencySamples: number[]; // successful RTTs only
  failedProbes: number;
  totalProbes: number;
  downloadMbps: number | null; // null when every download pass failed
  uploadMbps: number | null;
  elapsedSec: number;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function TestView({ onExit }: { onExit: () => void }) {
  const connection = useConnectionType();
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState<Step>("latency");
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<TestResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);

  // Leaving the view mid-run must not leave transfers flying in the background.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Arriving via a plain #test anchor keeps the landing scroll offset — reset.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const run = useCallback(async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    const runId = ++runIdRef.current;
    const live = () => runId === runIdRef.current && !controller.signal.aborted;
    const finishCancelled = () => {
      setPhase("cancelled");
      setProgress(0);
    };

    setPhase("running");
    setResult(null);
    setErrorMsg(null);
    setSaveState("idle");
    setSaveError(null);
    setProgress(0);
    setStep("latency");
    setStepIndex(0);

    const startedAt = Date.now();
    const latencies: number[] = [];
    let failedProbes = 0;
    const downRates: number[] = [];
    const upRates: number[] = [];

    try {
      // Phase 1 — latency burst (reuse of the monitor's probe logic).
      for (let i = 0; i < LATENCY_PROBE_COUNT; i++) {
        if (!live()) return finishCancelled();
        setStepIndex(i);
        try {
          latencies.push(await measureRtt(controller.signal));
        } catch (e) {
          if (controller.signal.aborted || (e instanceof DOMException && e.name === "AbortError")) {
            return finishCancelled();
          }
          failedProbes += 1;
        }
        setProgress(Math.round(((i + 1) / LATENCY_PROBE_COUNT) * 40));
        await sleep(150); // small gap so samples spread over the link
      }

      // Phase 2 — download passes (size-bounded GET, ~200 KB each).
      setStep("download");
      for (let p = 0; p < TRANSFER_PASSES; p++) {
        if (!live()) return finishCancelled();
        setStepIndex(p);
        const passStart = performance.now();
        try {
          const res = await fetch("/api/test/transfer", {
            cache: "no-store",
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`download failed: ${res.status}`);
          const buf = await res.arrayBuffer();
          downRates.push(mbpsOf(buf.byteLength, performance.now() - passStart));
        } catch (e) {
          if (controller.signal.aborted || (e instanceof DOMException && e.name === "AbortError")) {
            return finishCancelled();
          }
          // A failed pass is a data point, not a dead run — keep going.
        }
        setProgress(40 + Math.round(((p + 1) / TRANSFER_PASSES) * 30));
      }

      // Phase 3 — upload passes (size-bounded POST, body is discarded).
      setStep("upload");
      const payload = makeTransferPayload(TRANSFER_BYTES_PER_PASS);
      for (let p = 0; p < TRANSFER_PASSES; p++) {
        if (!live()) return finishCancelled();
        setStepIndex(p);
        const passStart = performance.now();
        try {
          const res = await fetch("/api/test/transfer", {
            method: "POST",
            body: payload,
            cache: "no-store",
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`upload failed: ${res.status}`);
          await res.arrayBuffer();
          upRates.push(mbpsOf(payload.byteLength, performance.now() - passStart));
        } catch (e) {
          if (controller.signal.aborted || (e instanceof DOMException && e.name === "AbortError")) {
            return finishCancelled();
          }
        }
        setProgress(70 + Math.round(((p + 1) / TRANSFER_PASSES) * 30));
      }

      if (!live()) return finishCancelled();

      if (!latencies.length && !downRates.length && !upRates.length) {
        setErrorMsg("Every request failed — the probe endpoint could not be reached.");
        setPhase("error");
        return;
      }

      setResult({
        latencySamples: latencies,
        failedProbes,
        totalProbes: LATENCY_PROBE_COUNT,
        downloadMbps: downRates.length
          ? Math.round((downRates.reduce((a, b) => a + b, 0) / downRates.length) * 100) / 100
          : null,
        uploadMbps: upRates.length
          ? Math.round((upRates.reduce((a, b) => a + b, 0) / upRates.length) * 100) / 100
          : null,
        elapsedSec: Math.round(((Date.now() - startedAt) / 1000) * 10) / 10,
      });
      setProgress(100);
      setPhase("done");
    } catch (e) {
      if (controller.signal.aborted) return finishCancelled();
      setErrorMsg(e instanceof Error ? e.message : "The test failed unexpectedly.");
      setPhase("error");
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // ONE validated sample through the hardened ping path (ISS-016), carrying
  // quality metadata: reported connection type + stability flag (§20).
  const save = useCallback(async () => {
    if (!result) return;
    const median = medianMs(result.latencySamples);
    if (median == null) return;
    const jitter = jitterMsOf(result.latencySamples);
    const loss = lossPctOf(result.failedProbes, result.totalProbes);
    setSaveState("saving");
    try {
      const res = await fetch("/api/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latencyMs: Math.round(median * 10) / 10,
          ok: true,
          connectionType: connectionTypeForApi(connection.effectiveType),
          stable: stabilityFlag(jitter, loss),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaveState("saved");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "the request failed");
      setSaveState("error");
    }
  }, [result, connection.effectiveType]);

  const stepLabel =
    step === "latency"
      ? `Measuring latency — probe ${Math.min(stepIndex + 1, LATENCY_PROBE_COUNT)} of ${LATENCY_PROBE_COUNT}`
      : step === "download"
        ? `Testing download — pass ${Math.min(stepIndex + 1, TRANSFER_PASSES)} of ${TRANSFER_PASSES}`
        : `Testing upload — pass ${Math.min(stepIndex + 1, TRANSFER_PASSES)} of ${TRANSFER_PASSES}`;

  const median = result ? medianMs(result.latencySamples) : null;
  const jitter = result ? jitterMsOf(result.latencySamples) : 0;
  const loss = result ? lossPctOf(result.failedProbes, result.totalProbes) : 0;
  const stable = result ? stabilityFlag(jitter, loss) : false;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onExit} aria-label="Back to site">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Gauge className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-lg font-semibold tracking-tight">
                Test <span className="text-primary">Center</span>
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={onExit} size="sm" variant="outline" className="hidden sm:inline-flex">
              Back to site
            </Button>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          How good is your connection, <span className="text-primary">really?</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          A full measurement suite — latency, jitter, download, upload and packet loss — sized to
          stay cheap on any network. You approve every byte that gets saved.
        </p>

        {/* Results / status region — announced politely as it changes (ISS-011 AC) */}
        <div
          className="mt-6"
          aria-live="polite"
          aria-busy={phase === "running"}
          aria-label="Connection test results"
        >
          {phase === "idle" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Before we start</CardTitle>
                <CardDescription className="text-sm">
                  What the test measures, what it costs in data, and how to stop it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Detected connection (§8) — never claims Wi-Fi SSID scanning */}
                <section aria-label="Detected connection">
                  <h2 className="text-sm font-semibold">Detected connection</h2>
                  <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="rounded-lg border bg-card px-3 py-2">
                      <dt className="text-xs text-muted-foreground">Connection type</dt>
                      <dd className="text-sm font-medium">
                        {connectionTypeLabel(connection.effectiveType)}
                      </dd>
                    </div>
                    <div className="rounded-lg border bg-card px-3 py-2">
                      <dt className="text-xs text-muted-foreground">Downlink estimate</dt>
                      <dd className="text-sm font-medium">
                        {connection.downlinkMbps != null
                          ? `~${connection.downlinkMbps} Mbps`
                          : "Not reported"}
                      </dd>
                    </div>
                    <div className="rounded-lg border bg-card px-3 py-2">
                      <dt className="text-xs text-muted-foreground">Data Saver</dt>
                      <dd className="text-sm font-medium">{connection.saveData ? "On" : "Off"}</dd>
                    </div>
                  </dl>
                  <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Detected from your browser&apos;s Network Information API. Browsers cannot scan
                    nearby Wi-Fi networks — this never reads your Wi-Fi name or surroundings.
                  </p>
                </section>

                {/* What is tested (§6) */}
                <section aria-label="What this test measures">
                  <h2 className="text-sm font-semibold">What this test measures</h2>
                  <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <li className="flex items-center gap-2">
                      <Timer className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      Latency — {LATENCY_PROBE_COUNT} quick probes
                    </li>
                    <li className="flex items-center gap-2">
                      <Activity className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      Jitter — spread across those probes
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowDownToLine className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      Download — {TRANSFER_PASSES} × {Math.round(TRANSFER_BYTES_PER_PASS / 1000)} KB
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowUpFromLine className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      Upload — {TRANSFER_PASSES} × {Math.round(TRANSFER_BYTES_PER_PASS / 1000)} KB
                    </li>
                    <li className="flex items-center gap-2 sm:col-span-2">
                      <Ban className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      Packet loss — the share of probes that fail
                    </li>
                  </ul>
                </section>

                {/* Data budget, stated BEFORE the run (§7) */}
                <section
                  aria-label="Estimated data usage"
                  className="rounded-lg border bg-secondary px-4 py-3 text-secondary-foreground"
                >
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Wallet className="h-4 w-4" aria-hidden="true" />
                    Estimated data usage: ~{TEST_DATA_BUDGET_MB} MB
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {(TRANSFER_PASSES * 2 * Math.round(TRANSFER_BYTES_PER_PASS / 1000)).toLocaleString()}{" "}
                    KB of transfers plus tiny probes — under the stated budget. Cancel any time;
                    nothing is saved without your explicit say-so.
                  </p>
                </section>

                {connection.metered && (
                  <Alert>
                    <Smartphone />
                    <AlertTitle>This test may use mobile data</AlertTitle>
                    <AlertDescription>
                      Your connection looks metered. The full run stays under the ~
                      {TEST_DATA_BUDGET_MB} MB estimate and can be cancelled mid-flight.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  size="lg"
                  className="min-h-11 w-full gap-2 sm:w-auto"
                  onClick={() => void run()}
                >
                  <Play className="h-4 w-4" aria-hidden="true" />
                  Start test
                </Button>
              </CardContent>
            </Card>
          )}

          {phase === "running" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Loader2
                    className="h-5 w-5 animate-spin text-primary motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  Test running
                </CardTitle>
                <CardDescription className="text-sm">{stepLabel}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress is value-driven; transitions are dropped under
                    prefers-reduced-motion (ISS-011 AC). */}
                <Progress
                  value={progress}
                  aria-label="Test progress"
                  className="[&_[data-slot=progress-indicator]]:motion-reduce:transition-none"
                />
                <p className="text-sm text-muted-foreground">
                  Nothing is written to your history during the run — you choose to save at the
                  end.
                </p>
                <Button
                  variant="outline"
                  className="min-h-11 w-full gap-2 sm:w-auto"
                  onClick={cancel}
                >
                  <Ban className="h-4 w-4" aria-hidden="true" />
                  Cancel test
                </Button>
              </CardContent>
            </Card>
          )}

          {phase === "cancelled" && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Ban className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  Test cancelled
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  In-flight transfers were aborted and nothing was saved to your history. Data
                  already used stays under the ~{TEST_DATA_BUDGET_MB} MB budget.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="min-h-11 gap-2"
                  onClick={() => void run()}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Run again
                </Button>
              </CardContent>
            </Card>
          )}

          {phase === "error" && (
            <ErrorState
              title="Test could not complete"
              message={errorMsg ?? "The test failed unexpectedly."}
              onRetry={() => void run()}
            />
          )}

          {phase === "done" && result && (
            <div className="space-y-4">
              {/* Metric cards — unit + verdict on every metric (ISS-011 AC) */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <MetricCard
                  icon={ArrowDownToLine}
                  label="Download"
                  value={result.downloadMbps}
                  unit="Mbps"
                  status={result.downloadMbps != null ? downloadStatus(result.downloadMbps) : null}
                />
                <MetricCard
                  icon={ArrowUpFromLine}
                  label="Upload"
                  value={result.uploadMbps}
                  unit="Mbps"
                  status={result.uploadMbps != null ? uploadStatus(result.uploadMbps) : null}
                />
                <MetricCard
                  icon={Timer}
                  label="Latency"
                  value={median}
                  unit="ms"
                  status={median != null ? latencyStatus(median) : null}
                  round={0}
                />
                <MetricCard
                  icon={Activity}
                  label="Jitter"
                  value={jitter}
                  unit="ms"
                  status={jitterStatus(jitter)}
                  round={1}
                />
                <MetricCard
                  icon={Ban}
                  label="Packet loss"
                  value={loss}
                  unit="%"
                  status={lossStatus(loss)}
                  round={1}
                />
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Run details</CardTitle>
                  <CardDescription className="text-sm">
                    {result.totalProbes} latency probes ({result.failedProbes} failed) ·{" "}
                    {TRANSFER_PASSES} × {Math.round(TRANSFER_BYTES_PER_PASS / 1000)} KB download ·{" "}
                    {TRANSFER_PASSES} × {Math.round(TRANSFER_BYTES_PER_PASS / 1000)} KB upload ·
                    finished in {result.elapsedSec}s
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quality metadata summary (§20) — mirrors what a saved sample carries */}
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Quality metadata:</span>
                    <Badge variant="outline" className="gap-1">
                      <Gauge className="h-3 w-3" aria-hidden="true" />
                      {connectionTypeLabel(connection.effectiveType)}
                    </Badge>
                    <Badge variant={stable ? "default" : "secondary"}>
                      {stable ? "Stable" : "Unstable"}
                    </Badge>
                  </div>

                  {median == null ? (
                    <p className="text-sm text-muted-foreground">
                      Every probe failed, so there is nothing meaningful to save. Check the
                      connection and run the test again.
                    </p>
                  ) : saveState === "saved" ? (
                    <p
                      className="flex items-center gap-2 text-sm font-medium text-primary"
                      role="status"
                    >
                      <CircleCheck className="h-4 w-4" aria-hidden="true" />
                      Saved to your history — see it on the dashboard.
                    </p>
                  ) : (
                    <>
                      {connection.metered ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              className="min-h-11 gap-2"
                              disabled={saveState === "saving"}
                            >
                              {saveState === "saving" ? (
                                <Loader2
                                  className="h-4 w-4 animate-spin motion-reduce:animate-none"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Save className="h-4 w-4" aria-hidden="true" />
                              )}
                              Save to my history
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Save on a metered connection?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This connection looks metered. Saving sends one small sample
                                (well under 1 KB) — the full test results stay on your device.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Not now</AlertDialogCancel>
                              <AlertDialogAction onClick={() => void save()}>
                                Save sample
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button
                          className="min-h-11 gap-2"
                          onClick={() => void save()}
                          disabled={saveState === "saving"}
                        >
                          {saveState === "saving" ? (
                            <Loader2
                              className="h-4 w-4 animate-spin motion-reduce:animate-none"
                              aria-hidden="true"
                            />
                          ) : (
                            <Save className="h-4 w-4" aria-hidden="true" />
                          )}
                          Save to my history
                        </Button>
                      )}
                      {saveState === "error" && (
                        <p role="alert" className="text-sm text-destructive">
                          Saving failed ({saveError}). Nothing was written — you can try again.
                        </p>
                      )}
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Saving writes one latency sample tagged with your connection type and the
                        stability flag shown above. Download/upload numbers stay on this device.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-auto border-t border-border/60 bg-card">
        <div className="mx-auto max-w-5xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
          InternetYangu v0.1.0 · Connection Test Center — size-bounded, cancellable, local-first ·
          <span className="ml-1 inline-flex items-center gap-1">
            <Gauge className="h-3 w-3" aria-hidden="true" /> Saved samples live under My Internet
          </span>
        </div>
      </footer>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  status,
  round = 2,
}: {
  icon: typeof Timer;
  label: string;
  value: number | null;
  unit: string;
  status: MetricStatus | null;
  round?: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardDescription className="flex items-center gap-1.5 text-xs font-medium">
          <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          {label}
        </CardDescription>
        <CardTitle className={`text-2xl tabular-nums ${status?.valueClass ?? "text-foreground"}`}>
          {value != null ? value.toFixed(round) : "—"}
          {value != null && (
            <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        {status ? (
          <Badge variant={status.badgeVariant} className="text-[10px]">
            {status.label}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            No data
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
