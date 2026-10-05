"use client";

// Consent gates hook (ISS-015 / Directive §16) — the tiny consumer API future
// features use before any consent-gated behavior runs:
//
//   const { consent, isGranted, grant, revoke } = useConsent();
//   if (isGranted("shareMeasurement")) { /* contribute */ }
//
// State lives in a module store read via useSyncExternalStore (same pattern
// as use-connection-type / use-service-worker): SSR-safe defaults (all OFF),
// hydrated from localStorage on mount, and shared across every mounted
// consumer — flipping a switch in the Privacy Center updates all readers.

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  clearStoredConsent,
  defaultConsent,
  loadConsent,
  saveConsent,
  type ConsentPurpose,
  type ConsentState,
} from "@/lib/consent";

// --- module store -------------------------------------------------------------

let current: ConsentState = defaultConsent();
let hydrated = false;

const listeners = new Set<() => void>();
let snapshot: ConsentState = current;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ConsentState {
  return snapshot;
}

function getServerSnapshot(): ConsentState {
  return snapshot;
}

function commit(next: ConsentState) {
  current = next;
  saveConsent(next);
  snapshot = next;
  for (const listener of listeners) listener();
}

function setPurpose(purpose: ConsentPurpose, granted: boolean) {
  commit({
    ...current,
    purposes: {
      ...current.purposes,
      [purpose]: { granted, updatedAt: new Date().toISOString() },
    },
  });
}

// --- hook ----------------------------------------------------------------------

export interface ConsentApi {
  consent: ConsentState;
  isGranted: (purpose: ConsentPurpose) => boolean;
  grant: (purpose: ConsentPurpose) => void;
  revoke: (purpose: ConsentPurpose) => void;
  /** "Delete my data" companion: drops the stored record and returns every
   * purpose to the OFF default across all mounted consumers. */
  reset: () => void;
}

export function useConsent(): ConsentApi {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Hydrate from localStorage once per page load: the SSR-safe all-OFF
  // defaults are replaced by the user's stored choices. loadConsent()
  // normalises malformed records and model versions to all-OFF.
  useEffect(() => {
    if (hydrated) return;
    hydrated = true;
    current = loadConsent();
    snapshot = current;
    for (const listener of listeners) listener();
  }, []);

  const grant = useCallback((purpose: ConsentPurpose) => setPurpose(purpose, true), []);
  const revoke = useCallback((purpose: ConsentPurpose) => setPurpose(purpose, false), []);
  const isGranted = useCallback(
    (purpose: ConsentPurpose) => consent.purposes[purpose].granted,
    [consent],
  );
  const reset = useCallback(() => {
    current = defaultConsent();
    clearStoredConsent();
    snapshot = current;
    for (const listener of listeners) listener();
  }, []);

  return { consent, isGranted, grant, revoke, reset };
}
