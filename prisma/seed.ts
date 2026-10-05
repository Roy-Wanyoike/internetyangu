/**
 * InternetYangu seed — East African provider directory + demo user data.
 * Prices are INDICATIVE (crowdsourced, KES equivalent) — verified anchors:
 *  - Airtel Kenya fixed internet entry: KES 1,999 (15 Mbps)  [research anchor]
 *  - Starlink Kenya: ~19,470 subscribers Sep-2025, standard ~KES 6,500/mo
 *  - Kenya fixed lines: 2.84M (Jun-2026, +32.4% YoY) — Communications Authority
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  await db.pingSample.deleteMany();
  await db.outageEvent.deleteMany();
  await db.billingEntry.deleteMany();
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

  const now = new Date();
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

  // 72 historical latency samples so the dashboard has history on first load
  const samples: Array<{ rttMs: number; ok: boolean; createdAt: Date }> = [];
  let seedVal = 42;
  const rand = () => {
    seedVal = (seedVal * 1103515245 + 12345) % 2147483648;
    return seedVal / 2147483648;
  };
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
    entries: await db.billingEntry.count(),
    outages: await db.outageEvent.count(),
    pings: await db.pingSample.count(),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
