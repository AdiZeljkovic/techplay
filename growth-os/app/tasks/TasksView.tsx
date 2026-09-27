"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { uid, useGrowth } from "@/lib/state/client";
import { OWNERS, PRIORITIES, TASK_STATUSES } from "@/lib/status";
import { addDays, fmt } from "@/lib/dates";
import type { SeedTask } from "@/lib/types";
import type { CustomTask } from "@/lib/state/types";
import { Drawer, FilterBar, useFiltered, type Filter } from "@/components/DataView";
import { CampaignLink, Chip, Empty, OwnerChip, PageHeader, PriorityChip, StatusSelect, cx } from "@/components/ui";
import { download, toCSV } from "@/lib/csv";

export type TaskRow = SeedTask & { custom: boolean; createdAt?: string };

export function TasksView({ seed, campaigns, today }: { seed: TaskRow[]; campaigns: { id: string; name: string }[]; today: string }) {
  const { state, dispatch } = useGrowth();
  const [editing, setEditing] = useState<CustomTask | null>(null);
  const sp = useSearchParams();
  const focus = sp.get("focus") ?? "";
  const src = sp.get("source");
  const [open, setOpen] = useState<TaskRow | null>(() => seed.find((x) => x.id === focus) ?? null);
  const custom: TaskRow[] = state.tasks.map((t) => ({ ...t, description: t.description, source: "Custom", custom: true }));
  const all = useMemo(() => [...custom, ...seed], [custom, seed]);
  const status = (t: TaskRow) => state.status[t.id] ?? "TODO";


  const filters: Filter<TaskRow>[] = [
    { key: "status", label: "Status", value: status, options: [...TASK_STATUSES] },
    { key: "owner", label: "Owner", value: (t) => t.owner.split(/[ ,/+]+/).filter((o) => (OWNERS as readonly string[]).includes(o)), options: [...OWNERS] },
    { key: "priority", label: "Priority", value: (t) => t.priority, options: [...PRIORITIES] },
    { key: "source", label: "Source", value: (t) => t.source.split(" · ")[0] },
    { key: "campaign", label: "Campaign", value: (t) => t.campaign },
    { key: "when", label: "Due", value: (t) => bucket(t.due, today), options: ["Overdue", "Today", "Next 7 days", "Later", "No date"] },
  ];
  const filt = useFiltered(all, filters, (t) => `${t.id} ${t.title} ${t.description} ${t.owner}`, src ? { sel: { source: src.startsWith("Quick") ? "Quick wins" : src } } : undefined);
  const viewAs = state.settings.viewAs;
  const rows = filt.rows.filter((t) => viewAs === "ALL" || t.owner.includes(viewAs));
  const hideDone = !filt.sel.status;
  const visible = rows.filter((t) => !hideDone || status(t) !== "DONE");
  const groups = ["Overdue", "Today", "Next 7 days", "Later", "No date"].map((b) => ({ b, list: visible.filter((t) => bucket(t.due, today) === b).sort((a, c) => (a.due || "9").localeCompare(c.due || "9") || a.priority.localeCompare(c.priority)) }));
  const doneN = rows.filter((t) => status(t) === "DONE").length;

  return (
    <div>
      <PageHeader
        title="Tasks"
        sub={`${rows.length - doneN} open · ${doneN} done. Quick wins, operations from the calendar, the dev backlog and your own tasks.`}
        actions={<>
          <button className="btn btn-ghost btn-sm" onClick={() => download("tasks.csv", toCSV(rows.map((t) => ({ ...t, status: status(t) })), ["id", "title", "due", "owner", "priority", "status", "campaign", "source", "description"]))}>Export CSV</button>
          <button className="btn btn-primary" onClick={() => setEditing({ id: uid("T"), title: "", description: "", due: today, campaign: "", channel: "", owner: viewAs === "ALL" ? "EIC" : viewAs, priority: "P1", createdAt: new Date().toISOString() })}><Plus size={14} /> New task</button>
        </>}
      />
      <FilterBar filters={filters} state={filt} total={all.length} shown={visible.length} extra={hideDone ? <span className="muted small">Done tasks hidden (pick a status to see them)</span> : null} />
      {visible.length === 0 && <Empty title="No tasks match" />}
      {groups.filter((g) => g.list.length).map((g) => (
        <div key={g.b} className="item-group">
          <div className="item-group-head">{g.b} <span className="count">{g.list.length}</span></div>
          <div className="panel">
            <ul className="list" style={{ padding: "0 12px" }}>
              {g.list.slice(0, 200).map((t) => {
                const st = status(t);
                return (
                  <li key={t.id} id={t.id} style={focus === t.id ? { boxShadow: "inset 3px 0 0 var(--focus)" } : undefined}>
                    <button className={cx("check", st === "DONE" && "is-on")} onClick={() => dispatch({ op: "setStatus", id: t.id, status: st === "DONE" ? null : "DONE" })} aria-label="Toggle done">✓</button>
                    <div className="list-main" style={{ cursor: "pointer" }} onClick={() => setOpen(t)}>
                      <div className={cx("small cell-title", st === "DONE" && "muted")} style={{ textDecoration: st === "DONE" ? "line-through" : undefined }}>{t.title}</div>
                      <div className="row small muted">
                        <span className="mono">{fmt(t.due)}</span><OwnerChip owner={t.owner} /><PriorityChip p={t.priority} />
                        {t.time && <span>{t.time}</span>}<span>{t.source}</span>
                        {t.campaign && <CampaignLink id={t.campaign} />}
                      </div>
                    </div>
                    <StatusSelect value={st} options={TASK_STATUSES} onChange={(v) => dispatch({ op: "setStatus", id: t.id, status: v === "TODO" ? null : v })} />
                  </li>
                );
              })}
              {g.list.length > 200 && <li className="muted small">+{g.list.length - 200} more · narrow with filters</li>}
            </ul>
          </div>
        </div>
      ))}

      <Drawer open={Boolean(open)} onClose={() => setOpen(null)} title={open?.title ?? ""}>
        {open && (
          <>
            <div className="row" style={{ marginBottom: 8 }}><StatusSelect value={status(open)} options={TASK_STATUSES} onChange={(v) => dispatch({ op: "setStatus", id: open.id, status: v === "TODO" ? null : v })} /><PriorityChip p={open.priority} /><OwnerChip owner={open.owner} /><Chip>{open.source}</Chip></div>
            <dl className="kv">
              <dt>Due</dt><dd>{fmt(open.due, { weekday: "long", day: "numeric", month: "long" })}</dd>
              <dt>What to do</dt><dd style={{ whiteSpace: "pre-wrap" }}>{open.description}</dd>
              {open.expected && <><dt>Expected effect</dt><dd>{open.expected}</dd></>}
              {open.doneWhen && <><dt>Done when</dt><dd>{open.doneWhen}</dd></>}
              {open.time && <><dt>Time</dt><dd>{open.time}</dd></>}
              {open.campaign && <><dt>Campaign</dt><dd><Link href={`/campaigns/${open.campaign.slice(0, 3)}`} style={{ color: "var(--info)" }}>{open.campaign}</Link></dd></>}
            </dl>
            {open.source.startsWith("Calendar") && <Link className="btn btn-sm" href={`/today?date=${open.due}#${encodeURIComponent(open.id)}`}>Open in Today</Link>}
            {open.custom && (
              <div className="row">
                <button className="btn btn-sm" onClick={() => { setEditing(state.tasks.find((x) => x.id === open.id) || null); setOpen(null); }}>Edit</button>
                <button className="btn btn-sm" onClick={() => { dispatch({ op: "deleteTask", id: open.id }); setOpen(null); }}><Trash2 size={13} /> Delete</button>
              </div>
            )}
          </>
        )}
      </Drawer>

      <Drawer open={Boolean(editing)} onClose={() => setEditing(null)} title={state.tasks.some((t) => t.id === editing?.id) ? "Edit task" : "New task"}>
        {editing && <TaskForm task={editing} campaigns={campaigns} onSave={(t) => { dispatch({ op: "upsertTask", task: t }); setEditing(null); }} />}
      </Drawer>
    </div>
  );
}

