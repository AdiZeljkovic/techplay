"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { uid, useGrowth } from "@/lib/state/client";
import { PIPELINE_STAGES } from "@/lib/status";
import { fmt } from "@/lib/dates";
import type { Section as Sec } from "@/lib/types";
import type { PipelineRecord } from "@/lib/state/types";
import { Kanban } from "@/components/Kanban";
import { Drawer } from "@/components/DataView";
import { Chip, CopyBlock, PageHeader, Section, StatusSelect, Tabs, cx } from "@/components/ui";
import { EditableField } from "@/components/Editable";
import { MarkdownClient } from "@/components/MarkdownClient";

type Seed = { id: string; name: string; kind: string; template: string };
type Row = { id: string; name: string; kind: string; template: string; custom: boolean };

function templateParts(md: string): { label: string; text: string }[] {
  const out: { label: string; text: string }[] = [];
  const lines = md.split("\n");
  let label = "Message";
  let buf: string[] = [];
  const flush = () => { if (buf.length) { out.push({ label, text: buf.join("\n").trim() }); buf = []; } };
  for (const l of lines) {
    if (l.startsWith(">")) buf.push(l.replace(/^>\s?/, ""));
    else { flush(); const t = l.trim(); if (t) label = t.replace(/\*\*/g, "").replace(/:$/, "").slice(0, 90); }
  }
  flush();
  return out;
}

export function PartnersView({ seeds, templates, types }: { seeds: Seed[]; templates: Record<string, { title: string; body: string }>; types: Sec[] }) {
  const { state, dispatch } = useGrowth();
  const [tab, setTab] = useState<"board" | "types">("board");
  const [kind, setKind] = useState("");
  const [open, setOpen] = useState<Row | null>(null);
  const [adding, setAdding] = useState(false);
  const rows: Row[] = [
    ...state.pipeline.map((p) => ({ id: p.id, name: p.name, kind: p.kind, template: p.template, custom: true })),
    ...seeds.map((s) => ({ ...s, custom: false })),
  ].filter((r) => !kind || r.kind === kind);
  const tpl = open ? templates[open.template] : null;
  return (
    <div>
      <PageHeader title="Partnerships & creators" sub="A light pipeline, not a CRM. Seeded with every outreach in 23-CREATORS and 24-PARTNERSHIPS; add real contacts as they happen." actions={<button className="btn btn-primary" onClick={() => setAdding(true)}><Plus size={14} /> Add contact</button>} />
      <Tabs tabs={[{ id: "board", label: "Pipeline" }, { id: "types", label: "Partner types", count: types.length }]} value={tab} onChange={setTab} />
      {tab === "board" && (
        <>
          <div className="filterbar">
            <select className={cx("filter-select", kind && "is-set")} value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Kind"><option value="">Kind: all</option><option value="partner">Partners</option><option value="creator">Creators</option></select>
            <span className="muted small filter-count">{rows.length}</span>
          </div>
          <Kanban stages={PIPELINE_STAGES} onOpen={(id) => setOpen(rows.find((r) => r.id === id) || null)}
            cards={rows.map((r) => ({ id: r.id, defaultStage: "TARGET", title: r.name, sub: <>{r.kind === "creator" ? "Creator" : "Partner"}{state.fields[r.id]?.due ? ` · next ${fmt(state.fields[r.id].due)}` : ""}</>, meta: r.template ? <span className="mono muted">{r.template}</span> : null }))} />
        </>
      )}
      {tab === "types" && <div className="stack">{types.map((t) => <Section key={t.title} title={t.title}><MarkdownClient md={t.body} /></Section>)}</div>}
      <Drawer wide open={Boolean(open)} onClose={() => setOpen(null)} title={open?.name ?? ""}>
        {open && (
          <div className="stack">
            <div className="row">
              <StatusSelect value={state.status[open.id] ?? "TARGET"} options={PIPELINE_STAGES} onChange={(v) => dispatch({ op: "setStatus", id: open.id, status: v === "TARGET" ? null : v })} />
              <Chip>{open.kind}</Chip>
              {open.custom && <button className="btn btn-ghost btn-sm" onClick={() => { dispatch({ op: "deletePipeline", id: open.id }); setOpen(null); }}><Trash2 size={13} /> Remove</button>}
            </div>
            <div className="grid grid-2">
              <EditableField id={open.id} field="contact" label="Contact (name, email/handle)" multiline={false} />
              <EditableField id={open.id} field="due" label="Next step date (YYYY-MM-DD)" multiline={false} placeholder="2026-10-05" />
              <EditableField id={open.id} field="next" label="Next step" multiline={false} />
              <EditableField id={open.id} field="outcome" label="Outcome / terms" multiline={false} />
            </div>
            <EditableField id={open.id} field="notes" label="Notes and replies" />
            {tpl && (
              <>
                <h3>Template: {tpl.title}</h3>
                {templateParts(tpl.body).map((p, i) => <div key={i}><div className="small muted">{p.label}</div><CopyBlock text={p.text} /></div>)}
                <details className="details"><summary>Full template notes</summary><MarkdownClient md={tpl.body} /></details>
              </>
            )}
          </div>
        )}
      </Drawer>
      <Drawer open={adding} onClose={() => setAdding(false)} title="Add contact">
        <AddForm templates={templates} onSave={(r) => { dispatch({ op: "upsertPipeline", record: r }); setAdding(false); }} />
      </Drawer>
    </div>
  );
}

function AddForm({ templates, onSave }: { templates: Record<string, { title: string }>; onSave: (r: PipelineRecord) => void }) {
  const [r, setR] = useState<PipelineRecord>({ id: uid("PL"), name: "", kind: "partner", contact: "", stage: "TARGET", nextStep: "", due: null, template: "", notes: "", createdAt: new Date().toISOString() });
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); if (r.name.trim()) onSave(r); }}>
      <label className="field"><span>Name (organisation or creator)</span><input className="input" required autoFocus value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} /></label>
      <div className="form-grid">
        <label className="field"><span>Kind</span><select className="select" value={r.kind} onChange={(e) => setR({ ...r, kind: e.target.value as PipelineRecord["kind"] })}><option value="partner">Partner</option><option value="creator">Creator</option></select></label>
        <label className="field"><span>Template</span><select className="select" value={r.template} onChange={(e) => setR({ ...r, template: e.target.value })}><option value="">None</option>{Object.entries(templates).map(([id, t]) => <option key={id} value={id}>{id} · {t.title.slice(0, 50)}</option>)}</select></label>
      </div>
      <button className="btn btn-primary" type="submit">Add to pipeline</button>
    </form>
  );
}
