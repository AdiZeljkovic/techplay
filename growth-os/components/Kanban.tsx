"use client";
import { useGrowth } from "@/lib/state/client";
import { label } from "@/lib/status";
import { StatusSelect } from "./ui";

export interface KanbanCard { id: string; title: string; sub?: React.ReactNode; meta?: React.ReactNode; defaultStage: string }

/** Stage board. The stage is the entity's status in working state; moving a card is one select. */
export function Kanban({ cards, stages, onOpen }: { cards: KanbanCard[]; stages: readonly string[]; onOpen?: (id: string) => void }) {
  const { state, dispatch } = useGrowth();
  const stageOf = (c: KanbanCard) => state.status[c.id] ?? c.defaultStage;
  return (
    <div className="kanban">
      {stages.map((s) => {
        const list = cards.filter((c) => stageOf(c) === s);
        return (
          <div key={s} className="kcol">
            <div className="kcol-head"><span>{label(s)}</span><span className="count">{list.length}</span></div>
            <div className="kcol-body">
              {list.map((c) => (
                <div key={c.id} className="kcard" onClick={() => onOpen?.(c.id)} role={onOpen ? "button" : undefined} tabIndex={onOpen ? 0 : undefined}
                  onKeyDown={(e) => { if (onOpen && e.key === "Enter") onOpen(c.id); }}>
                  <div className="kcard-title">{c.title}</div>
                  {c.sub && <div className="small muted">{c.sub}</div>}
                  <div className="row-between" style={{ marginTop: 6 }} onClick={(e) => e.stopPropagation()}>
                    <span className="small">{c.meta}</span>
                    <StatusSelect value={stageOf(c)} options={stages} onChange={(v) => dispatch({ op: "setStatus", id: c.id, status: v === c.defaultStage ? null : v })} ariaLabel={`Stage for ${c.title}`} />
                  </div>
                </div>
              ))}
              {list.length === 0 && <span className="muted small" style={{ padding: 6 }}>Empty</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
