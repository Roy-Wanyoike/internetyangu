/**
 * InternetYangu seed — East African provider directory + demo user data.
 * Prices are INDICATIVE (crowdsourced, KES equivalent) — verified anchors:
 *  - Airtel Kenya fixed internet entry: KES 1,999 (15 Mbps)  [research anchor]
 *  - Starlink Kenya: ~19,470 subscribers Sep-2025, standard ~KES 6,500/mo
 *  - Kenya fixed lines: 2.84M (Jun-2026, +32.4% YoY) — Communications Authority
 *
 * Area intelligence samples are ILLUSTRATIVE demo data (Addendum §38): every
 * API response built on them is stamped `dataBasis: "illustrative-seed"` and
 * the UI must show the illustrative-dataset banner wherever they are used.
 * Nakuru – Milimani is intentionally under-sampled (<5 samples) to exercise
 * the insufficient-data path.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Deterministic RNG so every seed run yields the same distributions.
let seedVal = 42;
const rand = () => {
  seedVal = (seedVal * 1103515245 + 12345) % 2147483648;
  return seedVal / 2147483648;
};

// Illustrative per-area provider behaviour (latency/jitter in ms).
type ProviderSpec = {
  provider: string;
  baseRtt: number;
  jitter: number;
  failureRate: number;
  samples: number;
  contributors: number;
};

type AreaSpec = {
  slug: string;
  name: string;
  country: string;
  level: string;
  providers: ProviderSpec[];
};

const AREA_SPECS: AreaSpec[] = [
  {
    slug: "nairobi-westlands",
    name: "Nairobi – Westlands",
    country: "KE",
    level: "neighborhood",
    providers: [
      { provider: "Safaricom Fiber", baseRtt: 24, jitter: 14, failureRate: 0.03, samples: 140, contributors: 9 },
      { provider: "Faiba 5G Home", baseRtt: 27, jitter: 12, failureRate: 0.04, samples: 110, contributors: 7 },
      { provider: "Zuku Fiber", baseRtt: 41, jitter: 22, failureRate: 0.07, samples: 62, contributors: 5 },
      { provider: "Airtel Fixed Internet", baseRtt: 33, jitter: 18, failureRate: 0.05, samples: 42, contributors: 4 },
      { provider: "Poa Internet", baseRtt: 38, jitter: 20, failureRate: 0.06, samples: 28, contributors: 3 },
    ],
  },
  {
    slug: "nairobi-kileleshwa",
    name: "Nairobi – Kileleshwa",
    country: "KE",
    level: "neighborhood",
    providers: [
      { provider: "Faiba 5G Home", baseRtt: 22, jitter: 10, failureRate: 0.03, samples: 150, contributors: 8 },
      { provider: "Airtel Fixed Internet", baseRtt: 26, jitter: 14, failureRate: 0.04, samples: 120, contributors: 7 },
      { provider: "Safaricom Fiber", baseRtt: 45, jitter: 25, failureRate: 0.09, samples: 95, contributors: 6 },
      { provider: "Poa Internet", baseRtt: 35, jitter: 18, failureRate: 0.06, samples: 40, contributors: 3 },
      { provider: "Starlink Kenya", baseRtt: 110, jitter: 40, failureRate: 0.05, samples: 30, contributors: 4 },
    ],
  },
  {
    slug: "mombasa",
    name: "Mombasa",
    country: "KE",
    level: "city",
    providers: [
      { provider: "Safaricom Fiber", baseRtt: 29, jitter: 15, failureRate: 0.04, samples: 120, contributors: 7 },
      { provider: "Zuku Fiber", baseRtt: 47, jitter: 26, failureRate: 0.08, samples: 82, contributors: 5 },
      { provider: "Airtel Fixed Internet", baseRtt: 38, jitter: 20, failureRate: 0.07, samples: 46, contributors: 4 },
      { provider: "Starlink Kenya", baseRtt: 120, jitter: 45, failureRate: 0.06, samples: 26, contributors: 3 },
    ],
  },
  {
    // Sparse on purpose: 3 samples total → API must answer insufficientData.
    slug: "nakuru-milimani",
    name: "Nakuru – Milimani",
    country: "KE",
    level: "neighborhood",
    providers: [
      { provider: "Poa Internet", baseRtt: 40, jitter: 20, failureRate: 0, samples: 2, contributors: 2 },
      { provider: "Mawingu Networks", baseRtt: 52, jitter: 20, failureRate: 0, samples: 1, contributors: 1 },
    ],
  },
];

async function main() {
  await db.pingSample.deleteMany();
  await db.outageEvent.deleteMany();
  await db.billingEntry.deleteMany();
  await db.area.deleteMany();
  await db.provider.deleteMany();

  await db.provider.createMany({
    data: [
      { name: "Safaricom Fiber", country: "KE", technology: "Fiber", entryPriceKes: 2999, avgSpeedMbps: 40, dataCapGb: 0, rating: 4.1, notes: "Largest fixed ISP; bundled with mobile." },
      { name: "Faiba 5G Home", country: "KE", technology: "5G", entryPriceKes: 2000, avgSpeedMbps: 60, dataCapGb: 300, rating: 3.9, notes: "Bundle-based; coverage limited to 5G zones." },
      { name: "Zuku Fiber", country: "KE", technology: "Fiber", entryPriceKes: 2499, avgSpeedMbps: 10, dataCapGb: 0, rating: 3.4, notes: "Legacy entry plan; upgrades to 40/60 Mbps tiers." },
      { name: "Airtel Fixed Internet", country: "KE", technology: "Fixed Wireless", entryPriceKes: 1999, avgSpeedMbps: 15, dataCapGb: 0, rating: 3.6, notes: "Aggressive 2025 price entry — KES 1,999." },
      { name: "Poa Internet", country: "KE", technology: "Fiber", entryPriceKes: 1500, avgSpeedMbps: 10, dataCapGb: 0, rating: 3.8, notes: "Low-cost home fiber, Nairobi focus." },
      { name: "Mawingu Networks", country: "KE", technology: "Fixed Wireless", entryPriceKes: 3000, avgSpeedMbps: 10, dataCapGb: 0, rating: 4.0, notes: "Rural/unserviced focus; $20M Series C (Oct-2025)." },
      { name: "Starlink Kenya", country: "KE", technology: "Satellite", entryPriceKes: 6500, avgSpeedMbps: 150, dataCapGb: 0, rating: 4.3, notes: "Standard plan; hardware KES ~45,500 one-off." },
      { name: "Vodacom Home Fiber", country: "TZ", technology: "Fiber", entryPriceKes: 2700, avgSpeedMbps: 20, dataCapGb: 0, rating: 3.7, notes: "Indicative KES-equivalent of TZS bundle." },
      { name: "MTN WakaNet", country: "UG", technology: "Fiber", entryPriceKes: 4700, avgSpeedMbps: 25, dataCapGb: 0, rating: 3.8, notes: "Indicative KES-equivalent of UGX plans." },
      { name: "Airtel Rwanda Home", country: "RW", technology: "Fixed Wireless", entryPriceKes: 3800, avgSpeedMbps: 20, dataCapGb: 0, rating: 3.5, notes: "Indicative KES-equivalent of RWF plans." },
    ],
  });

  const providers = await db.provider.findMany({ select: { id: true, name: true } });
  const providerIdByName = new Map(providers.map((p) => [p.name, p.id]));

  // --- Illustrative area intelligence samples (last 30 days) -----------------
  const now = new Date();
  for (const spec of AREA_SPECS) {
    const area = await db.area.create({
      data: { slug: spec.slug, name: spec.name, country: spec.country, level: spec.level },
    });
    const rows: Array<{
      rttMs: number;
      ok: boolean;
      createdAt: Date;
      providerId: string;
      areaId: string;
      contributorId: string;
    }> = [];
    for (const p of spec.providers) {
      const providerId = providerIdByName.get(p.provider);
      if (!providerId) continue;
      let pushed = 0;
      for (let c = 0; c < p.contributors && pushed < p.samples; c++) {
        const contributorId = `seed-${spec.slug}-${p.provider.toLowerCase().replace(/\s+/g, "-")}-c${c + 1}`;
        // Spread each contributor's samples over the 30-day window.
        const perContributor = Math.ceil(p.samples / p.contributors);
        for (let i = 0; i < perContributor && pushed < p.samples; i++) {
          const spike = rand() > 0.95;
          const rttMs = Math.round((p.baseRtt + rand() * p.jitter + (spike ? 180 : 0)) * 10) / 10;
          const ok = rand() >= p.failureRate;
          rows.push({
            rttMs,
            ok,
            createdAt: new Date(now.getTime() - rand() * 30 * 864e5),
            providerId,
            areaId: area.id,
            contributorId,
          });
          pushed++;
        }
      }
    }
    await db.pingSample.createMany({ data: rows });
  }

  const month = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const thisM = month(now);
  const lastM = month(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  await db.billingEntry.createMany({
    data: [
      { providerName: "Safaricom Fiber", planName: "Fiber 40 Mbps", amountKes: 2999, dataGb: 420, periodMonth: lastM, paymentRef: "QGH7XY12K3", source: "sms" },
      { providerName: "Faiba 5G Home", planName: "5G 300GB", amountKes: 2000, dataGb: 180, periodMonth: lastM, paymentRef: "A1B2C3D4E5", source: "manual" },
      { providerName: "Safaricom Fiber", planName: "Fiber 40 Mbps", amountKes: 2999, dataGb: 465, periodMonth: thisM, paymentRef: "QK4P9WR7T1", source: "sms" },
      { providerName: "Faiba 5G Home", planName: "5G Top-up 25GB", amountKes: 500, dataGb: 25, periodMonth: thisM, paymentRef: "ZZ82PLM41Q", source: "sms" },
    ],
  });

  await db.outageEvent.createMany({
    data: [
      {
        providerName: "Safaricom Fiber",
        startedAt: new Date(now.getTime() - 6 * 864e5 - 210 * 6e4),
        endedAt: new Date(now.getTime() - 6 * 864e5 - 25 * 6e4),
        notes: "No sync on ONT; confirmed with neighbours on same estate.",
      },
      {
        providerName: "Faiba 5G Home",
        startedAt: new Date(now.getTime() - 2 * 864e5 - 95 * 6e4),
        endedAt: new Date(now.getTime() - 2 * 864e5 - 20 * 6e4),
        notes: "5G icon present but no throughput.",
      },
    ],
  });

  // 72 local latency samples so the dashboard has history on first load
  // (no area/provider attribution — these are "my own probes").
  const samples: Array<{ rttMs: number; ok: boolean; createdAt: Date }> = [];
  for (let i = 0; i < 72; i++) {
    const spike = rand() > 0.93;
    samples.push({
      rttMs: Math.round((28 + rand() * 34 + (spike ? 180 : 0)) * 10) / 10,
      ok: true,
      createdAt: new Date(now.getTime() - (72 - i) * 5 * 1000),
    });
  }
  await db.pingSample.createMany({ data: samples });

  console.log("Seed complete:", {
    providers: await db.provider.count(),
    areas: await db.area.count(),
    entries: await db.billingEntry.count(),
    outages: await db.outageEvent.count(),
    pings: await db.pingSample.count(),
    areaPings: await db.pingSample.count({ where: { areaId: { not: null } } }),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
