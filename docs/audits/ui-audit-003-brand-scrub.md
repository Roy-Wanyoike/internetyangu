# UI Audit 003 — Brand scrub: competitor references (ISS-009)

**Date:** 2026-10-05 · **Trigger:** Product owner request — *"remove anything related to dishylink as this is a competitor"* · **Scope:** All tracked repository surfaces (+ out-of-repo investor assets, same release cycle) · **Severity:** P1 (brand / SEO / compliance, no functional impact)

## Method

1. Repo-wide case-insensitive scan: `rg --no-ignore -in "dishylink|daveyhert"` (filesystem, includes generated assets) and `git grep -in "dishylink\|daveyhert"` (tracked files).
2. Classified every hit into (a) **tracked repo surface** → fixed via PR for #17, or (b) **investor-facing document sources** (out-of-repo deliverables) → scrubbed in the same release cycle under this issue.
3. Copy rewritten so the universal / local-first / privacy-first story stands on its own without naming third-party tools.

## Findings and disposition

| Location | Before | Disposition |
|---|---|---|
| `src/components/landing/hero.tsx:38` | "Inspired by Dishylink — generalized for …" | Rewritten: "Built for Safaricom, Faiba, Zuku, Airtel, Poa, Mawingu, Starlink and beyond — every network East Africans actually use." |
| `src/components/landing/faq.tsx:7-8` | FAQ "How is InternetYangu different from Dishylink?" | Reframed as a category comparison vs. speed-test apps; no third-party name. |
| `src/components/landing/faq.tsx:28` | "inspired by Dishylink's open-source model …" | "…developed in the open on GitHub under the MIT license." |
| `src/components/landing/footer.tsx:63-74` | Credits block hyperlinking competitor repo | Replaced with "Open source under the MIT license". |
| `src/app/layout.tsx:23,30` | Meta description + keywords carried the competitor name | Description cleaned; keyword replaced with "cost per GB". |
| `README.md:5-8,78` | Intro credited the competitor; License line cited it | Intro cleaned; license line made generic. |
| `LICENSE:25-26` | Attribution block with competitor repo URL | Removed; standard MIT text only. |

Out-of-repo deliverables scrubbed under the same issue (not part of this PR): investor concept report sources (`scripts/report_content.py`, report cover HTML, architecture diagram), deck sources (`download/slides/slide_01/03/04/10/12.html`, `slides_brief.json`), and the stale repo archive, which is replaced by a clean v0.2.1 zip.

## Regression results (post-fix, pre-merge)

- `git grep -in "dishylink\|daveyhert"` across tracked files → **0 matches**
- `bun run lint` (eslint .) → **0 errors**
- `bunx tsc --noEmit` → **clean**
- Landing HTTP 200 on dev server; no client compile errors after edits
- Visual smoke at 375px and 1440px: hero paragraph wraps cleanly, no layout shift, footer Credits renders as a single line

## Acceptance

All ISS-009 acceptance criteria met. Release gate added: the repo-wide competitor scan is now part of the v0.2.1 tag checklist and all future release checks.

**Status: ACCEPTED — v0.2.1**
