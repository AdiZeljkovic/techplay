"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useGrowth } from "@/lib/state/client";
import { addDays, fmt, mondayOf } from "@/lib/dates";
import { TASK_STATUSES, label } from "@/lib/status";
import type { EnrichedItem } from "@/lib/enrich";
import { ItemCard } from "@/components/ItemCard";
import { Drawer } from "@/components/DataView";
import { GROUP_LABEL } from "@/components/channelIcon";
import { Empty, PageHeader, PriorityChip, Tabs, cx } from "@/components/ui";

export interface LiteItem { id: string; channel: string; label: string; group: string; owner: string; priority: string; campaigns: string[]; franchises: string[]; paid: boolean; text: string; hasCopy: boolean }
export interface LiteDay { date: string; theme: string; priority: string; objective: string; items: LiteItem[] }

const MONTHS = [["2026-09", "September"], ["2026-10", "October"], ["2026-11", "November"], ["2026-12", "December"]] as const;
type View = "month" | "week" | "day";

export function CalendarView({ days, campaigns, today }: { days: LiteDay[]; campaigns: { id: string; name: string; start: string; end: string }[]; today: string }) {
  const { state } = useGrowth();
  const [view, setView] = useState<View>("month");
  const [month, setMonth] = useState(today.slice(0, 7));
  const [focus, setFocus] = useState(today);
  const [f, setF] = useState({ channel: "", campaign: "", type: "", owner: "", priority: "", status: "", paid: "" });
  const [open, setOpen] = useState<{ date: string; id?: string } | null>(null);
  const [detail, setDetail] = useState<{ date: string; items: EnrichedItem[]; objective: string } | null>(null);

  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const channels = useMemo(() => [...new Map(days.flatMap((d) => d.items.map((i) => [i.channel, i.label] as const))).entries()], [days]);
  const franchises = useMemo(() => [...new Set(days.flatMap((d) => d.items.flatMap((i) => i.franchises)))].sort(), [days]);

  const match = (i: LiteItem) => {
    const st = state.status[i.id] ?? "TODO";
    const owner = f.owner || (state.settings.viewAs !== "ALL" ? state.settings.viewAs : "");
    return (!f.channel || i.channel === f.channel) && (!f.campaign || i.campaigns.includes(f.campaign))
      && (!f.type || (f.type.startsWith("F") ? i.franchises.includes(f.type) : i.group === f.type))
      && (!owner || i.owner.split(", ").includes(owner)) && (!f.priority || i.priority === f.priority)
      && (!f.status || st === f.status) && (!f.paid || (f.paid === "paid" ? i.paid : !i.paid));
  };
  const anyFilter = Object.values(f).some(Boolean);

  const openItem = async (date: string, id?: string) => {
    setOpen({ date, id });
    setDetail(null);
    const r = await fetch(`/api/day/${date}`);
    if (r.ok) { const d = await r.json(); setDetail({ date, items: d.items, objective: d.objective }); }
  };

  const sel = (key: keyof typeof f, lbl: string, opts: [string, string][]) => (
    <select className={cx("filter-select", f[key] && "is-set")} value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })} aria-label={lbl}>
      <option value="">{lbl}: all</option>
      {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );

  const monthDays = () => {
    const first = `${month}-01`;
    const planWeek = mondayOf(days[0]?.date ?? first);
    const start = mondayOf(first) < planWeek ? planWeek : mondayOf(first);
    const [y, m] = month.split("-").map(Number);
    const monthEnd = addDays(`${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}-01`, -1);
    const end = addDays(mondayOf(monthEnd), 6);
    const cells: string[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) cells.push(d);
    return cells;
  };

  const weekStart = mondayOf(focus);
  const shift = (n: number) => {
    if (view === "month") { const i = MONTHS.findIndex((m) => m[0] === month); const nx = MONTHS[i + n]; if (nx) setMonth(nx[0]); }
    else if (view === "week") setFocus(addDays(focus, 7 * n));
    else setFocus(addDays(focus, n));
  };

  return (
    <div>
      <PageHeader
        title="Calendar"
        sub="Every plan item from 28 Sep to 31 Dec 2026. Click a day or item for full details and copy."
        actions={
          <div className="row">
            <button className="btn btn-sm" onClick={() => shift(-1)} aria-label="Previous"><ChevronLeft size={14} /></button>
            <span className="mono small" style={{ minWidth: 150, textAlign: "center" }}>
              {view === "month" ? MONTHS.find((m) => m[0] === month)?.[1] + " 2026" : view === "week" ? `${fmt(weekStart)} – ${fmt(addDays(weekStart, 6))}` : fmt(focus, { weekday: "long", day: "numeric", month: "short" })}
            </span>
            <button className="btn btn-sm" onClick={() => shift(1)} aria-label="Next"><ChevronRight size={14} /></button>
            <button className="btn btn-sm" onClick={() => { setMonth(today.slice(0, 7)); setFocus(today); }}>Today</button>
          </div>
        }
      />
      <Tabs<View> tabs={[{ id: "month", label: "Month" }, { id: "week", label: "Week" }, { id: "day", label: "Day" }]} value={view} onChange={setView} />
      <div className="filterbar">
        {sel("channel", "Channel", channels.map(([k, l]) => [k, l]))}
        {sel("campaign", "Campaign", campaigns.map((c) => [c.id, `${c.id} ${c.name.slice(0, 40)}`]))}
        {sel("type", "Content type", [...Object.entries(GROUP_LABEL), ...franchises.map((x) => [x, `Franchise ${x}`] as [string, string])])}
        {sel("owner", "Owner", ["EIC", "ED", "SC", "DS", "DEV"].map((o) => [o, o]))}
        {sel("priority", "Priority", ["P0", "P1", "P2"].map((o) => [o, o]))}
        {sel("status", "Status", TASK_STATUSES.map((s) => [s, label(s)]))}
        {sel("paid", "Organic/Paid", [["organic", "Organic"], ["paid", "Paid"]])}
        {anyFilter && <button className="btn btn-ghost btn-sm" onClick={() => setF({ channel: "", campaign: "", type: "", owner: "", priority: "", status: "", paid: "" })}>Clear</button>}
      </div>

      {view === "month" && (
        <div className="cal-month">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="cal-dow">{d}</div>)}
          {monthDays().map((iso) => {
            const d = byDate.get(iso);
            const inMonth = iso.slice(0, 7) === month;
            if (!d) return <div key={iso} className="cal-cell is-out"><span className="cal-daynum">{Number(iso.slice(8))}</span></div>;
            const list = d.items.filter(match);
            const done = list.filter((i) => state.status[i.id] === "DONE").length;
            const starts = campaigns.filter((c) => c.start === iso);
            return (
              <button key={iso} className={cx("cal-cell", iso === today && "is-today", !inMonth && "is-adjacent")} onClick={() => { setFocus(iso); setView("day"); }}>
                <span className="cal-daynum">{inMonth ? Number(iso.slice(8)) : fmt(iso, { day: "numeric", month: "short" })}<PriorityChip p={d.priority} /></span>
                <span className="cal-theme clamp-2">{d.theme.split(" / ").pop()}</span>
                {starts.slice(0, 2).map((c) => <span key={c.id} className="cal-line">▸ {c.id} starts</span>)}
                <span className="cal-line">{anyFilter ? `${list.length} matching` : `${list.length} items`} · {list.filter((i) => i.hasCopy).length} with copy</span>
                <span className="cal-bar"><span style={{ display: "block", height: "100%", width: `${list.length ? (done / list.length) * 100 : 0}%`, background: "var(--good)" }} /></span>
              </button>
            );
          })}
        </div>
      )}

      {view === "week" && (
        <div className="cal-week">
          {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((iso) => {
            const d = byDate.get(iso);
            const list = d ? d.items.filter(match) : [];
            return (
              <div key={iso} className="cal-col">
                <div className="cal-col-head">
                  <div className="row-between"><b className={iso === today ? "" : ""}>{fmt(iso)}</b>{d && <PriorityChip p={d.priority} />}</div>
                  {d && <div className="small muted clamp-2">{d.theme.split(" / ").pop()}</div>}
                </div>
                <div className="cal-col-body">
                  {!d && <span className="muted small">Outside the plan</span>}
                  {d && list.length === 0 && <span className="muted small">No matching items</span>}
                  {list.map((i) => (
                    <button key={i.id} className={cx("cal-chip", state.status[i.id] === "DONE" && "is-done", i.paid && "is-paid")} onClick={() => openItem(iso, i.id)}>
                      <b>{i.label} · {i.owner}</b>
                      <span className="clamp-2">{i.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "day" && <DayList day={byDate.get(focus)} match={match} onOpen={(id) => openItem(focus, id)} />}

      <Drawer open={Boolean(open)} onClose={() => setOpen(null)} title={open ? `${fmt(open.date, { weekday: "long", day: "numeric", month: "long" })}` : ""} wide>
        {!detail && <p className="muted">Loading…</p>}
        {detail && (
          <>
            <p className="day-objective" style={{ fontSize: 15 }}>{detail.objective}</p>
            <p className="small"><Link href={`/today?date=${detail.date}`} style={{ color: "var(--info)" }}>Open this day in Today →</Link></p>
            {detail.items.filter((i) => !open?.id || i.id === open.id).map((it) => <ItemCard key={it.id} item={it} />)}
            {open?.id && <button className="btn btn-sm" onClick={() => setOpen({ date: detail.date })}>Show all {detail.items.length} items this day</button>}
          </>
        )}
      </Drawer>
    </div>
  );
}

function DayList({ day, match, onOpen }: { day?: LiteDay; match: (i: LiteItem) => boolean; onOpen: (id: string) => void }) {
  const { state } = useGrowth();
  if (!day) return <Empty title="Outside the plan" hint="The plan covers 28 Sep – 31 Dec 2026." />;
  const list = day.items.filter(match);
  return (
    <div className="panel">
      <div className="panel-head"><h2>{day.objective}</h2><Link className="small" style={{ color: "var(--info)" }} href={`/today?date=${day.date}`}>Work this day in Today →</Link></div>
      <div className="panel-body flush">
        {list.length === 0 ? <Empty title="No items match the filters" /> : (
          <table className="table">
            <thead><tr><th>Channel</th><th>Owner</th><th>Priority</th><th>What</th><th>Status</th></tr></thead>
            <tbody>
              {list.map((i) => (
                <tr key={i.id} className="clickable" onClick={() => onOpen(i.id)}>
                  <td><b>{i.label}</b>{i.paid && <span className="chip chip-warn" style={{ marginLeft: 4 }}>Paid</span>}</td>
                  <td className="mono small">{i.owner}</td>
                  <td><PriorityChip p={i.priority} /></td>
                  <td className="clamp-2">{i.text}{i.hasCopy && <span className="chip chip-accent" style={{ marginLeft: 6 }}>copy</span>}</td>
                  <td className="small">{label(state.status[i.id] ?? "TODO")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
