// Global search. Built once per server process from the synced data.
import { getCalendar, getCampaigns, getContent, getCopy, getDocs, getExperiments, getOpportunities, getPr, getSeedTasks } from "./data";
import { fmt } from "./dates";

export interface SearchHit { kind: string; id: string; title: string; sub: string; href: string }
interface Entry extends SearchHit { hay: string; titleHay: string }

let index: Entry[] | null = null;

function build(): Entry[] {
  const out: Entry[] = [];
  const push = (e: SearchHit, body: string) => {
    const title = String(e.title ?? "");
    out.push({ ...e, title, hay: `${title} ${e.sub ?? ""} ${body ?? ""}`.toLowerCase(), titleHay: title.toLowerCase() });
  };
  for (const c of getCampaigns()) push({ kind: "Campaign", id: c.id, title: `${c.id} ${c.name}`, sub: `${c.type} · ${fmt(c.start)} – ${fmt(c.end)}`, href: `/campaigns/${c.id}` }, `${c.message} ${c.goal} ${c.channels.join(" ")}`);
  for (const t of getSeedTasks()) push({ kind: "Task", id: t.id, title: t.title, sub: `${t.source} · ${t.owner} · due ${fmt(t.due)}`, href: `/tasks?focus=${encodeURIComponent(t.id)}` }, t.description);
  for (const c of getContent()) push({ kind: "Content", id: c.id, title: c.title, sub: `${c.kind} · ${c.query || c.topic}`, href: `/content?focus=${encodeURIComponent(c.id)}` }, `${c.query} ${c.game} ${c.note ?? ""}`);
  for (const e of getExperiments()) push({ kind: "Experiment", id: e.id, title: `${e.id} ${e.name}`, sub: `${e.area} · ${e.priority}`, href: `/experiments?focus=${e.id}` }, `${e.hypothesis} ${e.change}`);
  const opp = getOpportunities();
  for (const o of opp.items) push({ kind: "Opportunity", id: o.id, title: o.title, sub: `${o.type} · score ${o.total}`, href: `/opportunities?focus=${o.id}` }, o.note);
  for (const k of opp.keyDates) push({ kind: "Key date", id: k.id, title: k.event, sub: `${k.date_or_window} · ${k.type}`, href: `/opportunities?tab=dates&focus=${k.id}` }, `${k.game_or_company} ${k.publish_before}`);
  for (const p of getPr()) push({ kind: "PR", id: p.id, title: `${p.id} ${p.name}`, sub: `${p.publishLabel} · ${p.owner}`, href: `/pr?focus=${p.id}` }, p.card);
  for (const c of getCopy()) push({ kind: "Copy", id: c.id, title: c.text.slice(0, 110), sub: `${c.channel} · ${c.label.slice(0, 70)}`, href: `/copy?focus=${encodeURIComponent(c.id)}` }, c.label);
  for (const d of getCalendar()) for (const it of d.items) {
    if (it.group === "ops" || it.copy.length || it.campaigns.length) push({ kind: "Calendar", id: it.id, title: it.instruction.slice(0, 110) || it.copy[0]?.slice(0, 110) || it.channelLabel, sub: `${fmt(d.date)} · ${it.channelLabel} · ${it.owner}`, href: `/today?date=${d.date}#${encodeURIComponent(it.id)}` }, it.copy.join(" "));
  }
  for (const d of getDocs()) push({ kind: "Doc", id: d.slug, title: d.title, sub: d.file, href: `/docs/${d.slug}` }, "");
  return out;
}

export function search(q: string, limit = 40): SearchHit[] {
  if (!index || process.env.NODE_ENV !== "production") index = build();
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const scored: { e: Entry; s: number }[] = [];
  for (const e of index) {
    let s = 0;
    for (const t of terms) {
      if (!e.hay.includes(t)) { s = -1; break; }
      s += e.titleHay.includes(t) ? 3 : 1;
      if (e.id.toLowerCase() === t) s += 10;
    }
    if (s > 0) scored.push({ e, s: s + (e.kind === "Campaign" ? 2 : e.kind === "Task" ? 1 : 0) });
  }
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, limit).map(({ e }) => ({ kind: e.kind, id: e.id, title: e.title, sub: e.sub, href: e.href }));
}
