import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { getAssets, getBriefs, getCalendar, getCampaign, getPaid } from "@/lib/data";
import { getPlanDate } from "@/lib/server-date";
import { defaultCampaignStatus } from "@/lib/campaign";
import { fmt } from "@/lib/dates";
import { normPriority } from "@/lib/status";
import { Markdown } from "@/components/Markdown";
import { CopyBlock, PageHeader, PriorityChip, Section } from "@/components/ui";
import { CampaignControls, CampaignNotes, AssetStatusList } from "./CampaignClient";

const CH: Record<string, string> = {
  facebook: "Facebook", facebook_groups: "Facebook Groups", instagram: "Instagram", tiktok: "TikTok (script)", x: "X", threads: "Threads",
  bluesky: "Bluesky", reddit: "Reddit angle", discord: "Discord", youtube: "YouTube", short_script: "Reel / Short script", newsletter: "Newsletter blurb",
  push: "Push", ad: "Ad copy",
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const c = getCampaign(id);
  return { title: c ? `${c.id} ${c.name}` : "Campaign" };
}

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getCampaign(id);
  if (!c) notFound();
  const pd = await getPlanDate();
  const brief = getBriefs()[c.id];
  const paid = getPaid().filter((p) => p.id.startsWith(c.id));
  const assets = getAssets().filter((a) => a.campaign === c.id);
  const days = getCalendar()
    .map((d) => ({ date: d.date, items: d.items.filter((i) => i.campaigns.some((x) => x.startsWith(c.id))) }))
    .filter((d) => d.items.length);
  const copy = Object.entries(c.copy || {}).filter(([, v]) => v && v.trim());
  const extra = Object.entries(c.extra_copy || {});
  const utmCampaign = (c.utm_example.match(/utm_campaign=([^&]+)/) || [])[1] || "";

  return (
    <div>
      <p className="small"><Link href="/campaigns" style={{ color: "var(--info)" }}>← Campaigns</Link></p>
      <PageHeader
        title={`${c.id} · ${c.name}`}
        sub={<>{c.type}{c.secondary_type ? ` / ${c.secondary_type}` : ""} · {fmt(c.start, { day: "numeric", month: "short", year: "numeric" })} – {fmt(c.end, { day: "numeric", month: "short", year: "numeric" })} · Owner: {c.owner}</>}
        actions={<><PriorityChip p={normPriority(c.priority)} /><CampaignControls id={c.id} def={defaultCampaignStatus(c, pd.date)} /></>}
      />
      <div className="grid split-wide">
        <div className="stack">
          <Section title="Goal and message">
            <dl className="kv">
              <dt>Goal</dt><dd>{c.goal}</dd>
              <dt>KPI</dt><dd>{c.kpi}</dd>
              <dt>Target</dt><dd>{c.target}</dd>
              <dt>Core message</dt><dd><b>{c.message}</b></dd>
              {c.proof && <><dt>Proof</dt><dd>{c.proof}</dd></>}
              <dt>Audience</dt><dd>{c.audience.join(", ")}</dd>
              <dt>Channels</dt><dd>{c.channels.join(" · ")}</dd>
              <dt>CTA</dt><dd>{c.cta}</dd>
              <dt>Landing page</dt><dd>{c.landing_page}</dd>
              <dt>Budget</dt><dd className="mono">${c.budget_usd}{c.budget_note ? ` · ${c.budget_note}` : ""}</dd>
              {c.effort_hours && <><dt>Effort</dt><dd>{c.effort_hours}</dd></>}
              {c.delivery_status && <><dt>Delivery status</dt><dd>{c.delivery_status}</dd></>}
            </dl>
          </Section>

          <Section title="Platform copy" count={copy.length}>
            {copy.length === 0 && <p className="muted small">No per-channel copy in the library for this campaign; see extra copy below.</p>}
            {copy.map(([k, v]) => (
              <div key={k} style={{ marginBottom: 10 }}>
                <h3>{CH[k] || k}</h3>
                <CopyBlock text={v} />
              </div>
            ))}
          </Section>

          {extra.length > 0 && (
            <Section title="Emails, pages, pitches and other copy" count={extra.length}>
              {extra.map(([k, v]) => (
                <div key={k} style={{ marginBottom: 10 }}>
                  <h3>{k}</h3>
                  <CopyBlock text={typeof v === "string" ? v : JSON.stringify(v, null, 2)} />
                </div>
              ))}
            </Section>
          )}

          {paid.length > 0 && (
            <Section title="Paid set-up" count={paid.length}>
              {paid.map((p) => (
                <div key={p.id} style={{ marginBottom: 12 }}>
                  <h3>{p.id} · {p.name} <span className="muted small">({p.platform})</span></h3>
                  <dl className="kv">{Object.entries(p.fields).map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}</dl>
                </div>
              ))}
              <Link className="small" href="/paid" style={{ color: "var(--info)" }}>Track spend and results in Paid Media →</Link>
            </Section>
          )}

          <Section title="Creative brief" id="brief">
            {brief ? <Markdown md={brief.body} /> : <p className="muted small">No dedicated brief in 29-CREATIVE-BRIEFS; use the creative list and the franchise templates.</p>}
            <h3 style={{ marginTop: 12 }}>Creative needed</h3>
            <ul className="list">{c.creative.map((cr, i) => <li key={i}><span className="chip mono">{cr.size}</span><div className="list-main small">{cr.concept}</div></li>)}</ul>
          </Section>
        </div>

        <div className="stack">
          <Section title="Notes & results"><CampaignNotes id={c.id} /></Section>
          <Section title="Tracking">
            <dl className="kv" style={{ gridTemplateColumns: "90px 1fr" }}>
              <dt>Events</dt><dd>{c.tracking_events.map((e) => <span key={e} className="chip mono" style={{ margin: "0 4px 4px 0" }}>{e}</span>)}</dd>
            </dl>
            {(c.tracking_notes || []).map((n, i) => <p key={i} className="small muted">{n}</p>)}
            <div className="small muted">UTM example</div>
            <CopyBlockLite url={c.utm_example} />
            <div className="row">
              <Link className="btn btn-sm" href={`/utm?campaign=${encodeURIComponent(utmCampaign)}`}>Build a UTM for {c.id}</Link>
            </div>
          </Section>
          <Section title="Timeline">
            <ul className="list">{c.key_dates.map((k, i) => <li key={i} className="small">{k}</li>)}</ul>
            <h3 style={{ marginTop: 10 }}>In the daily calendar</h3>
            {days.length === 0 ? <p className="muted small">No calendar items reference {c.id} directly.</p> : (
              <ul className="list">
                {days.slice(0, 40).map((d) => (
                  <li key={d.date}><Link href={`/today?date=${d.date}`} className="date-badge" style={{ color: "var(--info)" }}>{fmt(d.date)}</Link><div className="list-main small">{d.items.map((i) => i.channelLabel).join(", ")}</div></li>
                ))}
              </ul>
            )}
          </Section>
          <Section title="Assets" count={assets.length}><AssetStatusList assets={assets} /></Section>
          <Section title="Dependencies & follow-up">
            <p className="small">{c.dependencies.join(" · ") || "None"}</p>
            <p className="small"><b>Follow-up:</b> {c.follow_up}</p>
            {c.risks && <p className="small"><b>Risks:</b> {c.risks}</p>}
            {(c.acceptance_criteria || []).length > 0 && <><h3>Acceptance criteria</h3><ul className="small">{c.acceptance_criteria!.map((a, i) => <li key={i}>{a}</li>)}</ul></>}
            <p className="small"><Link style={{ color: "var(--info)" }} href="/docs/28-CAMPAIGN-LIBRARY">Source: 28-CAMPAIGN-LIBRARY</Link></p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function CopyBlockLite({ url }: { url: string }) {
  return <CopyBlock text={url} />;
}