function bucket(due: string | null, today: string): string {
  if (!due) return "No date";
  if (due < today) return "Overdue";
  if (due === today) return "Today";
  if (due <= addDays(today, 7)) return "Next 7 days";
  return "Later";
}

function TaskForm({ task, campaigns, onSave }: { task: CustomTask; campaigns: { id: string; name: string }[]; onSave: (t: CustomTask) => void }) {
  const [t, setT] = useState(task);
  const set = (k: keyof CustomTask, v: string) => setT({ ...t, [k]: v });
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); if (t.title.trim()) onSave({ ...t, title: t.title.trim() }); }}>
      <label className="field"><span>Title</span><input className="input" autoFocus required value={t.title} onChange={(e) => set("title", e.target.value)} /></label>
      <label className="field"><span>Description</span><textarea className="textarea" value={t.description} onChange={(e) => set("description", e.target.value)} /></label>
      <div className="form-grid">
        <label className="field"><span>Due date</span><input className="input" type="date" value={t.due ?? ""} onChange={(e) => set("due", e.target.value)} /></label>
        <label className="field"><span>Owner</span><select className="select" value={t.owner} onChange={(e) => set("owner", e.target.value)}>{OWNERS.map((o) => <option key={o}>{o}</option>)}</select></label>
        <label className="field"><span>Priority</span><select className="select" value={t.priority} onChange={(e) => set("priority", e.target.value)}>{PRIORITIES.map((o) => <option key={o}>{o}</option>)}</select></label>
        <label className="field"><span>Campaign</span><select className="select" value={t.campaign} onChange={(e) => set("campaign", e.target.value)}><option value="">None</option>{campaigns.map((c) => <option key={c.id} value={c.id}>{c.id} {c.name.slice(0, 40)}</option>)}</select></label>
        <label className="field"><span>Channel</span><input className="input" value={t.channel} onChange={(e) => set("channel", e.target.value)} placeholder="e.g. Discord" /></label>
      </div>
      <div className="row"><button className="btn btn-primary" type="submit">Save task</button><span className="muted small">Saved to the working state; status is set from the list.</span></div>
    </form>
  );
}

