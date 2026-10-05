"use client";

import { Radio, Github, MessageCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer({ onLaunch }: { onLaunch: () => void }) {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Radio className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-lg font-semibold tracking-tight">
                Internet<span className="text-primary">Yangu</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              &ldquo;Yangu&rdquo; means &ldquo;mine&rdquo; — this is my internet: measured, priced and defended.
              Local-first, privacy-first, for every network in East Africa.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <p className="text-sm font-semibold">Product</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><a href="#product" className="hover:text-foreground">Measure · Track · Act</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground">How it works</a></li>
                <li><a href="#coverage" className="hover:text-foreground">Coverage</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">Community</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="https://github.com/Roy-Wanyoike/internetyangu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-foreground"
                  >
                    <Github className="h-3.5 w-3.5" aria-hidden="true" /> GitHub
                  </a>
                </li>
                <li>
                  <a href="#faq" className="inline-flex items-center gap-1.5 hover:text-foreground">
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> FAQ
                  </a>
                </li>
                <li><a href="#privacy" className="hover:text-foreground">Privacy Center</a></li>
                <li>
                  <button onClick={onLaunch} className="hover:text-foreground">
                    Open Dashboard
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">Credits</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Open source under the MIT license</li>
                <li>Market data: CA Kenya, FY2025 operator reports</li>
                <li>Prices indicative — verify with operator</li>
              </ul>
            </div>
          </div>
        </div>
        <Separator className="my-8" />
        <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} InternetYangu. Open source under MIT.</p>
          <p>Local-first · Privacy-first · Built for East Africa</p>
        </div>
      </div>
    </footer>
  );
}
