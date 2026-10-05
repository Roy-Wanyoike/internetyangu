import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Transfer test endpoint for the Connection Test Center (ISS-011 /
// Addendum §6-7). Deliberately small: payloads are size-bounded so the
// whole suite stays far under the ~2 MB budget stated in the UI, and the
// user can always cancel mid-flight. In-memory only — nothing is stored.

const TRANSFER_BYTES = 200_000; // ~200 KB per pass
const MAX_UPLOAD_BYTES = 1_000_000; // refuse absurd bodies, keep the route tiny

// Cheap deterministic PRNG (LCG). Random-ish bytes defeat transparent
// caching/compression so transfer timing reflects the real network path;
// we never burn entropy for this.
function fillRandomish(buf: Uint8Array, seed: number): void {
  let s = seed >>> 0 || 0x9e3779b9;
  for (let i = 0; i < buf.length; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    buf[i] = s & 0xff;
  }
}

// GET /api/test/transfer — download direction: ~200 KB of random-ish bytes.
export async function GET() {
  const payload = new Uint8Array(TRANSFER_BYTES);
  fillRandomish(payload, Date.now() & 0xffffffff);
  return new NextResponse(payload as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(TRANSFER_BYTES),
      "Cache-Control": "no-store, no-transform",
      "X-Transfer-Bytes": String(TRANSFER_BYTES),
    },
  });
}

// POST /api/test/transfer — upload direction: accepts and DISCARDS the body,
// reporting how many bytes arrived. Never persisted.
export async function POST(req: Request) {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `Upload too large for the bounded test (max ${MAX_UPLOAD_BYTES} bytes).` },
      { status: 413 },
    );
  }
  let received = 0;
  try {
    const body = await req.arrayBuffer();
    received = body.byteLength; // read then discard — nothing is stored
  } catch {
    return NextResponse.json({ error: "Could not read upload body." }, { status: 400 });
  }
  return NextResponse.json({ received }, { headers: { "Cache-Control": "no-store" } });
}
