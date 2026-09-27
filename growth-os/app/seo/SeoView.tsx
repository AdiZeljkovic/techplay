"use client";
import { useState } from "react";
import { useGrowth } from "@/lib/state/client";
import { CONTENT_STATUSES, TASK_STATUSES } from "@/lib/status";
import type { ContentItem, Section as Sec } from "@/lib/types";
import type { EnrichedItem } from "@/lib/enrich";
import { DataTable, FilterBar, useFiltered, type Column, type Filter } from "@/components/DataView";
import { ItemCard } from "@/components/ItemCard";
import { MarkdownClient } from "@/components/MarkdownClient";
import { Empty, PageHeader, PriorityChip, Section, StatusSelect, Tabs } from "@/components/ui";

type Tab = "week" | "evergreen" | "queries" | "hubs" | "fixes" | "linking" | "discover" | "tools";
type Row = Record<string, string>;

export function SeoView(p: { evergreen: ContentItem[]; queries: Row[]; hubs: Sec[]; linking: string; indexable: string; programmatic: string; plumbing: Row[]; titles: Row[]; tools: Row[]; discover: Sec[]; tasks: EnrichedItem[] }) {
  const [tab, setTab] = useState<Tab>("week");
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "week", label: "This week", count: p.tasks.length }, { id: "evergreen", label: "Evergreen", count: p.evergreen.length },
    { id: "queries", label: "Query map", count: p.queries.length }, { id: "hubs", label: "Game hubs", count: p.hubs.length },
    { id: "fixes", label: "Fixes & titles", count: p.plumbing.length + p.titles.length }, { id: "linking", label: "Internal linking" },
    { id: "discover", label: "Discover & News" }, { id: "tools", label: "Tools", count: p.tools.length },
  ];
  return (
    <div>
      <PageHeader title="SEO" sub="Search is a primary channel. Recovery first (plumbing, the indexable set), then narrow queries TechPlay can win." />
      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      {tab === "week" && (p.tasks.length ? p.tasks.map((i) => <ItemCard key={i.id} item={i} showDate />) : <Empty title="No SEO items this week" />)}
      {tab === "evergreen" && <Evergreen rows={p.evergreen} />}
      {tab === "queries" && <Queries rows={p.queries} />}
      {tab === "hubs" && <div className="stack">{p.hubs.map((h) => <Section key={h.title} title={h.title}><MarkdownClient md={h.body} /></Section>)}</div>}
      {tab === "fixes" && <Fixes plumbing={p.plumbing} titles={p.titles} indexable={p.indexable} />}
      {tab === "linking" && <div className="stack"><Section title="Internal linking rules"><MarkdownClient md={p.linking} /></Section><Section title="Programmatic templates"><MarkdownClient md={p.programmatic} /></Section></div>}
      {tab === "discover" && <div className="stack">{p.discover.map((s) => <details key={s.title} className="panel panel-body details" open={/Discover|checklist/i.test(s.title)}><summary><b>{s.title}</b></summary><MarkdownClient md={s.body} /></details>)}</div>}
      {tab === "tools" && <Tools rows={p.tools} />}
    </div>
  );
}

