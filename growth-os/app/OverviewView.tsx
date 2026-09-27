"use client";
import Link from "next/link";
import { useGrowth } from "@/lib/state/client";
import { fmt } from "@/lib/dates";
import { Sparkline, fmtNum } from "@/components/Kpi";
import { CampaignLink, Chip, Empty, OwnerChip, PageHeader, PriorityChip, Progress, Section, StatusChip } from "@/components/ui";

type Owned = { id: string; owner: string };
interface Props {
  date: string;
  day: { objective: string; theme: string; priority: string; kpi: string; audience: string };
  todayItems: (Owned & { channel: string; instruction: string; priority: string; group: string })[];
  weekIds: Owned[]; monthIds: Owned[];
  campaigns: { id: string; name: string; type: string; start: string; end: string; owner: string; def: string }[];
  upcoming: { id: string; date: string; title: string; sub: string }[];
  deadlines: { id: string; date: string; title: string; sub: string; kind: "task" | "campaign" | "pr"; priority: string }[];
  quickWins: { id: string; title: string; owner: string; due: string | null; priority: string }[];
  topOpp: { id: string; title: string; type: string; total: number }[];
  kpis: { id: string; name: string; baseline: string; targets: Record<string, string> }[];
  yearLeft: number;
}

export function OverviewView(p: Props) {
  const { state } = useGrowth();
  const va = state.settings.viewAs;
  const mine = <T extends Owned>(xs: T[]) => xs.filter((x) => va === "ALL" || x.owner.split(", ").includes(va));
  const done = (xs: Owned[]) => mine(xs).filter((x) => state.status[x.id] === "DONE").length;
  const today = mine(p.todayItems);
  const open = today.filter((x) => state.status[x.id] !== "DONE");
  const topToday = [...open].sort((a, b) => a.priority.localeCompare(b.priority) || (a.group === "ops" ? -1 : 0)).slice(0, 8);
  const campStatus = (c: Props["campaigns"][number]) => state.status[c.id] ?? c.def;
  const active = p.campaigns.filter((c) => campStatus(c) === "ACTIVE");
  const qwOpen = p.quickWins.filter((q) => state.status[q.id] !== "DONE" && (va === "ALL" || q.owner.includes(va)));
  const nextTarget = Object.keys(p.kpis[0]?.targets || {}).find((d) => d >= p.date) || "2026-12-31";

  return (
    <div>
      <PageHeader
        title="Overview"
        sub={<>{fmt(p.date, { weekday: "long", day: "numeric", month: "long" })} · {p.day.theme}</>}
        actions={<Link href="/today" className="btn btn-primary">Open today's work →</Link>}
      />
      <div className="grid grid-4" style={{ marginBottom: 14 }}>
        <div className="panel panel-body span-2">
          <div className="row" style={{ marginBottom: 4 }}><span className="muted small">Today's primary goal</span><PriorityChip p={p.day.priority} /></div>
          <div className="day-objective" style={{ margin: 0 }}>{p.day.objective}</div>
          <div className="small muted" style={{ marginTop: 6 }}>Audience: {p.day.audience}</div>
        </div>
        <div className="panel panel-body stack" style={{ gap: 10 }}>
          <Progress done={done(p.todayItems)} total={today.length} label="Today" />
          <Progress done={done(p.weekIds)} total={mine(p.weekIds).length} label="This week" />
          <Progress done={done(p.monthIds)} total={mine(p.monthIds).length} label="This month" />
        </div>
        <div className="panel panel-body grid grid-2" style={{ gap: 8 }}>
          <div className="stat"><span className="stat-value">{active.length}</span><span className="stat-label">Active campaigns</span></div>
          <div className="stat"><span className="stat-value">{open.length}</span><span className="stat-label">Open items today</span></div>
          <div className="stat"><span className="stat-value">{qwOpen.length}</span><span className="stat-label">Quick wins open</span></div>
          <div className="stat"><span className="stat-value">{p.yearLeft}</span><span className="stat-label">Days left in 2026</span></div>
        </div>
      </div>

      <div className="grid grid-3">
        <Section title="Today's tasks" count={open.length} actions={<Link href="/today" className="small" style={{ color: "var(--info)" }}>All →</Link>}>
          {topToday.length === 0 ? <Empty title="Everything for today is done" /> : (
            <ul className="list">
              {topToday.map((t) => (
                <li key={t.id}>
                  <PriorityChip p={t.priority} />
                  <div className="list-main">
                    <Link href={`/today#${encodeURIComponent(t.id)}`} className="small"><b>{t.channel}</b> · <span className="clamp-2">{t.instruction}</span></Link>
                  </div>
                  <OwnerChip owner={t.owner.split(", ")[0]} />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Critical deadlines · next 7 days" count={p.deadlines.length}>
          {p.deadlines.length === 0 ? <Empty title="No dated deadlines this week" /> : (
            <ul className="list">
              {p.deadlines.slice(0, 10).map((d) => (
                <li key={`${d.kind}:${d.id}`}>
                  <span className="date-badge">{fmt(d.date, { day: "numeric", month: "short" })}</span>
                  <div className="list-main">
                    <Link className="small cell-title clamp-2" href={d.kind === "campaign" ? `/campaigns/${d.id}` : d.kind === "pr" ? `/pr?focus=${d.id}` : `/tasks?focus=${encodeURIComponent(d.id)}`}>{d.title}</Link>
                    <div className="small muted">{d.sub}</div>
                  </div>
                  {d.kind === "task" && state.status[d.id] === "DONE" ? <StatusChip status="DONE" /> : <PriorityChip p={d.priority} />}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Active campaigns" count={active.length} actions={<Link href="/campaigns" className="small" style={{ color: "var(--info)" }}>All →</Link>}>
          <ul className="list">
            {active.slice(0, 10).map((c) => (
              <li key={c.id}>
                <CampaignLink id={c.id} />
                <div className="list-main"><div className="small cell-title">{c.name}</div><div className="small muted">{c.type} · ends {fmt(c.end, { day: "numeric", month: "short" })}</div></div>
              </li>
            ))}
            {active.length > 10 && <li className="small muted">+{active.length - 10} more</li>}
          </ul>
        </Section>

        <Section title="KPIs" count={p.kpis.length} actions={<Link href="/analytics" className="small" style={{ color: "var(--info)" }}>Enter values →</Link>}>
          <div className="stack" style={{ gap: 10 }}>
            {p.kpis.map((k) => {
              const vals = state.metrics.filter((m) => m.metric === k.id);
              const last = [...vals].sort((a, b) => b.date.localeCompare(a.date))[0];
              return (
                <div key={k.id}>
                  <div className="row-between"><span className="small cell-title">{k.name.replace(/ — North Star/, "")}</span><span className="mono">{last ? fmtNum(last.value) : "—"}</span></div>
                  <div className="small muted">{last ? `as of ${fmt(last.date, { day: "numeric", month: "short" })}` : `Baseline: ${k.baseline}`} · {k.targets[nextTarget] || ""} by {fmt(nextTarget, { day: "numeric", month: "short" })}</div>
                  <Sparkline values={vals} />
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Upcoming launches & moments · 3 weeks" count={p.upcoming.length}>
          <ul className="list">
            {p.upcoming.slice(0, 10).map((u) => (
              <li key={u.id}><span className="date-badge">{fmt(u.date, { day: "numeric", month: "short" })}</span><div className="list-main"><div className="small cell-title">{u.title}</div><div className="small muted">{u.sub}</div></div></li>
            ))}
          </ul>
        </Section>

        <div className="stack">
          <Section title="Quick wins" count={qwOpen.length} actions={<Link href="/tasks?source=Quick" className="small" style={{ color: "var(--info)" }}>All →</Link>}>
            <ul className="list">
              {qwOpen.slice(0, 5).map((q) => (
                <li key={q.id}><PriorityChip p={q.priority} /><div className="list-main small clamp-2">{q.title}</div><OwnerChip owner={q.owner} /></li>
              ))}
              {qwOpen.length === 0 && <li className="small muted">All quick wins done.</li>}
            </ul>
          </Section>
          <Section title="Priority opportunities" actions={<Link href="/opportunities" className="small" style={{ color: "var(--info)" }}>All →</Link>}>
            <ul className="list">
              {p.topOpp.map((o) => (
                <li key={o.id}><Chip>{o.type}</Chip><div className="list-main small">{o.title}</div><span className="mono small">{o.total}</span></li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}
