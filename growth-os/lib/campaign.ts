import type { Campaign } from "./types";

/** Date-derived default; a status set by hand (in state) always wins. */
export function defaultCampaignStatus(c: Pick<Campaign, "start" | "end">, date: string): "PLANNED" | "ACTIVE" | "COMPLETE" {
  if (c.start && date < c.start) return "PLANNED";
  if (c.end && date > c.end) return "COMPLETE";
  return "ACTIVE";
}
