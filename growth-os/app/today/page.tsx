import type { Metadata } from "next";
import { getCalendar, getDay } from "@/lib/data";
import { getPlanDate } from "@/lib/server-date";
import { enrichItems } from "@/lib/enrich";
import { sideItemsFor } from "@/lib/today";
import { TodayView } from "./TodayView";
import { Empty } from "@/components/ui";

export const metadata: Metadata = { title: "Today" };

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const sp = await searchParams;
  const pd = await getPlanDate();
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : pd.date;
  const day = getDay(date);
  if (!day) return <Empty title={`No plan for ${date}`} hint="The calendar covers 28 Sep to 31 Dec 2026." />;
  const all = getCalendar();
  const i = all.findIndex((d) => d.date === date);
  return (
    <TodayView
      day={{ ...day, items: [] }}
      items={enrichItems(day.items)}
      side={sideItemsFor(date)}
      prev={all[i - 1]?.date ?? null}
      next={all[i + 1]?.date ?? null}
      isToday={date === pd.date}
    />
  );
}
