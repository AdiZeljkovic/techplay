import type { Metadata } from "next";
import { getCalendar, getContent, getDoc, getSeo } from "@/lib/data";
import { getPlanDate } from "@/lib/server-date";
import { addDays } from "@/lib/dates";
import { enrichItems } from "@/lib/enrich";
import { sectionsOf } from "@/lib/md";
import { SeoView } from "./SeoView";

export const metadata: Metadata = { title: "SEO" };

export default async function SeoPage() {
  const pd = await getPlanDate();
  const seo = getSeo();
  const doc13 = getDoc("13-SEO-CONTENT")?.body ?? "";
  const s13 = sectionsOf(doc13, 2);
  const pick = (re: RegExp) => s13.find((s) => re.test(s.title));
  const tasks = enrichItems(getCalendar().filter((d) => d.date >= pd.date && d.date <= addDays(pd.date, 6)).flatMap((d) => d.items.filter((i) => ["seo", "google-news", "discover"].includes(i.channel))));
  return (
    <SeoView
      evergreen={getContent().filter((c) => c.kind === "evergreen")}
      queries={seo.queries}
      hubs={[...(pick(/Game and platform hubs/) ? [pick(/Game and platform hubs/)!] : []), ...seo.hubs]}
      linking={pick(/Internal linking/)?.body ?? ""}
      indexable={pick(/indexable set/)?.body ?? ""}
      programmatic={pick(/Programmatic/)?.body ?? ""}
      plumbing={seo.plumbing} titles={seo.titleRewrites} tools={seo.tools} discover={seo.discover} tasks={tasks}
    />
  );
}
