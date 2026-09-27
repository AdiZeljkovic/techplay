// Higher-level extractors built on parse.mjs. Still pure.
import { extractTables, extractSections, isPlaceholder, splitCell, parsePiece, ownersIn, toISODate, slug } from "./parse.mjs";

/** Blockquotes with the label line just above them: the docs' way of writing "exact copy". */
export function extractQuotedCopy(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let h2 = "", h3 = "";
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^## /.test(l)) { h2 = l.slice(3).trim(); h3 = ""; continue; }
    if (/^### /.test(l)) { h3 = l.slice(4).trim(); continue; }
    if (/^>\s?/.test(l) && (i === 0 || !/^>/.test(lines[i - 1]))) {
      const block = [];
      let j = i;
      for (; j < lines.length && /^>/.test(lines[j]); j++) block.push(lines[j].replace(/^>\s?/, ""));
      let label = "";
      for (let k = i - 1; k >= Math.max(0, i - 3); k--) {
        const t = lines[k].trim();
        if (t && !t.startsWith(">")) { label = t; break; }
      }
      const text = block.join("\n").trim();
      if (text.length > 15) out.push({ h2, h3, label: label.replace(/\*\*/g, "").replace(/:$/, ""), text, line: i + 1 });
      i = j - 1;
    }
  }
  return out;
}

export const CAL_CHANNELS = [
  ["Article / editorial", "editorial", "Editorial", "ED", "editorial"],
  ["SEO", "seo", "SEO", "ED", "editorial"],
  ["Google News", "google-news", "Google News", "ED", "editorial"],
  ["Google Discover angle", "discover", "Discover", "ED", "editorial"],
  ["Facebook", "facebook", "Facebook", "SC", "social"],
  ["Facebook Groups", "facebook-groups", "Facebook Groups", "SC", "social"],
  ["Instagram", "instagram", "Instagram", "SC", "social"],
  ["Stories", "stories", "Stories", "SC", "social"],
  ["Reels", "reels", "Reels", "SC", "video"],
  ["TikTok", "tiktok", "TikTok", "SC", "video"],
  ["YouTube", "youtube", "YouTube", "SC", "video"],
  ["YouTube Shorts", "youtube-shorts", "YouTube Shorts", "SC", "video"],
  ["X", "x", "X", "SC", "social"],
  ["Threads", "threads", "Threads", "SC", "social"],
  ["Bluesky", "bluesky", "Bluesky", "SC", "social"],
  ["Reddit", "reddit", "Reddit", "SC", "community"],
  ["Discord", "discord", "Discord", "SC", "community"],
  ["Newsletter", "newsletter", "Newsletter", "SC", "email"],
  ["Push", "push", "Push", "DEV", "email"],
  ["Community", "community", "Community", "SC", "community"],
  ["PR", "pr", "PR", "EIC", "outreach"],
  ["Creator activity", "creator", "Creator", "EIC", "outreach"],
  ["Partnership activity", "partnership", "Partnership", "EIC", "outreach"],
  ["Paid campaign", "paid", "Paid", "EIC", "paid"],
  ["Retargeting", "retargeting", "Retargeting", "EIC", "paid"],
  ["Operations / product", "ops", "Operations", "EIC", "ops"],
];

/** Campaign copy object keys by calendar channel key (used as copy fallback). */
export const CAMPAIGN_COPY_KEY = {
  facebook: "facebook", "facebook-groups": "facebook_groups", instagram: "instagram", stories: "instagram",
  tiktok: "tiktok", reels: "short_script", "youtube-shorts": "short_script", youtube: "youtube", x: "x",
  threads: "threads", bluesky: "bluesky", reddit: "reddit", discord: "discord", newsletter: "newsletter",
  push: "push", paid: "ad",
};

const SIZE = /\b\d{3,4}x\d{3,4}\b/g;

/** calendar.json (Phase 2) → normalised days with one item per actionable piece. */
export function normaliseCalendar(cal) {
  return cal.days.map((d) => {
    const priority = d["Priority"] || "P2";
    const items = [];
    for (const [field, key, label, defOwner, group] of CAL_CHANNELS) {
      const pieces = splitCell(d[field]);
      pieces.forEach((piece, idx) => {
        if (isPlaceholder(piece)) return;
        let p = parsePiece(piece);
        if (key === "discover" && !p.copy.length) {
          const m = piece.match(/Headline for Discover: '(.+)'; 1200px/);
          if (!m) return;
          p = { ...p, copy: [m[1]], instruction: "Discover-led piece: 1200px+ 16:9 image, no text on the image" };
        }
        const owners = ownersIn(piece);
        const sizes = [...new Set(piece.match(SIZE) || [])];
        items.push({
          id: `${d.Date}:${key}:${idx}`,
          date: d.Date,
          channel: key,
          channelLabel: label,
          group,
          paid: group === "paid",
          instruction: p.instruction,
          copy: p.copy,
          campaigns: p.campaigns,
          franchises: p.franchises,
          devItems: p.devItems,
          links: p.links,
          owner: owners.length ? owners.join(", ") : defOwner,
          priority,
          sizes,
          raw: piece,
        });
      });
    }
    return {
      date: d.Date, weekday: d.Day, week: d.Week, theme: d.Theme, objective: d["Primary objective"],
      audience: d["Primary audience"], cta: d.CTA, landing: d["Landing page"], creative: d.Creative,
      owner: d.Owner, effort: Number(d["Estimated effort (h)"]) || 0, priority, kpi: d.KPI, tracking: d.Tracking,
      status: d.Status, items,
    };
  });
}

/** 26-PAID-MEDIA: "**C56a — Name (T1)**" followed by a Field/Plan table. */
export function extractPaid(md) {
  const out = [];
  for (const t of extractTables(md)) {
    const m = t.lead.match(/^(C\d{2}[a-z]?)\s+—\s+(.+)$/);
    if (!m || !t.headers.includes("Field")) continue;
    const fields = Object.fromEntries(t.rows.map((r) => [r.Field, r.Plan ?? Object.values(r)[1] ?? ""]));
    const platform = (t.h3 || "").replace(/^\d+(\.\d+)*\s*/, "");
    const plat = /google/i.test(platform) ? "Google" : /youtube/i.test(platform) ? "YouTube" : /meta|facebook/i.test(platform) ? "Meta" : /instagram/i.test(platform) ? "Meta" : /tiktok/i.test(platform) ? "TikTok" : /reddit/i.test(platform) ? "Reddit" : platform;
    out.push({ id: m[1], name: m[2], platform: plat, section: platform, fields, budget: fields.Budget || "" });
  }
  return out;
}

/** Sections whose title starts with an id pattern, e.g. "PR-01 · ..." or "M1 · ...". */
export function sectionsById(md, level, re) {
  return extractSections(md, level)
    .map((s) => ({ ...s, id: (s.title.match(re) || [])[1] }))
    .filter((s) => s.id);
}

export { extractTables, extractSections, isPlaceholder, splitCell, parsePiece, ownersIn, toISODate, slug };
