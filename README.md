# InternetYangu

> **"Yangu" means "mine" — my internet: measured, priced, and defended.**

Universal **connectivity + spend monitor** for Kenya and East Africa — built for
*every* network the region actually uses: Safaricom Fiber, Faiba 5G, Zuku, Airtel
Fixed, Poa, Mawingu, Starlink and beyond. Local-first, privacy-first, open source.

## Why

Millions of East African households juggle two or more networks, pay via M-Pesa, and have no way
to answer three questions:

1. **Measure** — Is my connection good right now? How often does it actually fail?
2. **Track** — What am I *really* paying per GB across providers?
3. **Act** — What evidence do I have when the service I paid for lets me down?

Speed-test apps show a moment. Bank apps show a debit. InternetYangu connects the two.

## Pillars

| Pillar | What it does | Where it runs |
|---|---|---|
| **Measure** | Live latency probing (5s interval), outage log, uptime %, p50/p95 | Browser core (no permissions) |
| **Track** | Billing SMS parsed on-device → cost-per-GB truth across providers | Browser core / optional Android shell |
| **Act** | Outage evidence packs (JSON export), provider directory comparison | Browser core |

## Architecture — local-first, privacy-first

- **Tier 1 — Browser core** (this repo): PWA that measures latency and parses pasted billing SMS
  client-side. No sensitive permissions. Data lives in your own local database.
- **Tier 2 — Android shell** (planned): optional wrapper that reads billing SMS as they arrive and
  exposes the connected SSID. Explicit user opt-in.
- **Tier 3 — Encrypted sync + community adapter registry** (planned): opt-in encrypted backup
  across devices, community-maintained ISP billing-format adapters.

The raw SMS you paste **never leaves your browser** — only the parsed fields (amount, reference,
provider) are saved to your local database.

## Tech stack

- Next.js 16 (App Router) + TypeScript 5
- Tailwind CSS 4 + shadcn/ui (Crystal Blue design tokens)
- Prisma + SQLite (local-first persistence)
- Recharts (live latency chart), next-themes (light/dark)

## Quick start

```bash
bun install
cp .env.example .env        # or create .env with DATABASE_URL=file:./db/custom.db
bun run db:push             # create schema
bun prisma/seed.ts          # seed the provider directory (indicative prices)
bun run dev                 # http://localhost:3000
```

## Repository workflow (the rules we hold)

Every change is traceable: **FINDING → ISSUE → BRANCH → PR → REVIEW → MERGE → REGRESSION**.

- **Issues** carry severity, root cause, affected breakpoints, and testable acceptance criteria.
- **PRs** reference the issue they close, list validation performed, and note risks.
- **Regression** after merge: `bun run lint` + manual smoke of every tab at mobile/desktop widths.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full audit → issue → PR loop, and
[docs/audits/](docs/audits/) for the UI audit trail that drives the roadmap.

## Market context (why now)

- Kenya fixed internet: **2.84M households** (+32.4% YoY, Communications Authority, Jun 2026)
- M-Pesa: **37.9M** one-month actives — billing rails everyone already uses
- Starlink Kenya: **~19.5K** subscribers — satellite monitors cover <1% of the market
- Airtel Kenya fixed entry: **KES 1,999** (15 Mbps) — the price war makes switching frequent

## License

MIT — open source, in the spirit of community-built utilities.
