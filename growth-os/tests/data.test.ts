import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { CalendarDay, Campaign, CopyEntry } from "@/lib/types";

const dir = path.resolve(__dirname, "../data/generated");
const load = <T,>(n: string): T => JSON.parse(fs.readFileSync(path.join(dir, `${n}.json`), "utf8"));
const ready = fs.existsSync(path.join(dir, "calendar.json"));

describe.skipIf(!ready)("synced strategy data", () => {
  it("has every plan date exactly once", () => {
    const days = load<CalendarDay[]>("calendar");
    expect(days).toHaveLength(95);
    expect(days[0].date).toBe("2026-09-28");
    expect(days[94].date).toBe("2026-12-31");
    expect(new Set(days.map((d) => d.date)).size).toBe(95);
    for (const d of days) expect(d.items.length).toBeGreaterThan(5);
  });
  it("never leaks copy markers into instructions, and copy is never empty", () => {
    for (const d of load<CalendarDay[]>("calendar")) for (const i of d.items) {
      expect(i.instruction).not.toMatch(/[«»]/);
      for (const c of i.copy) expect(c.trim().length).toBeGreaterThan(3);
    }
  });
  it("carries all 71 campaigns with dates", () => {
    const c = load<Campaign[]>("campaigns");
    expect(c).toHaveLength(71);
    for (const x of c) expect(x.start).toMatch(/^2026-\d\d-\d\d$/);
  });
  it("builds a copy library with text for every entry", () => {
    const copy = load<CopyEntry[]>("copy");
    expect(copy.length).toBeGreaterThan(1000);
    expect(copy.every((c) => c.text.trim().length > 0)).toBe(true);
    expect(new Set(copy.map((c) => c.id)).size).toBe(copy.length);
  });
  it("never puts a dead Discord invite in public copy", () => {
    const copy = load<CopyEntry[]>("copy").filter((c) => /discord\.gg\//.test(c.text));
    const dead = copy.filter((c) => /discord\.gg\/techplay(gg)?\b/.test(c.text) && !/replace|dead|D-004/i.test(`${c.label} ${c.text}`));
    expect(dead.map((c) => c.id)).toEqual([]);
  });
});
