"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { uid, useGrowth } from "@/lib/state/client";
import type { EnrichedItem } from "@/lib/enrich";
import type { Section as Sec } from "@/lib/types";
import { fmt } from "@/lib/dates";
import { ItemCard } from "@/components/ItemCard";
import { DataTable } from "@/components/DataView";
import { MarkdownClient } from "@/components/MarkdownClient";
import { Empty, PageHeader, Section, Tabs } from "@/components/ui";

type Row = Record<string, string>;
type Tab = "discord" | "reddit" | "events" | "giveaways" | "feedback" | "rhythms";

function Table({ rows, name }: { rows: Row[]; name: string }) {
  if (!rows.length) return <Empty title="No rows" />;
  return <DataTable rows={rows} rowKey={(r) => Object.values(r).join("|").slice(0, 80)} exportName={name} columns={Object.keys(rows[0]).map((k) => ({ key: k, label: k, render: (r: Row) => <span className="small">{r[k]}</span> }))} />;
}

export function CommunityView({ discord, reddit, data, rhythms, date }: {
  discord: EnrichedItem[]; reddit: EnrichedItem[]; date: string; rhythms: { title: string; body: string }[];
  data: { rituals: Row[]; events: Row[]; polls: Row[]; channels: { category: string; rows: Row[] }[]; redditCalendar: Row[]; redditAnswers: Row[]; redditRoles: Row[]; giveaways: Sec[] };
}) {
  const [tab, setTab] = useState<Tab>("discord");
  const byDay = (list: EnrichedItem[]) => Object.entries(list.reduce<Record<string, EnrichedItem[]>>((a, i) => { (a[i.date] ||= []).push(i); return a; }, {}));
  return (
    <div>
      <PageHeader title="Community" sub="Discord is a primary channel; Reddit is reputation, not distribution. Tasks for the next 7 days, rituals, events, polls, giveaways and member feedback." />
      <Tabs<Tab> tabs={[
        { id: "discord", label: "Discord", count: discord.length }, { id: "reddit", label: "Reddit", count: reddit.length },
        { id: "events", label: "Events & polls", count: data.events.length + data.polls.length }, { id: "giveaways", label: "Giveaways", count: data.giveaways.length },
        { id: "feedback", label: "Member feedback" }, { id: "rhythms", label: "Rhythms & moderation" },
      ]} value={tab} onChange={setTab} />
      {tab === "discord" && (
        <div className="grid split-wide">
          <div>{byDay(discord).map(([d, list]) => <div key={d} className="item-group"><div className="item-group-head">{fmt(d, { weekday: "long", day: "numeric", month: "short" })}{d === date && " · today"}</div>{list.map((i) => <ItemCard key={i.id} item={i} />)}</div>)}{!discord.length && <Empty title="No Discord tasks this week" />}</div>
          <div className="stack">
            <Section title="Weekly rituals" count={data.rituals.length}><Table rows={data.rituals} name="discord-rituals" /></Section>
            <Section title="Channel list" count={data.channels.length}>{data.channels.map((c) => <details key={c.category} className="details"><summary>{c.category}</summary><Table rows={c.rows} name="discord-channels" /></details>)}</Section>
          </div>
        </div>
      )}
      {tab === "reddit" && (
        <div className="grid split-wide">
          <div>{byDay(reddit).map(([d, list]) => <div key={d} className="item-group"><div className="item-group-head">{fmt(d, { weekday: "long", day: "numeric", month: "short" })}</div>{list.map((i) => <ItemCard key={i.id} item={i} />)}</div>)}</div>
          <div className="stack">
            <Section title="13-week plan" count={data.redditCalendar.length}><Table rows={data.redditCalendar} name="reddit-13-weeks" /></Section>
            <Section title="Subreddit roles" count={data.redditRoles.length}><Table rows={data.redditRoles} name="reddit-roles" /></Section>
            <Section title="Helpful-answer bank" count={data.redditAnswers.length}><Table rows={data.redditAnswers} name="reddit-answers" /></Section>
          </div>
        </div>
      )}
      {tab === "events" && <div className="stack"><Section title="Events and game nights" count={data.events.length}><Table rows={data.events} name="community-events" /></Section><Section title="Poll of the Week calendar" count={data.polls.length}><Table rows={data.polls} name="polls" /></Section></div>}
      {tab === "giveaways" && <div className="stack">{data.giveaways.map((g) => <Section key={g.title} title={g.title}><MarkdownClient md={g.body} /></Section>)}<p className="muted small">Before promoting any giveaway: D-039a (base points on entry), D-039b (IP limit) and D-041 (bot links) must be live. See Tasks.</p></div>}
      {tab === "feedback" && <Feedback />}
      {tab === "rhythms" && <div className="stack">{rhythms.map((r) => <Section key={r.title} title={r.title}><MarkdownClient md={r.body} /></Section>)}</div>}
    </div>
  );
}

function Feedback() {
  const { state, dispatch } = useGrowth();
  const [text, setText] = useState("");
  const [source, setSource] = useState("Discord");
  return (
    <div className="grid split-wide">
      <Section title="Feedback log" count={state.feedback.length}>
        {state.feedback.length === 0 ? <Empty title="No feedback logged yet" hint="Log suggestions, complaints and requests from Discord, Reddit, comments and email; review them in the Monday meeting." /> : (
          <ul className="list">{[...state.feedback].reverse().map((f) => (
            <li key={f.id}><span className="date-badge">{fmt(f.date)}</span><div className="list-main"><div className="small muted">{f.source}</div><div style={{ whiteSpace: "pre-wrap" }}>{f.text}</div></div>
              <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ op: "deleteFeedback", id: f.id })} aria-label="Delete"><Trash2 size={13} /></button></li>
          ))}</ul>
        )}
      </Section>
      <Section title="Log feedback">
        <form className="stack" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; dispatch({ op: "addFeedback", note: { id: uid("FB"), date: new Date().toISOString().slice(0, 10), source, text: text.trim() } }); setText(""); }}>
          <label className="field"><span>Source</span><select className="select" value={source} onChange={(e) => setSource(e.target.value)}>{["Discord", "Reddit", "Site comments", "Email reply", "Forum", "Social", "Other"].map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className="field"><span>What they said / asked</span><textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} /></label>
          <button className="btn btn-primary" type="submit">Add</button>
        </form>
      </Section>
    </div>
  );
}
