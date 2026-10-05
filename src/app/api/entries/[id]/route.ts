import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// DELETE /api/entries/:id — remove a billing entry (path param, not query)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id path parameter is required" }, { status: 400 });
  }
  const existing = await db.billingEntry.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }
  await db.billingEntry.delete({ where: { id } });
  return NextResponse.json({ deleted: id });
}
