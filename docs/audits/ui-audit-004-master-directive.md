# UI/UX & Capability Audit 004 — Master Engineering Directive Baseline

**Date:** 2026-10-05 · **Scope:** Full Phase-0 baseline of `main` @ `14cb643` (v0.2.1) against `docs/MASTER-ENGINEERING-DIRECTIVE.md` and `docs/ADDENDUM-CONNECTIVITY-INTELLIGENCE.md` (§40 capability classification).
**Method:** Repository inspection (schema, API routes, hooks, components, public/ assets), static grep verification, prior audit reviews (001–003), no live-traffic assumptions. Classifications per Addendum §40: `COMPLETE / PARTIAL / BROKEN / UI ONLY / BACKEND ONLY / UNTESTED / MISSING`.

## Executive Summary

v0.2.1 is a solid **My Internet** v1: latency measurement, SMS-driven spend tracking, outage evidence, accessible dashboard, all shipped through the audit→issue→PR loop. However, measured against the Master Directive and the Connectivity-Intelligence Addendum, the platform today is a **single-user monitor, not yet a connectivity intelligence network**. The material gaps cluster in four areas: (1) PWA runtime (no service worker → no offline shell, no update flow), (2) the **Find Internet / area intelligence** half of the product is absent end-to-end, (3) the connection test is latency-only with no mobile-data guardrails, and (4) the privacy promise lives in marketing copy but has **no consent, deletion, or contribution UI**. None of these are regressions; all are build-out. The issue plan below sequences them with dependencies.

## Capability Matrix (Addendum §40)

