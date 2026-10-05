// In-memory request guards for measurement ingestion (POST /api/ping).
//
// Privacy: nothing here is persisted. Keys live in process memory only and
// are dropped when their fixed window expires or the process restarts —
// IP addresses are never written to the database, logs or disk (Addendum §21,
// local-first promise).
//
// Two independent fixed-window guards:
//  1. RATE_LIMIT  — per client IP, protects the DB from volume abuse.
//  2. FLOOD_LIMIT — per (provider + latency + user-agent) payload signature,
//     protects public rankings from scripted identical-sample flooding
//     (Addendum §27: "no single device may manipulate public rankings").

export const RATE_LIMIT = 60; // max POSTs per client per window
export const FLOOD_LIMIT = 10; // max identical payload signatures per window
export const WINDOW_MS = 60_000;

interface FixedWindow {
  count: number;
  expiresAt: number;
}

const rateByClient = new Map<string, FixedWindow>();
const floodBySignature = new Map<string, FixedWindow>();

function sweep(map: Map<string, FixedWindow>, now: number) {
  for (const [key, w] of map) {
    if (w.expiresAt <= now) map.delete(key);
  }
}

function hit(
  map: Map<string, FixedWindow>,
  key: string,
  limit: number,
  now: number,
): { allowed: boolean; retryAfterSec: number } {
  sweep(map, now);
  const w = map.get(key);
  if (!w || w.expiresAt <= now) {
    map.set(key, { count: 1, expiresAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }
  w.count += 1;
  if (w.count > limit) {
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((w.expiresAt - now) / 1000)) };
  }
  return { allowed: true, retryAfterSec: 0 };
}

/** Best-effort client key from proxy headers (first XFF hop) or a shared
 * fallback for direct connections. The key never leaves process memory. */
export function clientKey(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "direct";
}

/** Fixed-window per-client throttle. */
export function checkRate(client: string, now = Date.now()) {
  return hit(rateByClient, client, RATE_LIMIT, now);
}

/** Canonical signature of a measurement payload for flood detection. */
export function floodSignature(providerId: string | null, latencyMs: number, userAgent: string) {
  return `${providerId ?? "-"}|${latencyMs}|${userAgent}`;
}

/** Fixed-window identical-payload flood guard. */
export function checkFlood(signature: string, now = Date.now()) {
  return hit(floodBySignature, signature, FLOOD_LIMIT, now);
}

/** Test/introspection hook: clear both windows. */
export function resetGuards() {
  rateByClient.clear();
  floodBySignature.clear();
}
