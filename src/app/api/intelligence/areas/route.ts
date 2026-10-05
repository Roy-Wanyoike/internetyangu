import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DATA_WINDOW_DAYS, METHODOLOGY_VERSION } from "@/lib/intelligence";

export const dynamic = "force-dynamic";

// GET /api/intelligence/areas — list areas with 30-day sample coverage.
// Powers the Find Internet area selector (no account required, Addendum §34).
export async function GET() {
  const from = new Date(Date.now() - DATA_WINDOW_DAYS * 864e5);
  const areas = await db.area.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      country: true,
      level: true,
      _count: { select: { samples: true } },
    },
  });

  const recent = await db.pingSample.groupBy({
    by: ["areaId"],
    where: { areaId: { not: null }, createdAt: { gte: from } },
    _count: { _all: true },
  });
  const recentByArea = new Map(recent.map((r) => [r.areaId, r._count._all]));

  return NextResponse.json({
    methodology: METHODOLOGY_VERSION,
    dataWindowDays: DATA_WINDOW_DAYS,
    dataBasis: "illustrative-seed",
    areas: areas.map((a) => ({
      slug: a.slug,
      name: a.name,
      country: a.country,
      level: a.level,
      sampleCount: recentByArea.get(a.id) ?? 0,
    })),
  });
}
