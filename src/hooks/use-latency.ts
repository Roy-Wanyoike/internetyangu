"use client";

// Live latency monitor: the browser probes /api/ping every INTERVAL_MS,
// measures round-trip time with performance.now(), keeps the last WINDOW
// samples in memory, and persists each reading to the local database.
// Pauses automatically when the tab is hidden (battery + data friendly).
//
// Mobile-data guardrails (ISS-012 / Addendum §7, §30):
//   - metered connection (2g/slow-2g/3g, or the user's Data Saver is on)
//     → probe interval degrades from 5s to 60s;
//   - saveData=true → background probes are OFF entirely (the manual test
//     in the Connection Test Center stays available).
// We never silently consume significant mobile data.

import { useCallback, useEffect, useRef, useState } from "react";
import type { PingSampleDto } from "@/lib/types";
import { useConnectionType, type ConnectionInfo } from "@/hooks/use-connection-type";

const INTERVAL_MS = 5000;
const METERED_INTERVAL_MS = 60000;
const WINDOW = 60;

export interface LatencyState {
  samples: PingSampleDto[];
  latest: PingSampleDto | null;
  failStreak: number;
  measuring: boolean;
  pause: () => void;
  resume: () => void;
  connection: ConnectionInfo;
}

/**
 * One latency probe: time a GET /api/ping with performance.now().
 * Pure measurement — nothing is persisted here. Shared by the live monitor
 * below and by the Connection Test Center's burst probes (ISS-011), so both
 * always measure the same endpoint the same way.
 */
export async function measureRtt(signal?: AbortSignal): Promise<number> {
  const started = performance.now();
  const res = await fetch("/api/ping", { cache: "no-store", signal });
  if (!res.ok) throw new Error(`ping failed: ${res.status}`);
  return Math.round((performance.now() - started) * 10) / 10;
}

export function useLatency(active: boolean): LatencyState {
  const connection = useConnectionType();
  const [samples, setSamples] = useState<PingSampleDto[]>([]);
  const [latest, setLatest] = useState<PingSampleDto | null>(null);
  const [failStreak, setFailStreak] = useState(0);
  const [measuring, setMeasuring] = useState(false);
  const [paused, setPaused] = useState(false);
  const hiddenRef = useRef(false);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  const probe = useCallback(async () => {
    if (hiddenRef.current) return;
    setMeasuring(true);
    try {
      const rttMs = await measureRtt();
      const sample: PingSampleDto = { rttMs, ok: true, createdAt: new Date().toISOString() };
      setLatest(sample);
      setFailStreak(0);
      setSamples((prev) => [...prev.slice(-(WINDOW - 1)), sample]);
      void fetch("/api/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latencyMs: rttMs, ok: true }),
      }).catch(() => undefined);
    } catch {
      const sample: PingSampleDto = { rttMs: -1, ok: false, createdAt: new Date().toISOString() };
      setLatest(null);
      setFailStreak((s) => s + 1);
      setSamples((prev) => [...prev.slice(-(WINDOW - 1)), sample]);
      void fetch("/api/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latencyMs: 0, ok: false }),
      }).catch(() => undefined);
    } finally {
      setMeasuring(false);
    }
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      hiddenRef.current = document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Background probing policy: off entirely under Data Saver, 60s on metered
  // links, otherwise the normal 5s cadence. Manual tests are never blocked.
  const backgroundProbesOn = !connection.saveData;
  const intervalMs = connection.metered ? METERED_INTERVAL_MS : INTERVAL_MS;

  useEffect(() => {
    if (!active || paused || !backgroundProbesOn) return;
    void probe();
    const id = setInterval(() => void probe(), intervalMs);
    return () => clearInterval(id);
  }, [active, paused, backgroundProbesOn, intervalMs, probe]);

  return { samples, latest, failStreak, measuring, pause, resume, connection };
}
