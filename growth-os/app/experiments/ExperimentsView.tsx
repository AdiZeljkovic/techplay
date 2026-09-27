"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useGrowth } from "@/lib/state/client";
import { EXPERIMENT_STATUSES, PRIORITIES } from "@/lib/status";
import type { Experiment } from "@/lib/types";
import { DataTable, Drawer, FilterBar, useFiltered, type Column, type Filter } from "@/components/DataView";
import { Chip, PageHeader, PriorityChip, StatusSelect } from "@/components/ui";
import { EditableField } from "@/components/Editable";

export function ExperimentsView({ rows }: { rows: Experiment[] }) {
  const { state, dispatch } = useGrowth();
  const focusId = useSearchParams().get("focus");
  const [open, setOpen] = useState<Experiment | null>(() => rows.find((x) => x.id === focusId) ?? null);
  const status = (r: Experiment) => state.status[r.id] ?? "BACKLOG";
  const fld = (r: Experiment, k: string) => state.fields[r.id]?.[k] ?? "";
  const filters: Filter<Experiment>[] = [
    { key: "status", label: "Status", value: status, options: [...EXPERIMENT_STATUSES] },
    { key: "area", label: "Area", value: (r) => r.area },
    { key: "priority", label: "Priority", value: (r) => r.priority, options: [...PRIORITIES] },
    { key: "effort", label: "Effort", value: (r) => r.effort, options: ["S", "M", "L"] },
    { key: "design", label: "Design", value: (r) => r.design || "" },
  ];
  const f = useFiltered(rows, filters, (r) => `${r.id} ${r.name} ${r.hypothesis} ${r.change} ${r.metric}`);
  const cols: Column<Experiment>[] = [
    { key: "id", label: "ID", render: (r) => <span className="mono small">{r.id}</span> },
    { key: "priority", label: "Pri", render: (r) => <PriorityChip p={r.priority} /> },
    { key: "name", label: "Experiment", render: (r) => <div><div className="cell-title">{r.name}</div><div className="cell-sub clamp-2">{r.hypothesis}</div></div> },
    { key: "area", label: "Area", hideOnMobile: true, render: (r) => <Chip>{r.area}</Chip> },
    { key: "metric", label: "Primary metric", hideOnMobile: true, render: (r) => <span className="small clamp-2">{r.metric}</span> },
    { key: "start", label: "Start", value: (r) => fld(r, "start"), render: (r) => <span className="mono small">{fld(r, "start") || "—"}</span>, hideOnMobile: true },
    { key: "result", label: "Result", sortable: false, hideOnMobile: true, render: (r) => <span className="small clamp-2">{fld(r, "result") || <span className="muted">—</span>}</span> },
    { key: "status", label: "Status", value: status, render: (r) => <span onClick={(e) => e.stopPropagation()}><StatusSelect value={status(r)} options={EXPERIMENT_STATUSES} onChange={(v) => dispatch({ op: "setStatus", id: r.id, status: v === "BACKLOG" ? null : v })} /></span> },
  ];
  const counts = EXPERIMENT_STATUSES.map((s) => `${rows.filter((r) => status(r) === s).length} ${s.toLowerCase()}`).join(" · ");
  return (
    <div>
      <PageHeader title="Experiments" sub={`96 experiments from 31-EXPERIMENTS. ${counts}. Traffic is small, so most designs are pre/post or alternating weeks, not A/B significance.`} />
      <FilterBar filters={filters} state={f} total={rows.length} shown={f.rows.length} />
      <div className="panel panel-body"><DataTable rows={f.rows} columns={cols} rowKey={(r) => r.id} onRowClick={setOpen} exportName="experiments" /></div>
      <Drawer wide open={Boolean(open)} onClose={() => setOpen(null)} title={open ? `${open.id} · ${open.name}` : ""}>
        {open && (
          <div className="stack">
            <div className="row"><StatusSelect value={status(open)} options={EXPERIMENT_STATUSES} onChange={(v) => dispatch({ op: "setStatus", id: open.id, status: v === "BACKLOG" ? null : v })} /><PriorityChip p={open.priority} /><Chip>{open.area}</Chip><Chip>Effort {open.effort}</Chip>{open.design && <Chip>{open.design}</Chip>}</div>
            <dl className="kv">
              <dt>Hypothesis</dt><dd>{open.hypothesis}</dd>
              <dt>Change</dt><dd>{open.change}</dd>
              <dt>Audience</dt><dd>{open.audience}</dd>
              <dt>Primary metric</dt><dd>{open.metric}</dd>
              <dt>Success threshold</dt><dd><b>{open.success_threshold}</b></dd>
              <dt>Duration</dt><dd>{open.duration_days} days</dd>
              <dt>Expected learning</dt><dd>{open.expected_learning}</dd>
              <dt>Dependencies</dt><dd>{open.dependencies.join(", ") || "—"}</dd>
            </dl>
            <div className="grid grid-2">
              <EditableField id={open.id} field="start" label="Start (YYYY-MM-DD)" multiline={false} />
              <EditableField id={open.id} field="end" label="End (YYYY-MM-DD)" multiline={false} />
              <EditableField id={open.id} field="baseline" label="Baseline" multiline={false} />
              <EditableField id={open.id} field="result" label="Result" multiline={false} />
            </div>
            <EditableField id={open.id} field="decision" label="Decision" placeholder="Keep / roll back / extend, and why" />
            <EditableField id={open.id} field="learning" label="Learning" />
          </div>
        )}
      </Drawer>
    </div>
  );
}
