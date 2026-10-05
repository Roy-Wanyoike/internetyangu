"use client";

// Service-worker registration + update flow (ISS-010 / Addendum §3, §32).
//
// Registration is production-only and tolerant of failure — the app must work
// perfectly without a service worker (private windows, unsupported browsers).
//
// The hook can be mounted from several components (page-level registration,
// dashboard banner) safely: registration happens exactly once per page load
// and the "update ready" flag lives in a tiny module store, read through
// useSyncExternalStore — the same pattern as the hash router and
// use-connection-type.
//
// Update flow: when a new worker installs and waits, `updateReady` becomes
// true and the app shows a dismissible "Update available" banner. The waiting
// worker is told to skipWaiting ONLY when the user presses "Refresh" — never
// automatically — and the page reloads once the new worker takes control.

import { useCallback, useEffect, useSyncExternalStore } from "react";

// --- module-level store (single source of truth per page load) --------------
let updateReady = false;
let waitingWorker: ServiceWorker | null = null;
let reloading = false;
let started = false;

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  return updateReady;
}

function getServerSnapshot(): boolean {
  return false;
}

function markUpdateReady(worker: ServiceWorker | null) {
  // Only a real update (waiting worker behind an active controller) counts.
  if (!worker || !navigator.serviceWorker.controller) return;
  waitingWorker = worker;
  if (!updateReady) {
    updateReady = true;
    notify();
  }
}

function startRegistration() {
  if (started) return;
  started = true;

  if (process.env.NODE_ENV !== "production") return;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // The confirmed update took control — reload exactly once.
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  navigator.serviceWorker.register("/sw.js").then(
    (reg) => {
      if (reg.waiting) markUpdateReady(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed") markUpdateReady(reg.waiting);
        });
      });
    },
    () => {
      // Registration failed (unsupported, insecure context, storage
      // blocked) — everything keeps working over the plain network.
    },
  );
}

// --- hook --------------------------------------------------------------------

export interface ServiceWorkerState {
  /** A new service worker has installed and is waiting to activate. */
  updateReady: boolean;
  /** User confirmed the update: activate the waiting worker, then reload. */
  applyUpdate: () => void;
}

export function useServiceWorker(): ServiceWorkerState {
  const ready = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Registration is a browser side effect, started once per page load
  // (guarded by the module-level `started` flag — extra mounts are no-ops).
  useEffect(() => {
    startRegistration();
  }, []);

  const applyUpdate = useCallback(() => {
    if (!waitingWorker) return;
    waitingWorker.postMessage("SKIP_WAITING");
    // controllerchange (registered above) reloads the page once activated.
  }, []);

  return { updateReady: ready, applyUpdate };
}
