"use client";
import { useRef, useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { useGrowth } from "@/lib/state/client";
import type { Kpi } from "@/lib/types";
import { download, parseCSV, toCSV } from "@/lib/csv";
import { fmt } from "@/lib/dates";
import { Sparkline, fmtNum } from "@/components/Kpi";
import { Drawer } from "@/components/DataView";
import { Chip, PageHeader, Section, cx } from "@/components/ui";
import { useToast } from "@/components/Toast";

type Integration = { id: string; label: string; env: string[]; metrics: string[]; configured: boolean };
const CAT_ORDER = ["north-star", "traffic", "organic", "discover", "news", "direct", "social", "registration", "activation", "returning", "retention", "engagement", "newsletter", "discord", "community", "video", "paid", "product-loop", "guardrail", "measurement"];

export function AnalyticsView({ kpis, integrations }: { kpis: Kpi[]; integrations: Integration[] }) {
  const { state, dispatch } = useGrowth();
  const toast = useToast();
  const [open, setOpen] = useState<Kpi | null>(null);
  const [cat, setCat] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const cats = [...new Set(kpis.map((k) => k.category))].sort((a, b) => CAT_ORDER.indexOf(a) - CAT_ORDER.indexOf(b));
  const shown = kpis.filter((k) => !cat || k.category === cat);
  const valuesOf = (id: string) => state.metrics.filter((m) => m.metric === id).sort((a, b) => a.date.localeCompare(b.date));
  const ids = new Set(kpis.map((k) => k.id));

  const importCsv = async (file: File) => {
    const rows = parseCSV(await file.text());
    const values = rows.filter((r) => ids.has(r.metric) && r.date && r.value !== "" && !Number.isNaN(Number(r.value)))
      .map((r) => ({ id: `${r.metric}:${r.date}`, metric: r.metric, date: r.date, value: Number(r.value), note: r.note, source: r.source || "CSV import" }));
    dispatch({ op: "addMetrics", values });
    toast(`Imported ${values.length} of ${rows.length} rows${rows.length - values.length ? " (unknown metric ids or bad values skipped)" : ""}`, values.length ? "good" : "bad");
  };

  return (
    <div>
      <PageHeader title="Analytics" sub="KPI definitions, baselines and TARGETS from 30-ANALYTICS / kpis.json. Enter values by hand or import a CSV; one value per metric per date (re-entering replaces it)."
        actions={<>
          <input ref={fileRef} type="file" accept=".csv" hidden onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])} />
          <button className="btn btn-sm" onClick={() => fileRef.current?.click()}><Upload size={13} /> Import CSV</button>
          <button className="btn btn-ghost btn-sm" onClick={() => download("kpi-values.csv", toCSV(state.metrics, ["metric", "date", "value", "note", "source"]))}>Export values</button>
          <button className="btn btn-ghost btn-sm" onClick={() => download("kpi-template.csv", `metric,date,value,note,source\n${kpis.slice(0, 3).map((k) => `${k.id},2026-10-05,,,manual`).join("\n")}\n`)}>CSV template</button>
        </>} />
      <div className="filterbar">
        <select className={cx("filter-select", cat && "is-set")} value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category"><option value="">Category: all</option>{cats.map((c) => <option key={c}>{c}</option>)}</select>
        <span className="muted small filter-count">{shown.length} metrics · {state.metrics.length} values recorded</span>
      </div>
      <div className="kpis">
        {shown.map((k) => {
          const vals = valuesOf(k.id);
          const last = vals[vals.length - 1];
          const prev = vals[vals.length - 2];
          const nextT = Object.entries(k.targets).find(([d]) => !last || d >= last.date);
          return (
            <button key={k.id} className="kpi" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => setOpen(k)}>
              <span className="row-between"><span className="kpi-name">{k.name}</span><span className="mono small muted">{k.id}</span></span>
              <span className="kpi-value">{last ? fmtNum(last.value) : "—"}</span>
              <span className="small muted">{last ? `${fmt(last.date, { day: "numeric", month: "short" })}${prev ? ` · ${last.value >= prev.value ? "+" : ""}${fmtNum(last.value - prev.value)} vs previous` : ""}` : `Baseline: ${k.baseline.value}`}</span>
              <Sparkline values={vals} />
              {nextT && <span className="kpi-target">{nextT[1]} by {fmt(nextT[0], { day: "numeric", month: "short" })}</span>}
            </button>
          );
        })}
      </div>
      <Section title="Integrations" count={integrations.length}>
        <p className="small muted">Not implemented yet. A provider flips to "configured" when its environment variables are set on the server; values are never shown here. Until then every number is entered by hand or by CSV. See GROWTH-OS-README.</p>
        <table className="table">
          <thead><tr><th>Source</th><th>Status</th><th>Would fill</th><th>Environment variables</th></tr></thead>
          <tbody>{integrations.map((i) => <tr key={i.id}><td className="cell-title">{i.label}</td><td>{i.configured ? <Chip tone="good">configured</Chip> : <Chip>not configured</Chip>}</td><td className="mono small">{i.metrics.join(", ")}</td><td className="mono small">{i.env.join(", ")}</td></tr>)}</tbody>
        </table>
      </Section>
      <Drawer wide open={Boolean(open)} onClose={() => setOpen(null)} title={open ? `${open.id} · ${open.name}` : ""}>
        {open && <KpiDetail k={open} />}
      </Drawer>
    </div>
  );
}

