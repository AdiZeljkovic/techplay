// Joins calendar items with campaign data on the server, so client components
// receive exactly what they render (no 250 KB campaign file in the browser).
import { getBriefs, getCampaigns, getMeta } from "./data";
import type { CalendarItem } from "./types";

export interface EnrichedItem extends CalendarItem {
  campaignNames: Record<string, string>;
  campaignCopy: { campaign: string; text: string } | null;
  briefFor: string[];
}

export function enrichItems(items: CalendarItem[]): EnrichedItem[] {
  const camps = new Map(getCampaigns().map((c) => [c.id, c]));
  const briefs = getBriefs();
  const keys = getMeta().copyChannelKeys;
  return items.map((it) => {
    const names: Record<string, string> = {};
    let campaignCopy: EnrichedItem["campaignCopy"] = null;
    const briefFor: string[] = [];
    for (const cid of it.campaigns) {
      const base = cid.slice(0, 3);
      const c = camps.get(base);
      if (!c) continue;
      names[cid] = c.name;
      if (briefs[base]) briefFor.push(base);
      const k = keys[it.channel];
      if (!campaignCopy && k && c.copy[k] && c.copy[k].trim().length > 20) campaignCopy = { campaign: base, text: c.copy[k] };
    }
    return { ...it, campaignNames: names, campaignCopy, briefFor: [...new Set(briefFor)] };
  });
}
