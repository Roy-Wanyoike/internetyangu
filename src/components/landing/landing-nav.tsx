"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Radio, Gauge, Menu } from "lucide-react";

const LINKS = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#coverage", label: "Coverage" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNav({ onLaunch }: { onLaunch: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

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

          {/* Mobile navigation drawer (ISS-001) */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 md:hidden"
                aria-expanded={menuOpen}
                aria-controls="mobile-nav"
                aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" id="mobile-nav" className="flex w-72 flex-col gap-1 p-6">
              <SheetHeader className="p-0 text-left">
                <SheetTitle className="text-base">Navigation</SheetTitle>
                <SheetDescription className="text-sm">Jump to a section</SheetDescription>
              </SheetHeader>
              <nav aria-label="Mobile" className="mt-2 flex flex-col">
                {LINKS.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-11 items-center rounded-lg px-3 text-base font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    {l.label}
                  </a>
                ))}
              </nav>
              <Button
                onClick={() => {
                  setMenuOpen(false);
                  onLaunch();
                }}
                className="mt-4 min-h-11 w-full gap-2"
              >
                <Gauge className="h-4 w-4" aria-hidden="true" />
                Open Dashboard
              </Button>
            </SheetContent>
          </Sheet>

          <Button onClick={onLaunch} size="sm" className="hidden gap-2 sm:inline-flex">
            <Gauge className="h-4 w-4" aria-hidden="true" />
            Open Dashboard
          </Button>
        </div>
      </div>
    </header>
  );
}
