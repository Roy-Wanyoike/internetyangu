/*
 * InternetYangu service worker (ISS-010 / Addendum §3, §31, §32).
 *
 * Hand-rolled — no Workbox, no new dependencies. Strategy map:
 *
 *   navigations (mode === "navigate")  → network-first, cached shell "/" as
 *                                        the offline fallback (§31 offline shell)
 *   /api/*  GET                        → network-first with cache fallback.
 *                                        When serving from cache the SW marks
 *                                        the response with
 *                                        X-InternetYangu-Cache-Fallback: 1 and
 *                                        X-InternetYangu-Cached-At: <iso> so
 *                                        the app can label data as stale and
 *                                        never present it as current (§31).
 *   static assets (/_next/static, icons, logo, manifest) →
 *                                        stale-while-revalidate (§30: cached
 *                                        shell + progressive loading)
 *
 * Updates: a new waiting worker activates ONLY when the page sends
 * SKIP_WAITING (user pressed "Refresh" on the update banner) — never silently.
 * Activate cleans every cache that does not belong to the current version.
 */

const VERSION = "v1";
const SHELL_CACHE = `internetyangu-shell-${VERSION}`;
const ASSET_CACHE = `internetyangu-assets-${VERSION}`;
const API_CACHE = `internetyangu-api-${VERSION}`;
const KNOWN_CACHES = [SHELL_CACHE, ASSET_CACHE, API_CACHE];

// App shell essentials — the minimum to render the offline chrome (§31).
const SHELL_PRECACHE = [
  "/",
  "/logo.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.webmanifest",
];

// Cache-fallback markers — mirrored in src/lib/pwa.ts. The client reads these
// to label cached API data as stale instead of current (§31 honesty rule).
const FALLBACK_HEADER = "X-InternetYangu-Cache-Fallback";
const CACHED_AT_HEADER = "X-InternetYangu-Cached-At";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Tolerant precache: one missing asset must not break installation.
      await Promise.allSettled(SHELL_PRECACHE.map((url) => cache.add(url)));
      // Do NOT skipWaiting here — the waiting worker is activated only on an
      // explicit user confirmation (§32 non-annoying update UX).
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("internetyangu-") && !KNOWN_CACHES.includes(name))
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Live-measurement endpoints must NEVER be answered from cache: a stale
// timestamp or transfer would fake a successful probe while offline and
// corrupt the user's measurement record (§31 — never fake current data).
const NEVER_CACHE = ["/api/ping", "/api/test/"];

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/logo.svg" ||
    url.pathname === "/icon-192.png" ||
    url.pathname === "/icon-512.png" ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/robots.txt"
  );
}

/** Stamp the response with the time it entered the runtime cache, so a later
 * cache-fallback serve can tell the client exactly how old the data is. */
async function putWithCachedAt(cache, request, response) {
  try {
    const stamped = new Response(await response.clone().arrayBuffer(), {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    });
    stamped.headers.set(CACHED_AT_HEADER, new Date().toISOString());
    await cache.put(request, stamped);
  } catch {
    // Cache.put rejects on some responses (e.g. Vary: *) — never break the
    // request path because caching failed.
  }
}

/** Network-first with cache fallback. Fresh responses pass through untouched;
 * cached fallbacks are explicitly marked so the client can label staleness. */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await putWithCachedAt(cache, request, response);
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (!cached) throw new Error("no cached fallback");
    const headers = new Headers(cached.headers);
    headers.set(FALLBACK_HEADER, "1");
    return new Response(await cached.arrayBuffer(), {
      status: cached.status,
      statusText: cached.statusText,
      headers,
    });
  }
}

/** Stale-while-revalidate for static assets: instant cache answer, background
 * refresh. Misses fetch, cache and return. */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then((response) => {
      if (response.ok) void putWithCachedAt(cache, request, response);
      return response;
    })
    .catch(() => undefined);
  if (cached) return cached;
  const response = await refresh;
  if (response) return response;
  throw new Error("offline and not cached");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  // Same-origin only: cross-origin traffic is left to the browser.
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    // Offline shell (§31): network first, then the precached app shell.
    event.respondWith(
      networkFirst(request, SHELL_CACHE).catch(async () => {
        const cache = await caches.open(SHELL_CACHE);
        const shell = (await cache.match("/")) || (await cache.match(request));
        if (shell) return shell;
        return new Response("Offline and no cached shell available.", {
          status: 503,
          headers: { "Content-Type": "text/plain" },
        });
      }),
    );
    return;
  }

  if (
    url.pathname.startsWith("/api/") &&
    !NEVER_CACHE.some((prefix) => url.pathname.startsWith(prefix))
  ) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
  }
  // Everything else passes through untouched.
});
