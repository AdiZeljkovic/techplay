"use client";
import { useGrowth } from "@/lib/state/client";
import { ASSET_STATUSES, CAMPAIGN_STATUSES } from "@/lib/status";
import type { Asset } from "@/lib/types";
import { fmt } from "@/lib/dates";
import { EditableField } from "@/components/Editable";
import { StatusSelect } from "@/components/ui";

export function CampaignControls({ id, def }: { id: string; def: string }) {
  const { state, dispatch } = useGrowth();
  const v = state.status[id] ?? def;
  return <StatusSelect value={v} options={CAMPAIGN_STATUSES} onChange={(s) => dispatch({ op: "setStatus", id, status: s === def ? null : s })} ariaLabel="Campaign status" />;
}

export function CampaignNotes({ id }: { id: string }) {
  return (
    <div className="stack" style={{ gap: 10 }}>
      <EditableField id={id} field="results" label="Results (numbers, links, what happened)" placeholder="e.g. 14 Oct: 38 reminders set from 1,120 sessions; 2 referring domains" />
      <EditableField id={id} field="notes" label="Notes" placeholder="Decisions, blockers, changes to copy…" />
    </div>
  );
}

export function AssetStatusList({ assets }: { assets: Asset[] }) {
  const { state, dispatch } = useGrowth();
  if (!assets.length) return <p className="muted small">No assets listed.</p>;
  return (
    <ul className="list">
      {assets.map((a) => (
        <li key={a.id}>
          <div className="list-main small"><b className="mono">{a.format}</b><div className="muted clamp-2">{a.brief}</div><div className="muted">Due {fmt(a.due)} · {a.owner}</div></div>
          <StatusSelect value={state.status[a.id] ?? "NEEDED"} options={ASSET_STATUSES} onChange={(s) => dispatch({ op: "setStatus", id: a.id, status: s === "NEEDED" ? null : s })} />
        </li>
      ))}
    </ul>
  );
}
