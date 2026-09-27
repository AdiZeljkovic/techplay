#!/usr/bin/env node
// Reads the Phase 1 research and Phase 2 strategy files and writes the
// normalised data Growth OS renders. Run: npm run sync-data
// Source of truth stays in docs/techplay-growth; this output is disposable.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractTables, extractSections, extractQuotedCopy, normaliseCalendar, extractPaid, sectionsById,
  toISODate, slug, CAMPAIGN_COPY_KEY,
} from "./lib/extract.mjs";
import { parseCSV } from "./lib/parse.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..", "..");
const DOCS = process.env.GROWTH_DOCS_DIR || path.join(ROOT, "docs", "techplay-growth");
const STRAT = path.join(DOCS, "strategy");
const RES = path.join(DOCS, "research");
const OUT = path.resolve(here, "..", "data", "generated");

const read = (p) => fs.readFileSync(p, "utf8");
const json = (p) => JSON.parse(read(p));
const md = (f) => read(path.join(STRAT, f));
const write = (name, data) => fs.writeFileSync(path.join(OUT, name), JSON.stringify(data));
const counts = {};
const note = (k, v) => { counts[k] = Array.isArray(v) ? v.length : v; return v; };

if (!fs.existsSync(STRAT)) {
  console.error(`Growth OS: strategy folder not found at ${STRAT}. Set GROWTH_DOCS_DIR.`);
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

// ---------- Calendar ----------
const days = note("days", normaliseCalendar(json(path.join(STRAT, "calendar.json"))));
note("calendarItems", days.reduce((n, d) => n + d.items.length, 0));
write("calendar.json", days);

// ---------- Campaigns (+ creative briefs, paid detail) ----------
const campaigns = json(path.join(STRAT, "campaigns.json")).campaigns;
const briefs = {};
for (const s of extractSections(md("29-CREATIVE-BRIEFS.md"), 3)) {
  const m = s.title.match(/^(C\d{2})\s+—/);
  if (m) briefs[m[1]] = { title: s.title, body: s.body };
}
const paid = note("paidCampaigns", extractPaid(md("26-PAID-MEDIA.md")));
write("campaigns.json", note("campaigns", campaigns));
write("briefs.json", briefs);
write("paid.json", paid);

// ---------- Plain JSON sets ----------
write("experiments.json", note("experiments", json(path.join(STRAT, "experiments.json")).experiments));
write("kpis.json", note("kpis", json(path.join(STRAT, "kpis.json")).kpis));
write("channels.json", note("channels", json(path.join(STRAT, "channels.json"))));
const backlog = note("backlog", json(path.join(STRAT, "development-backlog.json")).items);
write("backlog.json", backlog);

// ---------- Content opportunities ----------
const pillarOf = (t) => /gta/i.test(t) ? "GTA 6" : /wow|warcraft|mmo|ffxiv/i.test(t) ? "MMO / WoW" : /stutter|fps|windows|driver|gpu|pc |directx|secure boot|steam deck/i.test(t) ? "PC fixes" : /release|calendar|where to play|platform|switch/i.test(t) ? "Releases & platforms" : "Other";
const tierFrom = (score, hi, mid, lo) => score >= hi ? "P0" : score >= mid ? "P1" : score >= lo ? "P2" : "P3";
const content = [];
for (const r of parseCSV(read(path.join(RES, "evergreen-opportunities.csv")))) {
  const tp = Number(r.traffic_potential) || 0;
  content.push({
    id: r.id, title: r.topic, query: r.primary_query, secondary: r.secondary_queries, intent: r.search_intent,
    audience: r.audience, game: r.game_or_platform, platform: r.game_or_platform, topic: pillarOf(`${r.topic} ${r.primary_query}`),
    format: r.recommended_format, kind: "evergreen", priority: tierFrom(tp, 5, 4, 3), score: tp,
    lifespan: r.evergreen_lifespan, freshness: r.freshness_requirement, competition: r.competition_estimate,
    note: r.evidence_note, conversion: r.conversion_potential, source: "research/evergreen-opportunities.csv",
  });
}
for (const r of parseCSV(read(path.join(RES, "game-opportunities.csv")))) {
  const total = Number(r.total) || 0;
  content.push({
    id: r.id, title: r.game, query: "", intent: "hub", audience: "", game: r.game, platform: r.platforms,
    topic: "Game hub", format: "game hub", kind: "game-hub", priority: tierFrom(total, 36, 32, 28), score: total,
    note: r.notes, window: r.status_or_release_window, source: "research/game-opportunities.csv",
  });
}
const seoQueries = [];
for (const t of extractTables(md("13-SEO-CONTENT.md"))) {
  if (!t.headers.some((h) => /^Query/.test(h))) continue;
  const qKey = t.headers.find((h) => /^Query/.test(h));
  const pageKey = t.headers.find((h) => /^Target page/.test(h));
  const linkKey = t.headers.find((h) => /^Links/.test(h));
  t.rows.forEach((r, i) => {
    seoQueries.push({
      id: `SEO-${slug(t.h3).slice(0, 12)}-${r["#"] || i + 1}`, cluster: t.h3.replace(/^\d+(\.\d+)*\s*/, ""),
      query: r[qKey], intent: r.Intent, page: r[pageKey], state: r["St."], supporting: r.Supporting, hub: r.Hub,
      links: r[linkKey], cta: r.CTA, conversion: r.Conversion,
    });
  });
}
note("seoQueries", seoQueries);
for (const q of seoQueries) {
  content.push({
    id: q.id, title: q.page || q.query || q.id, query: q.query || "", intent: q.intent, audience: "", game: /gta/i.test(q.query) ? "GTA VI" : "",
    platform: "", topic: q.cluster, format: "article/page", kind: "search", priority: /new/i.test(q.state || "") ? "P1" : "P2",
    score: 0, note: `${q.supporting || ""} · Hub: ${q.hub || ""}`, source: "strategy/13-SEO-CONTENT.md",
  });
}
write("content.json", note("content", content));

// ---------- Opportunities ----------
const opp = json(path.join(RES, "opportunities.json"));
const oppItems = opp.opportunities.map((o) => ({ ...o, priority: o.rank <= 25 ? "P0" : o.rank <= 80 ? "P1" : o.rank <= 180 ? "P2" : "P3" }));
const keyDates = opp.calendar.map((c, i) => ({ id: `KD-${i + 1}`, ...c, date: toISODate(c.date_or_window) }));
write("opportunities.json", { items: note("opportunities", oppItems), keyDates: note("keyDates", keyDates) });

// ---------- SEO extras ----------
const seoMd = md("13-SEO-CONTENT.md");
const plumbing = (extractTables(seoMd).find((t) => t.headers[0] === "ID" && t.headers.includes("Fix")) || { rows: [] }).rows;
const titleRewrites = (extractTables(seoMd).find((t) => t.headers.some((h) => /^Before/.test(h))) || { rows: [] }).rows;
const hubSections = extractSections(md("20-GAME-HUBS.md"), 2).filter((s) => /`\//.test(s.title));
const tools = (extractTables(md("21-GAMING-TOOLS.md")).find((t) => /Scores and buckets/.test(t.h2)) || { rows: [] }).rows;
const discoverChecklist = extractSections(md("14-DISCOVER-NEWS.md"), 2).map((s) => ({ title: s.title, body: s.body }));
write("seo.json", { queries: seoQueries, plumbing, titleRewrites, hubs: hubSections, tools: note("tools", tools), discover: discoverChecklist });

// ---------- Video ----------
const ytMd = md("09-YOUTUBE.md");
const ideaTable = extractTables(ytMd).find((t) => t.headers.includes("Title") && t.headers.includes("Publish window"));
const videoIdeas = (ideaTable?.rows || []).map((r) => ({
  id: `V-${String(r["#"]).padStart(2, "0")}`, title: r.Title, format: r.Format, length: r.Length, source: r["Source asset"],
  target: r["Target query / audience"], window: r["Publish window"], date: toISODate(r["Publish window"]), cta: r.CTA, slot: r.Slot,
}));
const shows = (extractTables(ytMd).find((t) => t.headers.includes("Show")) || { rows: [] }).rows;
const pilots = extractSections(ytMd, 2).filter((s) => /^(9|10)\. Pilot/.test(s.title));
write("video.json", { ideas: note("videoIdeas", videoIdeas), shows, pilots, workflow: extractSections(md("18-VIDEO.md"), 2) });

// ---------- Email ----------
const emMd = md("17-NEWSLETTER-EMAIL.md");
const emTables = extractTables(emMd);
const sends = (emTables.find((t) => t.headers.includes("Subject") && t.headers.includes("Send date")) || { rows: [] }).rows.map((r) => ({
  id: `S-${r["#"]}`, date: toISODate(r["Send date"]), dateLabel: r["Send date"], product: r.Product, subject: r.Subject,
  preview: r["Preview line (first visible line)"] || "",
}));
const products = (emTables.find((t) => t.headers.includes("Product") && t.headers.includes("Audience")) || { rows: [] }).rows;
const lifecycleTable = (emTables.find((t) => t.headers.includes("Sequence")) || { rows: [] }).rows;
const lifecycleBodies = Object.fromEntries(sectionsById(emMd, 3, /^(E-\d{2})/).map((s) => [s.id, s]));
const lifecycle = lifecycleTable.map((r) => ({ ...r, body: lifecycleBodies[r.ID]?.body || "", title: lifecycleBodies[r.ID]?.title || r.Sequence }));
const saveFileSections = (emTables.find((t) => t.h2.startsWith("3. The Save File")) || { rows: [] }).rows;
const editions = extractSections(emMd, 2).filter((s) => /^1[01]\. Full copy/.test(s.title));
const placements = sectionsById(emMd, 3, /^(P-\d{2})/);
write("email.json", { sends: note("emailSends", sends), products, lifecycle: note("lifecycle", lifecycle), saveFileSections, editions, placements });

// ---------- PR ----------
const prMd = md("22-DIGITAL-PR.md");
const prTable = (extractTables(prMd).find((t) => t.headers[0] === "ID" && t.headers.includes("Publish")) || { rows: [] }).rows;
const prCards = Object.fromEntries(sectionsById(prMd, 3, /^(PR-\d{2})/).map((s) => [s.id, s]));
const prPitches = {};
for (const s of extractSections(prMd, 3)) {
  const m = s.title.match(/^P\d+ · (PR-\d{2})/);
  if (m) prPitches[m[1]] = s.body;
}
const pr = prTable.map((r) => ({
  id: r.ID, spine: r.Spine, name: r.Campaign, publishLabel: r.Publish, date: toISODate(r.Publish), data: r["Data status"],
  effort: r.Effort, tier: r.Priority, owner: r.Owner, card: prCards[r.ID]?.body || "", pitch: prPitches[r.ID] || "",
}));
write("pr.json", note("pr", pr));

// ---------- Partnerships & creators ----------
const partnerMsgs = sectionsById(md("24-PARTNERSHIPS.md"), 3, /^(M\d{1,2})\b/);
const creatorTpls = sectionsById(md("23-CREATORS.md"), 3, /^(T\d{1,2})\b/);
const partnerTypes = extractSections(md("24-PARTNERSHIPS.md"), 3).filter((s) => /^4\.\d+/.test(s.title));
const pipelineSeed = [
  ...partnerMsgs.map((m) => ({ id: `P-${m.id}`, name: m.title.replace(/^M\d+ · /, ""), kind: "partner", template: m.id })),
  ...creatorTpls.map((t) => ({ id: `CR-${t.id}`, name: t.title.replace(/^T\d+ · /, ""), kind: "creator", template: t.id })),
];
write("partners.json", { messages: partnerMsgs, creatorTemplates: creatorTpls, types: partnerTypes, pipeline: note("pipeline", pipelineSeed) });

// ---------- Community ----------
const dcMd = md("12-DISCORD.md");
const rdMd = md("11-REDDIT.md");
const dcTables = extractTables(dcMd);
const rdTables = extractTables(rdMd);
const community = {
  rituals: (dcTables.find((t) => /7\.1/.test(t.h3)) || { rows: [] }).rows,
  events: (dcTables.find((t) => /7\.3/.test(t.h3)) || { rows: [] }).rows,
  polls: (dcTables.find((t) => /7\.4/.test(t.h3)) || { rows: [] }).rows,
  channels: dcTables.filter((t) => /^3\.\d/.test(t.h3)).map((t) => ({ category: t.h3, rows: t.rows })),
  rhythms: extractSections(dcMd, 2).filter((s) => /rhythm|timetable|daily|weekly|monthly/i.test(s.title)),
  redditCalendar: (rdTables.find((t) => /13-week/.test(t.h2)) || { rows: [] }).rows,
  redditAnswers: (rdTables.find((t) => /Helpful-answer/.test(t.h2)) || { rows: [] }).rows,
  redditRoles: (rdTables.find((t) => /Subreddit roles/.test(t.h2)) || { rows: [] }).rows,
  giveaways: extractSections(md("25-GIVEAWAYS.md"), 3).filter((s) => /^6\.\d/.test(s.title)),
};
write("community.json", community);

// ---------- Social ----------
const franchises = sectionsById(md("05-SOCIAL-MEDIA.md"), 3, /^(F\d{2})\b/);
write("social.json", { franchises: note("franchises", franchises) });

// ---------- Tasks (seed) ----------
const qwMd = md("33-QUICK-WINS.md");
const shortTitle = (a) => {
  const first = a.split(/(?<=\.)\s/)[0];
  const t = first.length >= 30 ? first : a;
  return t.length > 150 ? `${t.slice(0, 147).replace(/\s+\S*$/, "")}…` : t;
};
const horizonDue = { "24 HOURS": "2026-09-28", "3 DAYS": "2026-09-30", "7 DAYS": "2026-10-04", "14 DAYS": "2026-10-11", "30 DAYS": "2026-10-27" };
const tasks = [];
for (const t of extractTables(qwMd)) {
  const h = Object.keys(horizonDue).find((k) => t.h2.includes(`NEXT ${k}`));
  if (!h || !t.headers.includes("Exact action")) continue;
  t.rows.forEach((r) => {
    const action = r["Exact action"].replace(/\*\*/g, "").replace(/`/g, "");
    tasks.push({
      id: `QW-${slug(h)}-${r["#"]}`, title: shortTitle(action), description: action,
      expected: r["Expected effect"], doneWhen: r["Done when"], due: horizonDue[h], owner: r.Owner, time: r.Time,
      priority: h === "24 HOURS" ? "P0" : h === "30 DAYS" ? "P2" : "P1", campaign: (action.match(/\bC\d{2}\b/) || [""])[0],
      channel: "", source: `Quick wins · next ${h.toLowerCase()}`,
    });
  });
}
for (const b of backlog) {
  const dates = (b.target_week || "").match(/\(([^)]+)\)/);
  const end = dates ? toISODate(dates[1].split(/[–-]/).pop()) : null;
  tasks.push({
    id: b.id, title: `${b.id} ${b.title}`, description: b.problem, doneWhen: (b.acceptance_criteria || []).join(" · "),
    due: end, owner: b.owner || "DEV", time: b.hours_estimate ? `${b.hours_estimate} h` : "", priority: b.priority || "P2",
    campaign: (b.unlocks || [])[0] || "", channel: "dev", source: `Dev backlog · ${b.target_week || "unscheduled"}`,
  });
}
write("tasks.json", note("seedTasks", tasks));

