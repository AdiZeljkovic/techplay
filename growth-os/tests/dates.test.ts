import { describe, expect, it } from "vitest";
import { addDays, fmt, isoWeek, mondayOf, resolvePlanDate } from "@/lib/dates";

describe("dates", () => {
  it("clamps to the plan", () => {
    expect(resolvePlanDate(null, new Date("2026-09-27T10:00:00Z"))).toMatchObject({ date: "2026-09-28", clamped: "before" });
    expect(resolvePlanDate(null, new Date("2027-01-03T10:00:00Z"))).toMatchObject({ date: "2026-12-31", clamped: "after" });
    expect(resolvePlanDate("2026-11-19", new Date("2026-09-27T10:00:00Z"))).toMatchObject({ date: "2026-11-19", overridden: true, clamped: null });
    expect(resolvePlanDate("garbage", new Date("2026-10-10T10:00:00Z"))).toMatchObject({ date: "2026-10-10", overridden: false });
  });
  it("uses Sarajevo time at midnight", () => {
    expect(resolvePlanDate(null, new Date("2026-10-04T22:30:00Z")).date).toBe("2026-10-05");
  });
  it("formats deterministically", () => {
    expect(fmt("2026-11-19")).toBe("Thu 19 Nov");
    expect(fmt("2026-11-19", { weekday: "long", day: "numeric", month: "long", year: "numeric" })).toBe("Thursday 19 November 2026");
    expect(fmt(null)).toBe("—");
  });
  it("does week arithmetic", () => {
    expect(mondayOf("2026-10-04")).toBe("2026-09-28");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(isoWeek("2026-09-28")).toBe(40);
    expect(isoWeek("2026-12-31")).toBe(53);
  });
});
