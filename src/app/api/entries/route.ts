import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const SOURCE_RE = /^(manual|sms|csv)$/;
const PERIOD_RE = /^\d{4}-\d{2}$/;

// GET /api/entries — list billing entries (newest first)
export async function GET() {
  const entries = await db.billingEntry.findMany({
    orderBy: [{ periodMonth: "desc" }, { createdAt: "desc" }],
    take: 200,
  });
  return NextResponse.json(entries);
}

// POST /api/entries — create a billing entry
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

    const providerName = typeof body.providerName === "string" ? body.providerName.trim() : "";
    const planName = typeof body.planName === "string" && body.planName.trim() ? body.planName.trim() : null;
    const amountKes = Number(body.amountKes);
    const dataGb = Number(body.dataGb);
    const periodMonth = typeof body.periodMonth === "string" ? body.periodMonth.trim() : "";
    const paymentRef = typeof body.paymentRef === "string" && body.paymentRef.trim() ? body.paymentRef.trim() : null;
    const source = typeof body.source === "string" && SOURCE_RE.test(body.source) ? body.source : "manual";

    const errors: string[] = [];
    if (!providerName) errors.push("providerName is required");
    else if (providerName.length > 80) errors.push("providerName must be 80 characters or fewer");
    if (!Number.isFinite(amountKes) || amountKes <= 0) errors.push("amountKes must be a positive number");
    if (!Number.isFinite(dataGb) || dataGb <= 0) errors.push("dataGb must be a positive number");
    if (!PERIOD_RE.test(periodMonth)) errors.push("periodMonth must match YYYY-MM");
    if (paymentRef && paymentRef.length > 40) errors.push("paymentRef must be 40 characters or fewer");

    if (errors.length) {
      return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
    }

    const entry = await db.billingEntry.create({
      data: { providerName, planName, amountKes, dataGb, periodMonth, paymentRef, source },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
