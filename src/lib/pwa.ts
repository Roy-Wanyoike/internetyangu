// Shared PWA runtime constants and helpers (ISS-010 / Addendum §3, §31, §32).
// Mirrors the marker headers written by public/sw.js — keep both in sync.

/** Marker header: the SW served this API response from the runtime cache
 * because the network failed. Data is stale — label it, never present as
 * current (§31). */
export const SW_CACHE_FALLBACK_HEADER = "X-InternetYangu-Cache-Fallback";

/** Marker header: ISO timestamp of when the SW last successfully fetched and
 * cached this response — the honest "last updated" time for offline data. */
export const SW_CACHED_AT_HEADER = "X-InternetYangu-Cached-At";

/**
 * Inspect a response that came through the service worker.
 * Returns the cached-at ISO timestamp when the response is a cache fallback
 * (stale), or null when it was freshly fetched from the network.
 */
export function cacheFallbackAt(res: Response): string | null {
  if (res.headers.get(SW_CACHE_FALLBACK_HEADER) !== "1") return null;
  return res.headers.get(SW_CACHED_AT_HEADER) ?? null;
}

// --- localStorage keys (dashboard-visit counter for install promotion §32) ---
export const VISITS_STORAGE_KEY = "internetyangu.dashboard.visits";
/** sessionStorage key: the user declined install — respected for the session. */
export const INSTALL_DECLINED_KEY = "internetyangu.install.declined";

/** Increment and return the dashboard-visit counter (localStorage-backed,
 * tolerant of private-mode failures). Returns 1 for a first visit. */
export function countDashboardVisit(): number {
  try {
    const current = Number(window.localStorage.getItem(VISITS_STORAGE_KEY) ?? "0");
    const next = Number.isFinite(current) && current >= 0 ? current + 1 : 1;
    window.localStorage.setItem(VISITS_STORAGE_KEY, String(next));
    return next;
  } catch {
    return 1;
  }
}

/** True when the user declined installation earlier in this session. */
export function installDeclinedThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(INSTALL_DECLINED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markInstallDeclined(): void {
  try {
    window.sessionStorage.setItem(INSTALL_DECLINED_KEY, "1");
  } catch {
    // Private mode — the card just hides for this mount.
  }
}
