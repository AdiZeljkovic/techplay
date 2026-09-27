import type { Metadata } from "next";
import { getOpportunities } from "@/lib/data";
import { getPlanDate } from "@/lib/server-date";
import { OpportunitiesView } from "./OpportunitiesView";

export const metadata: Metadata = { title: "Opportunities" };

export default async function OpportunitiesPage() {
  const pd = await getPlanDate();
  const o = getOpportunities();
  return <OpportunitiesView items={o.items} keyDates={o.keyDates} today={pd.date} />;
}