function KpiDetail({ k }: { k: Kpi }) {
  const { state, dispatch } = useGrowth();
  const vals = state.metrics.filter((m) => m.metric === k.id).sort((a, b) => b.date.localeCompare(a.date));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  return (
    <div className="stack">
      <form className="form-grid" onSubmit={(e) => { e.preventDefault(); if (value === "" || Number.isNaN(Number(value))) return; dispatch({ op: "addMetric", value: { id: `${k.id}:${date}`, metric: k.id, date, value: Number(value), note, source: "manual" } }); setValue(""); setNote(""); }}>
        <label className="field"><span>Date</span><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
        <label className="field"><span>Value</span><input className="input" type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} required /></label>
        <label className="field"><span>Note</span><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="source / query used" /></label>
        <div className="field"><span>&nbsp;</span><button className="btn btn-primary" type="submit"><Plus size={13} /> Record</button></div>
      </form>
      <Sparkline values={vals} />
      {vals.length > 0 && (
        <table className="table">
          <thead><tr><th>Date</th><th>Value</th><th>Note</th><th /></tr></thead>
          <tbody>{vals.map((v) => <tr key={v.id}><td className="mono">{v.date}</td><td className="mono">{fmtNum(v.value)}</td><td className="small">{v.note} <span className="muted">{v.source}</span></td><td><button className="btn btn-ghost btn-sm" aria-label="Delete value" onClick={() => dispatch({ op: "deleteMetric", id: v.id })}><Trash2 size={13} /></button></td></tr>)}</tbody>
        </table>
      )}
      <dl className="kv">
        <dt>Definition</dt><dd>{k.definition}</dd>
        <dt>Formula</dt><dd className="small">{k.formula}</dd>
        <dt>Source</dt><dd>{k.source}</dd>
        <dt>Baseline</dt><dd>{k.baseline.value} <span className="muted">({k.baseline.date}{k.baseline.note ? `; ${k.baseline.note}` : ""})</span></dd>
        {Object.entries(k.targets).map(([d, t]) => <TargetRow key={d} d={d} t={t} />)}
        <dt>Owner · cadence</dt><dd>{k.owner} · {k.cadence}</dd>
        {k.events.length > 0 && <><dt>Events</dt><dd className="mono small">{k.events.join(", ")}</dd></>}
      </dl>
    </div>
  );
}

function TargetRow({ d, t }: { d: string; t: string }) {
  return <><dt>By {fmt(d, { day: "numeric", month: "short" })}</dt><dd>{t}</dd></>;
}
