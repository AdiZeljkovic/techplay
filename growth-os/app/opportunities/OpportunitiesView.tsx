"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useGrowth } from "@/lib/state/client";
import { CONTENT_STATUSES, PRIORITIES } from "@/lib/status";
import type { KeyDate, Opportunity } from "@/lib/types";
import { fmt } from "@/lib/dates";
import { DataTable, Drawer, FilterBar, useFiltered, type Column, type Filter } from "@/components/DataView";
import { Chip, ExtLink, PageHeader, PriorityChip, StatusSelect, Tabs } from "@/components/ui";
import { EditableField } from "@/components/Editable";

const DIMS = ["traffic", "growth", "competition", "fit", "seo", "social", "registration", "retention", "backlink", "revenue", "difficulty", "time"];

export function OpportunitiesView({ items, keyDates, today }: { items: Opportunity[]; keyDates: KeyDate[]; today: string }) {
  const { state, dispatch } = useGrowth();
  const sp = useSearchParams();
  const focusId = sp.get("focus");
  const [tab, setTab] = useState<"scored" | "dates">(() => (sp.get("tab") === "dates" || keyDates.some((k) => k.id === focusId) ? "dates" : "scored"));
  const [open, setOpen] = useState<Opportunity | null>(() => items.find((x) => x.id === focusId) ?? null);
  const [openDate, setOpenDate] = useState<KeyDate | null>(() => keyDates.find((x) => x.id === focusId) ?? null);
  const status = (id: string) => state.status[id] ?? "IDEA";
  const filters: Filter<Opportunity>[] = [
    { key: "type", label: "Type", value: (r) => r.type },
    { key: "priority", label: "Priority", value: (r) => r.priority, options: [...PRIORITIES] },
    { key: "status", label: "Status", value: (r) => status(r.id), options: [...CONTENT_STATUSES] },
  ];
  const f = useFiltered(items, filters, (r) => `${r.id} ${r.title} ${r.note}`);
  const [showPast, setShowPast] = useState(false);
  const dFilters: Filter<KeyDate>[] = [
    { key: "type", label: "Type", value: (r) => r.type },
    { key: "interest", label: "Interest", value: (r) => `${r.expected_interest_1to5}/5`, options: ["5/5", "4/5", "3/5", "2/5"] },
    { key: "confidence", label: "Confidence", value: (r) => r.confidence },
  ];
  const df = useFiltered(keyDates, dFilters, (r) => `${r.event} ${r.game_or_company}`);
  const cols: Column<Opportunity>[] = [
    { key: "rank", label: "#", value: (r) => r.rank, render: (r) => <span className="mono small">{r.rank}</span> },
    { key: "priority", label: "Pri", render: (r) => <PriorityChip p={r.priority} /> },
    { key: "title", label: "Opportunity", render: (r) => <div><div className="cell-title">{r.title}</div><div className="cell-sub clamp-2">{r.note}</div></div> },
    { key: "type", label: "Type", render: (r) => <Chip>{r.type}</Chip> },
    { key: "total", label: "Score", value: (r) => r.total, render: (r) => <span className="mono">{r.total}</span> },
    { key: "status", label: "Status", value: (r) => status(r.id), render: (r) => <span onClick={(e) => e.stopPropagation()}><StatusSelect value={status(r.id)} options={CONTENT_STATUSES} onChange={(v) => dispatch({ op: "setStatus", id: r.id, status: v === "IDEA" ? null : v })} /></span> },
  ];
  const dates = df.rows.filter((k) => showPast || !k.date || k.date >= today).sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  return (
    <div>
      <PageHeader title="Opportunities" sub="The 291 scored opportunities from the research matrix, and 66 dated industry moments with what to publish before, during and after." />
      <Tabs tabs={[{ id: "scored", label: "Scored opportunities", count: items.length }, { id: "dates", label: "Key dates", count: keyDates.length }]} value={tab} onChange={setTab} />
      {tab === "scored" && <><FilterBar filters={filters} state={f} total={items.length} shown={f.rows.length} /><div className="panel panel-body"><DataTable rows={f.rows} columns={cols} rowKey={(r) => r.id} onRowClick={setOpen} exportName="opportunities" initialSort={{ key: "rank", dir: 1 }} /></div></>}
      {tab === "dates" && (
        <>
          <FilterBar filters={dFilters} state={df} total={keyDates.length} shown={dates.length} extra={<label className="row small"><input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} /> Include past</label>} />
          <div className="panel panel-body">
            <DataTable rows={dates} rowKey={(r) => r.id} onRowClick={setOpenDate} exportName="key-dates" columns={[
              { key: "date", label: "Date", value: (r) => r.date || r.date_or_window, render: (r) => <span className="mono small">{r.date ? fmt(r.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : r.date_or_window}</span> },
              { key: "event", label: "Moment", render: (r) => <div><div className="cell-title">{r.event}</div><div className="cell-sub">{r.game_or_company}</div></div> },
              { key: "type", label: "Type", render: (r) => <Chip>{r.type}</Chip> },
              { key: "interest", label: "Interest", value: (r) => Number(r.expected_interest_1to5), render: (r) => <span className="mono">{r.expected_interest_1to5}/5</span> },
              { key: "confidence", label: "Confidence", hideOnMobile: true, render: (r) => <span className="small">{r.confidence}</span> },
              { key: "before", label: "Publish before", hideOnMobile: true, render: (r) => <span className="small clamp-2">{r.publish_before}</span> },
            ]} />
          </div>
        </>
      )}
      <Drawer open={Boolean(open)} onClose={() => setOpen(null)} title={open?.title ?? ""}>
        {open && (
          <div className="stack">
            <div className="row"><StatusSelect value={status(open.id)} options={CONTENT_STATUSES} onChange={(v) => dispatch({ op: "setStatus", id: open.id, status: v === "IDEA" ? null : v })} /><PriorityChip p={open.priority} /><Chip>{open.type}</Chip><span className="mono small">rank {open.rank} · score {open.total}</span></div>
            <p>{open.note}</p>
            <table className="table"><tbody>{DIMS.filter((d) => open[d] !== undefined).map((d) => <tr key={d}><td>{d}</td><td className="mono">{String(open[d])}/5</td></tr>)}</tbody></table>
            <p className="small muted">Source: research file {open.source_file}. Scale in 21-MASTER-OPPORTUNITY-MATRIX.</p>
            <EditableField id={open.id} field="notes" label="Decision / notes" />
          </div>
        )}
      </Drawer>
      <Drawer open={Boolean(openDate)} onClose={() => setOpenDate(null)} title={openDate?.event ?? ""}>
        {openDate && (
          <dl className="kv">
            <dt>When</dt><dd>{openDate.date_or_window}</dd>
            <dt>Who</dt><dd>{openDate.game_or_company}</dd>
            <dt>Type</dt><dd>{openDate.type} · interest {openDate.expected_interest_1to5}/5</dd>
            <dt>Confidence</dt><dd>{openDate.confidence}</dd>
            <dt>Prepare before</dt><dd>{openDate.prepare_before}</dd>
            <dt>Publish before</dt><dd>{openDate.publish_before}</dd>
            <dt>Publish during</dt><dd>{openDate.publish_during}</dd>
            <dt>Publish after</dt><dd>{openDate.publish_after}</dd>
            <dt>Source</dt><dd><ExtLink href={openDate.source_url} /></dd>
          </dl>
        )}
      </Drawer>
    </div>
  );
}
