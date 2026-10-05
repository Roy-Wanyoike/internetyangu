"use client";

// Install promotion (ISS-010 / Addendum §32) — no aggressive prompts.
//
// `beforeinstallprompt` is captured and stashed. The custom install card is
// offered ONCE per session, and only after meaningful engagement: the second
// time the user opens the dashboard (visit counter in localStorage). Decline
// is respected for the whole session (sessionStorage). If the app is already
// running installed (standalone) or the browser never fires
// `beforeinstallprompt` (e.g. iOS Safari), nothing is ever shown — the
// product works perfectly without installation.
//
// State lives in a tiny module store read through useSyncExternalStore —
// the same pattern as use-connection-type and use-service-worker — so the
// hook can be mounted, remounted and StrictMode-double-invoked safely.

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  countDashboardVisit,
  installDeclinedThisSession,
  markInstallDeclined,
} from "@/lib/pwa";

const ENGAGEMENT_THRESHOLD = 2; // 2nd dashboard visit (§32 "meaningful engagement")

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// The captured beforeinstallprompt event — module-level because the browser
// allows prompt() exactly once per captured event.
let currentPromptEvent: BeforeInstallPromptEvent | null = null;

// --- module store -------------------------------------------------------------
let engaged = false; // engagement threshold reached and not declined before
let hasPrompt = false; // browser fired beforeinstallprompt and we hold it
let installed = false; // running installed / install accepted
let declined = false; // user chose "Not now" (or used the native prompt) this session
let standalone = false; // app is running in standalone display mode

const listeners = new Set<() => void>();
let snapshot = { showInstallCard: false };

function recompute() {
  const show = engaged && hasPrompt && !installed && !declined && !standalone;
  if (show !== snapshot.showInstallCard) {
    snapshot = { showInstallCard: show };
  }
  return snapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): { showInstallCard: boolean } {
  return snapshot;
}

function getServerSnapshot(): { showInstallCard: boolean } {
  return snapshot;
}

function notify() {
  recompute();
  for (const listener of listeners) listener();
}

// --- hook ----------------------------------------------------------------------

export interface InstallPromptState {
  /** Whether the install card should be rendered right now. */
  showInstallCard: boolean;
  /** Trigger the browser's install flow from the card's Install button. */
  install: () => void;
  /** User chose "Not now" — hide the card for the rest of the session. */
  decline: () => void;
}

export function useInstallPrompt(): InstallPromptState {
  const { showInstallCard } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      // Already running as an installed app — never promote installation.
      standalone = true;
      notify();
      return;
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      currentPromptEvent = event as BeforeInstallPromptEvent;
      hasPrompt = true;
      notify();
    };
    const onInstalled = () => {
      installed = true;
      hasPrompt = false;
      notify();
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // Engagement gate: count this dashboard visit; from the threshold visit
    // onwards the card may show (if the browser offers installability).
    const visits = countDashboardVisit();
    engaged = visits >= ENGAGEMENT_THRESHOLD && !installDeclinedThisSession();
    notify();

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(() => {
    const event = currentPromptEvent;
    if (!event) {
      notify();
      return;
    }
    void event
      .prompt()
      .then(() => event.userChoice)
      .then(({ outcome }) => {
        // The native prompt can only be used once — either way the card goes
        // and we do not ask again this session (§32: no nagging).
        markInstallDeclined();
        declined = true;
        hasPrompt = false;
        if (outcome === "accepted") installed = true;
        notify();
      });
  }, []);

  const decline = useCallback(() => {
    markInstallDeclined();
    declined = true;
    hasPrompt = false;
    notify();
  }, []);

  return { showInstallCard, install, decline };
}
