// TechPlay UTM convention (30-ANALYTICS §7). Shared by the builder and tests.

export const UTM_SOURCES = ["google", "facebook", "instagram", "tiktok", "youtube", "x", "threads", "bluesky", "reddit", "discord", "newsletter", "email", "push", "linkedin", "steam"] as const;
export const UTM_MEDIUMS = ["organic-social", "community", "email", "push", "paid-social", "cpc", "referral", "pr", "creator", "partner", "qr"] as const;

export const RX = {
  utm_source: /^(google|facebook|instagram|tiktok|youtube|x|threads|bluesky|reddit|discord|newsletter|email|push|linkedin|steam|(creator|partner|pr)-[a-z0-9]+(-[a-z0-9]+)*)$/,
  utm_medium: /^(organic-social|community|email|push|paid-social|cpc|referral|pr|creator|partner|qr)$/,
  utm_campaign: /^c(0[1-9]|[1-6][0-9]|7[01])[a-z]?-[a-z0-9]+(-[a-z0-9]+)*$/,
  utm_content: /^[a-z0-9]+(-[a-z0-9]+)+$/,
  utm_term: /^[a-z0-9_]+(-[a-z0-9_]+)*$/,
};

export interface UtmInput {
  url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term?: string;
  date?: string;
}

export interface UtmResult { url: string | null; errors: { field: string; message: string }[] }

export function normaliseValue(v: string): string {
  return v.trim().toLowerCase().replace(/\s+/g, "-");
}

export function buildUtm(input: UtmInput): UtmResult {
  const errors: { field: string; message: string }[] = [];
  const p = {
    utm_source: normaliseValue(input.utm_source || ""),
    utm_medium: normaliseValue(input.utm_medium || ""),
    utm_campaign: normaliseValue(input.utm_campaign || ""),
    utm_content: normaliseValue(input.utm_content || ""),
    utm_term: input.utm_term ? normaliseValue(input.utm_term) : "",
  };
  let base: URL | null = null;
  try {
    base = new URL(input.url.trim());
  } catch {
    errors.push({ field: "url", message: "Enter a full URL starting with https://" });
  }
  if (base && !/(^|\.)techplay\.gg$/.test(base.hostname)) errors.push({ field: "url", message: "Host must be techplay.gg (UTMs are never used on internal links or other sites)" });
  if (base && [...base.searchParams.keys()].some((k) => k.startsWith("utm_"))) errors.push({ field: "url", message: "The URL already has UTM parameters; paste the clean URL" });

  (["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const).forEach((k) => {
    if (!p[k]) errors.push({ field: k, message: "Required" });
    else if (!RX[k].test(p[k])) errors.push({ field: k, message: messages[k] });
  });
  if (p.utm_term && !RX.utm_term.test(p.utm_term)) errors.push({ field: "utm_term", message: messages.utm_term });

  // Cross-field rules
  const m = p.utm_medium, s = p.utm_source;
  if (m === "cpc") {
    if (s !== "google") errors.push({ field: "utm_source", message: "cpc is Google only" });
    if (!p.utm_term) errors.push({ field: "utm_term", message: "cpc needs utm_term (keyword)" });
  }
  if (m === "paid-social") {
    if (!["facebook", "instagram", "reddit", "tiktok", "youtube"].includes(s)) errors.push({ field: "utm_source", message: "paid-social source must be facebook, instagram, reddit, tiktok or youtube" });
    if (!p.utm_term) errors.push({ field: "utm_term", message: "paid-social needs utm_term (audience)" });
    if (input.date && input.date < "2026-10-19") errors.push({ field: "utm_medium", message: "No paid spend before 19 Oct 2026" });
  }
  if (m === "email" && !["newsletter", "email"].includes(s)) errors.push({ field: "utm_source", message: "email medium needs source newsletter or email" });
  if (m === "push" && !["push", "discord"].includes(s)) errors.push({ field: "utm_source", message: "push medium needs source push or discord" });
  if (s.startsWith("creator-") && m !== "creator") errors.push({ field: "utm_medium", message: "creator-* sources use medium creator" });
  if (s.startsWith("partner-") && !["partner", "qr"].includes(m)) errors.push({ field: "utm_medium", message: "partner-* sources use medium partner or qr" });
  if (s.startsWith("pr-") && m !== "pr") errors.push({ field: "utm_medium", message: "pr-* sources use medium pr" });
  if (m === "qr" && !p.utm_content.startsWith("qr-")) errors.push({ field: "utm_content", message: "qr links need utm_content starting qr-" });
  if (s === "newsletter" && p.utm_campaign && !/^c40-/.test(p.utm_campaign)) errors.push({ field: "utm_campaign", message: "The Save File uses c40-save-file-2026wNN" });
  if (p.utm_term && !["cpc", "paid-social"].includes(m) && s !== "reddit") errors.push({ field: "utm_term", message: "utm_term is for paid and Reddit only" });

  if (errors.length || !base) return { url: null, errors };
  const u = new URL(base.toString());
  u.searchParams.set("utm_source", p.utm_source);
  u.searchParams.set("utm_medium", p.utm_medium);
  u.searchParams.set("utm_campaign", p.utm_campaign);
  u.searchParams.set("utm_content", p.utm_content);
  if (p.utm_term) u.searchParams.set("utm_term", p.utm_term);
  const url = u.toString();
  if (url.length > 300) return { url: null, errors: [{ field: "url", message: `URL is ${url.length} characters; the limit is 300` }] };
  return { url, errors: [] };
}

const messages = {
  utm_source: "Use a listed platform, or creator-<handle>, partner-<name>, pr-<outlet>",
  utm_medium: "Use one of the allowed mediums",
  utm_campaign: "Format: c<01–71>[a-z]-<slug>, e.g. c06-gta6-countdown",
  utm_content: "Format: <franchise or asset>-<variant>, e.g. f01-carousel-a",
  utm_term: "Lower-case words joined by hyphens (underscores allowed for subreddits)",
};

/** Campaign slug suggestion from a campaign id and name, e.g. C06 + "GTA 6 Countdown" → c06-gta-6-countdown */
export function campaignSlug(id: string, name: string): string {
  const s = name.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").split("-").slice(0, 4).join("-");
  return `${id.toLowerCase()}-${s}`;
}
