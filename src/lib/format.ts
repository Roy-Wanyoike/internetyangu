// Formatting helpers — KES currency, data sizes, cost-per-GB, relative time

const kesFmt = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

const kesFmt2 = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatKes(n: number, precise = false): string {
  if (!Number.isFinite(n)) return "—";
  return precise ? kesFmt2.format(n) : kesFmt.format(n);
}

export function formatGb(gb: number): string {
  if (!Number.isFinite(gb)) return "—";
  if (gb >= 1024) return `${(gb / 1024).toFixed(2)} TB`;
  if (gb >= 100) return `${Math.round(gb)} GB`;
  return `${gb.toFixed(1)} GB`;
}

export function costPerGb(amountKes: number, dataGb: number): number | null {
  if (!dataGb || dataGb <= 0 || !Number.isFinite(amountKes)) return null;
  return amountKes / dataGb;
}

export function formatMs(ms: number): string {
  if (!Number.isFinite(ms)) return "—";
  return `${Math.round(ms)} ms`;
}

export function latencyGrade(rttMs: number | null | undefined): {
  label: string;
  tone: "excellent" | "good" | "fair" | "poor" | "offline" | "idle";
} {
  if (rttMs == null) return { label: "Idle", tone: "idle" };
  if (rttMs < 50) return { label: "Excellent", tone: "excellent" };
  if (rttMs < 100) return { label: "Good", tone: "good" };
  if (rttMs < 200) return { label: "Fair", tone: "fair" };
  return { label: "Poor", tone: "poor" };
}

export function durationMin(startedAt: string, endedAt: string | null): number | null {
  const s = new Date(startedAt).getTime();
  const e = endedAt ? new Date(endedAt).getTime() : null;
  if (!Number.isFinite(s) || e == null || !Number.isFinite(e)) return null;
  return Math.max(0, Math.round((e - s) / 60000));
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.round(hr / 24)}d ago`;
}

export function currentPeriod(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
