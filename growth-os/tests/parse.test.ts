import { describe, expect, it } from "vitest";
import { extractTables, extractSections, isPlaceholder, parseCSV, parsePiece, splitRow, toISODate, ownersIn } from "../scripts/lib/parse.mjs";
import { extractQuotedCopy, normaliseCalendar } from "../scripts/lib/extract.mjs";

describe("markdown tables", () => {
  it("splits rows and keeps escaped pipes", () => {
    expect(splitRow("| a | PS5 and Xbox Series X\\|S | c |")).toEqual(["a", "PS5 and Xbox Series X|S", "c"]);
  });
  it("finds tables under their headings", () => {
    const md = "## 2. Things\n### 2.1 Sub\n\n| ID | Name |\n|---|---|\n| A1 | One |\n| A2 | Two |\n\ntext\n";
    const [t] = extractTables(md);
    expect(t.h2).toBe("2. Things");
    expect(t.h3).toBe("2.1 Sub");
    expect(t.rows).toEqual([{ ID: "A1", Name: "One" }, { ID: "A2", Name: "Two" }]);
  });
  it("captures the bold lead line before a table", () => {
    const md = "### 4.1 Google\n\n**C56a — Google branded exact (T1)**\n\n| Field | Plan |\n|---|---|\n| Budget | $3/day |\n";
    expect(extractTables(md)[0].lead).toBe("C56a — Google branded exact (T1)");
  });
  it("splits sections at a level", () => {
    const s = extractSections("## A\nx\n### A1\ny\n## B\nz\n", 2);
    expect(s.map((x: { title: string }) => x.title)).toEqual(["A", "B"]);
    expect(s[0].body).toContain("### A1");
  });
});

describe("calendar pieces", () => {
  it("separates instruction from «copy»", () => {
    const p = parsePiece("F02 09:00 CET (Date): «52 days. It's Rockstar's date. https://techplay.gg/gta6?utm_source=x» [gate: C12]");
    expect(p.copy).toEqual(["52 days. It's Rockstar's date. https://techplay.gg/gta6?utm_source=x"]);
    expect(p.instruction).not.toContain("«");
    expect(p.instruction).not.toContain("52 days");
    expect(p.franchises).toEqual(["F02"]);
    expect(p.links[0]).toMatch(/^https:\/\/techplay\.gg\/gta6/);
  });
  it("finds campaign, dev and owner references", () => {
    const p = parsePiece("C05 picks with D-039a fixed (EIC, ED)");
    expect(p.campaigns).toEqual(["C05"]);
    expect(p.devItems).toEqual(["D-039a"]);
    expect(ownersIn("DEV (W40) and SC; not EDIT")).toEqual(["SC", "DEV"]);
  });
  it("treats 'nothing today' cells as empty", () => {
    for (const t of ["No post", "None", "No send", "No pitch today", "Not live in 2026: C59", "Moderation queue under 24 h"]) expect(isPlaceholder(t)).toBe(true);
    expect(isPlaceholder("None: paid waits for D-007")).toBe(true);
    expect(isPlaceholder("F01 link post")).toBe(false);
  });
  it("normalises a calendar day into items", () => {
    const [d] = normaliseCalendar({ days: [{ Date: "2026-10-01", Day: "Thursday", Week: "2026w40", Theme: "t", "Primary objective": "o", Priority: "P0",
      Facebook: "C05 link post: «The Autumn Sale is on.» | No post", X: "No post", "Google Discover angle": "Headline for Discover: 'Hidden gem: Chants'; 1200px+ 16:9 image" }] });
    expect(d.items.map((i: { channel: string }) => i.channel)).toEqual(["discover", "facebook"]);
    expect(d.items[1].copy).toEqual(["The Autumn Sale is on."]);
    expect(d.items[0].copy).toEqual(["Hidden gem: Chants"]);
  });
});

describe("helpers", () => {
  it("parses dates in the docs' formats", () => {
    expect(toISODate("Wed 7 Oct")).toBe("2026-10-07");
    expect(toISODate("Tue 12 Jan")).toBe("2027-01-12");
    expect(toISODate("2026-11-19 — launch")).toBe("2026-11-19");
    expect(toISODate("date TBA")).toBeNull();
  });
  it("parses CSV with quotes, commas and newlines", () => {
    expect(parseCSV('a,b\n"x, y","line1\nline2"\n1,""\n')).toEqual([{ a: "x, y", b: "line1\nline2" }, { a: "1", b: "" }]);
  });
  it("extracts blockquoted copy with its label", () => {
    const q = extractQuotedCopy("## 3. X\n\n**X1 — Countdown. Mon 28 Sep, 12:00**\n> 52 days to Vice City.\n> That's the list.\n");
    expect(q[0]).toMatchObject({ h2: "3. X", label: "X1 — Countdown. Mon 28 Sep, 12:00", text: "52 days to Vice City.\nThat's the list." });
  });
});
