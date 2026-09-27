"use client";
import Link from "next/link";
import { Check, FileImage } from "lucide-react";
import { useStatus } from "@/lib/state/client";
import { TASK_STATUSES } from "@/lib/status";
import type { EnrichedItem } from "@/lib/enrich";
import { ChannelIcon } from "./channelIcon";
import { CampaignLink, Chip, CopyBlock, ExtLink, OwnerChip, PriorityChip, StatusSelect, cx } from "./ui";

export interface DayContext { cta?: string; landing?: string; kpi?: string; tracking?: string }

export function ItemCard({ item, ctx, highlight, showDate }: { item: EnrichedItem; ctx?: DayContext; highlight?: boolean; showDate?: boolean }) {
  const [status, setStatus] = useStatus(item.id, "TODO");
  const done = status === "DONE";
  const links = item.links.filter((l) => !item.copy.some((c) => c.includes(l)));
  return (
    <article id={item.id} className={cx("item", done && "is-done", status === "BLOCKED" && "is-blocked", highlight && "is-target")}>
      <button
        className={cx("check", done && "is-on")}
        onClick={() => setStatus(done ? "TODO" : "DONE")}
        aria-label={done ? "Mark not done" : "Mark complete"}
        title={done ? "Mark not done" : "Mark complete"}
      >
        <Check size={14} strokeWidth={3} />
      </button>
      <div className="min-w-0">
        <div className="item-top">
          <ChannelIcon channel={item.channel} />
          <span className="item-channel">{item.channelLabel}</span>
          {showDate && <span className="muted small mono">{item.date}</span>}
          <PriorityChip p={item.priority} />
          {item.owner.split(", ").map((o) => <OwnerChip key={o} owner={o} />)}
          {item.paid && <Chip tone="warn">Paid</Chip>}
          {item.franchises.map((f) => <Chip key={f} title="Recurring franchise">{f}</Chip>)}
          <span style={{ marginLeft: "auto" }}>
            <StatusSelect value={status} options={TASK_STATUSES} onChange={setStatus} ariaLabel={`Status for ${item.channelLabel}`} />
          </span>
        </div>
        {item.instruction && <p className="item-instr">{item.instruction}</p>}
        {item.copy.map((c, i) => <CopyBlock key={i} text={c} />)}
        {!item.copy.length && item.campaignCopy && (
          <details className="details">
            <summary>Approved {item.campaignCopy.campaign} copy for {item.channelLabel}</summary>
            <CopyBlock text={item.campaignCopy.text} meta={`From the campaign library (${item.campaignCopy.campaign})`} />
          </details>
        )}
        <div className="item-foot">
          {item.campaigns.map((c) => <CampaignLink key={c} id={c} />)}
          {item.briefFor.map((c) => (
            <Link key={c} className="chip chip-link" href={`/campaigns/${c}#brief`}><FileImage size={12} /> Creative brief</Link>
          ))}
          {item.sizes.length > 0 && <span title="Asset sizes">Asset: {item.sizes.join(", ")}</span>}
          {links.slice(0, 2).map((l) => <ExtLink key={l} href={l}>Open link</ExtLink>)}
          {ctx && (ctx.cta || ctx.kpi) && (
            <details className="details" style={{ flexBasis: "100%" }}>
              <summary>CTA, landing page, KPI</summary>
              <dl className="kv">
                {ctx.cta && <><dt>CTA</dt><dd>{ctx.cta}</dd></>}
                {ctx.landing && <><dt>Landing page</dt><dd>{ctx.landing}</dd></>}
                {ctx.kpi && <><dt>KPI</dt><dd>{ctx.kpi}</dd></>}
                {ctx.tracking && <><dt>Tracking</dt><dd className="mono small">{ctx.tracking}</dd></>}
              </dl>
            </details>
          )}
        </div>
      </div>
    </article>
  );
}
