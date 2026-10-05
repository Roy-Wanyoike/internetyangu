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
import { FindView } from "@/components/find/find-view";
import { TestView } from "@/components/test/test-view";

type View = "landing" | "app" | "find" | "test";

// The view is fully derived from the URL hash — SSR-safe via the server
// snapshot, reactive via hashchange, and no effect-based setState anywhere.
function subscribeHash(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function getHashView(): View {
  const hash = window.location.hash;
  if (hash === "#dashboard") return "app";
  if (hash === "#find") return "find";
  if (hash === "#test") return "test";
  return "landing";
}

function getServerView(): View {
  return "landing";
}

export default function Home() {
  const view = useSyncExternalStore(subscribeHash, getHashView, getServerView);

  const setHashView = useCallback((v: View) => {
    // replaceState does not fire hashchange — dispatch it manually
    window.history.replaceState(
      null,
      "",
      v === "app" ? "#dashboard" : v === "find" ? "#find" : v === "test" ? "#test" : "#top",
    );
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  const launch = useCallback(() => setHashView("app"), [setHashView]);
  const exit = useCallback(() => setHashView("landing"), [setHashView]);
  const openFind = useCallback(() => setHashView("find"), [setHashView]);

  if (view === "app") {
    return (
      <>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Skip to dashboard
        </a>
        <AppShell onExit={exit} />
      </>
    );
  }

  if (view === "find") {
    return (
      <>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Skip to results
        </a>
        <FindView onExit={exit} />
      </>
    );
  }

  if (view === "test") {
    return (
      <>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Skip to the test
        </a>
        <TestView onExit={exit} />
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <LandingNav onLaunch={launch} onFind={openFind} />
      <main id="main-content" className="flex-1">
        <Hero onLaunch={launch} onFind={openFind} />
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