function Evergreen({ rows }: { rows: ContentItem[] }) {
  const { state, dispatch } = useGrowth();
  const status = (r: ContentItem) => state.status[r.id] ?? "IDEA";
  const filters: Filter<ContentItem>[] = [
    { key: "impact", label: "Impact", value: (r) => `${r.score}/5`, options: ["5/5", "4/5", "3/5", "2/5", "1/5"] },
    { key: "difficulty", label: "Difficulty", value: (r) => r.competition || "", },
    { key: "game", label: "Game", value: (r) => (r.game || "").split(/[,(]/)[0].trim() },
    { key: "intent", label: "Intent", value: (r) => r.intent },
    { key: "status", label: "Status", value: status, options: [...CONTENT_STATUSES] },
  ];
  const f = useFiltered(rows, filters, (r) => `${r.title} ${r.query} ${r.secondary}`);
  const cols: Column<ContentItem>[] = [
    { key: "priority", label: "Pri", render: (r) => <PriorityChip p={r.priority} /> },
    { key: "title", label: "Topic", render: (r) => <div><div className="cell-title">{r.title}</div><div className="cell-sub mono">“{r.query}”</div></div> },
    { key: "score", label: "Impact", value: (r) => r.score, render: (r) => <span className="mono">{r.score}/5</span> },
    { key: "competition", label: "Difficulty" },
    { key: "intent", label: "Intent", hideOnMobile: true },
    { key: "format", label: "Format", hideOnMobile: true, render: (r) => <span className="small clamp-2">{r.format}</span> },
    { key: "status", label: "Status", value: status, render: (r) => <StatusSelect value={status(r)} options={CONTENT_STATUSES} onChange={(v) => dispatch({ op: "setStatus", id: r.id, status: v === "IDEA" ? null : v })} /> },
  ];
  return <><FilterBar filters={filters} state={f} total={rows.length} shown={f.rows.length} /><div className="panel panel-body"><DataTable rows={f.rows} columns={cols} rowKey={(r) => r.id} exportName="seo-evergreen" initialSort={{ key: "score", dir: -1 }} /></div></>;
}

function Queries({ rows }: { rows: Row[] }) {
  const { state, dispatch } = useGrowth();
  const status = (r: Row) => state.status[r.id] ?? "IDEA";
  const filters: Filter<Row>[] = [
    { key: "cluster", label: "Cluster", value: (r) => r.cluster },
    { key: "intent", label: "Intent", value: (r) => r.intent },
    { key: "state", label: "Page state", value: (r) => r.state },
    { key: "game", label: "Game", value: (r) => (/gta/i.test(r.query) ? "GTA VI" : /wow|warcraft/i.test(r.query) ? "WoW" : /switch/i.test(r.query) ? "Switch 2" : /steam/i.test(r.query) ? "Steam" : "Other") },
    { key: "status", label: "Status", value: status, options: [...CONTENT_STATUSES] },
  ];
  const f = useFiltered(rows, filters, (r) => Object.values(r).join(" "));
  const cols: Column<Row>[] = [
    { key: "query", label: "Query", render: (r) => <span className="mono small">{r.query}</span> },
    { key: "intent", label: "Intent" },
    { key: "page", label: "Target page", render: (r) => <div><div className="cell-title small">{r.page}</div><div className="cell-sub">{r.hub}</div></div> },
    { key: "state", label: "State", hideOnMobile: true },
    { key: "links", label: "Links", hideOnMobile: true, render: (r) => <span className="small clamp-3">{r.links}</span> },
    { key: "cta", label: "CTA", hideOnMobile: true, render: (r) => <span className="small">{r.cta}</span> },
    { key: "status", label: "Status", value: status, render: (r) => <StatusSelect value={status(r)} options={CONTENT_STATUSES} onChange={(v) => dispatch({ op: "setStatus", id: r.id, status: v === "IDEA" ? null : v })} /> },
  ];
  return <><FilterBar filters={filters} state={f} total={rows.length} shown={f.rows.length} /><div className="panel panel-body"><DataTable rows={f.rows} columns={cols} rowKey={(r) => r.id} exportName="seo-query-map" /></div></>;
}

function Fixes({ plumbing, titles, indexable }: { plumbing: Row[]; titles: Row[]; indexable: string }) {
  const { state, dispatch } = useGrowth();
  const pcols = Object.keys(plumbing[0] || {});
  return (
    <div className="stack">
      <Section title="Plumbing fixes (C02)" count={plumbing.length}>
        <DataTable rows={plumbing} rowKey={(r) => r.ID} exportName="seo-plumbing" columns={[
          ...pcols.map((k) => ({ key: k, label: k, render: (r: Row) => <span className="small">{r[k]}</span> })),
          { key: "status", label: "Status", sortable: false, render: (r: Row) => <StatusSelect value={state.status[`seo-fix:${r.ID}`] ?? "TODO"} options={TASK_STATUSES} onChange={(v) => dispatch({ op: "setStatus", id: `seo-fix:${r.ID}`, status: v === "TODO" ? null : v })} /> },
        ]} />
      </Section>
      <Section title="Title and meta rewrites" count={titles.length}>
        <DataTable rows={titles} rowKey={(r) => r["#"] + r.Page} exportName="seo-titles" columns={Object.keys(titles[0] || {}).map((k) => ({ key: k, label: k, render: (r: Row) => <span className="small">{r[k]}</span> }))} />
      </Section>
      <Section title="Decision D-021: the indexable set"><MarkdownClient md={indexable} /></Section>
    </div>
  );
}

function Tools({ rows }: { rows: Row[] }) {
  const filters: Filter<Row>[] = [{ key: "bucket", label: "Bucket", value: (r) => r.Bucket, options: ["NOW", "NEXT", "LATER"] }];
  const f = useFiltered(rows, filters, (r) => Object.values(r).join(" "));
  return <><FilterBar filters={filters} state={f} total={rows.length} shown={f.rows.length} /><div className="panel panel-body"><DataTable rows={f.rows} rowKey={(r) => r.ID + r.Rank} exportName="tools" columns={Object.keys(rows[0] || {}).map((k) => ({ key: k, label: k, value: (r: Row) => (/^\d+(\.\d+)?$/.test(r[k]) ? Number(r[k]) : r[k]), render: (r: Row) => <span className={/Tool/.test(k) ? "cell-title small" : "small"}>{r[k]}</span> }))} /></div></>;
}
