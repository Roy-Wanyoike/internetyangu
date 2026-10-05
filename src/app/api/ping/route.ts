import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/ping — lightweight endpoint the browser probes to measure RTT.
export async function GET() {
  return NextResponse.json({ t: Date.now() });
}

// POST /api/ping — record a measured sample { rttMs, ok }
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { rttMs?: unknown; ok?: unknown };
    const rttMs = Number(body.rttMs);
    const ok = body.ok === undefined ? true : Boolean(body.ok);

    if (!Number.isFinite(rttMs) || rttMs < 0 || rttMs > 120000) {
      return NextResponse.json({ error: "rttMs must be a finite number between 0 and 120000" }, { status: 400 });
    }

    const sample = await db.pingSample.create({ data: { rttMs, ok } });

    // Prune: keep the newest 1000 samples (local-first DB hygiene)
    const count = await db.pingSample.count();
    if (count > 1000) {
      const oldest = await db.pingSample.findMany({
        orderBy: { createdAt: "desc" },
        skip: 1000,
        take: count - 1000,
        select: { id: true },
      });
      if (oldest.length) {
        await db.pingSample.deleteMany({ where: { id: { in: oldest.map((s) => s.id) } } });
      }
    }

    return NextResponse.json(sample, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
