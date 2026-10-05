# Contributing to InternetYangu

Thanks for helping build the universal connectivity monitor for East Africa. This project runs a
strict **audit → issue → PR → merge → regression** loop — nothing changes without a traceable
finding, and nothing merges without validation.

## The loop

```
DISCOVER → AUDIT → DOCUMENT FINDINGS → CHECK EXISTING ISSUES → CREATE/UPDATE ISSUES
  → PRIORITIZE → DESIGN SOLUTION → IMPLEMENT → TEST → VISUAL REVIEW
  → RESPONSIVE REVIEW → ACCESSIBILITY REVIEW → CODE REVIEW → PR → MERGE
  → REGRESSION TEST → FULL RE-AUDIT → NEW ISSUES? YES → REPEAT / NO → DONE
```

## Filing issues

Search existing issues first — no duplicates. Every UI/UX issue must include:

```
Title
Page / Route · Component
Problem · Evidence (screenshot / log / measurement)
Current behavior · Expected behavior
Affected breakpoints · Affected users
Severity (P0 blocker … P3 polish)
Root cause
Acceptance criteria (objective, testable)
Visual / Functional / Regression validation requirements
```

**Severity rubric**

| Level | Meaning |
|---|---|
| P0 | Broken functionality, unusable navigation, accessibility blockers |
| P1 | Major layout/UX failures, broken primary workflows |
| P2 | Design-system inconsistencies, a11y gaps, polish |
| P3 | Minor visual refinements |

## Submitting PRs

1. Branch from `main`: `fix/iss-<n>-short-slug` or `feat/iss-<n>-short-slug`.
2. Reference the issue: `Closes #<n>` in the PR body.
3. Fill the PR template: what changed, why, how it was validated, risks.
4. Validation checklist before opening the PR:
   - `bun run lint` passes
   - Verified in browser at **375px, 768px, 1280px** widths
   - Dark **and** light themes checked
   - Keyboard navigation and focus states intact
   - No new dependencies without justification (bundle impact documented)
5. Merge is **merge-commit** (history preserved, traceable to the issue).

## Design rules

- One design system: **Crystal Blue** tokens in `src/app/globals.css`. Never hardcode colors.
- Reuse shadcn/ui primitives before writing new components.
- Preserve existing functionality — visual changes must not break business behavior.
- Respect `prefers-reduced-motion`; keep touch targets ≥ 44px; contrast ≥ WCAG AA.

## Local development

```bash
bun install
bun run db:push && bun prisma/seed.ts
bun run dev    # port 3000
bun run lint
```

## License

By contributing you agree your contributions are licensed under the MIT License.
