"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Radio, Gauge, ReceiptText, Scale } from "lucide-react";

const LINKS = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#coverage", label: "Coverage" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNav({ onLaunch }: { onLaunch: () => void }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5" aria-label="InternetYangu home">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Radio className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Internet<span className="text-primary">Yangu</span>
          </span>
        </a>

        {/* Desktop navigation */}
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button onClick={onLaunch} size="sm" className="gap-2">
            <Gauge className="h-4 w-4" aria-hidden="true" />
            Open Dashboard
          </Button>
        </div>
      </div>

      {/* Anchor quick-strip for small screens — replaced by full drawer in ISS-001 */}
      <nav
        aria-label="Section shortcuts"
        className="flex items-center gap-4 overflow-x-auto border-t border-border/60 px-4 py-2 text-xs text-muted-foreground md:hidden"
      >
        <a href="#product" className="flex shrink-0 items-center gap-1.5">
          <ReceiptText className="h-3.5 w-3.5" aria-hidden="true" /> Product
        </a>
        <a href="#how-it-works" className="flex shrink-0 items-center gap-1.5">
          <Scale className="h-3.5 w-3.5" aria-hidden="true" /> How it works
        </a>
        <a href="#pricing" className="shrink-0">Pricing</a>
        <a href="#faq" className="shrink-0">FAQ</a>
      </nav>
    </header>
  );
}
