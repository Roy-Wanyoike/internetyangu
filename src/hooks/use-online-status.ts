"use client";

// Online/offline status (ISS-010 / Addendum §31) — the honest source for the
// app-shell offline banner. Driven by navigator.onLine plus the browser's
// online/offline events; SSR snapshot is "online" (unknown, optimistic) so
// server output never claims an offline state it cannot know about.

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

function getSnapshot(): boolean {
  return navigator.onLine;
}

function getServerSnapshot(): boolean {
  return true;
}

/** True when the browser reports a live network connection. */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
