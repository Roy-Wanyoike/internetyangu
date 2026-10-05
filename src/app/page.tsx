"use client";

import { useCallback, useSyncExternalStore } from "react";
import { LandingNav } from "@/components/landing/landing-nav";
import { Hero } from "@/components/landing/hero";
import { Pillars } from "@/components/landing/pillars";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Coverage } from "@/components/landing/coverage";
import { Pricing } from "@/components/landing/pricing";
import { Faq } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { AppShell } from "@/components/app/app-shell";

type View = "landing" | "app";

// The view is fully derived from the URL hash — SSR-safe via the server
// snapshot, reactive via hashchange, and no effect-based setState anywhere.
function subscribeHash(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function getHashView(): View {
  return window.location.hash === "#dashboard" ? "app" : "landing";
}

function getServerView(): View {
  return "landing";
}

export default function Home() {
  const view = useSyncExternalStore(subscribeHash, getHashView, getServerView);

  const setHashView = useCallback((v: View) => {
    // replaceState does not fire hashchange — dispatch it manually
    window.history.replaceState(null, "", v === "app" ? "#dashboard" : "#top");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  const launch = useCallback(() => setHashView("app"), [setHashView]);
  const exit = useCallback(() => setHashView("landing"), [setHashView]);

  if (view === "app") {
    return <AppShell onExit={exit} />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <LandingNav onLaunch={launch} />
      <main className="flex-1">
        <Hero onLaunch={launch} />
        <Pillars />
        <HowItWorks />
        <Coverage />
        <Pricing onLaunch={launch} />
        <Faq />
      </main>
      <Footer onLaunch={launch} />
    </div>
  );
}