// ---------- Assets (seed) ----------
const minusDays = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
const assets = [];
for (const c of campaigns) {
  (c.creative || []).forEach((cr, i) => {
    assets.push({
      id: `A-${c.id}-${i + 1}`, campaign: c.id, campaignName: c.name, channel: /1080x1920/.test(cr.size) ? "Stories / vertical" : /1280x720/.test(cr.size) ? "YouTube" : /1200x630/.test(cr.size) ? "Web / link preview" : /1080x1350|1080x1080/.test(cr.size) ? "Feed" : "Web",
      format: cr.size, dimensions: (cr.size.match(/\d{3,4}x\d{3,4}/g) || []).join(", "), headline: c.message || "", copy: c.cta || "",
      brief: cr.concept, due: c.start ? minusDays(c.start, 2) : null, owner: "DS", hasBrief: Boolean(briefs[c.id]),
    });
  });
}
for (const d of days) {
  if (!d.creative) continue;
  d.creative.split(" | ").forEach((cr, i) => {
    if (/^Campaign creative per/.test(cr)) return;
    assets.push({
      id: `A-${d.date}-${i + 1}`, campaign: "", campaignName: d.theme, channel: "Franchise template fill",
      format: cr, dimensions: (cr.match(/\d{3,4}x\d{3,4}/g) || []).join(", "), headline: "", copy: d.cta,
      brief: `${cr} — for ${d.weekday} ${d.date}. Template specs in 29-CREATIVE-BRIEFS §2.`, due: d.date, owner: "DS", hasBrief: false,
    });
  });
}
write("assets.json", note("assets", assets));

