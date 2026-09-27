import type { Metadata } from "next";
import { getCalendar, getCampaigns } from "@/lib/data";
import { getPlanDate } from "@/lib/server-date";
import { CalendarView, type LiteDay } from "./CalendarView";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const pd = await getPlanDate();
  const days: LiteDay[] = getCalendar().map((d) => ({
    date: d.date, theme: d.theme, priority: d.priority, objective: d.objective,
    items: d.items.map((i) => ({
      id: i.id, channel: i.channel, label: i.channelLabel, group: i.group, owner: i.owner, priority: i.priority,
      campaigns: i.campaigns.map((c) => c.slice(0, 3)), franchises: i.franchises, paid: i.paid,
      text: (i.instruction || i.copy[0] || "").slice(0, 160), hasCopy: i.copy.length > 0,
    })),
  }));
  const campaigns = getCampaigns().map((c) => ({ id: c.id, name: c.name, start: c.start, end: c.end }));
  return <CalendarView days={days} campaigns={campaigns} today={pd.date} />;
}
