import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/outages — list outage events (newest first)
export async function GET() {
  const outages = await db.outageEvent.findMany({
    orderBy: { startedAt: "desc" },
    take: 200,
  });
  return NextResponse.json(outages);
}

// POST /api/outages — report an outage { providerName, startedAt?, notes? }
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const providerName = typeof body.providerName === "string" ? body.providerName.trim() : "";
    const notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;

    let startedAt = new Date();
    if (typeof body.startedAt === "string" && body.startedAt) {
      const d = new Date(body.startedAt);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: "startedAt is not a valid ISO date" }, { status: 400 });
      }
      startedAt = d;
    }

    if (!providerName || providerName.length > 80) {
      return NextResponse.json({ error: "providerName is required (max 80 chars)" }, { status: 400 });
    }

    const outage = await db.outageEvent.create({ data: { providerName, startedAt, notes } });
    return NextResponse.json(outage, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

// PUT /api/outages — close an outage { id, endedAt?, notes? }
export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const existing = await db.outageEvent.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Outage not found" }, { status: 404 });
    if (existing.endedAt) return NextResponse.json({ error: "Outage already closed" }, { status: 409 });

    let endedAt = new Date();
    if (typeof body.endedAt === "string" && body.endedAt) {
      const d = new Date(body.endedAt);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: "endedAt is not a valid ISO date" }, { status: 400 });
      }
      endedAt = d;
    }
    if (endedAt.getTime() < existing.startedAt.getTime()) {
      return NextResponse.json({ error: "endedAt cannot be before startedAt" }, { status: 400 });
    }

    const notes =
      typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : existing.notes;

    const outage = await db.outageEvent.update({ where: { id }, data: { endedAt, notes } });
    return NextResponse.json(outage);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