// ---------- Copy library ----------
const copy = [];
const CH_LABEL = { facebook: "Facebook", facebook_groups: "Facebook Groups", instagram: "Instagram", tiktok: "TikTok", x: "X", threads: "Threads", bluesky: "Bluesky", reddit: "Reddit", discord: "Discord", youtube: "YouTube", short_script: "Reels / Shorts script", newsletter: "Newsletter", push: "Push", ad: "Ads" };
for (const d of days) for (const it of d.items) it.copy.forEach((t, i) => copy.push({
  id: `cal:${it.id}:${i}`, channel: it.channelLabel, text: t, label: it.instruction, date: it.date, campaigns: it.campaigns, source: "Calendar",
}));
for (const c of campaigns) {
  for (const [k, v] of Object.entries(c.copy || {})) if (v && v.trim()) copy.push({ id: `cmp:${c.id}:${k}`, channel: CH_LABEL[k] || k, text: v, label: `${c.id} ${c.name}`, date: c.start, campaigns: [c.id], source: "Campaign library" });
  for (const [k, v] of Object.entries(c.extra_copy || {})) {
    const text = typeof v === "string" ? v : JSON.stringify(v, null, 2);
    if (text.trim()) copy.push({ id: `cmpx:${c.id}:${slug(k)}`, channel: /email|newsletter|issue/i.test(k) ? "Email" : /pitch|outreach/i.test(k) ? "Outreach" : /linkedin/i.test(k) ? "LinkedIn" : "Site / other", text, label: `${c.id} · ${k}`, date: c.start, campaigns: [c.id], source: "Campaign library" });
  }
}
for (const s of sends) {
  copy.push({ id: `sub:${s.id}`, channel: "Newsletter subject", text: s.subject, label: `${s.dateLabel} · ${s.product}`, date: s.date, campaigns: [], source: "17-NEWSLETTER-EMAIL" });
  if (s.preview) copy.push({ id: `pre:${s.id}`, channel: "Newsletter preview", text: s.preview, label: `${s.dateLabel} · preview for "${s.subject}"`, date: s.date, campaigns: [], source: "17-NEWSLETTER-EMAIL" });
}
for (const p of paid) {
  for (const [k, v] of Object.entries(p.fields)) if (/Headline|Description|Primary text|Ad copy|Hook|Title/i.test(k) && v) copy.push({ id: `ad:${p.id}:${slug(k)}`, channel: `Ads · ${p.platform}`, text: v.replace(/ · /g, "\n"), label: `${p.id} ${p.name} · ${k}`, date: null, campaigns: [p.id.slice(0, 3)], source: "26-PAID-MEDIA" });
}
const QUOTE_SOURCES = [
  ["05-SOCIAL-MEDIA.md", (q) => /x thread|x post|\bx\b/i.test(q.label) ? "X" : /instagram|carousel/i.test(q.label) ? "Instagram" : /discord/i.test(q.label) ? "Discord" : /tiktok|short|reel/i.test(q.label) ? "Reels / Shorts script" : /facebook/i.test(q.label) ? "Facebook" : "Social"],
  ["06-FACEBOOK.md", (q) => /group/i.test(`${q.h2} ${q.h3} ${q.label}`) ? "Facebook Groups" : "Facebook"],
  ["07-INSTAGRAM.md", () => "Instagram"], ["08-TIKTOK.md", () => "TikTok"], ["09-YOUTUBE.md", () => "YouTube"],
  ["10-X-THREADS-BLUESKY.md", (q) => /Threads/.test(q.h2) ? "Threads" : /Bluesky/.test(q.h2) ? "Bluesky" : "X"],
  ["11-REDDIT.md", () => "Reddit"], ["12-DISCORD.md", () => "Discord"], ["15-REGISTRATION.md", () => "Site copy"],
  ["16-ACTIVATION-RETENTION.md", () => "Site copy"], ["17-NEWSLETTER-EMAIL.md", () => "Email"], ["18-VIDEO.md", (q) => /x thread/i.test(q.label) ? "X" : "Reels / Shorts script"],
  ["19-GTA6.md", (q) => /discord/i.test(q.label) ? "Discord" : /email|briefing/i.test(q.label) ? "Email" : "GTA 6"],
  ["22-DIGITAL-PR.md", () => "PR pitch"], ["23-CREATORS.md", () => "Creator outreach"], ["24-PARTNERSHIPS.md", () => "Partner outreach"],
  ["25-GIVEAWAYS.md", () => "Giveaway"], ["26-PAID-MEDIA.md", () => "Ads"],
];
for (const [file, chan] of QUOTE_SOURCES) {
  extractQuotedCopy(md(file)).forEach((q) => copy.push({
    id: `doc:${file.slice(0, 2)}:${q.line}`, channel: chan(q), text: q.text.replace(/^"|"$/g, ""),
    label: [q.h3 || q.h2, q.label].filter(Boolean).join(" · ").slice(0, 160), date: toISODate(q.label) || null,
    campaigns: [...new Set(`${q.label} ${q.h3}`.match(/\bC\d{2}\b/g) || [])], source: file.replace(/\.md$/, ""),
  }));
}
for (const m of [...partnerMsgs, ...creatorTpls]) copy.push({ id: `tpl:${m.id}`, channel: m.id.startsWith("M") ? "Partner outreach" : "Creator outreach", text: m.body, label: m.title, date: null, campaigns: [...new Set(m.title.match(/\bC\d{2}\b/g) || [])], source: m.id.startsWith("M") ? "24-PARTNERSHIPS" : "23-CREATORS" });
for (const l of lifecycle) if (l.body) copy.push({ id: `life:${l.ID}`, channel: "Lifecycle email", text: l.body, label: `${l.ID} ${l.Sequence}`, date: null, campaigns: [], source: "17-NEWSLETTER-EMAIL" });
write("copy.json", note("copy", copy));

// ---------- Documents ----------
const docs = fs.readdirSync(STRAT).filter((f) => f.endsWith(".md")).sort().map((f) => {
  const body = md(f);
  return { slug: f.replace(/\.md$/, ""), file: `strategy/${f}`, title: (body.match(/^# (.+)$/m) || [, f])[1], body };
});
write("docs.json", note("docs", docs));

write("meta.json", {
  generatedAt: new Date().toISOString(),
  docsDir: path.relative(ROOT, DOCS),
  planStart: days[0]?.date, planEnd: days[days.length - 1]?.date,
  counts, copyChannelKeys: CAMPAIGN_COPY_KEY,
});
console.log(`Growth OS data synced → ${path.relative(process.cwd(), OUT)}`);
console.log(Object.entries(counts).map(([k, v]) => `${k}=${v}`).join("  "));
