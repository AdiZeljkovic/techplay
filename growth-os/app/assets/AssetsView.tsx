"use client";
import Link from "next/link";
import { useState } from "react";
import { useGrowth } from "@/lib/state/client";
import { ASSET_STATUSES, OWNERS } from "@/lib/status";
import { fmt } from "@/lib/dates";
import type { Asset } from "@/lib/types";
import { DataTable, Drawer, FilterBar, useFiltered, type Column, type Filter } from "@/components/DataView";
import { CampaignLink, OwnerChip, PageHeader, StatusSelect } from "@/components/ui";
import { EditableField } from "@/components/Editable";

export function AssetsView({ rows, briefIds }: { rows: Asset[]; briefIds: string[] }) {
  const { state, dispatch } = useGrowth();
  const [open, setOpen] = useState<Asset | null>(null);
  const status = (a: Asset) => state.status[a.id] ?? "NEEDED";
  const owner = (a: Asset) => state.fields[a.id]?.owner || a.owner;
  const setStatus = (a: Asset, v: string) => dispatch({ op: "setStatus", id: a.id, status: v === "NEEDED" ? null : v });
  const filters: Filter<Asset>[] = [
    { key: "status", label: "Status", value: status, options: [...ASSET_STATUSES] },
    { key: "kind", label: "Kind", value: (a) => (a.campaign ? "Campaign creative" : "Franchise template fill"), options: ["Campaign creative", "Franchise template fill"] },
    { key: "channel", label: "Channel", value: (a) => a.channel },
    { key: "campaign", label: "Campaign", value: (a) => a.campaign },
    { key: "month", label: "Due", value: (a) => (a.due ? fmt(`${a.due.slice(0, 7)}-01`, { month: "long" }) : "No date") },
    { key: "owner", label: "Owner", value: owner, options: [...OWNERS] },
  ];
  const f = useFiltered(rows, filters, (a) => `${a.format} ${a.brief} ${a.campaignName} ${a.headline}`);
  const columns: Column<Asset>[] = [
    { key: "due", label: "Due", render: (a) => <span className="mono small">{fmt(a.due)}</span> },
    { key: "campaign", label: "Campaign", render: (a) => (a.campaign ? <CampaignLink id={a.campaign} /> : <span className="small muted">Franchise</span>) },
    { key: "format", label: "Format", render: (a) => <div><div className="cell-title small">{a.dimensions || a.format}</div><div className="cell-sub clamp-2">{a.format}</div></div> },
    { key: "channel", label: "Channel", hideOnMobile: true },
    { key: "brief", label: "Visual brief", hideOnMobile: true, render: (a) => <span className="small clamp-2">{a.brief}</span> },
    { key: "owner", label: "Owner", value: owner, render: (a) => <OwnerChip owner={owner(a)} /> },
    { key: "status", label: "Status", value: status, render: (a) => <span onClick={(e) => e.stopPropagation()}><StatusSelect value={status(a)} options={ASSET_STATUSES} onChange={(v) => setStatus(a, v)} /></span> },
  ];
  const counts = ASSET_STATUSES.map((s) => [s, rows.filter((a) => status(a) === s).length] as const);
  return (
    <div>
      <PageHeader title="Assets" sub={<>Creative the plan needs: campaign creative with briefs, and the franchise template fill for each day. {counts.map(([s, n]) => `${n} ${s.toLowerCase().replace("_", " ")}`).join(" · ")}</>} />
      <FilterBar filters={filters} state={f} total={rows.length} shown={f.rows.length} />
      <div className="panel panel-body"><DataTable rows={f.rows} columns={columns} rowKey={(a) => a.id} onRowClick={setOpen} exportName="assets" initialSort={{ key: "due", dir: 1 }} /></div>
      <Drawer open={Boolean(open)} onClose={() => setOpen(null)} title={open ? `${open.dimensions || open.format}` : ""}>
        {open && (
          <div className="stack">
            <div className="row"><StatusSelect value={status(open)} options={ASSET_STATUSES} onChange={(v) => setStatus(open, v)} />{open.campaign && <CampaignLink id={open.campaign} />}</div>
            <dl className="kv">
              <dt>Campaign</dt><dd>{open.campaignName}</dd>
              <dt>Channel</dt><dd>{open.channel}</dd>
              <dt>Format</dt><dd>{open.format}</dd>
              <dt>Dimensions</dt><dd className="mono">{open.dimensions || "—"}</dd>
              {open.headline && <><dt>Headline</dt><dd>{open.headline}</dd></>}
              {open.copy && <><dt>CTA / copy</dt><dd>{open.copy}</dd></>}
              <dt>Visual brief</dt><dd>{open.brief}</dd>
              <dt>Due</dt><dd>{fmt(open.due, { weekday: "long", day: "numeric", month: "long" })}</dd>
            </dl>
            {open.campaign && briefIds.includes(open.campaign) && <Link className="btn btn-sm" href={`/campaigns/${open.campaign}#brief`}>Full creative brief for {open.campaign}</Link>}
            <label className="field"><span>Owner</span>
              <select className="select" value={owner(open)} onChange={(e) => dispatch({ op: "setField", id: open.id, key: "owner", value: e.target.value === open.owner ? "" : e.target.value })}>{OWNERS.map((o) => <option key={o}>{o}</option>)}</select>
            </label>
            <EditableField id={open.id} field="link" label="File link (Figma/Canva/Drive)" multiline={false} placeholder="https://…" />
            <EditableField id={open.id} field="notes" label="Notes" />
            <p className="muted small">Export settings, naming and the pre-publish checklist: <Link href="/docs/29-CREATIVE-BRIEFS" style={{ color: "var(--info)" }}>29-CREATIVE-BRIEFS §4</Link>.</p>
          </div>
        )}
      </Drawer>
    </div>
  );
}
