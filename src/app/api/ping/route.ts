import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  checkFlood,
  checkRate,
  clientKey,
  floodSignature,
} from "@/lib/ping-guard";

export const dynamic = "force-dynamic";

// GET /api/ping — lightweight endpoint the browser probes to measure RTT.
export async function GET() {
  return NextResponse.json({ t: Date.now() });
}

// POST /api/ping — record a measured sample.
// Hardened ingestion (ISS-016 / Addendum §27): per-client fixed-window
// throttle, strict schema validation, provider/area existence checks and an
// identical-payload flood guard. Rejections never persist anything.
// ISS-011: optional measurement-quality metadata (Addendum §20) — the
// Connection Test Center may attach the reported connection type and a
// stability flag; both are strictly typed and everything else is still
// rejected.
const bodySchema = z
  .object({
    // Canonical field; `rttMs` remains a legacy alias for the original probe.
    latencyMs: z.number().finite().min(0).max(600000).optional(),
    rttMs: z.number().finite().min(0).max(600000).optional(),
    ok: z.boolean().optional(),
    providerId: z.string().min(1).max(64).optional(),
    areaId: z.string().min(1).max(64).optional(),
    connectionType: z.enum(["slow-2g", "2g", "3g", "4g", "unknown"]).optional(),
    stable: z.boolean().optional(),
  })
  .strict();

export async function POST(req: Request) {
  // 1) Volume throttle — fixed window per client, in-memory only.
  const client = clientKey(req);
  const rate = checkRate(client);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many measurement submissions. Slow down and retry shortly." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
    );
  }

  // 2) Strict body validation.
  let parsedBody: unknown;
  try {
    parsedBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(parsedBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Invalid payload: latencyMs must be a number between 0 and 600000, ok a boolean, providerId/areaId short strings; unknown fields are rejected.",
      },
      { status: 400 },
    );
  }
  const body = parsed.data;
  const latencyMs = body.latencyMs ?? body.rttMs;
  if (latencyMs === undefined) {
    return NextResponse.json({ error: "latencyMs is required" }, { status: 400 });
  }
  const ok = body.ok ?? true;

  // 3) Referential checks — a claimed provider/area must exist.
  if (body.providerId) {
    const provider = await db.provider.findUnique({
      where: { id: body.providerId },
      select: { id: true },
    });
    if (!provider) {
      return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
    }
  }
  if (body.areaId) {
    const area = await db.area.findUnique({ where: { id: body.areaId }, select: { id: true } });
    if (!area) {
      return NextResponse.json({ error: "Unknown area" }, { status: 400 });
    }
  }

  // 4) Identical-payload flood guard (Addendum §27) — same provider +
  //    latency + user-agent more than FLOOD_LIMIT times per minute is a
  //    scripted flood, not a real measurement stream.
  const signature = floodSignature(
    body.providerId ?? null,
    latencyMs,
    req.headers.get("user-agent") ?? "no-user-agent",
  );
  const flood = checkFlood(signature);
  if (!flood.allowed) {
    return NextResponse.json(
      { error: "Identical measurements repeated too frequently — rejected as potential flooding." },
      { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } },
    );
  }

  const sample = await db.pingSample.create({
    data: {
      rttMs: latencyMs,
      ok,
      ...(body.providerId ? { providerId: body.providerId } : {}),
      ...(body.areaId ? { areaId: body.areaId } : {}),
      ...(body.connectionType ? { connectionType: body.connectionType } : {}),
      ...(body.stable !== undefined ? { stable: body.stable } : {}),
    },
  });

  // Prune: keep the newest 1000 locally-generated samples (local-first DB
  // hygiene). Area-attributed samples are intelligence data — they age out
  // via the 30-day aggregation window instead of being pruned here.
  const count = await db.pingSample.count({ where: { areaId: null } });
  if (count > 1000) {
    const oldest = await db.pingSample.findMany({
      where: { areaId: null },
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
}
