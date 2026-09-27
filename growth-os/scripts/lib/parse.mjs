// Parsers for the Phase 2 strategy files. Pure functions: string in, data out.
// Kept free of Node APIs so they can be unit-tested and reused.

/** Split a markdown table row into cells, honouring escaped pipes (\|). */
export function splitRow(line) {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells = [];
  let cur = "";
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === "\\" && trimmed[i + 1] === "|") { cur += "|"; i++; continue; }
    if (ch === "|") { cells.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

const isSep = (line) => /^\s*\|?\s*:?-{2,}/.test(line) && /^[\s|:\-]+$/.test(line);

/**
 * Every markdown table in a document, with the headings it sits under.
 * @returns {{h2:string,h3:string,h4:string,lead:string,headers:string[],rows:Record<string,string>[],line:number}[]}
 */
export function extractTables(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let h2 = "", h3 = "", h4 = "", lead = "";
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^## /.test(l)) { h2 = l.slice(3).trim(); h3 = ""; h4 = ""; lead = ""; continue; }
    if (/^### /.test(l)) { h3 = l.slice(4).trim(); h4 = ""; lead = ""; continue; }
    if (/^#### /.test(l)) { h4 = l.slice(5).trim(); lead = ""; continue; }
    if (/^\*\*.+\*\*\s*$/.test(l.trim())) lead = l.trim().replace(/^\*\*|\*\*$/g, "");
    if (l.trim().startsWith("|") && i + 1 < lines.length && isSep(lines[i + 1])) {
      const headers = splitRow(l);
      const rows = [];
      let j = i + 2;
      for (; j < lines.length && lines[j].trim().startsWith("|"); j++) {
        const cells = splitRow(lines[j]);
        const row = {};
        headers.forEach((h, k) => { row[h || `col${k}`] = cells[k] ?? ""; });
        rows.push(row);
      }
      out.push({ h2, h3, h4, lead, headers, rows, line: i + 1 });
      i = j - 1;
    }
  }
  return out;
}

/**
 * Sections at a heading level (2, 3 or 4). Body runs until the next heading
 * of the same or a higher level.
 * @returns {{title:string,body:string,parent:string}[]}
 */
export function extractSections(md, level) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let cur = null;
  let parent = "";
  const re = new RegExp(`^#{${level}} `);
  const stop = new RegExp(`^#{1,${level}} `);
  for (const l of lines) {
    if (level > 2 && /^## /.test(l)) parent = l.slice(3).trim();
    if (re.test(l)) {
      if (cur) out.push(cur);
      cur = { title: l.replace(re, "").trim(), body: "", parent };
      continue;
    }
    if (cur && stop.test(l)) { out.push(cur); cur = null; continue; }
    if (cur) cur.body += l + "\n";
  }
  if (cur) out.push(cur);
  return out.map((s) => ({ ...s, body: s.body.trim() }));
}

/** Minimal RFC 4180 CSV parser. */
export function parseCSV(text) {
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.length > 1 || r[0] !== "");
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

const PLACEHOLDER = /^(no (post|pitch today|send|slot today|feed post|vertical today|long-form|short|planned .*)|none(\b.*)?|not live.*|moderation queue under 24 h)$/i;

/** True when a calendar cell says "nothing today". */
export function isPlaceholder(text) {
  return !text || PLACEHOLDER.test(text.trim());
}

/** Split a calendar cell into its " | " separated pieces (never splits "X|S"). */
export function splitCell(text) {
  return (text || "").split(" | ").map((s) => s.trim()).filter(Boolean);
}

/**
 * One calendar piece → instruction and public copy. Copy is whatever the
 * generator wrapped in «…»; the instruction is the rest.
 */
export function parsePiece(text) {
  const copy = [];
  const instruction = text
    .replace(/«([^»]*)»/g, (_, c) => { copy.push(c.trim()); return "⟨copy⟩"; })
    .replace(/:\s*⟨copy⟩\s*$/, "")
    .replace(/\s*⟨copy⟩\s*/g, " … ")
    .replace(/\s+/g, " ")
    .trim();
  const campaigns = [...new Set((text.match(/\bC\d{2}[a-z]?\b/g) || []))];
  const franchises = [...new Set((text.match(/\bF\d{2}\b/g) || []))];
  const devItems = [...new Set((text.match(/\bD-\d{3}[a-z]?\b/g) || []))];
  const links = [...new Set((text.match(/https?:\/\/[^\s»)"]+/g) || []))];
  return { instruction, copy, campaigns, franchises, devItems, links };
}

const OWNER_CODES = ["EIC", "ED", "SC", "DS", "DEV"];
/** Owner codes mentioned in a text, in canonical order. */
export function ownersIn(text) {
  return OWNER_CODES.filter((c) => new RegExp(`(^|[^A-Za-z-])${c}([^A-Za-z]|$)`).test(text || ""));
}

/** Convert "Mon 28 Sep" / "Wed 7 Oct" / "2026-10-07" to ISO, assuming 2026 (Jan–Apr → 2027). */
export function toISODate(s) {
  if (!s) return null;
  const iso = s.match(/(20\d\d)-(\d\d)-(\d\d)/);
  if (iso) return iso[0];
  const m = s.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:\s+(20\d\d))?/i);
  if (!m) return null;
  const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  const mo = months.indexOf(m[2].toLowerCase().slice(0, 3));
  const year = m[3] ? Number(m[3]) : mo <= 3 ? 2027 : 2026;
  return `${year}-${String(mo + 1).padStart(2, "0")}-${String(Number(m[1])).padStart(2, "0")}`;
}

/** Stable slug for ids. */
export function slug(s) {
  return String(s).toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 80);
}
