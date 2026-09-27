// Everything dated on one plan day, from every source.
import { getEmail, getOpportunities, getPr, getSeedTasks, getVideo } from "./data";

export function sideItemsFor(date: string) {
  return {
    tasks: getSeedTasks().filter((t) => t.due === date),
    keyDates: getOpportunities().keyDates.filter((k) => k.date === date),
    sends: getEmail().sends.filter((s) => s.date === date),
    pr: getPr().filter((p) => p.date === date),
    videos: getVideo().ideas.filter((v) => v.date === date),
  };
}
export type SideItems = ReturnType<typeof sideItemsFor>;
