"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { CopyEntry } from "@/lib/types";
import { fmt } from "@/lib/dates";
import { FilterBar, useFiltered, type Filter } from "@/components/DataView";
import { CampaignLink, Chip, CopyBlock, Empty, PageHeader } from "@/components/ui";
import { download, toCSV } from "@/lib/csv";

const GROUPS: [string, RegExp][] = [
  ["Facebook", /^Facebook$/], ["Facebook Groups", /Groups/], ["Instagram", /Instagram|Stories/], ["TikTok", /TikTok/],
  ["Reels / Shorts", /Reels|Shorts|YouTube Shorts/], ["YouTube", /^YouTube$/], ["X", /^X$/], ["Threads", /Threads/], ["Bluesky", /Bluesky/],
  ["Discord", /Discord/], ["Reddit", /Reddit/], ["Newsletter & email", /Newsletter|Email|email/], ["Push", /Push/], ["Ads", /^Ads/],
  ["PR & outreach", /PR|outreach|Outreach/], ["Discover & SEO", /Discover|SEO|Editorial|Google News/], ["Site copy", /Site|LinkedIn|Giveaway|GTA 6|Social|Community|Operations|Partnership|Creator/],
];
const groupOf = (ch: string) => GROUPS.find(([, re]) => re.test(ch))?.[0] ?? "Other";

export function CopyLibrary({ rows }: { rows: CopyEntry[] }) {
  const [limit, setLimit] = useState(60);
  const focus = useSearchParams().get("focus") ?? "";
  const filters: Filter<CopyEntry>[] = [
    { key: "group", label: "Channel", value: (r) => groupOf(r.channel), options: GROUPS.map((g) => g[0]).concat("Other") },
    { key: "source", label: "Source", value: (r) => r.source },
    { key: "month", label: "Month", value: (r) => (r.date ? fmt(`${r.date.slice(0, 7)}-01`, { month: "long", year: "numeric" }) : "Undated") },
    { key: "campaign", label: "Campaign", value: (r) => r.campaigns.map((c) => c.slice(0, 3)) },
  ];
  const f = useFiltered(rows, filters, (r) => `${r.text} ${r.label} ${r.channel}`);
  useEffect(() => {
    if (focus) document.getElementById(focus)?.scrollIntoView({ block: "center" });
  }, [focus]);
  const focused = focus ? rows.find((r) => r.id === focus) : null;
  const list = focused && !f.q && !Object.values(f.sel).some(Boolean) ? [focused, ...f.rows.filter((r) => r.id !== focus)] : f.rows;
  return (
    <div>
      <PageHeader
        title="Copy Library"
        sub="Every piece of public-facing copy in the plan: daily calendar posts, campaign copy, subject lines, ads, scripts and outreach. COPY copies the text only."
        actions={<button className="btn btn-ghost btn-sm" onClick={() => download("copy-library.csv", toCSV(f.rows.map((r) => ({ id: r.id, channel: r.channel, date: r.date, campaigns: r.campaigns, label: r.label, text: r.text }))))}>Export CSV</button>}
      />
      <FilterBar filters={filters} state={f} total={rows.length} shown={f.rows.length} />
      {list.length === 0 && <Empty title="No copy matches" hint="Try a shorter search or clear a filter." />}
      <div className="cards" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))" }}>
        {list.slice(0, limit).map((r) => (
          <div key={r.id} id={r.id} className="card" style={focus === r.id ? { boxShadow: "0 0 0 2px var(--focus)" } : undefined}>
            <div className="row">
              <Chip tone="accent">{r.channel}</Chip>
              {r.date && <Link className="mono small muted" href={`/today?date=${r.date}`}>{fmt(r.date)}</Link>}
              {r.campaigns.slice(0, 3).map((c) => <CampaignLink key={c} id={c} />)}
            </div>
            <div className="small muted clamp-2" title={r.label}>{r.label}</div>
            <CopyBlock text={r.text} meta={r.source} />
          </div>
        ))}
      </div>
      {list.length > limit && <div className="row" style={{ justifyContent: "center", marginTop: 12 }}><button className="btn" onClick={() => setLimit(limit + 90)}>Show more ({list.length - limit} left)</button></div>}
    </div>
  );
}
