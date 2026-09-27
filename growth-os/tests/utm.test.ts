import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildUtm, campaignSlug } from "@/lib/utm";

const base = { url: "https://techplay.gg/calendar", utm_source: "instagram", utm_medium: "organic-social", utm_campaign: "c04-out-this-week", utm_content: "f01-carousel-a" };

describe("UTM builder", () => {
  it("builds a valid link", () => {
    const r = buildUtm(base);
    expect(r.errors).toEqual([]);
    expect(r.url).toBe("https://techplay.gg/calendar?utm_source=instagram&utm_medium=organic-social&utm_campaign=c04-out-this-week&utm_content=f01-carousel-a");
  });
  it("normalises case and spaces", () => {
    expect(buildUtm({ ...base, utm_content: "F01 Carousel A" }).url).toContain("utm_content=f01-carousel-a");
  });
  it("rejects other hosts, bad campaigns and existing UTMs", () => {
    expect(buildUtm({ ...base, url: "https://example.com/" }).errors[0].field).toBe("url");
    expect(buildUtm({ ...base, utm_campaign: "c99-nope" }).errors.map((e) => e.field)).toContain("utm_campaign");
    expect(buildUtm({ ...base, url: "https://techplay.gg/?utm_source=x" }).errors[0].field).toBe("url");
  });
  it("applies cross-field rules", () => {
    expect(buildUtm({ ...base, utm_source: "facebook", utm_medium: "cpc" }).errors.map((e) => e.message).join(" ")).toMatch(/Google only/);
    expect(buildUtm({ ...base, utm_medium: "paid-social", utm_term: "us-18" , date: "2026-10-01" }).errors.map((e) => e.message).join(" ")).toMatch(/19 Oct/);
    expect(buildUtm({ ...base, utm_source: "creator-somebody", utm_medium: "organic-social" }).errors[0].field).toBe("utm_medium");
    expect(buildUtm({ ...base, utm_term: "gta6" }).errors[0].field).toBe("utm_term");
    expect(buildUtm({ ...base, utm_source: "reddit", utm_medium: "community", utm_term: "gta6" }).errors).toEqual([]);
  });
  it("accepts every worked example in 30-ANALYTICS §7.4", () => {
    const doc = fs.readFileSync(path.resolve(__dirname, "../../docs/techplay-growth/strategy/30-ANALYTICS.md"), "utf8");
    const urls = [...doc.matchAll(/`(https:\/\/techplay\.gg[^`]+utm_[^`]+)`/g)].map((m) => m[1]).filter((u) => !u.includes("{") && !u.includes("…"));
    expect(urls.length).toBeGreaterThan(20);
    const failures = urls.map((u) => {
      const x = new URL(u);
      const g = (k: string) => x.searchParams.get(k) ?? "";
      const clean = `${x.origin}${x.pathname}`;
      const r = buildUtm({ url: clean, utm_source: g("utm_source"), utm_medium: g("utm_medium"), utm_campaign: g("utm_campaign"), utm_content: g("utm_content"), utm_term: g("utm_term") || undefined, date: "2026-11-15" });
      return r.errors.length ? `${u} → ${r.errors.map((e) => e.message).join("; ")}` : null;
    }).filter(Boolean);
    expect(failures).toEqual([]);
  });
  it("suggests campaign slugs", () => {
    expect(campaignSlug("C06", "GTA 6 Countdown ('X days to Vice City', F02)")).toBe("c06-gta-6-countdown");
  });
});
