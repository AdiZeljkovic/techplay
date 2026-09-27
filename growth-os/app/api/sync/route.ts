import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import path from "node:path";

export const dynamic = "force-dynamic";

// Re-reads docs/techplay-growth into data/generated. Local use only: the
// sync writes files, which a production deploy should do at build time instead.
export async function POST() {
  if (process.env.NODE_ENV === "production" && process.env.GROWTH_OS_ALLOW_SYNC !== "1") {
    return NextResponse.json({ ok: false, output: "Sync is disabled in production mode; run `npm run sync-data` and rebuild." }, { status: 403 });
  }
  const script = path.join(process.cwd(), "scripts", "sync-data.mjs");
  const output = await new Promise<{ ok: boolean; text: string }>((resolve) => {
    execFile(process.execPath, [script], { cwd: process.cwd(), timeout: 60000 }, (err, stdout, stderr) => resolve({ ok: !err, text: `${stdout}${stderr}` }));
  });
  return NextResponse.json({ ok: output.ok, output: output.text }, { status: output.ok ? 200 : 500 });
}
