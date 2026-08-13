"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import Meter from "@/components/ui/Meter";
import { Compass, Flame, CalendarDays, CalendarRange, Check, Zap, Coins } from "lucide-react";

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data);

interface Quest {
    id: number;
    name: string;
    description: string;
    type: "daily" | "weekly" | "monthly" | "permanent";
    is_seasonal?: boolean;
    criteria_value: number;
    xp_reward: number;
    bounty_reward: number;
    progress: number;
    completed: boolean;
}

const LAYERS: { type: Quest["type"]; label: string; blurb: string; icon: typeof Compass }[] = [
    { type: "permanent", label: "First steps", blurb: "One lap of the site — done once", icon: Compass },
    { type: "daily", label: "Today", blurb: "Resets at midnight", icon: Flame },
    { type: "weekly", label: "This week", blurb: "Resets on Monday", icon: CalendarDays },
    { type: "monthly", label: "This season", blurb: "The long arcs", icon: CalendarRange },
];

function QuestRow({ quest }: { quest: Quest }) {
    return (
        <div
            className={`rounded-[var(--radius-card)] border p-3.5 transition-colors duration-300 ${
                quest.completed
                    ? "border-emerald-500/25 bg-emerald-500/[0.06]"
                    : "border-[var(--line)] bg-[var(--fill-1)]"
            }`}
        >
            <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-white truncate">{quest.name}</span>
                        {quest.completed && <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-white/35 leading-snug">{quest.description}</p>
                </div>

                <div className="shrink-0 flex items-center gap-2.5 font-display text-[10px] font-black tabular-nums">
                    {quest.xp_reward > 0 && (
                        <span className="inline-flex items-center gap-1 text-[var(--xp-bright,#a78bfa)]">
                            <Zap className="w-3 h-3" /> {quest.xp_reward}
                        </span>
                    )}
                    {quest.bounty_reward > 0 && (
                        <span className="inline-flex items-center gap-1 text-amber-400">
                            <Coins className="w-3 h-3" /> {quest.bounty_reward}
                        </span>
                    )}
                </div>
            </div>

            {/* A one-step quest has nothing to measure — the tick says it all. */}
            {quest.criteria_value > 1 && (
                <Meter
                    value={quest.progress}
                    max={quest.criteria_value}
                    showCount
                    tone={quest.completed ? "#34d399" : undefined}
                    className="mt-3"
                />
            )}
        </div>
    );
}

/**
 * The quest board, grouped by the question each layer answers.
 *
 * The catalogue used to count two things — the collection and the journal — so
 * somebody who spent every evening on the forum, wrote lists and made friends
 * could finish a whole season without a single quest noticing them. It covers
 * the platform now, and the server hands back a shortlist rather than the
 * whole catalogue: three dailies, three weeklies, the season's arcs, and
 * whatever is left of the welcome chain.
 */
export default function QuestBoard() {
    const { data: quests } = useSWR<Quest[]>("/user/quests", fetcher, {
        dedupingInterval: 120_000,
        revalidateOnFocus: false,
    });

    if (!quests?.length) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LAYERS.map(({ type, label, blurb, icon: Icon }) => {
                const group = quests.filter((q) => q.type === type);

                if (group.length === 0) return null;

                const done = group.filter((q) => q.completed).length;

                return (
                    <section
                        key={type}
                        className="rounded-[var(--radius-panel)] border p-4"
                        style={{
                            background: "var(--surface-2)",
                            borderColor: "var(--line-strong)",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
                        }}
                    >
                        <header className="flex items-baseline gap-2.5 mb-3">
                            <Icon className="w-4 h-4 shrink-0 self-center text-[var(--accent)]" />
                            <h3 className="font-display text-[11px] font-black uppercase tracking-[0.14em] text-white">{label}</h3>
                            <span className="font-display text-[10px] font-bold tabular-nums text-white/25">
                                {done}/{group.length}
                            </span>
                            <span className="ml-auto text-[10.5px] text-white/25 hidden sm:block">{blurb}</span>
                        </header>

                        <div className="space-y-2">
                            {group.map((q) => <QuestRow key={q.id} quest={q} />)}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}
