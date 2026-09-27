// One status vocabulary per kind of thing, used everywhere in the UI.

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"] as const;
export const CAMPAIGN_STATUSES = ["PLANNED", "ACTIVE", "PAUSED", "COMPLETE"] as const;
export const CONTENT_STATUSES = ["IDEA", "PLANNED", "CREATING", "READY", "PUBLISHED", "REJECTED"] as const;
export const ASSET_STATUSES = ["NEEDED", "IN_DESIGN", "READY", "PUBLISHED"] as const;
export const VIDEO_STAGES = ["IDEA", "SCRIPT", "RECORDING", "EDITING", "READY", "PUBLISHED"] as const;
export const PR_STAGES = ["IDEA", "DATA_COLLECTION", "CREATION", "OUTREACH", "COVERAGE", "COMPLETE"] as const;
export const PIPELINE_STAGES = ["TARGET", "CONTACT", "OPPORTUNITY", "OUTREACH", "REPLY", "NEGOTIATION", "ACTIVE", "COMPLETE"] as const;
export const EXPERIMENT_STATUSES = ["BACKLOG", "RUNNING", "WON", "LOST", "INCONCLUSIVE"] as const;
export const SEND_STATUSES = ["DRAFT", "SCHEDULED", "SENT"] as const;
export const PRIORITIES = ["P0", "P1", "P2", "P3"] as const;
export const OWNERS = ["EIC", "ED", "SC", "DS", "DEV"] as const;

export const OWNER_NAMES: Record<string, string> = {
  EIC: "Founder / Editor-in-Chief",
  ED: "Journalist / Editor",
  SC: "Social / Community",
  DS: "Designer",
  DEV: "Developer",
};

export type TaskStatus = (typeof TASK_STATUSES)[number];

export function label(s: string): string {
  return s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

/** Tone for a status chip. Reserved: done/complete = good, blocked/lost = critical. */
export function tone(s: string): "neutral" | "info" | "good" | "warn" | "bad" | "muted" {
  switch (s) {
    case "DONE": case "COMPLETE": case "PUBLISHED": case "WON": case "SENT": case "READY": case "ACTIVE":
      return s === "ACTIVE" ? "info" : "good";
    case "IN_PROGRESS": case "RUNNING": case "IN_DESIGN": case "CREATING": case "SCRIPT": case "RECORDING": case "EDITING":
    case "OUTREACH": case "CREATION": case "DATA_COLLECTION": case "SCHEDULED": case "REPLY": case "NEGOTIATION": case "CONTACT": case "OPPORTUNITY": case "COVERAGE":
      return "info";
    case "BLOCKED": case "LOST": case "REJECTED":
      return "bad";
    case "PAUSED": case "INCONCLUSIVE": case "NEEDED":
      return "warn";
    default:
      return "neutral";
  }
}

/** Normalise the many priority spellings in the docs to P0–P3. */
export function normPriority(p: string | undefined): string {
  if (!p) return "P2";
  const m = p.match(/P[0-3]/);
  if (m) return m[0];
  if (/T1|must|^A$/i.test(p)) return "P0";
  if (/T2|should|^B$/i.test(p)) return "P1";
  if (/T3|could|^C$/i.test(p)) return "P2";
  return "P2";
}
