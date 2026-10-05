// Connection Test Center thresholds (ISS-011).
//
// ONE module owns every good/fair/poor judgement the Test Center makes, so
// the metric cards can never drift apart. Latency deliberately reuses the
// existing `latencyGrade` bands from format.ts (<50 Excellent, <100 Good,
// <200 Fair, ≥200 Poor) so the Test Center and the live dashboard always
// agree on what the numbers mean.
//
// Band rationale (mobile-first, East African reality — Addendum §30: do not
// make a good connection a requirement for diagnosing a bad one):
//   - Download:  ≥10 Mbps good (HD streaming / comfortable household),
//                ≥4 Mbps fair (usable browsing + SD video), below = poor.
//   - Upload:    ≥5 Mbps good (video calls), ≥2 Mbps fair, below = poor.
//   - Jitter:    <30 ms good (calls hold), <60 ms fair, above = poor.
//   - Loss:      ≤1% good (VoIP-grade), ≤5% fair, above = poor.

import { latencyGrade } from "@/lib/format";
import type { EffectiveType } from "@/hooks/use-connection-type";

export type MetricVerdict = "good" | "fair" | "poor";

export interface MetricStatus {
  verdict: MetricVerdict;
  label: string;
  /** Token-based value color — AA on both light and dark card surfaces. */
  valueClass: string;
  /** shadcn Badge variant carrying the verdict, mirroring the dashboard toneBadge. */
  badgeVariant: "default" | "secondary" | "destructive";
}

const GOOD: MetricStatus = {
  verdict: "good",
  label: "Good",
  valueClass: "text-primary",
  badgeVariant: "default",
};
const FAIR: MetricStatus = {
  verdict: "fair",
  label: "Fair",
  valueClass: "text-foreground",
  badgeVariant: "secondary",
};
const POOR: MetricStatus = {
  verdict: "poor",
  label: "Poor",
  valueClass: "text-destructive",
  badgeVariant: "destructive",
};

function tierOf(value: number, goodAt: number, fairAt: number, highIsGood: boolean): MetricStatus {
  const qualifies = (threshold: number) =>
    highIsGood ? value >= threshold : value <= threshold;
  if (qualifies(goodAt)) return GOOD;
  if (qualifies(fairAt)) return FAIR;
  return POOR;
}

export const DOWNLOAD_GOOD_MBPS = 10;
export const DOWNLOAD_FAIR_MBPS = 4;
export function downloadStatus(mbps: number): MetricStatus {
  return tierOf(mbps, DOWNLOAD_GOOD_MBPS, DOWNLOAD_FAIR_MBPS, true);
}

export const UPLOAD_GOOD_MBPS = 5;
export const UPLOAD_FAIR_MBPS = 2;
export function uploadStatus(mbps: number): MetricStatus {
  return tierOf(mbps, UPLOAD_GOOD_MBPS, UPLOAD_FAIR_MBPS, true);
}

// Latency: delegate straight to the existing dashboard bands.
export function latencyStatus(ms: number): MetricStatus {
  const grade = latencyGrade(ms);
  if (grade.tone === "excellent" || grade.tone === "good") return GOOD;
  if (grade.tone === "fair") return FAIR;
  if (grade.tone === "poor") return POOR;
  return FAIR; // idle/unknown should not reach the results cards
}

export const JITTER_GOOD_MS = 30;
export const JITTER_FAIR_MS = 60;
export function jitterStatus(ms: number): MetricStatus {
  return tierOf(ms, JITTER_GOOD_MS, JITTER_FAIR_MS, false);
}

export const LOSS_GOOD_PCT = 1;
export const LOSS_FAIR_PCT = 5;
export function lossStatus(pct: number): MetricStatus {
  return tierOf(pct, LOSS_GOOD_PCT, LOSS_FAIR_PCT, false);
}

