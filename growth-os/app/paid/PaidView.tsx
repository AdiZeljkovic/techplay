"use client";
import { useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { uid, useGrowth } from "@/lib/state/client";
import { CAMPAIGN_STATUSES } from "@/lib/status";
import type { PaidCampaign } from "@/lib/types";
import type { PaidEntry } from "@/lib/state/types";
import { download, parseCSV, toCSV } from "@/lib/csv";
import { fmt } from "@/lib/dates";
import { Drawer } from "@/components/DataView";
import { MarkdownClient } from "@/components/MarkdownClient";
import { Chip, CopyBlock, PageHeader, Section, StatusSelect, Tabs, cx } from "@/components/ui";
import { useToast } from "@/components/Toast";

const PLATFORMS = ["Meta", "Google", "YouTube", "TikTok", "Reddit"];
type Tab = "campaigns" | "budgets" | "gates" | "no";

function totals(entries: PaidEntry[]) {
  const t = entries.reduce((a, e) => ({ spend: a.spend + e.spend, imp: a.imp + e.impressions, clicks: a.clicks + e.clicks, reg: a.reg + e.registrations }), { spend: 0, imp: 0, clicks: 0, reg: 0 });
  return { ...t, ctr: t.imp ? (t.clicks / t.imp) * 100 : null, cpc: t.clicks ? t.spend / t.clicks : null, cpa: t.reg ? t.spend / t.reg : null };
}
const money = (n: number | null) => (n === null ? "—" : `$${n.toFixed(2)}`);

export function PaidView({ campaigns, parents, budgets, gates, notWorth }: { campaigns: PaidCampaign[]; parents: Record<string, { name: string; start: string; end: string; delivery: string }>; budgets: string; gates: string; notWorth: string }) {
  const { state, dispatch } = useGrowth();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("campaigns");
  const [platform, setPlatform] = useState("");
  const [open, setOpen] = useState<PaidCampaign | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const list = campaigns.filter((c) => !platform || c.platform === platform);
  const all = totals(state.paid);
  const status = (c: PaidCampaign) => state.status[`paid:${c.id}`] ?? "PLANNED";

  const importCsv = async (file: File) => {
    const rows = parseCSV(await file.text());
    const entries: PaidEntry[] = rows.filter((r) => r.campaign && r.date).map((r) => ({
      id: uid("PE"), campaign: r.campaign, date: r.date, spend: Number(r.spend) || 0, impressions: Number(r.impressions) || 0,
      clicks: Number(r.clicks) || 0, registrations: Number(r.registrations) || 0, note: r.note || "CSV import",
    }));
    entries.forEach((entry) => dispatch({ op: "addPaid", entry }));
    toast(`Imported ${entries.length} rows`, entries.length ? "good" : "bad");
  };

  return (
    <div>
      <PageHeader title="Paid media" sub="No spend before measurement works (D-007, D-008): Google branded from 2 Nov at the earliest, Reddit test 9–25 Nov, Meta out for 2026 unless EIC picks D-031 Option B. Enter spend by hand or import a CSV; APIs later."
        actions={<>
          <input ref={fileRef} type="file" accept=".csv" hidden onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])} />
          <button className="btn btn-sm" onClick={() => fileRef.current?.click()}><Upload size={13} /> Import CSV</button>
          <button className="btn btn-ghost btn-sm" onClick={() => download("paid-entries.csv", toCSV(state.paid, ["campaign", "date", "spend", "impressions", "clicks", "registrations", "note"]))}>Export entries</button>
          <button className="btn btn-ghost btn-sm" onClick={() => download("paid-template.csv", "campaign,date,spend,impressions,clicks,registrations,note\nC56a,2026-11-02,3.00,120,6,0,first day\n")}>CSV template</button>
        </>} />
      <div className="grid grid-4" style={{ marginBottom: 12 }}>
        {[["Spend to date", money(all.spend)], ["CTR", all.ctr === null ? "—" : `${all.ctr.toFixed(2)}%`], ["CPC", money(all.cpc)], ["Cost per registration", money(all.cpa)]].map(([l, v]) => (
          <div key={l} className="kpi"><span className="kpi-name">{l}</span><span className="kpi-value">{v}</span></div>
        ))}
      </div>
      <Tabs<Tab> tabs={[{ id: "campaigns", label: "Campaigns", count: campaigns.length }, { id: "budgets", label: "Budget plans" }, { id: "gates", label: "Launch gates" }, { id: "no", label: "Not worth running" }]} value={tab} onChange={setTab} />
      {tab === "campaigns" && (
        <>
          <div className="filterbar">
            <select className={cx("filter-select", platform && "is-set")} value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label="Platform"><option value="">Platform: all</option>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select>
            <span className="muted small filter-count">{list.length} campaigns</span>
          </div>
          <div className="cards">
            {list.map((c) => {
              const t = totals(state.paid.filter((e) => e.campaign === c.id));
              const parent = parents[c.id.slice(0, 3)];
              return (
                <div key={c.id} className="card" onClick={() => setOpen(c)} style={{ cursor: "pointer" }}>
                  <div className="row-between"><span className="row"><Chip tone="warn">{c.platform}</Chip><span className="mono small">{c.id}</span></span><span onClick={(e) => e.stopPropagation()}><StatusSelect value={status(c)} options={CAMPAIGN_STATUSES} onChange={(v) => dispatch({ op: "setStatus", id: `paid:${c.id}`, status: v === "PLANNED" ? null : v })} /></span></div>
                  <div className="card-title">{c.name}</div>
                  <div className="small muted clamp-2">{c.fields.Objective}</div>
                  <dl className="kv" style={{ gridTemplateColumns: "90px 1fr", margin: 0 }}>
                    <dt>Budget</dt><dd className="small">{c.budget || "—"}</dd>
                    <dt>Audience</dt><dd className="small clamp-2">{c.fields.Audience}</dd>
                    {parent && <><dt>Window</dt><dd className="small">{fmt(parent.start)} – {fmt(parent.end)}</dd></>}
                  </dl>
                  <div className="row small mono"><span>Spend {money(t.spend)}</span><span>CTR {t.ctr === null ? "—" : `${t.ctr.toFixed(1)}%`}</span><span>CPC {money(t.cpc)}</span><span>CPA {money(t.cpa)}</span><span>Reg {t.reg}</span></div>
                </div>
              );
            })}
          </div>
          <p className="muted small" style={{ marginTop: 10 }}>Campaign set-ups are parsed from 26-PAID-MEDIA §4. Sub-campaigns written in prose rather than a Field/Plan table (C57d–e) are in the doc only.</p>
        </>
      )}
      {tab === "budgets" && <Section title="LEAN / GROWTH / AGGRESSIVE"><MarkdownClient md={budgets} /></Section>}
      {tab === "gates" && <Section title="Launch gates"><MarkdownClient md={gates} /></Section>}
      {tab === "no" && <Section title="Not worth running"><MarkdownClient md={notWorth} /></Section>}
      <Drawer wide open={Boolean(open)} onClose={() => setOpen(null)} title={open ? `${open.id} · ${open.name}` : ""}>
        {open && <PaidDetail c={open} />}
      </Drawer>
    </div>
  );
}

