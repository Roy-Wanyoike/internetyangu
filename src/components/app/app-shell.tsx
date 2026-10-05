"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { Radio, ArrowLeft, Gauge, ReceiptText, Signal, AlertTriangle } from "lucide-react";
import { OverviewTab } from "./overview-tab";
import { SpendTab } from "./spend-tab";
import { ProvidersTab } from "./providers-tab";
import { OutagesTab } from "./outages-tab";

const TABS = [
  { value: "overview", label: "Overview", icon: Gauge },
  { value: "spend", label: "Spend", icon: ReceiptText },
  { value: "providers", label: "Providers", icon: Signal },
  { value: "outages", label: "Outages", icon: AlertTriangle },
];

export function AppShell({ onExit }: { onExit: () => void }) {
  const [tab, setTab] = useState("overview");

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
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={onExit} size="sm" variant="outline" className="hidden sm:inline-flex">
              Back to site
            </Button>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
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
      </main>

      <footer className="mt-auto border-t border-border/60 bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
          InternetYangu v0.1.0 · Local-first: your bills and latency history live in your own
          database · Prices indicative
        </div>
      </footer>
    </div>
  );
}
