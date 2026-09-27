"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGrowth } from "@/lib/state/client";
import { CAMPAIGN_STATUSES } from "@/lib/status";
import { fmt } from "@/lib/dates";
import { DataTable, FilterBar, useFiltered, type Column, type Filter } from "@/components/DataView";
import { Chip, OwnerChip, PageHeader, PriorityChip, StatusSelect, Tabs } from "@/components/ui";

export interface CampaignRow {
  id: string; name: string; type: string; goal: string; target: string; kpi: string; audience: string[]; channels: string[];
  start: string; end: string; budget: number; cta: string; landing: string; owner: string; dependencies: string[]; priority: string; def: string; hasBrief: boolean; delivery: string;
}

const ownerCodes = (o: string) => ["EIC", "ED", "SC", "DS", "DEV"].filter((c) => new RegExp(`\\b${c}\\b`).test(o));

export function CampaignsView({ rows }: { rows: CampaignRow[] }) {
  const { state, dispatch } = useGrowth();
  const router = useRouter();
  const [mode, setMode] = useState<"table" | "cards">("table");
  const status = (r: CampaignRow) => state.status[r.id] ?? r.def;
  const setStatus = (r: CampaignRow, v: string) => dispatch({ op: "setStatus", id: r.id, status: v === r.def ? null : v });
  const filters: Filter<CampaignRow>[] = [
    { key: "status", label: "Status", value: status, options: [...CAMPAIGN_STATUSES] },
    { key: "type", label: "Type", value: (r) => r.type },
    { key: "owner", label: "Owner", value: (r) => ownerCodes(r.owner), options: ["EIC", "ED", "SC", "DS", "DEV"] },
    { key: "priority", label: "Priority", value: (r) => r.priority, options: ["P0", "P1", "P2", "P3"] },
    { key: "month", label: "Running in", value: (r) => ["2026-09", "2026-10", "2026-11", "2026-12", "2027-01"].filter((m) => r.start.slice(0, 7) <= m && (r.end || r.start).slice(0, 7) >= m).map((m) => fmt(`${m}-01`, { month: "long", year: "numeric" })) },
    { key: "channel", label: "Channel", value: (r) => r.channels.map((c) => c.replace(/\s*\(.*\)$/, "")) },
    { key: "paid", label: "Organic/Paid", value: (r) => (r.budget > 0 ? "Paid" : "Organic"), options: ["Organic", "Paid"] },
  ];
  const f = useFiltered(rows, filters, (r) => `${r.id} ${r.name} ${r.goal} ${r.channels.join(" ")}`);
  const columns: Column<CampaignRow>[] = [
    { key: "id", label: "ID", width: "56px", render: (r) => <Link className="chip chip-link" href={`/campaigns/${r.id}`}>{r.id}</Link> },
    { key: "name", label: "Campaign", render: (r) => <div><Link href={`/campaigns/${r.id}`} className="cell-title">{r.name}</Link><div className="cell-sub clamp-2">{r.goal}</div></div> },
    { key: "status", label: "Status", value: status, render: (r) => <span onClick={(e) => e.stopPropagation()}><StatusSelect value={status(r)} options={CAMPAIGN_STATUSES} onChange={(v) => setStatus(r, v)} /></span> },
    { key: "priority", label: "Pri", render: (r) => <PriorityChip p={r.priority} /> },
    { key: "type", label: "Type", hideOnMobile: true },
    { key: "start", label: "Start", render: (r) => <span className="mono small">{fmt(r.start, { day: "numeric", month: "short" })}</span> },
    { key: "end", label: "End", render: (r) => <span className="mono small">{fmt(r.end, { day: "numeric", month: "short" })}</span>, hideOnMobile: true },
    { key: "audience", label: "Audience", hideOnMobile: true, render: (r) => <span className="small">{r.audience.join(", ")}</span> },
    { key: "channels", label: "Channels", hideOnMobile: true, render: (r) => <span className="small clamp-2">{r.channels.join(", ")}</span> },
    { key: "budget", label: "Budget", value: (r) => r.budget, render: (r) => <span className="mono small">{r.budget ? `$${r.budget}` : "$0"}</span>, hideOnMobile: true },
    { key: "owner", label: "Owner", hideOnMobile: true, render: (r) => <div className="row">{ownerCodes(r.owner).map((o) => <OwnerChip key={o} owner={o} />)}</div> },
    { key: "results", label: "Results", hideOnMobile: true, sortable: false, render: (r) => <span className="small clamp-2">{state.fields[r.id]?.results || <span className="muted">—</span>}</span> },
  ];
  return (
    <div>
      <PageHeader title="Campaigns" sub="All 71 campaigns from the campaign library. Status defaults from the dates; change it here and it sticks." actions={<Tabs tabs={[{ id: "table", label: "Table" }, { id: "cards", label: "Cards" }]} value={mode} onChange={setMode} />} />
      <FilterBar filters={filters} state={f} total={rows.length} shown={f.rows.length} />
      {mode === "table" ? (
        <div className="panel panel-body"><DataTable rows={f.rows} columns={columns} rowKey={(r) => r.id} onRowClick={(r) => router.push(`/campaigns/${r.id}`)} exportName="campaigns" /></div>
      ) : (
        <div className="cards">
          {f.rows.map((r) => (
            <Link key={r.id} href={`/campaigns/${r.id}`} className="card">
              <div className="row-between"><span className="chip chip-link">{r.id}</span><span className="row"><PriorityChip p={r.priority} /><Chip tone={status(r) === "ACTIVE" ? "info" : status(r) === "COMPLETE" ? "good" : status(r) === "PAUSED" ? "warn" : "neutral"}>{status(r).toLowerCase()}</Chip></span></div>
              <div className="card-title">{r.name}</div>
              <div className="small muted clamp-3">{r.goal}</div>
              <dl className="kv" style={{ gridTemplateColumns: "80px 1fr", margin: 0 }}>
                <dt>Dates</dt><dd className="mono small">{fmt(r.start)} – {fmt(r.end)}</dd>
                <dt>CTA</dt><dd className="small">{r.cta}</dd>
                <dt>Budget</dt><dd className="mono small">${r.budget}</dd>
                <dt>Owner</dt><dd className="small">{r.owner}</dd>
              </dl>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