| # | Capability | Class | Evidence |
|---|------------|-------|----------|
| 1 | PWA manifest + icons + installability basics | COMPLETE | `public/manifest.webmanifest` (name, standalone, maskable 512, theme `#0a1628`, `start_url /#dashboard`); PR#12 added appleWebApp/canonical/themeColor |
| 2 | Service worker | **MISSING** | No `sw.js`, no `serviceWorker` reference anywhere in `src/` or `public/` |
| 3 | Offline shell | **MISSING** | No SW → no precached app shell; offline yields browser error page |
| 4 | Install promotion (§32) | **MISSING** | No `beforeinstallprompt` handling, no install UX |
| 5 | Update mechanism / versioning (§3,26) | **MISSING** | No SW lifecycle, no "new version available" flow |
| 6 | Responsive mobile UI | COMPLETE | Mobile nav drawer (PR#8), 375px no-overflow regression verified in audit-002 E2E |
| 7 | Responsive desktop richness (1280–1920) | PARTIAL | Dashboard laid out at laptop width; no explicit 1920 / safe-area / `prefers-reduced-motion` sweep on record |
| 8 | Mobile navigation | COMPLETE | Radix Sheet drawer, Escape-close verified |
| 9 | Connection testing | PARTIAL | `use-latency.ts` probes `/api/ping` every 5s (latency only, pauses on hidden tab); no download/upload/jitter/loss; no dedicated Test Center view |
| 10 | Mobile data testing guardrails (§7) | **MISSING** | No data-usage warning, no estimate, no cancel affordance |
| 11 | Wi-Fi vs cellular distinction (§8,18) | **MISSING** | No `navigator.connection` usage; connection type never captured or displayed |
| 12 | Provider detection | PARTIAL | Provider chosen manually / parsed from SMS; no network-level detection |
| 13 | Location intelligence (§11,35,36) | **MISSING** | No area/geolocation dimension anywhere |
| 14 | Geographic aggregation | **MISSING** | `PingSample` has no area field; no cell/fallback hierarchy |
| 15 | Provider comparison | PARTIAL | Providers tab is a directory (plan/price table); no scored comparison |
| 16 | Area intelligence | **MISSING** | No area model, no per-area provider performance |
| 17 | Measurement ingestion | COMPLETE | `POST /api/ping` persists samples w/ pruning (`skip: 1000`) |
| 18 | Measurement validation & quality (§20,27) | PARTIAL | Pruning only; no value-range checks, no duplicate/flood rejection, **no rate limiting on POST /api/ping** |
| 19 | Recommendation engine | **MISSING** | Nothing produces "best for you / best here" outputs |
| 20 | Confidence scoring (§13,38) | **MISSING** | No sample-count/confidence tier surfaced |
| 21 | Outage detection | PARTIAL | Manual report + close + evidence export (`OutageEvent`); no automatic detection from measurement streams, no confidence-gated language |
| 22 | Privacy controls (§16,17) | PARTIAL | Local-first claims in FAQ copy; no Privacy Center, no consent toggles, no account/data deletion flow |
| 23 | Anonymous contribution (§21) | **MISSING** | No opt-in share flow or allowlisted-fields pipeline |
| 24 | Notification infrastructure (§29) | **MISSING** | No push, no alert preferences |
| 25 | Intelligence API surface (§25) | PARTIAL | Internal APIs (`/api/stats` p50/p95/uptime) exist; no area/provider intelligence endpoints, no methodology versioning |

## Key Findings

- **F-01 (P1):** No service worker; the "persistent intelligence layer" positioning (Addendum §2) fails its first test — the app cannot run offline, cannot background-cache, cannot be updated gracefully. → ISS-010
- **F-02 (P1):** Test story is latency-only and silent about cost. On metered mobile data, a monitoring app that silently consumes data contradicts Addendum §7 and our own positioning. → ISS-011, ISS-012
- **F-03 (P1):** Zero area/geographic dimension in the data model. Without an area on measurements, the entire intelligence engine (Addendum §10–17) has no substrate. → ISS-013
- **F-04 (P1):** No Find Internet experience; new-user acquisition loop (the flywheel's entry point) does not exist. → ISS-014
- **F-05 (P1):** Privacy UX gap: no consent architecture, no deletion. Directive §16–17 are hard requirements for an open-source privacy-first product. → ISS-015
- **F-06 (P1):** `POST /api/ping` is unauthenticated, unthrottled, and accepts arbitrary payloads — measurement flooding could poison future public intelligence (Addendum §27). → ISS-016
- **F-07 (P2):** Landing sells one product ("monitor"); the dual-path entry (My Internet **vs** Find Internet) and locked positioning ("Know your internet. Choose better. Pay smarter.") are absent. → ISS-017
- **F-08 (P2):** No install promotion or update UX — the app never asks to be installed, and never announces new versions. → rides with ISS-010
- **F-09 (P3):** Desktop 1280–1920 richness, safe-area insets, and `prefers-reduced-motion` have no recorded sweep. → ISS-018
- **F-10 (P3):** Recommendation scoring, confidence tiers, push/alerts and the public intelligence API are greenfield; sequenced after F-03/F-04 land. → ISS-019 (umbrella, backlog)

## Dependency Graph

```text
ISS-013 (area model + API)  ──►  ISS-014 (Find Internet view)
ISS-010 (SW + offline)      ──►  install/update UX (inside ISS-010)
ISS-011 (test engine)       ──►  ISS-012 (mobile-data guardrails)
ISS-016 (ping hardening)    ──►  ISS-014 (public aggregation must not inherit unthrottled ingestion)
ISS-015 (Privacy Center)    ──►  ISS-019 contribution flow (backlog)
ISS-017 (landing dual-path)      independent
```

## Recommended Roadmap (this sprint = v0.3.0)

| Order | Issue | Priority | Why now |
|-------|-------|----------|---------|
| 1 | ISS-013 area intelligence backend | P1 | Substrate for the intelligence engine |
| 2 | ISS-014 Find Internet view | P1 | Completes the product's second half |
| 3 | ISS-016 ping hardening | P1 | Protects everything public built on ingestion |
| 4 | ISS-011+012 Test Center + data guardrails | P1 | Honest measurement UX |
| 5 | ISS-010 SW + offline shell + install/update | P1 | PWA-first promise |
| 6 | ISS-015 Privacy Center | P1 | Consent + deletion hard requirement |
| 7 | ISS-017 landing dual-path | P2 | Positioning catch-up |
| 8 | ISS-018/019 | P3/backlog | Documented, scheduled |

## Definition of Done (sprint)

Every P1 issue: linked branch `fix/iss-0NN-slug`, lint + `tsc` + production build green, golden-path browser regression (landing → dashboard → new surfaces; 375px no overflow), audit doc updated, PR merged with merge commit, issue closed by commit keyword. Demo data surfaced anywhere must be explicitly labeled *illustrative* (Addendum §38).
