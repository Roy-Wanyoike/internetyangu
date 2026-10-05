"use client";

// Live latency monitor: the browser probes /api/ping every INTERVAL_MS,
// measures round-trip time with performance.now(), keeps the last WINDOW
// samples in memory, and persists each reading to the local database.
// Pauses automatically when the tab is hidden (battery + data friendly).

import { useCallback, useEffect, useRef, useState } from "react";
import type { PingSampleDto } from "@/lib/types";

const INTERVAL_MS = 5000;
const WINDOW = 60;

export interface LatencyState {
  samples: PingSampleDto[];
  latest: PingSampleDto | null;
  failStreak: number;
  measuring: boolean;
  pause: () => void;
  resume: () => void;
}

export function useLatency(active: boolean): LatencyState {
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
    const started = performance.now();
    try {
      const res = await fetch("/api/ping", { cache: "no-store" });
      if (!res.ok) throw new Error(`ping failed: ${res.status}`);
      const rttMs = Math.round((performance.now() - started) * 10) / 10;
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

  useEffect(() => {
    if (!active || paused) return;
    void probe();
    const id = setInterval(() => void probe(), INTERVAL_MS);
    return () => clearInterval(id);
  }, [active, paused, probe]);

  return { samples, latest, failStreak, measuring, pause, resume };
}
