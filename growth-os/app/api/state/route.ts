import { NextResponse } from "next/server";
import { getStore } from "@/lib/state/store";
import { isStateOp } from "@/lib/state/reducer";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getStore().read());
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const ops = Array.isArray((body as { ops?: unknown })?.ops) ? (body as { ops: unknown[] }).ops : [];
  if (!ops.length || !ops.every(isStateOp)) return NextResponse.json({ error: "Expected { ops: StateOp[] }" }, { status: 400 });
  const state = await getStore().apply(ops);
  return NextResponse.json(state);
}
