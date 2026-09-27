import { NextResponse } from "next/server";
import { integrationStatus } from "@/lib/integrations";
import { ASSIST_ACTIONS, assistConfigured } from "@/lib/ai";

export const dynamic = "force-dynamic";

// Reports configuration state only: which env vars are present, never their values.
export function GET() {
  return NextResponse.json({ providers: integrationStatus(), assist: { configured: assistConfigured(), actions: ASSIST_ACTIONS } });
}
