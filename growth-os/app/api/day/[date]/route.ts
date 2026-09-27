import { NextResponse } from "next/server";
import { getDay } from "@/lib/data";
import { enrichItems } from "@/lib/enrich";

export async function GET(_req: Request, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const day = getDay(date);
  if (!day) return NextResponse.json({ error: "No plan for that date" }, { status: 404 });
  return NextResponse.json({ ...day, items: enrichItems(day.items) });
}
