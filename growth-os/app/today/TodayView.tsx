"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarDay } from "@/lib/types";
import type { EnrichedItem } from "@/lib/enrich";
import type { SideItems } from "@/lib/today";
import { useGrowth } from "@/lib/state/client";
import { fmt } from "@/lib/dates";
import { ItemCard } from "@/components/ItemCard";
import { GROUP_LABEL, GROUP_ORDER } from "@/components/channelIcon";
import { Chip, CopyButton, Empty, OwnerChip, PriorityChip, Progress, Section, cx } from "@/components/ui";

export function TodayView({ day, items, side, prev, next, isToday }: { day: CalendarDay; items: EnrichedItem[]; side: SideItems; prev: string | null; next: string | null; isToday: boolean }) {
  const { state } = useGrowth();
  const router = useRouter();
  const [group, setGroup] = useState("ALL");
  const [hideDone, setHideDone] = useState(false);
  const [copyOnly, setCopyOnly] = useState(false);

  const viewAs = state.settings.viewAs;
  const mine = useMemo(() => items.filter((it) => viewAs === "ALL" || it.owner.split(", ").includes(viewAs)), [items, viewAs]);
  const doneCount = mine.filter((it) => state.status[it.id] === "DONE").length;
  const shown = mine.filter((it) =>
    (group === "ALL" || it.group === group) &&
    (!hideDone || state.status[it.id] !== "DONE") &&
    (!copyOnly || it.copy.length > 0 || it.campaignCopy));
  const groups = GROUP_ORDER.map((g) => ({ g, list: shown.filter((it) => it.group === g) })).filter((x) => x.list.length);
  const ctx = { cta: day.cta, landing: day.landing, kpi: day.kpi, tracking: day.tracking };
  const blocked = mine.filter((it) => state.status[it.id] === "BLOCKED").length;

  return (
    <div>
      <div className="day-head">
        <div>
          <div className="day-kicker">
            <Link className="btn btn-ghost btn-sm" href={prev ? `/today?date=${prev}` : "#"} aria-disabled={!prev} aria-label="Previous day"><ChevronLeft size={14} /></Link>
            <span>{fmt(day.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
            <Link className="btn btn-ghost btn-sm" href={next ? `/today?date=${next}` : "#"} aria-disabled={!next} aria-label="Next day"><ChevronRight size={14} /></Link>
            <input type="date" className="input" style={{ width: 150, padding: "2px 6px" }} value={day.date} min="2026-09-28" max="2026-12-31"
              onChange={(e) => e.target.value && router.push(`/today?date=${e.target.value}`)} aria-label="Jump to date" />
            {!isToday && <Link className="small" href="/today" style={{ color: "var(--info)" }}>Back to today</Link>}
            <PriorityChip p={day.priority} />
          </div>
          <p className="day-objective">{day.objective}</p>
          <div className="day-meta">
            <span><b>Theme</b>{day.theme}</span>
            <span><b>Audience</b>{day.audience}</span>
            <span><b>Owners</b>{day.owner.split(", ").map((o) => <OwnerChip key={o} owner={o} />)}</span>
            <span><b>Planned effort</b>{day.effort} h</span>
          </div>
          <div className="day-meta" style={{ marginTop: 6 }}>
            <span><b>Main CTA</b>{day.cta}</span>
            <span><b>Landing</b>{day.landing}</span>
          </div>
        </div>
        <div className="day-side">
          <Progress done={doneCount} total={mine.length} label={viewAs === "ALL" ? "Done today" : `Done today · ${viewAs}`} />
          {blocked > 0 && <Chip tone="bad">{blocked} blocked</Chip>}
          <div className="small"><span className="muted">KPI to check: </span>{day.kpi}</div>
        </div>
      </div>

      <div className="filterbar">
        <select className={cx("filter-select", group !== "ALL" && "is-set")} value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Area">
          <option value="ALL">All areas ({mine.length})</option>
          {GROUP_ORDER.map((g) => { const n = mine.filter((i) => i.group === g).length; return n ? <option key={g} value={g}>{GROUP_LABEL[g]} ({n})</option> : null; })}
        </select>
        <label className="row small"><input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} /> Hide done</label>
        <label className="row small"><input type="checkbox" checked={copyOnly} onChange={(e) => setCopyOnly(e.target.checked)} /> Only items with copy</label>
        <span className="muted small filter-count">{shown.length} of {mine.length} items</span>
      </div>

      <div className="grid split-main">
        <div>
          {groups.length === 0 && <Empty title={mine.length ? "All done, or filtered out" : "Nothing for this owner today"} hint={viewAs !== "ALL" ? "Switch 'Viewing as' to Everyone to see the whole day." : undefined} />}
          {groups.map(({ g, list }) => (
            <div key={g} className="item-group">
              <div className="item-group-head">{GROUP_LABEL[g]} <span className="count">{list.length}</span></div>
              {list.map((it) => <ItemCard key={it.id} item={it} ctx={ctx} />)}
            </div>
          ))}
        </div>
        <div className="stack">
          <SidePanel side={side} />
        </div>
      </div>
    </div>
  );
}

function SidePanel({ side }: { side: SideItems }) {
  const { state, dispatch } = useGrowth();
  const nothing = !side.tasks.length && !side.keyDates.length && !side.sends.length && !side.pr.length && !side.videos.length;
  return (
    <>
      {side.sends.length > 0 && (
        <Section title="Email sends" count={side.sends.length}>
          <ul className="list">
            {side.sends.map((s) => (
              <li key={s.id}><div className="list-main">
                <div className="small muted">{s.product}</div>
                <div className="cell-title">{s.subject}</div>
                <div className="small muted clamp-2">{s.preview}</div>
                <div className="row" style={{ marginTop: 4 }}><CopyButton text={s.subject} label="Subject" small />{s.preview && <CopyButton text={s.preview} label="Preview" small />}</div>
              </div></li>
            ))}
          </ul>
        </Section>
      )}
      {side.tasks.length > 0 && (
        <Section title="Tasks due" count={side.tasks.length}>
          <ul className="list">
            {side.tasks.map((t) => {
              const done = state.status[t.id] === "DONE";
              return (
                <li key={t.id}>
                  <input type="checkbox" checked={done} onChange={() => dispatch({ op: "setStatus", id: t.id, status: done ? null : "DONE" })} aria-label="Complete task" />
                  <div className="list-main">
                    <div className={cx("small", done && "muted")} style={{ textDecoration: done ? "line-through" : undefined }}>{t.title}</div>
                    <div className="row small muted"><OwnerChip owner={t.owner} /><PriorityChip p={t.priority} />{t.time}</div>
                  </div>
                </li>
              );
            })}
          </ul>
          <Link href="/tasks" className="small" style={{ color: "var(--info)" }}>All tasks →</Link>
        </Section>
      )}
      {side.keyDates.length > 0 && (
        <Section title="Industry moments" count={side.keyDates.length}>
          <ul className="list">
            {side.keyDates.map((k) => (
              <li key={k.id}><div className="list-main">
                <div className="cell-title">{k.event}</div>
                <div className="small muted">{k.type} · {k.confidence}</div>
                <div className="small"><b>During:</b> {k.publish_during}</div>
              </div></li>
            ))}
          </ul>
        </Section>
      )}
      {side.pr.length > 0 && (
        <Section title="PR publishing" count={side.pr.length}>
          {side.pr.map((p) => <div key={p.id}><Link href={`/pr?focus=${p.id}`} className="cell-title">{p.id} {p.name}</Link><div className="small muted">{p.owner} · data: {p.data}</div></div>)}
        </Section>
      )}
      {side.videos.length > 0 && (
        <Section title="Video ideas due" count={side.videos.length}>
          {side.videos.map((v) => <div key={v.id} className="small"><Link href="/video" className="cell-title">{v.title}</Link><div className="muted">{v.format} · {v.length}</div></div>)}
        </Section>
      )}
      {nothing && <Section title="Also today"><p className="muted small">No dated tasks, sends or industry moments beyond the plan items.</p></Section>}
    </>
  );
}
