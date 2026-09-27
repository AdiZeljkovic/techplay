"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EnrichedItem } from "@/lib/enrich";
import type { Channel, CopyEntry, Section as Sec } from "@/lib/types";
import { fmt } from "@/lib/dates";
import { ItemCard } from "@/components/ItemCard";
import { Chip, CopyBlock, Empty, PageHeader, Section, Tabs } from "@/components/ui";
import { MarkdownClient } from "@/components/MarkdownClient";

export function SocialView({ tabs, tab, date, today, upcoming, channels, franchises, copy, doc, perWeek }: {
  tabs: { id: string; label: string }[]; tab: string; date: string; today: EnrichedItem[]; upcoming: EnrichedItem[]; channels: Channel[];
  franchises: Sec[]; copy: CopyEntry[]; doc: string; perWeek: number;
}) {
  const router = useRouter();
  const label = tabs.find((t) => t.id === tab)?.label;
  const byDate = upcoming.reduce<Record<string, EnrichedItem[]>>((acc, i) => { (acc[i.date] ||= []).push(i); return acc; }, {});
  const inactive = channels.length > 0 && channels.every((c) => c.priority === "NOT NOW");
  return (
    <div>
      <PageHeader title="Social" sub={`${label}: strategy, today's posts, the next 7 days, recurring formats and approved copy. ${perWeek} planned items in the next 7 days.`}
        actions={<Link className="btn btn-sm" href={`/docs/${doc}`}>Full playbook ({doc})</Link>} />
      <Tabs tabs={tabs} value={tab} onChange={(t) => router.push(`/social?tab=${t}`)} />
      {inactive && <div className="notice" style={{ margin: "0 0 12px" }}>{label} is classed NOT NOW in the channel strategy. Nothing is scheduled; the reasons are below.</div>}
      <div className="grid split-wide">
        <div className="stack">
          <Section title={`Today · ${fmt(date)}`} count={today.length}>
            {today.length ? today.map((i) => <ItemCard key={i.id} item={i} />) : <Empty title={`Nothing on ${label} today`} />}
          </Section>
          <Section title="Next 7 days" count={upcoming.length}>
            {Object.keys(byDate).length === 0 && <Empty title="Nothing scheduled" />}
            {Object.entries(byDate).map(([d, list]) => (
              <div key={d} style={{ marginBottom: 10 }}>
                <div className="item-group-head"><Link href={`/today?date=${d}`}>{fmt(d, { weekday: "long", day: "numeric", month: "short" })}</Link></div>
                {list.map((i) => <ItemCard key={i.id} item={i} />)}
              </div>
            ))}
          </Section>
          <Section title="Approved copy and examples" count={copy.length}>
            {copy.length === 0 ? <p className="muted small">No channel-specific examples; see the Copy Library.</p> : copy.slice(0, 20).map((c) => (
              <div key={c.id} style={{ marginBottom: 8 }}><div className="small muted">{c.label}</div><CopyBlock text={c.text} meta={c.source} /></div>
            ))}
            <Link className="small" style={{ color: "var(--info)" }} href="/copy">All copy →</Link>
          </Section>
        </div>
        <div className="stack">
          {channels.map((c) => (
            <Section key={c.id} title={c.name} actions={<Chip tone={c.priority === "PRIMARY" ? "accent" : c.priority === "NOT NOW" ? "bad" : c.priority === "EXPERIMENTAL" ? "warn" : "neutral"}>{c.priority}</Chip>}>
              <dl className="kv" style={{ gridTemplateColumns: "96px 1fr" }}>
                <dt>Role</dt><dd>{c.role}</dd>
                <dt>Frequency</dt><dd>{c.frequency_per_week}/week · owner {c.owner} · ~{c.weekly_hours_estimate} h/week</dd>
                <dt>Audience</dt><dd>{c.audiences.join(", ")}</dd>
                <dt>Formats</dt><dd>{c.formats.join(" · ")}</dd>
                <dt>Voice</dt><dd>{c.voice}</dd>
                <dt>CTA</dt><dd>{c.primary_cta}</dd>
                <dt>KPI</dt><dd>{c.success_metric} <span className="mono small">({c.kpi_event})</span></dd>
                <dt>Workflow</dt><dd>{c.workflow}</dd>
                <dt>Don't</dt><dd>{c.do_not}</dd>
              </dl>
            </Section>
          ))}
          <Section title="Recurring formats" count={franchises.length}>
            {franchises.length === 0 && <p className="muted small">No franchise lists this platform.</p>}
            {franchises.map((f) => (
              <details key={f.id} className="details" style={{ marginBottom: 6 }}>
                <summary><b>{f.title}</b></summary>
                <MarkdownClient md={f.body} />
              </details>
            ))}
          </Section>
        </div>
      </div>
    </div>
  );
}