// Stability flag (Addendum §20 quality metadata): a test counts as stable
// when jitter and loss are both within "good" range — i.e. the numbers are
// trustworthy enough to carry full statistical weight.
export const STABLE_JITTER_MS = JITTER_GOOD_MS;
export const STABLE_LOSS_PCT = LOSS_GOOD_PCT;
export function stabilityFlag(jitterMs: number, lossPct: number): boolean {
  return jitterMs <= STABLE_JITTER_MS && lossPct <= STABLE_LOSS_PCT;
}

// Fixed stated budget for a full run (shown BEFORE the test starts,
// Addendum §7). Actual transfers: 2 × 200 KB download + 2 × 200 KB upload
// + ~10 tiny latency probes ≈ 0.9 MB — the budget is an honest ceiling.
export const TEST_DATA_BUDGET_MB = 2;

// Latency probes per run; also drives the phase progress bar.
export const LATENCY_PROBE_COUNT = 10;
export const TRANSFER_PASSES = 2;
export const TRANSFER_BYTES_PER_PASS = 200_000;

// ---------------------------------------------------------------------------
// Pure measurement math — shared by the Test Center view so the metric cards
// never carry their own statistics implementations (ISS-011 AC: "jitter =
// stddev of latency samples", "packet loss = failed probe ratio").
// ---------------------------------------------------------------------------

/** Median of successful round-trip samples, or null when none succeeded. */
export function medianMs(samples: number[]): number | null {
  const ok = samples.filter((s) => Number.isFinite(s) && s >= 0).sort((a, b) => a - b);
  if (!ok.length) return null;
  const mid = Math.floor(ok.length / 2);
  return ok.length % 2 ? ok[mid] : (ok[mid - 1] + ok[mid]) / 2;
}

/**
 * Jitter = sample standard deviation of the successful latency samples
 * (population-free, N-1 denominator; 0 for fewer than 2 samples).
 */
export function jitterMsOf(samples: number[]): number {
  const ok = samples.filter((s) => Number.isFinite(s) && s >= 0);
  if (ok.length < 2) return 0;
  const mean = ok.reduce((a, b) => a + b, 0) / ok.length;
  const variance = ok.reduce((acc, s) => acc + (s - mean) ** 2, 0) / (ok.length - 1);
  return Math.round(Math.sqrt(variance) * 10) / 10;
}

/** Packet loss = failed probes / total probes, as a percentage. */
export function lossPctOf(failed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((failed / total) * 1000) / 10;
}

/** Throughput in Mbps from bytes transferred over an elapsed interval. */
export function mbpsOf(bytes: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || bytes <= 0) return 0;
  return Math.round(((bytes * 8) / (elapsedMs / 1000) / 1_000_000) * 100) / 100;
}

/**
 * Map the hook's display-facing EffectiveType ("Unknown") onto the ping
 * ingestion enum, which expects lowercase "unknown" (ISS-016 strict schema).
 */
export function connectionTypeForApi(
  effectiveType: EffectiveType,
): "slow-2g" | "2g" | "3g" | "4g" | "unknown" {
  return effectiveType === "Unknown" ? "unknown" : effectiveType;
}

/** Human phrasing of the Network Information API effectiveType (§8: no SSID claims). */
export function connectionTypeLabel(effectiveType: EffectiveType): string {
  switch (effectiveType) {
    case "slow-2g":
      return "Slow 2G";
    case "2g":
      return "2G";
    case "3g":
      return "3G";
    case "4g":
      return "4G";
    default:
      return "Unknown";
  }
}

/**
 * Deterministic pseudo-random upload payload. Random-ish bytes defeat any
 * transparent compression so upload timing reflects the real network path —
 * without burning entropy on the client.
 */
export function makeTransferPayload(bytes: number): Uint8Array<ArrayBuffer> {
  const buf = new Uint8Array(new ArrayBuffer(bytes));
  let s = (Date.now() & 0xffffffff) || 0x9e3779b9;
  for (let i = 0; i < buf.length; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    buf[i] = s & 0xff;
  }
  return buf;
}
