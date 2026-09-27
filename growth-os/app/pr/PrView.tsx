"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useGrowth } from "@/lib/state/client";
import { PR_STAGES } from "@/lib/status";
import { fmt } from "@/lib/dates";
import { Kanban } from "@/components/Kanban";
import { DataTable, Drawer, FilterBar, useFiltered, type Filter } from "@/components/DataView";
import { Chip, CopyBlock, OwnerChip, PageHeader, StatusSelect, Tabs } from "@/components/ui";
import { EditableField } from "@/components/Editable";
import { MarkdownClient } from "@/components/MarkdownClient";

type Pr = { id: string; spine: string; name: string; publishLabel: string; date: string | null; data: string; effort: string; tier: string; owner: string; card: string; pitch: string };

function splitPitch(md: string): { subject: string; body: string; followUp: string } {
  const subject = (md.match(/\*\*Subject:\*\*\s*(.+)/) || [])[1]?.trim() || "";
  const body = md.split("\n").filter((l) => l.startsWith(">")).map((l) => l.replace(/^>\s?/, "")).join("\n").trim();
  const followUp = (md.match(/\*\*Follow-up[^*]*\*\*:?\s*"?([\s\S]+?)"?\s*$/m) || [])[1]?.trim() || "";
  return { subject, body, followUp };
}

export function PrView({ rows }: { rows: Pr[] }) {
  const { state, dispatch } = useGrowth();
  const [tab, setTab] = useState<"board" | "table">("board");
  const focusId = useSearchParams().get("focus");
  const [open, setOpen] = useState<Pr | null>(() => rows.find((x) => x.id === focusId) ?? null);
  const stage = (r: Pr) => state.status[r.id] ?? "IDEA";
  const filters: Filter<Pr>[] = [
    { key: "stage", label: "Stage", value: stage, options: [...PR_STAGES] },
    { key: "tier", label: "Tier", value: (r) => r.tier },
    { key: "owner", label: "Owner", value: (r) => r.owner.split("/") },
    { key: "quarter", label: "When", value: (r) => (r.date && r.date < "2027-01-01" ? "Q4 2026" : "Q1 2027"), options: ["Q4 2026", "Q1 2027"] },
  ];
  const f = useFiltered(rows, filters, (r) => `${r.id} ${r.spine} ${r.name} ${r.card}`);
  const pitch = open ? splitPitch(open.pitch) : null;
  return (
    <div>
      <PageHeader title="Digital PR" sub="32 data-led campaigns from 22-DIGITAL-PR, from idea to coverage. Every number stays [N] until the publication-day query fills it." actions={<Tabs tabs={[{ id: "board", label: "Board" }, { id: "table", label: "Table" }]} value={tab} onChange={setTab} />} />
      <FilterBar filters={filters} state={f} total={rows.length} shown={f.rows.length} />
      {tab === "board" ? (
        <Kanban stages={PR_STAGES} onOpen={(id) => setOpen(rows.find((r) => r.id === id) || null)}
          cards={f.rows.map((r) => ({ id: r.id, defaultStage: "IDEA", title: `${r.id} · ${r.name}`, sub: <>{r.publishLabel} · {r.spine} · tier {r.tier}</>, meta: <OwnerChip owner={r.owner} /> }))} />
      ) : (
        <div className="panel panel-body">
          <DataTable rows={f.rows} rowKey={(r) => r.id} onRowClick={setOpen} exportName="pr" columns={[
            { key: "date", label: "Publish", render: (r) => <span className="mono small">{r.date ? fmt(r.date) : r.publishLabel}</span> },
            { key: "id", label: "ID", render: (r) => <span className="mono">{r.id}</span> },
            { key: "name", label: "Campaign", render: (r) => <span className="cell-title">{r.name}</span> },
            { key: "spine", label: "Spine" }, { key: "tier", label: "Tier" }, { key: "data", label: "Data", hideOnMobile: true },
            { key: "owner", label: "Owner" },
            { key: "stage", label: "Stage", value: stage, render: (r) => <span onClick={(e) => e.stopPropagation()}><StatusSelect value={stage(r)} options={PR_STAGES} onChange={(v) => dispatch({ op: "setStatus", id: r.id, status: v === "IDEA" ? null : v })} /></span> },
            { key: "links", label: "Backlinks", sortable: false, hideOnMobile: true, render: (r) => <span className="small">{(state.fields[r.id]?.backlinks || "").split("\n").filter(Boolean).length || "—"}</span> },
          ]} />
        </div>
      )}
      <Drawer wide open={Boolean(open)} onClose={() => setOpen(null)} title={open ? `${open.id} · ${open.name}` : ""}>
        {open && pitch && (
          <div className="stack">
            <div className="row">
              <StatusSelect value={stage(open)} options={PR_STAGES} onChange={(v) => dispatch({ op: "setStatus", id: open.id, status: v === "IDEA" ? null : v })} />
              <Chip>{open.publishLabel}</Chip><Chip>Tier {open.tier}</Chip><OwnerChip owner={open.owner} />
              {/^C\d{2}/.test(open.spine) && <Link className="chip chip-link" href={`/campaigns/${open.spine.slice(0, 3)}`}>{open.spine}</Link>}
            </div>
            {pitch.subject && <><h3>Pitch subject</h3><CopyBlock text={pitch.subject} /></>}
            {pitch.body && <><h3>Pitch email</h3><CopyBlock text={pitch.body} /></>}
            {pitch.followUp && <><h3>Follow-up</h3><CopyBlock text={pitch.followUp} /></>}
            {!open.pitch && <p className="muted small">No full pitch for this one (only the top 10 have one). Use the card and 22 §7 as the model.</p>}
            <div className="grid grid-2">
              <EditableField id={open.id} field="targets" label="Targets (outlet · journalist · status)" placeholder="GamesIndustry.biz — news desk — pitched 7 Oct" />
              <EditableField id={open.id} field="assets" label="Assets (chart, CSV, page URLs)" />
              <EditableField id={open.id} field="coverage" label="Coverage links (one per line)" />
              <EditableField id={open.id} field="backlinks" label="Backlinks (one per line)" />
            </div>
            <h3>Campaign card</h3>
            <MarkdownClient md={open.card} />
          </div>
        )}
      </Drawer>
    </div>
  );
}
