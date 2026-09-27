import type { Metadata } from "next";
import { getCalendar, getVideo } from "@/lib/data";
import { getPlanDate } from "@/lib/server-date";
import { VideoView, type VideoCard } from "./VideoView";

export const metadata: Metadata = { title: "Video" };

export default async function VideoPage() {
  const pd = await getPlanDate();
  const v = getVideo();
  const ideas: VideoCard[] = v.ideas.map((i) => ({
    id: i.id, title: i.title, date: i.date, platforms: /long/i.test(i.format) ? ["YouTube"] : ["YouTube Shorts", "TikTok", "Instagram Reels", "Facebook Reels"],
    format: `${i.format} · ${i.length}`, detail: { Source: i.source, Target: i.target, Window: i.window, CTA: i.cta, Slot: i.slot }, script: "", origin: "Idea bank (09-YOUTUBE §8.3)",
  }));
  const verticals: VideoCard[] = getCalendar().flatMap((d) => d.items.filter((i) => i.channel === "reels").map((i) => ({
    id: `vid:${i.id}`, title: videoTitle(i.franchises[0] || i.campaigns[0] || "Vertical", i.copy[0] || i.instruction), date: d.date,
    platforms: ["YouTube Shorts", "TikTok", "Instagram Reels", "Facebook Reels"], format: "Vertical · one edit, four platforms",
    detail: { Campaigns: i.campaigns.join(", "), Franchise: i.franchises.join(", "), Owner: i.owner }, script: i.copy.join("\n\n"), origin: "Daily calendar (C49)",
  })));
  return <VideoView cards={[...verticals, ...ideas]} today={pd.date} shows={v.shows} pilots={v.pilots} workflow={v.workflow} />;
}

function videoTitle(tag: string, text: string): string {
  const hook = (text.match(/Hook:\s*([\s\S]*?)(?:\s(?:Fact|Cards|Topic|CTA):|$)/) || [])[1] || text;
  const t = hook.trim().replace(/\.$/, "");
  return `${tag} · ${t.length > 110 ? `${t.slice(0, 107)}…` : t}`;
}
