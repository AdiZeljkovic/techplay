import { NextResponse } from "next/server";
import { search } from "@/lib/search";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") || "";
  return NextResponse.json({ hits: q.trim().length < 2 ? [] : search(q.slice(0, 120)) });
}
