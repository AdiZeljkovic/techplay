import type { Metadata } from "next";
import { getCalendar, getChannels, getCopy, getSocial } from "@/lib/data";
import { getPlanDate } from "@/lib/server-date";
import { addDays } from "@/lib/dates";
import { enrichItems } from "@/lib/enrich";
import { SOCIAL_TABS } from "@/lib/social";
import { SocialView } from "./SocialView";

export const metadata: Metadata = { title: "Social" };

export default async function SocialPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const sp = await searchParams;
  const pd = await getPlanDate();
  const tabId = SOCIAL_TABS.find((t) => t.id === sp.tab)?.id ?? "facebook";
  const tab = SOCIAL_TABS.find((t) => t.id === tabId)!;
  const cal = getCalendar();
  const inCh = (c: string) => (tab.cal as readonly string[]).includes(c);
  const today = enrichItems(cal.find((d) => d.date === pd.date)?.items.filter((i) => inCh(i.channel)) ?? []);
  const end = addDays(pd.date, 7);
  const upcoming = enrichItems(cal.filter((d) => d.date > pd.date && d.date <= end).flatMap((d) => d.items.filter((i) => inCh(i.channel))));
  const channels = getChannels().filter((c) => (tab.channels as readonly string[]).includes(c.id));
  const franchises = getSocial().franchises.filter((f) => tab.franchise.test(f.body.split("\n").find((l) => /Platforms/.test(l)) || ""));
  const copy = getCopy().filter((c) => tab.copy.test(c.channel) && c.source !== "Calendar").slice(0, 60);
  const perWeek = cal.filter((d) => d.date >= pd.date && d.date < addDays(pd.date, 7)).reduce((n, d) => n + d.items.filter((i) => inCh(i.channel)).length, 0);
  return (
    <SocialView
      tabs={SOCIAL_TABS.map((t) => ({ id: t.id, label: t.label }))} tab={tabId} date={pd.date}
      today={today} upcoming={upcoming} channels={channels} franchises={franchises} copy={copy} doc={tab.doc} perWeek={perWeek}
    />
  );
}
