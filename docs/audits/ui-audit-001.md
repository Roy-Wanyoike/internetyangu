# UI Audit 001 — InternetYangu v0.1.0 baseline

- **Date:** 2026-10-05
- **Auditor:** Principal frontend / product / a11y / QA review (solo, via Agent Browser + code inspection)
- **Scope:** all user-visible surfaces of the single-route app: landing (`/` sections: nav, hero, product, how-it-works, coverage, pricing, FAQ, footer) and dashboard (`/#dashboard` tabs: Overview, Spend, Providers, Outages)
- **Method:** code walkthrough against the design/UX checklist (nav, states, forms, a11y, SEO, data-viz, consistency) + live smoke at 375/768/1280 px, light + dark
- **Baseline health:** lint clean · typecheck clean · all 5 API endpoints 200 · seeded data renders

## What already passes

- Design tokens centralized in `globals.css` (Crystal Blue), no scattered hex values in components
- All cards use shadcn/ui primitives with consistent `p-4/p-6` padding and `gap-4/6` rhythm
- Sticky header + sticky footer implemented with `min-h-screen flex-col` / `mt-auto`
- Loading skeletons present on directory, billing history, outages, KPI cards
- Dark mode functional via `next-themes`; charts inherit CSS variables
- `prefers-reduced-motion` respected globally
- API layer validates input server-side (entries, outages) and prunes ping history

## Findings

| ID | Sev | Area | Finding | Issue |
|---|---|---|---|---|
| F-01 | P1 | Nav / Responsive | Mobile landing nav is a placeholder horizontal anchor strip; no full menu, no `aria-expanded` pattern, cramped at 320 px | ISS-001 |
| F-02 | P1 | Error states | `/api/stats` failure is captured in `statsError` but never rendered — KPI cards silently show "loading…" forever; no retry affordance anywhere in the dashboard | ISS-002 |
| F-03 | P1 | Forms | Add-bill form shows one error string below the whole form; no field-level errors, no `aria-invalid`/`aria-describedby`, focus not moved to first invalid field | ISS-003 |
| F-04 | P2 | Accessibility | No skip-to-content link; latency status changes are not announced (`aria-live` missing); Providers country filter uses bare buttons without `aria-pressed`; delete-entry icon button is the only focus target in its cell group without a visible group label | ISS-004 |
| F-05 | P2 | SEO / PWA | Metadata + OG exist, but there is no web manifest, no `theme-color`, no canonical URL, no apple icons — not installable as the PWA the concept promises | ISS-005 |
| F-06 | P2 | Data-viz | Latency chart is a bare line: no good/fair/poor reference bands, no time axis labels, failed probes invisible (gaps), tooltip lacks threshold context | ISS-006 |
| F-07 | P3 | Interaction / polish | Deleting a billing entry is immediate and irreversible (no destructive confirmation); delete button is the only row control — risk of accidental data loss on touch | ISS-007 |

## Priority order

1. ISS-001 (P1) mobile navigation — blocks the "works from 320 px" acceptance bar
2. ISS-002 (P1) error states + retry — silent failure is worse than visible failure
3. ISS-003 (P1) form validation UX — primary conversion loop (log a bill)
4. ISS-004 (P2) accessibility pass
5. ISS-005 (P2) PWA/SEO metadata
6. ISS-006 (P2) latency chart legibility
7. ISS-007 (P3) destructive-action confirmation

## Regression bar for this cycle

- `bun run lint` and `bunx tsc --noEmit` clean on every PR
- Landing + all 4 dashboard tabs re-smoked at 375/768/1280 px, light + dark, keyboard-only pass on nav and forms
- No new runtime errors in dev server log during a scripted golden-path walk (launch dashboard → latency probes → add bill via SMS paste → report outage → export evidence → delete entry)

## Decision log

- Baseline imperfections documented here are the audit trail; fixes land only via issues + PRs (merge commits), keeping FINDING → ISSUE → OWNER → PR → MERGE traceable.
- No new dependencies planned this cycle: drawer uses existing Radix `sheet.tsx`, confirmations use existing `alert-dialog.tsx`. Bundle impact: zero.
