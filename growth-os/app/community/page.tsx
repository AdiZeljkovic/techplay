import type { Metadata } from "next";
import { getCalendar, getCommunity, getDoc } from "@/lib/data";
import { getPlanDate } from "@/lib/server-date";
import { addDays } from "@/lib/dates";
import { enrichItems } from "@/lib/enrich";
import { sectionsOf } from "@/lib/md";
import { CommunityView } from "./CommunityView";

export const metadata: Metadata = { title: "Community" };

export default async function CommunityPage() {
  const pd = await getPlanDate();
  const days = getCalendar().filter((d) => d.date >= pd.date && d.date <= addDays(pd.date, 6));
  const pick = (ch: string[]) => enrichItems(days.flatMap((d) => d.items.filter((i) => ch.includes(i.channel))));
  const c = getCommunity();
  const discordDoc = sectionsOf(getDoc("12-DISCORD")?.body ?? "", 2);
  const rhythms = discordDoc.filter((s) => /rhythm|timetable|Road to 500|Moderation/i.test(s.title));
  return <CommunityView discord={pick(["discord", "community"])} reddit={pick(["reddit"])} data={c} rhythms={rhythms} date={pd.date} />;
}
