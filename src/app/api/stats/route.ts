import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function currentPeriod(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function percentile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return Math.round(sorted[idx] * 10) / 10;
}

// GET /api/stats — dashboard KPIs
export async function GET() {
  const now = new Date();
  const period = currentPeriod(now);
  const d30 = new Date(now.getTime() - 30 * 864e5);

  const [entries, outages30, outagesAll, samples] = await Promise.all([
    db.billingEntry.findMany({ where: { periodMonth: period }, select: { amountKes: true, dataGb: true } }),
    db.outageEvent.findMany({ where: { startedAt: { gte: d30 } }, select: { startedAt: true, endedAt: true } }),
    db.outageEvent.findMany({ where: { startedAt: { gte: d30 }, endedAt: null }, select: { id: true } }),
    db.pingSample.findMany({
      where: { createdAt: { gte: d30 } },
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: { rttMs: true, ok: true },
    }),
  ]);

  const spendMtdKes = entries.reduce((s, e) => s + e.amountKes, 0);
  const totalGb = entries.reduce((s, e) => s + e.dataGb, 0);
  const avgCostPerGbKes = totalGb > 0 ? Math.round((spendMtdKes / totalGb) * 100) / 100 : null;

  const downtimeMin30d = outages30.reduce((s, o) => {
    const end = o.endedAt ? new Date(o.endedAt).getTime() : now.getTime();
    return s + Math.max(0, Math.round((end - new Date(o.startedAt).getTime()) / 60000));
  }, 0);

  const okSamples = samples.filter((s) => s.ok);
  const uptimePct30d = samples.length ? Math.round((okSamples.length / samples.length) * 10000) / 100 : null;

  const rtts = okSamples.map((s) => s.rttMs).sort((a, b) => a - b);

  return NextResponse.json({
    spendMtdKes,
    avgCostPerGbKes,
    entriesCount: entries.length,
    outages30d: outages30.length,
    openOutages: outagesAll.length,
    downtimeMin30d,
    uptimePct30d,
    latencyP50Ms: percentile(rtts, 50),
    latencyP95Ms: percentile(rtts, 95),
    currentMonth: period,
  });
}
