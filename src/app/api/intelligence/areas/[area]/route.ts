import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  DATA_WINDOW_DAYS,
  METHODOLOGY_VERSION,
  MIN_AREA_SAMPLES,
  aggregateSamples,
  type SampleStat,
} from "@/lib/intelligence";

export const dynamic = "force-dynamic";

// GET /api/intelligence/areas/:slug — per-provider connectivity intelligence
// for one area (Addendum §10–15). Aggregates measurements inside a 30-day
// window; areas with fewer than MIN_AREA_SAMPLES total samples answer
// `insufficientData: true` with NO rankings (Addendum §38).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ area: string }> },
) {
  const { area: slug } = await params;
  if (!slug || slug.length > 120) {
    return NextResponse.json({ error: "area path parameter is required" }, { status: 400 });
  }

  const area = await db.area.findUnique({ where: { slug } });
  if (!area) {
    return NextResponse.json({ error: "Area not found" }, { status: 404 });
  }

  const to = new Date();
  const from = new Date(to.getTime() - DATA_WINDOW_DAYS * 864e5);

  const [samples, allAreas] = await Promise.all([
    db.pingSample.findMany({
      where: { areaId: area.id, createdAt: { gte: from, lte: to } },
      select: {
        rttMs: true,
        ok: true,
        contributorId: true,
        createdAt: true,
        providerId: true,
        provider: { select: { id: true, name: true, technology: true, entryPriceKes: true, avgSpeedMbps: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.pingSample.groupBy({
      by: ["areaId"],
      where: { areaId: { not: null }, createdAt: { gte: from } },
      _count: { _all: true },
    }),
  ]);

  const totalSamples = samples.length;

  // Sparse-area fallback: point the user at the best-covered area instead
  // of inventing a ranking (Addendum §11 fallback upward / §38 honesty).
  const countByArea = new Map(
    allAreas.filter((r) => r.areaId).map((r) => [r.areaId as string, r._count._all]),
  );
  countByArea.delete(area.id);
  let fallbackArea: { slug: string; name: string; sampleCount: number } | null = null;
  if (totalSamples < MIN_AREA_SAMPLES && countByArea.size) {
    const [bestId, bestCount] = [...countByArea.entries()].sort((a, b) => b[1] - a[1])[0];
    const best = await db.area.findUnique({
      where: { id: bestId },
      select: { slug: true, name: true },
    });
    if (best) fallbackArea = { ...best, sampleCount: bestCount };
  }

  if (totalSamples < MIN_AREA_SAMPLES) {
    return NextResponse.json({
      area: { slug: area.slug, name: area.name, country: area.country, level: area.level },
      dataBasis: "illustrative-seed",
      methodology: METHODOLOGY_VERSION,
      dataWindow: { days: DATA_WINDOW_DAYS, from: from.toISOString(), to: to.toISOString() },
      insufficientData: true,
      totalSamples,
      minimumSamples: MIN_AREA_SAMPLES,
      providers: [],
      fallbackArea,
      notice:
        "InternetYangu has limited data in this area — measurements are too few to produce a fair ranking.",
    });
  }

  // Group by provider and aggregate. Samples whose provider was removed
  // (providerId null) are unattributed and excluded from rankings.
  const byProvider = new Map<string, SampleStat[]>();
  for (const s of samples) {
    if (!s.providerId || !s.provider) continue;
    const list = byProvider.get(s.providerId) ?? [];
    list.push({
      rttMs: s.rttMs,
      ok: s.ok,
      contributorId: s.contributorId,
      createdAt: s.createdAt,
    });
    byProvider.set(s.providerId, list);
  }

  const providers = [...byProvider.entries()]
    .map(([providerId, list]) => {
      const stats = aggregateSamples(list);
      const meta = samples.find((s) => s.providerId === providerId)?.provider;
      return {
        providerId,
        name: meta?.name ?? "Unknown provider",
        technology: meta?.technology ?? null,
        entryPriceKes: meta?.entryPriceKes ?? null,
        avgSpeedMbps: meta?.avgSpeedMbps ?? null,
        ...stats,
      };
    })
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  return NextResponse.json({
    area: { slug: area.slug, name: area.name, country: area.country, level: area.level },
    dataBasis: "illustrative-seed",
    methodology: METHODOLOGY_VERSION,
    dataWindow: { days: DATA_WINDOW_DAYS, from: from.toISOString(), to: to.toISOString() },
    insufficientData: false,
    totalSamples,
    minimumSamples: MIN_AREA_SAMPLES,
    providers,
  });
}