function PaidDetail({ c }: { c: PaidCampaign }) {
  const { state, dispatch } = useGrowth();
  const entries = state.paid.filter((e) => e.campaign === c.id).sort((a, b) => a.date.localeCompare(b.date));
  const t = totals(entries);
  const [e, setE] = useState({ date: new Date().toISOString().slice(0, 10), spend: "", impressions: "", clicks: "", registrations: "", note: "" });
  const copyFields = Object.entries(c.fields).filter(([k]) => /Headline|Description|Primary text|Hook|Title/i.test(k));
  return (
    <div className="stack">
      <div className="grid grid-4">
        {[["Spend", money(t.spend)], ["CTR", t.ctr === null ? "—" : `${t.ctr.toFixed(2)}%`], ["CPC", money(t.cpc)], ["CPA (registration)", money(t.cpa)]].map(([l, v]) => <div key={l} className="kpi"><span className="kpi-name">{l}</span><span className="kpi-value" style={{ fontSize: 18 }}>{v}</span></div>)}
      </div>
      <Section title="Log a day">
        <form className="form-grid" onSubmit={(ev) => { ev.preventDefault(); dispatch({ op: "addPaid", entry: { id: uid("PE"), campaign: c.id, date: e.date, spend: Number(e.spend) || 0, impressions: Number(e.impressions) || 0, clicks: Number(e.clicks) || 0, registrations: Number(e.registrations) || 0, note: e.note } }); setE({ ...e, spend: "", impressions: "", clicks: "", registrations: "", note: "" }); }}>
          {(["date", "spend", "impressions", "clicks", "registrations", "note"] as const).map((k) => (
            <label key={k} className="field"><span>{k}</span><input className="input" type={k === "date" ? "date" : k === "note" ? "text" : "number"} step="any" min={k === "date" || k === "note" ? undefined : 0} value={e[k]} onChange={(x) => setE({ ...e, [k]: x.target.value })} required={k === "date"} /></label>
          ))}
          <div className="field"><span>&nbsp;</span><button className="btn btn-primary" type="submit">Add</button></div>
        </form>
        {entries.length > 0 && (
          <table className="table" style={{ marginTop: 10 }}>
            <thead><tr><th>Date</th><th>Spend</th><th>Impr.</th><th>Clicks</th><th>Reg.</th><th>Note</th><th /></tr></thead>
            <tbody>{entries.map((x) => <tr key={x.id}><td className="mono">{x.date}</td><td className="mono">{money(x.spend)}</td><td className="mono">{x.impressions}</td><td className="mono">{x.clicks}</td><td className="mono">{x.registrations}</td><td className="small">{x.note}</td><td><button className="btn btn-ghost btn-sm" onClick={() => dispatch({ op: "deletePaid", id: x.id })} aria-label="Delete"><Trash2 size={13} /></button></td></tr>)}</tbody>
          </table>
        )}
      </Section>
      {copyFields.length > 0 && <Section title="Ad copy">{copyFields.map(([k, v]) => <div key={k}><div className="small muted">{k}</div><CopyBlock text={v.replace(/ · /g, "\n")} /></div>)}</Section>}
      <Section title="Set-up (26-PAID-MEDIA)">
        <dl className="kv">{Object.entries(c.fields).map(([k, v]) => <FragmentKV key={k} k={k} v={v} />)}</dl>
      </Section>
    </div>
  );
}

function FragmentKV({ k, v }: { k: string; v: string }) {
  return <><dt>{k}</dt><dd>{v}</dd></>;
}
