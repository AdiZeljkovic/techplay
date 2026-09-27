"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import { Download, RefreshCw, Upload } from "lucide-react";
import { useGrowth } from "@/lib/state/client";
import { normaliseState } from "@/lib/state/reducer";
import type { Meta } from "@/lib/types";
import { OWNERS, OWNER_NAMES } from "@/lib/status";
import { download } from "@/lib/csv";
import { Chip, PageHeader, Section } from "@/components/ui";
import { useToast } from "@/components/Toast";

const DATASETS = ["campaigns", "calendar-items", "calendar-days", "tasks", "experiments", "content", "copy", "kpis", "backlog"];

export function SettingsView({ meta, planDate, integrations, assist }: {
  meta: Meta; planDate: { date: string; real: string; overridden: boolean };
  integrations: { id: string; label: string; configured: boolean; env: string[] }[];
  assist: { configured: boolean; actions: { id: string; label: string; description: string }[] };
}) {
  const router = useRouter();
  const toast = useToast();
  const { state, dispatch, offline } = useGrowth();
  const [date, setDate] = useState(planDate.overridden ? planDate.date : "");
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "system");
  const [syncOut, setSyncOut] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const applyDate = (d: string) => {
    document.cookie = d ? `gos_date=${d}; path=/; max-age=${60 * 60 * 24 * 120}; samesite=lax` : "gos_date=; path=/; max-age=0";
    toast(d ? `Plan date set to ${d}` : "Using the real date");
    router.refresh();
  };
  const applyTheme = (t: string) => {
    try { if (t === "system") localStorage.removeItem("gos-theme"); else localStorage.setItem("gos-theme", t); } catch { /* ignore */ }
    if (t === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
    window.dispatchEvent(new Event("gos-theme"));
  };
  const sync = async () => {
    setBusy(true);
    const r = await fetch("/api/sync", { method: "POST" });
    const d = await r.json();
    setSyncOut(d.output);
    setBusy(false);
    toast(d.ok ? "Strategy data re-synced" : "Sync failed", d.ok ? "good" : "bad");
    if (d.ok) router.refresh();
  };
  const importState = async (file: File) => {
    try {
      const parsed = normaliseState(JSON.parse(await file.text()));
      if (!confirm(`Replace the working state with this file? (${Object.keys(parsed.status).length} statuses, ${parsed.tasks.length} tasks, ${parsed.metrics.length} KPI values)`)) return;
      dispatch({ op: "replace", state: parsed });
      toast("Working state imported");
    } catch {
      toast("That file is not a Growth OS state export", "bad");
    }
  };

  return (
    <div>
      <PageHeader title="Settings" sub="Plan date, theme, data sync, working-state backup and integration status." />
      <div className="grid grid-2">
        <Section title="Plan date">
          <p className="small">Today in Sarajevo is <b className="mono">{planDate.real}</b>. The plan runs 28 Sep – 31 Dec 2026. Override the date to rehearse a day or catch up on a missed one.</p>
          <div className="row">
            <input type="date" className="input" style={{ maxWidth: 180 }} min="2026-09-28" max="2026-12-31" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Override date" />
            <button className="btn btn-primary btn-sm" disabled={!date} onClick={() => applyDate(date)}>Use this date</button>
            <button className="btn btn-sm" onClick={() => { setDate(""); applyDate(""); }}>Use real date</button>
          </div>
          {planDate.overridden && <p className="small" style={{ marginTop: 8 }}><Chip tone="warn">Override active: {planDate.date}</Chip></p>}
        </Section>
        <Section title="You">
          <div className="form-grid">
            <label className="field"><span>Viewing as (filters Today, Overview, Calendar, Tasks)</span>
              <select className="select" value={state.settings.viewAs} onChange={(e) => dispatch({ op: "setSetting", key: "viewAs", value: e.target.value })}>
                <option value="ALL">Everyone</option>{OWNERS.map((o) => <option key={o} value={o}>{o} · {OWNER_NAMES[o]}</option>)}
              </select>
            </label>
            <label className="field"><span>Theme (this browser)</span>
              <select className="select" value={theme} onChange={(e) => applyTheme(e.target.value)}><option value="system">Follow system</option><option value="dark">Dark</option><option value="light">Light</option></select>
            </label>
          </div>
        </Section>
        <Section title="Strategy data">
          <dl className="kv" style={{ gridTemplateColumns: "130px 1fr" }}>
            <dt>Source</dt><dd className="mono small">{meta.docsDir}</dd>
            <dt>Last synced</dt><dd className="mono small">{meta.generatedAt.replace("T", " ").slice(0, 19)} UTC</dd>
            <dt>Plan range</dt><dd className="mono small">{meta.planStart} → {meta.planEnd}</dd>
            <dt>Contents</dt><dd className="small">{Object.entries(meta.counts).map(([k, v]) => `${v} ${k}`).join(" · ")}</dd>
          </dl>
          <p className="small muted">Edit the files in docs/techplay-growth (or regenerate the calendar with strategy/_generator), then re-sync. The UI reads whatever the sync produces.</p>
          <button className="btn btn-sm" onClick={sync} disabled={busy}><RefreshCw size={13} /> {busy ? "Syncing…" : "Re-sync from docs"}</button>
          {syncOut && <pre className="small mono" style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{syncOut}</pre>}
          <h3 style={{ marginTop: 14 }}>Download datasets</h3>
          <div className="row">{DATASETS.map((d) => <span key={d} className="row" style={{ gap: 2 }}><a className="btn btn-ghost btn-sm" href={`/api/export/${d}`}><Download size={12} /> {d}.csv</a><a className="btn btn-ghost btn-sm" href={`/api/export/${d}?format=json`}>json</a></span>)}</div>
        </Section>
        <Section title="Working state">
          <p className="small">Statuses, notes, custom tasks, KPI values, paid spend and pipeline records. {offline ? "The server store is unreachable, so this browser holds it." : "Stored on this machine in data/state/state.json (git-ignored)."}</p>
          <p className="small mono muted">{Object.keys(state.status).length} statuses · {Object.keys(state.fields).length} notes · {state.tasks.length} tasks · {state.metrics.length} KPI values · {state.paid.length} spend rows · {state.pipeline.length} contacts · last change {state.updatedAt.slice(0, 16).replace("T", " ")}</p>
          <div className="row">
            <button className="btn btn-sm" onClick={() => download(`growth-os-state-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(state, null, 2), "application/json")}><Download size={13} /> Export state (JSON)</button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && importState(e.target.files[0])} />
            <button className="btn btn-sm" onClick={() => fileRef.current?.click()}><Upload size={13} /> Import state</button>
            <button className="btn btn-sm" onClick={() => { if (confirm("Clear all statuses, notes, tasks and values? Export first if unsure.")) dispatch({ op: "replace", state: normaliseState(null) }); }}>Reset</button>
          </div>
        </Section>
        <Section title="Integrations">
          <ul className="list">{integrations.map((i) => <li key={i.id}><div className="list-main small">{i.label}<div className="mono muted">{i.env.join(", ")}</div></div>{i.configured ? <Chip tone="good">configured</Chip> : <Chip>not configured</Chip>}</li>)}</ul>
          <p className="small muted">Interfaces only (lib/integrations). Credentials go in .env.local on the machine that runs Growth OS, never in the repo.</p>
        </Section>
        <Section title="AI assist (optional)">
          <p className="small">{assist.configured ? "ANTHROPIC_API_KEY is set, but no assist action is implemented yet." : "Not configured. Everything in Growth OS works without it."}</p>
          <ul className="list">{assist.actions.map((a) => <li key={a.id}><div className="list-main small"><b>{a.label}</b><div className="muted">{a.description}</div></div><Chip>planned</Chip></li>)}</ul>
        </Section>
      </div>
    </div>
  );
}

function readTheme(): string {
  try { return localStorage.getItem("gos-theme") || "system"; } catch { return "system"; }
}
function subscribeTheme(cb: () => void) {
  window.addEventListener("gos-theme", cb);
  return () => window.removeEventListener("gos-theme", cb);
}
