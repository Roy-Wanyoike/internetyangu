"use client";

// Metered-connection detection (ISS-012 / Addendum §7, §30).
//
// Wraps the Network Information API (`navigator.connection`) so the app KNOWS
// when it is on a slow or metered link and can change behavior visibly:
//   - effectiveType 2g / slow-2g / 3g, or saveData=true  → metered
//   - saveData=true                                      → Data Saver (no background probes)
// Where the API is missing (Safari, Firefox, SSR) everything degrades to
// "Unknown" / not-metered — we never guess or block a user on absence of data.
//
// SSR-safe: the server snapshot is a stable "Unknown" object, so SSR output
// never claims a connection type. Hidden-tab safe: the only listener is the
// connection object's own `change` event — no timers, no polling.

import { useSyncExternalStore } from "react";

export type EffectiveType = "slow-2g" | "2g" | "3g" | "4g" | "Unknown";

export interface ConnectionInfo {
  /** Network Information API effectiveType, or "Unknown" when unavailable. */
  effectiveType: EffectiveType;
  /** true when the browser reports the Data Saver ("saveData") preference. */
  saveData: boolean;
  /** Reported downlink estimate in Mbps, or null when unavailable. */
  downlinkMbps: number | null;
  /** Metered = slow effectiveType (2g/slow-2g/3g) OR the user's Data Saver is on. */
  metered: boolean;
}

interface NetworkInformationLike extends EventTarget {
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
  addEventListener(type: "change", listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: "change", listener: EventListenerOrEventListenerObject): void;
}

function getConnection(): NetworkInformationLike | null {
  if (typeof navigator === "undefined") return null;
  const conn = (navigator as Navigator & { connection?: NetworkInformationLike | undefined })
    .connection;
  return conn ?? null;
}

const SERVER_SNAPSHOT: ConnectionInfo = {
  effectiveType: "Unknown",
  saveData: false,
  downlinkMbps: null,
  metered: false,
};

function readInfo(): ConnectionInfo {
  const conn = getConnection();
  if (!conn) return SERVER_SNAPSHOT;
  const raw = conn.effectiveType;
  const effectiveType: EffectiveType =
    raw === "slow-2g" || raw === "2g" || raw === "3g" || raw === "4g" ? raw : "Unknown";
  const downlinkMbps =
    typeof conn.downlink === "number" && Number.isFinite(conn.downlink) && conn.downlink >= 0
      ? conn.downlink
      : null;
  const saveData = conn.saveData === true;
  const metered = saveData || effectiveType === "slow-2g" || effectiveType === "2g" || effectiveType === "3g";
  return { effectiveType, saveData, downlinkMbps, metered };
}

// getSnapshot must return a stable reference while values are unchanged,
// otherwise useSyncExternalStore would re-render in a loop.
let lastSnapshot: ConnectionInfo = SERVER_SNAPSHOT;

function getSnapshot(): ConnectionInfo {
  const next = readInfo();
  if (
    lastSnapshot.effectiveType === next.effectiveType &&
    lastSnapshot.saveData === next.saveData &&
    lastSnapshot.downlinkMbps === next.downlinkMbps &&
    lastSnapshot.metered === next.metered
  ) {
    return lastSnapshot;
  }
  lastSnapshot = next;
  return next;
}

function subscribe(onChange: () => void) {
  const conn = getConnection();
  if (!conn) return () => undefined;
  conn.addEventListener("change", onChange);
  return () => conn.removeEventListener("change", onChange);
}

export function useConnectionType(): ConnectionInfo {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
}
