import type { Metadata } from "next";
import { getCalendar, getCampaigns, getSeedTasks } from "@/lib/data";
import { getPlanDate } from "@/lib/server-date";
import { TasksView, type TaskRow } from "./TasksView";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage() {
  const pd = await getPlanDate();
  const seed: TaskRow[] = getSeedTasks().map((t) => ({ ...t, custom: false }));
  const ops: TaskRow[] = getCalendar().flatMap((d) => d.items.filter((i) => i.group === "ops").map((i) => ({
    id: i.id, title: i.instruction.slice(0, 160), description: i.instruction, due: d.date, owner: i.owner.split(", ")[0],
    priority: i.priority, campaign: i.campaigns[0]?.slice(0, 3) || "", channel: "Operations", source: "Calendar · operations", custom: false,
  })));
  const campaigns = getCampaigns().map((c) => ({ id: c.id, name: c.name }));
  return <TasksView seed={[...ops, ...seed]} campaigns={campaigns} today={pd.date} />;
}
