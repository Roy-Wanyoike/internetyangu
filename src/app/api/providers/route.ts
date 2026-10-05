import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/providers — community provider directory (indicative prices)
export async function GET() {
  const providers = await db.provider.findMany({
    orderBy: [{ country: "asc" }, { rating: "desc" }],
  });
  return NextResponse.json(providers);
}
