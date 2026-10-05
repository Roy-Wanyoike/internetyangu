"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { ConnectionNotice } from "./connection-notice";
import { Radio, ArrowLeft, Gauge, ReceiptText, Signal, AlertTriangle, ShieldCheck } from "lucide-react";
import { OverviewTab } from "./overview-tab";
import { SpendTab } from "./spend-tab";
import { ProvidersTab } from "./providers-tab";
import { OutagesTab } from "./outages-tab";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { UpdateBanner } from "@/components/pwa/update-banner";
import { InstallCard } from "@/components/pwa/install-card";

const TABS = [
  { value: "overview", label: "Overview", icon: Gauge },
  { value: "spend", label: "Spend", icon: ReceiptText },
  { value: "providers", label: "Providers", icon: Signal },
  { value: "outages", label: "Outages", icon: AlertTriangle },
];

// Deep-link support (ISS-015): #dashboard/outages lands directly on the
// evidence log — the Privacy Center's "Export my data" links here. Any other
// hash (or the server render) falls back to the Overview tab. Only read once,
// on mount; switching tabs afterwards is ordinary local state.
function initialTabFromHash(): string {
  if (typeof window === "undefined") return "overview";
  const segment = window.location.hash.split("/")[1] ?? "";
  return TABS.some((t) => t.value === segment) ? segment : "overview";
}

export function AppShell({ onExit }: { onExit: () => void }) {
  const [tab, setTab] = useState(initialTabFromHash);
  const online = useOnlineStatus();
  const { updateReady, applyUpdate } = useServiceWorker();
  const { showInstallCard, install, decline } = useInstallPrompt();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onExit} aria-label="Back to site">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Radio className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-lg font-semibold tracking-tight">
                Internet<span className="text-primary">Yangu</span>
              </span>
            </span>
            <span className="ml-1 hidden rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground sm:inline-block">
              My connection, my data
            </span>
            {/* Mobile-data guardrail notice (ISS-012) — Data Saver / metered chip */}
            <span className="ml-auto inline-flex md:ml-1">
              <ConnectionNotice />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {/* Privacy Center (ISS-015) — dashboard menu entry, keyboard reachable */}
            <Button
              asChild
              size="sm"
              variant="outline"
              className="hidden gap-1.5 sm:inline-flex"
            >
              <a href="#privacy" aria-label="Open the Privacy Center">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Privacy
              </a>
            </Button>
            <a
              href="#privacy"
              aria-label="Open the Privacy Center"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:hidden"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </a>
            <Button onClick={onExit} size="sm" variant="outline" className="hidden sm:inline-flex">
              Back to site
            </Button>
          </div>
        </div>
      </header>

      {/* PWA runtime (ISS-010): honest offline banner + update availability */}
      <OfflineBanner offline={!online} />
      <UpdateBanner visible={updateReady} onApply={applyUpdate} />

      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {/* Install promotion (ISS-010 / §32): offered once after the 2nd
            dashboard visit, dismissible, never blocks the product. */}
        <InstallCard visible={showInstallCard} onInstall={install} onDecline={decline} />
        <div className={showInstallCard ? "mt-6" : ""}>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-11 w-full justify-start gap-1 overflow-x-auto rounded-xl bg-secondary p-1 sm:w-auto">
              {TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="gap-2 rounded-lg px-4">
                  <t.icon className="h-4 w-4" aria-hidden="true" />
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          <TabsContent value="overview" className="mt-6">
            <OverviewTab onGoToSpend={() => setTab("spend")} />
          </TabsContent>
          <TabsContent value="spend" className="mt-6">
            <SpendTab />
          </TabsContent>
          <TabsContent value="providers" className="mt-6">
            <ProvidersTab />
          </TabsContent>
          <TabsContent value="outages" className="mt-6">
            <OutagesTab />
          </TabsContent>
          </Tabs>
        </div>
      </main>

      <footer className="mt-auto border-t border-border/60 bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:px-6">
          <p>
            InternetYangu v0.1.0 · Local-first: your bills and latency history live in your own
            database · Prices indicative
          </p>
          <a
            href="#privacy"
            className="inline-flex items-center gap-1.5 underline-offset-2 transition-colors hover:text-foreground hover:underline"
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Privacy Center
          </a>
        </div>
      </footer>
    </div>
  );
}
