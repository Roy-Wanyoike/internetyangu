import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// DELETE /api/data/purge — "Delete my data" (ISS-015 / Master Directive §17).
//
// InternetYangu is local-first and accountless: this device's records live in
// the user's own SQLite database and are identified by the pseudonymous
// contributor key (random UUID from the device's localStorage, sent in the
// X-Contributor-Key header). The purge removes:
//
//   - BillingEntry  — every row (these records have no contributor concept:
//                     the whole table IS this device's spend log)
//   - OutageEvent   — every row (same: the evidence log is per-device)
//   - PingSample    — rows belonging to this device, i.e. `contributorId`
//                     matching the caller's key, plus keyless locally
//                     generated probes (`areaId: null`). Area-attributed
//                     intelligence rows contributed by other devices (different
//                     contributorId) are never touched.
//
// The caller also clears its own derived state: browser localStorage keys and
// the service worker's API runtime cache (Directive §17: deletion propagates
// through caches). The aggregates /stats recomputes on next read.

export async function DELETE(req: Request) {
  const key = req.headers.get("x-contributor-key")?.trim() ?? "";
  if (!key) {
    return NextResponse.json(
      { error: "X-Contributor-Key header is required — deletion is keyed on this device's pseudonymous contributor key." },
      { status: 400 },
    );
  }
  if (!KEY_PATTERN.test(key)) {
    return NextResponse.json(
      { error: "Invalid X-Contributor-Key header — expected a UUID." },
      { status: 400 },
    );
  }

  const [billingEntries, outageEvents, pingSamples] = await db.$transaction([
    db.billingEntry.deleteMany({}),
    db.outageEvent.deleteMany({}),
    db.pingSample.deleteMany({
      where: {
        OR: [{ contributorId: key }, { areaId: null }],
      },
    }),
  ]);

  return NextResponse.json(
    {
      purgedAt: new Date().toISOString(),
      deleted: {
        billingEntries: billingEntries.count,
        outageEvents: outageEvents.count,
        pingSamples: pingSamples.count,
      },
    },
    { status: 200 },
  );
}
