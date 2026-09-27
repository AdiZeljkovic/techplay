"use client";
import { useMemo, useState } from "react";
import { useGrowth } from "@/lib/state/client";
import { VIDEO_STAGES } from "@/lib/status";
import { addDays, fmt } from "@/lib/dates";
import type { Section as Sec } from "@/lib/types";
import { Kanban } from "@/components/Kanban";
import { DataTable, Drawer } from "@/components/DataView";
import { Chip, CopyBlock, PageHeader, Section, StatusSelect, Tabs, cx } from "@/components/ui";
import { EditableField } from "@/components/Editable";
import { MarkdownClient } from "@/components/MarkdownClient";

export interface VideoCard { id: string; title: string; date: string | null; platforms: string[]; format: string; detail: Record<string, string>; script: string; origin: string }
const PLATFORMS = ["YouTube", "YouTube Shorts", "TikTok", "Instagram Reels", "Facebook Reels"];

export function VideoView({ cards, today, shows, pilots, workflow }: { cards: VideoCard[]; today: string; shows: Record<string, string>[]; pilots: Sec[]; workflow: Sec[] }) {
  const { state, dispatch } = useGrowth();
  const [tab, setTab] = useState<"pipeline" | "shows" | "pilots" | "workflow">("pipeline");
  const [platform, setPlatform] = useState("");
  const [range, setRange] = useState("next14");
  const [open, setOpen] = useState<VideoCard | null>(null);
  const filtered = useMemo(() => cards.filter((c) => {
    if (platform && !c.platforms.includes(platform)) return false;
    if (range === "next14") return !c.date || (c.date >= today && c.date <= addDays(today, 14)) || (state.status[c.id] && state.status[c.id] !== "IDEA" && state.status[c.id] !== "PUBLISHED");
    if (range === "past") return Boolean(c.date && c.date < today);
    return true;
  }), [cards, platform, range, today, state.status]);
  return (
    <div>
      <PageHeader title="Video" sub="One pipeline for YouTube long-form and the vertical system (TikTok, Shorts, Reels, Facebook Reels: one edit, four uploads)." />
      <Tabs tabs={[{ id: "pipeline", label: "Pipeline" }, { id: "shows", label: "Shows", count: shows.length }, { id: "pilots", label: "Long-form pilots", count: pilots.length }, { id: "workflow", label: "Repurposing workflow" }]} value={tab} onChange={setTab} />
      {tab === "pipeline" && (
        <>
          <div className="filterbar">
            <select className={cx("filter-select", platform && "is-set")} value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label="Platform">
              <option value="">Platform: all</option>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select className="filter-select" value={range} onChange={(e) => setRange(e.target.value)} aria-label="Range">
              <option value="next14">Next 14 days + in production</option><option value="all">Whole plan</option><option value="past">Past dates</option>
            </select>
            <span className="muted small filter-count">{filtered.length} videos</span>
          </div>
          <Kanban
            stages={VIDEO_STAGES}
            onOpen={(id) => setOpen(cards.find((c) => c.id === id) || null)}
            cards={filtered.map((c) => ({ id: c.id, defaultStage: "IDEA", title: c.title, sub: <>{c.date ? fmt(c.date) : "Undated"} · {c.format}</>, meta: <span className="muted">{c.platforms.length > 1 ? "4 platforms" : c.platforms[0]}</span> }))}
          />
        </>
      )}
      {tab === "shows" && <div className="panel panel-body"><DataTable rows={shows} rowKey={(r) => r["#"] || r.Show} columns={Object.keys(shows[0] || {}).map((k) => ({ key: k, label: k, render: (r: Record<string, string>) => <span className="small">{r[k]}</span> }))} exportName="video-shows" /></div>}
      {tab === "pilots" && <div className="stack">{pilots.map((p) => <Section key={p.title} title={p.title}><MarkdownClient md={p.body} /></Section>)}</div>}
      {tab === "workflow" && <div className="stack">{workflow.map((p) => <Section key={p.title} title={p.title}><MarkdownClient md={p.body} /></Section>)}</div>}
      <Drawer open={Boolean(open)} onClose={() => setOpen(null)} title={open?.title ?? ""}>
        {open && (
          <div className="stack">
            <div className="row">
              <StatusSelect value={state.status[open.id] ?? "IDEA"} options={VIDEO_STAGES} onChange={(v) => dispatch({ op: "setStatus", id: open.id, status: v === "IDEA" ? null : v })} />
              {open.platforms.map((p) => <Chip key={p}>{p}</Chip>)}
            </div>
            <dl className="kv">
              <dt>Date</dt><dd>{fmt(open.date, { weekday: "long", day: "numeric", month: "long" })}</dd>
              <dt>Format</dt><dd>{open.format}</dd>
              {Object.entries(open.detail).filter(([, v]) => v).map(([k, v]) => <FragmentKV key={k} k={k} v={v} />)}
              <dt>From</dt><dd>{open.origin}</dd>
            </dl>
            {open.script && <><h3>Script / hook</h3><CopyBlock text={open.script} /></>}
            <EditableField id={open.id} field="script" label="Working script" placeholder="0–2s hook / 2–7s context / 7–15s information / 15–25s payoff / CTA" />
            <EditableField id={open.id} field="links" label="Published links (one per line)" placeholder="TikTok, Shorts, Reels URLs" />
          </div>
        )}
      </Drawer>
    </div>
  );
}

function FragmentKV({ k, v }: { k: string; v: string }) {
  return <><dt>{k}</dt><dd>{v}</dd></>;
}
