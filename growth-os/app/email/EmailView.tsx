"use client";
import { Fragment, useState } from "react";
import { useGrowth } from "@/lib/state/client";
import { SEND_STATUSES } from "@/lib/status";
import { fmt } from "@/lib/dates";
import type { Section as Sec } from "@/lib/types";
import { DataTable, Drawer } from "@/components/DataView";
import { MarkdownClient } from "@/components/MarkdownClient";
import { CopyBlock, CopyButton, PageHeader, Section, StatusSelect, Tabs } from "@/components/ui";
import { EditableField } from "@/components/Editable";

type Send = { id: string; date: string | null; dateLabel: string; product: string; subject: string; preview: string };
type Row = Record<string, string>;
type Tab = "sends" | "lifecycle" | "editions" | "placements" | "products";

export function EmailView({ data, today }: { data: { sends: Send[]; products: Row[]; lifecycle: (Row & { body: string; title: string })[]; saveFileSections: Row[]; editions: Sec[]; placements: Sec[] }; today: string }) {
  const { state, dispatch } = useGrowth();
  const [tab, setTab] = useState<Tab>("sends");
  const [open, setOpen] = useState<Send | null>(null);
  const [past, setPast] = useState(false);
  const status = (s: Send) => state.status[s.id] ?? "DRAFT";
  const sends = data.sends.filter((s) => past || !s.date || s.date >= today);
  return (
    <div>
      <PageHeader title="Newsletter & email" sub="The Save File (Fri), Your releases this week (Mon), the GTA VI briefing, special editions, and lifecycle email. Sends are manual from the admin mail desk until D-013 ships." />
      <Tabs<Tab> tabs={[{ id: "sends", label: "Upcoming sends", count: sends.length }, { id: "lifecycle", label: "Lifecycle", count: data.lifecycle.length }, { id: "editions", label: "Full issues", count: data.editions.length }, { id: "placements", label: "Sign-up placements", count: data.placements.length }, { id: "products", label: "Products & structure" }]} value={tab} onChange={setTab} />
      {tab === "sends" && (
        <>
          <div className="filterbar"><label className="row small"><input type="checkbox" checked={past} onChange={(e) => setPast(e.target.checked)} /> Include past sends</label></div>
          <div className="panel panel-body">
            <DataTable rows={sends} rowKey={(s) => s.id} onRowClick={setOpen} exportName="email-sends" columns={[
              { key: "date", label: "Send", render: (s) => <span className="mono small">{s.date ? fmt(s.date) : s.dateLabel}</span> },
              { key: "product", label: "Product", render: (s) => <span className="small">{s.product}</span> },
              { key: "subject", label: "Subject", render: (s) => <div><div className="cell-title">{s.subject}</div><div className="cell-sub clamp-2">{s.preview}</div></div> },
              { key: "copy", label: "Copy", sortable: false, render: (s) => <span className="row" onClick={(e) => e.stopPropagation()}><CopyButton text={s.subject} label="Subject" small />{s.preview && <CopyButton text={s.preview} label="Preview" small />}</span> },
              { key: "status", label: "Status", value: status, render: (s) => <span onClick={(e) => e.stopPropagation()}><StatusSelect value={status(s)} options={SEND_STATUSES} onChange={(v) => dispatch({ op: "setStatus", id: s.id, status: v === "DRAFT" ? null : v })} /></span> },
            ]} />
          </div>
        </>
      )}
      {tab === "lifecycle" && (
        <div className="stack">
          {data.lifecycle.map((l) => (
            <details key={l.ID} className="panel panel-body details">
              <summary><b>{l.ID} {l.Sequence}</b> <span className="muted small">· {l["Trigger (event / job)"]} · {l.Live}</span></summary>
              <dl className="kv">{["Delay", "Frequency cap", "Exit conditions", "Requirement"].map((k) => l[k] ? <Fragment key={k}><dt>{k}</dt><dd>{l[k]}</dd></Fragment> : null)}</dl>
              {l.body && <><CopyBlock text={l.body} meta="Full sequence copy" /><MarkdownClient md={l.body} /></>}
            </details>
          ))}
        </div>
      )}
      {tab === "editions" && <div className="stack">{data.editions.map((e) => <Section key={e.title} title={e.title} actions={<CopyButton text={e.body} label="Copy issue" small />}><MarkdownClient md={e.body} /></Section>)}</div>}
      {tab === "placements" && <div className="cards">{data.placements.map((p) => <div key={p.id} className="card"><div className="card-title">{p.title}</div><MarkdownClient md={p.body} /></div>)}</div>}
      {tab === "products" && (
        <div className="stack">
          <Section title="Products"><DataTable rows={data.products} rowKey={(r) => r.ID} columns={Object.keys(data.products[0] || {}).map((k) => ({ key: k, label: k, render: (r: Row) => <span className="small">{r[k]}</span> }))} /></Section>
          <Section title="The Save File: section structure"><DataTable rows={data.saveFileSections} rowKey={(r) => r["#"]} columns={Object.keys(data.saveFileSections[0] || {}).map((k) => ({ key: k, label: k, render: (r: Row) => <span className="small">{r[k]}</span> }))} /></Section>
        </div>
      )}
      <Drawer open={Boolean(open)} onClose={() => setOpen(null)} title={open ? `${open.dateLabel} · ${open.product}` : ""}>
        {open && (
          <div className="stack">
            <StatusSelect value={status(open)} options={SEND_STATUSES} onChange={(v) => dispatch({ op: "setStatus", id: open.id, status: v === "DRAFT" ? null : v })} />
            <h3>Subject</h3><CopyBlock text={open.subject} />
            {open.preview && <><h3>Preview line (first visible line)</h3><CopyBlock text={open.preview} /></>}
            <EditableField id={open.id} field="sections" label="Sections / outline" placeholder="Out this week / 3 stories / deals / GTA countdown / one from the database" />
            <EditableField id={open.id} field="cta" label="Main CTA" multiline={false} />
            <EditableField id={open.id} field="audience" label="Audience / segment" multiline={false} placeholder="All verified subscribers" />
            <EditableField id={open.id} field="results" label="Results (sent, opens, clicks, unsubscribes, complaints)" />
          </div>
        )}
      </Drawer>
    </div>
  );
}
