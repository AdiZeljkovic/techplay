import { getCalendar, getCampaigns, getKpis, getOpportunities, getPr, getSeedTasks } from "@/lib/data";
import { getPlanDate } from "@/lib/server-date";
import { addDays, diffDays, mondayOf, monthKey } from "@/lib/dates";
import { defaultCampaignStatus } from "@/lib/campaign";
import { OverviewView } from "./OverviewView";

export default async function OverviewPage() {
  const pd = await getPlanDate();
  const date = pd.date;
  const cal = getCalendar();
  const day = cal.find((d) => d.date === date)!;
  const wkStart = mondayOf(date), wkEnd = addDays(wkStart, 6);
  const weekIds = cal.filter((d) => d.date >= wkStart && d.date <= wkEnd).flatMap((d) => d.items.map((i) => ({ id: i.id, owner: i.owner })));
  const monthIds = cal.filter((d) => monthKey(d.date) === monthKey(date)).flatMap((d) => d.items.map((i) => ({ id: i.id, owner: i.owner })));
  const todayItems = day.items.map((i) => ({ id: i.id, owner: i.owner, channel: i.channelLabel, instruction: i.instruction || i.copy[0] || "", priority: i.priority, group: i.group }));
  const campaigns = getCampaigns().map((c) => ({ id: c.id, name: c.name, type: c.type, start: c.start, end: c.end, owner: c.owner, def: defaultCampaignStatus(c, date) }));
  const horizon = addDays(date, 21);
  const opp = getOpportunities();
  const upcoming = opp.keyDates.filter((k) => k.date && k.date >= date && k.date <= horizon).map((k) => ({ id: k.id, date: k.date!, title: k.event, sub: `${k.type} · ${k.confidence}` }));
  const in7 = addDays(date, 7);
  const deadlines = [
    ...getSeedTasks().filter((t) => t.due && t.due >= date && t.due <= in7 && (t.priority === "P0" || t.priority === "P1")).map((t) => ({ id: t.id, date: t.due!, title: t.title, sub: `${t.owner} · ${t.source}`, kind: "task" as const, priority: t.priority })),
    ...getCampaigns().filter((c) => c.start > date && c.start <= in7).map((c) => ({ id: c.id, date: c.start, title: `${c.id} ${c.name} starts`, sub: c.owner, kind: "campaign" as const, priority: "P1" })),
    ...getPr().filter((p) => p.date && p.date >= date && p.date <= in7).map((p) => ({ id: p.id, date: p.date!, title: `${p.id} ${p.name}`, sub: `PR · ${p.owner}`, kind: "pr" as const, priority: p.tier === "A" ? "P0" : "P1" })),
  ].sort((a, b) => a.date.localeCompare(b.date));
  const quickWins = getSeedTasks().filter((t) => t.id.startsWith("QW-")).map((t) => ({ id: t.id, title: t.title, owner: t.owner, due: t.due, priority: t.priority }));
  const topOpp = opp.items.slice().sort((a, b) => a.rank - b.rank).slice(0, 6).map((o) => ({ id: o.id, title: o.title, type: o.type, total: o.total }));
  const kpiIds = ["K00", "K07", "K08", "K09", "K10", "K02"];
  const kpis = getKpis().filter((k) => kpiIds.includes(k.id)).map((k) => ({ id: k.id, name: k.name, baseline: k.baseline.value, targets: k.targets }));
  const yearLeft = diffDays(date, "2026-12-31");
  return (
    <OverviewView
      date={date}
      day={{ objective: day.objective, theme: day.theme, priority: day.priority, kpi: day.kpi, audience: day.audience }}
      todayItems={todayItems} weekIds={weekIds} monthIds={monthIds} campaigns={campaigns} upcoming={upcoming}
      deadlines={deadlines} quickWins={quickWins} topOpp={topOpp} kpis={kpis} yearLeft={yearLeft}
    />
  );
}
