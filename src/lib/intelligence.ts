// Intelligence engine v1 — shared aggregation, scoring and confidence policy.
// ALL thresholds live in this module (single source of truth) so the API, the
// UI and any future job stay consistent, and every published figure remains
// reproducible for a given methodology version (Addendum §26).

export const METHODOLOGY_VERSION = "v1" as const;

// Aggregation window for area intelligence (Addendum §13: 30-day baseline).
export const DATA_WINDOW_DAYS = 30;

// Confidence tiers by sample count in the window (per provider × area).
export const CONFIDENCE_THRESHOLDS = {
  high: 100, // ≥100 samples → high
  medium: 25, // ≥25 samples  → medium
} as const;
// anything below `medium` → "limited"

// Minimum total samples before an area may show ANY ranking (Addendum §38:
// "InternetYangu has limited data in this area" is always better than an
// invented ranking).
export const MIN_AREA_SAMPLES = 5;

export type ConfidenceTier = "high" | "medium" | "limited";

export function confidenceTier(sampleCount: number): ConfidenceTier {
  if (sampleCount >= CONFIDENCE_THRESHOLDS.high) return "high";
  if (sampleCount >= CONFIDENCE_THRESHOLDS.medium) return "medium";
  return "limited";
}

export interface SampleStat {
  rttMs: number;
  ok: boolean;
  contributorId?: string | null;
  createdAt: Date;
}

/** Median of a numeric list (input order irrelevant). */
export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const m = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return Math.round(m * 10) / 10;
}

export interface AreaProviderStats {
  medianLatencyMs: number | null; // p50 of successful probes
  uptimePct: number | null; // share of ok samples
  sampleCount: number;
  contributorProxyCount: number;
  confidence: ConfidenceTier;
  lastMeasuredAt: string | null;
  score: number | null; // transparent v1 composite, see scoreProvider()
}

/** Aggregate a provider's samples inside one area window. */
export function aggregateSamples(samples: SampleStat[]): AreaProviderStats {
  const ok = samples.filter((s) => s.ok);
  const uptimePct = samples.length
    ? Math.round((ok.length / samples.length) * 10000) / 100
    : null;
  const p50 = median(ok.map((s) => s.rttMs));
  // Contributor proxy: distinct pseudonymous session keys. Samples without a
  // key (legacy/anonymous probes) are each counted individually — this can
  // only OVER-count contributors, never collapse distinct ones.
  const keyed = new Set<string>();
  let unkeyed = 0;
  for (const s of samples) {
    if (s.contributorId) keyed.add(s.contributorId);
    else unkeyed += 1;
  }
  const last = samples.reduce<Date | null>(
    (acc, s) => (acc == null || s.createdAt > acc ? s.createdAt : acc),
    null,
  );
  return {
    medianLatencyMs: p50,
    uptimePct,
    sampleCount: samples.length,
    contributorProxyCount: keyed.size + unkeyed,
    confidence: confidenceTier(samples.length),
    lastMeasuredAt: last ? last.toISOString() : null,
    score: uptimePct != null && p50 != null ? scoreProvider(uptimePct, p50) : null,
  };
}

/**
 * Transparent v1 composite (0–100): reliability weighted 60%, latency 40%.
 * Latency term is linear between LAT_SCORE_BEST_MS (full marks) and
 * LAT_SCORE_WORST_MS (zero). Documented here so any score is reproducible.
 */
export const SCORE_WEIGHTS = { uptime: 0.6, latency: 0.4 } as const;
export const LAT_SCORE_BEST_MS = 20;
export const LAT_SCORE_WORST_MS = 500;

export function latencyScore(medianLatencyMs: number): number {
  const clamped = Math.min(LAT_SCORE_WORST_MS, Math.max(LAT_SCORE_BEST_MS, medianLatencyMs));
  const t = (clamped - LAT_SCORE_BEST_MS) / (LAT_SCORE_WORST_MS - LAT_SCORE_BEST_MS);
  return Math.round((1 - t) * 1000) / 10; // 0–100, one decimal
}

export function scoreProvider(uptimePct: number, medianLatencyMs: number): number {
  const s =
    SCORE_WEIGHTS.uptime * uptimePct + SCORE_WEIGHTS.latency * latencyScore(medianLatencyMs);
  return Math.round(s * 10) / 10;
}
