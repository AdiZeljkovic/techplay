"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useGrowth } from "@/lib/state/client";
import { CONTENT_STATUSES, PRIORITIES } from "@/lib/status";
import type { ContentItem } from "@/lib/types";
import { DataTable, Drawer, FilterBar, useFiltered, type Column, type Filter } from "@/components/DataView";
import { Chip, CopyButton, PageHeader, PriorityChip, StatusSelect, Tabs } from "@/components/ui";
import { EditableField } from "@/components/Editable";

const KIND: Record<string, string> = { evergreen: "Evergreen", search: "Search", "game-hub": "Game hub", trend: "Trend / news", social: "Social" };

export function ContentView({ rows }: { rows: ContentItem[] }) {
  const { state, dispatch } = useGrowth();
  const focusId = useSearchParams().get("focus");
  const [open, setOpen] = useState<ContentItem | null>(() => rows.find((x) => x.id === focusId) ?? null);
  const [kind, setKind] = useState("all");
  const status = (r: ContentItem) => state.status[r.id] ?? "IDEA";
  const setStatus = (r: ContentItem, v: string) => dispatch({ op: "setStatus", id: r.id, status: v === "IDEA" ? null : v });
  const base = kind === "all" ? rows : rows.filter((r) => r.kind === kind);
  const filters: Filter<ContentItem>[] = [
    { key: "status", label: "Status", value: status, options: [...CONTENT_STATUSES] },
    { key: "priority", label: "Priority", value: (r) => r.priority, options: [...PRIORITIES] },
    { key: "topic", label: "Topic", value: (r) => r.topic },
    { key: "game", label: "Game", value: (r) => (r.game || "").split(/[,(]/)[0].trim() },
    { key: "platform", label: "Platform", value: (r) => (r.platform || "").split(/,\s*/).map((p) => p.replace(/\(.*$/, "").trim()).filter(Boolean) },
    { key: "format", label: "Format", value: (r) => (r.format || "").split(/[;+]/)[0].trim() },
    { key: "intent", label: "Intent", value: (r) => r.intent },
  ];
  const f = useFiltered(base, filters, (r) => `${r.id} ${r.title} ${r.query} ${r.secondary ?? ""} ${r.note ?? ""}`);
  const columns: Column<ContentItem>[] = [
    { key: "priority", label: "Pri", render: (r) => <PriorityChip p={r.priority} /> },
    { key: "title", label: "Opportunity", render: (r) => <div><div className="cell-title">{r.title}</div>{r.query && <div className="cell-sub mono">“{r.query}”</div>}</div> },
    { key: "kind", label: "Type", render: (r) => <Chip>{KIND[r.kind] || r.kind}</Chip> },
    { key: "topic", label: "Topic", hideOnMobile: true },
    { key: "intent", label: "Intent", hideOnMobile: true },
    { key: "format", label: "Format", hideOnMobile: true, render: (r) => <span className="small clamp-2">{r.format}</span> },
    { key: "score", label: "Score", value: (r) => r.score, render: (r) => <span className="mono small">{r.score || "—"}</span>, hideOnMobile: true },
    { key: "status", label: "Status", value: status, render: (r) => <span onClick={(e) => e.stopPropagation()}><StatusSelect value={status(r)} options={CONTENT_STATUSES} onChange={(v) => setStatus(r, v)} /></span> },
  ];
  const tabs = [{ id: "all", label: "All", count: rows.length }, ...Object.entries(KIND).map(([k, l]) => ({ id: k, label: l, count: rows.filter((r) => r.kind === k).length }))];
  return (
    <div>
      <PageHeader title="Content" sub="Content opportunities from research and strategy: evergreen topics, the search query map, game hubs, dated industry moments and social franchises." />
      <Tabs tabs={tabs} value={kind} onChange={setKind} />
      <FilterBar filters={filters} state={f} total={base.length} shown={f.rows.length} />
      <div className="panel panel-body"><DataTable rows={f.rows} columns={columns} rowKey={(r) => r.id} onRowClick={setOpen} exportName="content" /></div>
      <Drawer open={Boolean(open)} onClose={() => setOpen(null)} title={open?.title ?? ""}>
        {open && (
          <div className="stack">
            <div className="row"><StatusSelect value={status(open)} options={CONTENT_STATUSES} onChange={(v) => setStatus(open, v)} /><PriorityChip p={open.priority} /><Chip>{KIND[open.kind] || open.kind}</Chip><span className="mono small muted">{open.id}</span></div>
            {open.query && <div className="row"><span className="mono">“{open.query}”</span><CopyButton text={open.query} label="Query" small /></div>}
            <dl className="kv">
              {open.secondary && <><dt>Related queries</dt><dd>{open.secondary}</dd></>}
              <dt>Intent</dt><dd>{open.intent}</dd>
              {open.audience && <><dt>Audience</dt><dd>{open.audience}</dd></>}
              {open.game && <><dt>Game / platform</dt><dd>{open.game}</dd></>}
              <dt>Topic</dt><dd>{open.topic}</dd>
              <dt>Format</dt><dd>{open.format}</dd>
              {open.window && <><dt>Window</dt><dd>{open.window}</dd></>}
              {open.competition && <><dt>Competition</dt><dd>{open.competition}</dd></>}
              {open.freshness && <><dt>Freshness</dt><dd>{open.freshness}</dd></>}
              {open.lifespan && <><dt>Lifespan</dt><dd>{open.lifespan}</dd></>}
              {open.conversion && <><dt>Conversion</dt><dd>{open.conversion}</dd></>}
              {open.note && <><dt>Notes / evidence</dt><dd style={{ whiteSpace: "pre-wrap" }}>{open.note}</dd></>}
              <dt>Source</dt><dd className="mono small">{open.source}</dd>
            </dl>
            <EditableField id={open.id} field="url" label="Published URL" multiline={false} placeholder="https://techplay.gg/…" />
            <EditableField id={open.id} field="notes" label="Notes" />
          </div>
        )}
      </Drawer>
    </div>
  );
}
