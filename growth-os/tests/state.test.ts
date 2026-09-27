import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { applyOp, isStateOp, normaliseState } from "@/lib/state/reducer";
import { emptyState } from "@/lib/state/types";
import { FileStateStore } from "@/lib/state/store";

describe("state reducer", () => {
  it("sets and clears statuses", () => {
    let s = applyOp(emptyState(), { op: "setStatus", id: "2026-09-28:x:0", status: "DONE" });
    expect(s.status["2026-09-28:x:0"]).toBe("DONE");
    s = applyOp(s, { op: "setStatus", id: "2026-09-28:x:0", status: null });
    expect(s.status).toEqual({});
  });
  it("upserts tasks and metrics by id", () => {
    const task = { id: "T1", title: "a", description: "", due: null, campaign: "", channel: "", owner: "SC", priority: "P1", createdAt: "" };
    let s = applyOp(emptyState(), { op: "upsertTask", task });
    s = applyOp(s, { op: "upsertTask", task: { ...task, title: "b" } });
    expect(s.tasks).toHaveLength(1);
    expect(s.tasks[0].title).toBe("b");
    s = applyOp(s, { op: "addMetrics", values: [{ id: "K10:2026-10-05", metric: "K10", date: "2026-10-05", value: 170 }, { id: "K10:2026-10-05", metric: "K10", date: "2026-10-05", value: 175 }] });
    expect(s.metrics).toEqual([{ id: "K10:2026-10-05", metric: "K10", date: "2026-10-05", value: 175 }]);
  });
  it("removes empty fields", () => {
    let s = applyOp(emptyState(), { op: "setField", id: "C06", key: "notes", value: "x" });
    s = applyOp(s, { op: "setField", id: "C06", key: "notes", value: "" });
    expect(s.fields.C06).toEqual({});
  });
  it("normalises partial or foreign input", () => {
    expect(normaliseState({ status: { a: "DONE" } }).tasks).toEqual([]);
    expect(normaliseState("nonsense").settings.viewAs).toBe("ALL");
    expect(isStateOp({ op: "setStatus", id: "x", status: "DONE" })).toBe(true);
    expect(isStateOp({ op: "dropTables" })).toBe(false);
  });
});

describe("file store", () => {
  it("persists and serialises concurrent writes", async () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "gos-")), "state.json");
    const store = new FileStateStore(file);
    await Promise.all(Array.from({ length: 20 }, (_, i) => store.apply([{ op: "setStatus", id: `i${i}`, status: "DONE" }])));
    const s = await new FileStateStore(file).read();
    expect(Object.keys(s.status)).toHaveLength(20);
  });
});
