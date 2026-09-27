import type { Metadata } from "next";
import { getBriefs, getCampaigns } from "@/lib/data";
import { getPlanDate } from "@/lib/server-date";
import { defaultCampaignStatus } from "@/lib/campaign";
import { normPriority } from "@/lib/status";
import { CampaignsView } from "./CampaignsView";

export const metadata: Metadata = { title: "Campaigns" };

export default async function CampaignsPage() {
  const pd = await getPlanDate();
  const briefs = getBriefs();
  const rows = getCampaigns().map((c) => ({
    id: c.id, name: c.name, type: c.type, goal: c.goal, target: c.target, kpi: c.kpi, audience: c.audience, channels: c.channels,
    start: c.start, end: c.end, budget: c.budget_usd, cta: c.cta, landing: c.landing_page, owner: c.owner,
    dependencies: c.dependencies, priority: normPriority(c.priority), def: defaultCampaignStatus(c, pd.date), hasBrief: Boolean(briefs[c.id]),
    delivery: c.delivery_status || "",
  }));
  return <CampaignsView rows={rows} />;
}
