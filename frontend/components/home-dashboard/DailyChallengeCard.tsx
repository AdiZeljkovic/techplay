"use client";

import Link from "next/link";
import useSWR from "swr";
import { Clock3, Sparkles, ChevronRight } from "lucide-react";
import axios from "@/lib/axios";
import Panel from "@/components/ui/Panel";
import { timeLeft } from "@/lib/timeAgo";

interface Quest {
    id: number;
    name: string;
    description: string;
    type: "daily" | "weekly" | "monthly" | "permanent";
    criteria_value: number;
    xp_reward: number;
    bounty_reward: number;
    progress: number;
    completed: boolean;
    expires_at: string | null;
}

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data as Quest[]);

const HEX = "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";

/**
 * One featured challenge, not a board — the deadline in the header, the task,
 * the bar, and what it pays. The full quest board stays in Daily Missions;
 * the footer link scrolls there.
 *
 * The reward hex wears violet when it pays XP (progression), amber when it
 * pays only bounty (currency) — same colour law as everywhere else.
 */
export default function DailyChallengeCard() {
    const { data: quests } = useSWR("/user/quests", fetcher, {
        dedupingInterval: 120_000,
        revalidateOnFocus: false,
    });

    // The most urgent open quest fronts the card — nearest deadline first,
    // undated (ongoing) ones last.
    const featured = (quests ?? [])
        .filter((q) => !q.completed)
        .sort((a, b) => {
            if (!a.expires_at) return 1;
            if (!b.expires_at) return -1;
            return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
        })[0];

    const remaining = featured ? timeLeft(featured.expires_at) : null;
    const percent = featured
        ? Math.min(100, Math.round((featured.progress / Math.max(1, featured.criteria_value)) * 100))
        : 0;
    const paysXp = !!featured && featured.xp_reward > 0;

    return (
        <Panel
            title="Daily Challenge"
            meta={
                remaining ? (
                    <span className="inline-flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
                        <Clock3 className="w-3.5 h-3.5" /> {remaining}
                    </span>
                ) : undefined
            }
            className="h-full flex flex-col"
            bodyClassName="p-4 flex-1 flex flex-col"
        >
            {!quests ? (
                <div className="flex-1 rounded-[12px] bg-white/[0.04] animate-pulse min-h-[120px]" />
            ) : !featured ? (
                <p className="flex-1 flex items-center justify-center gap-2 text-[12px] text-white/45 text-center">
                    <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                    All challenges cleared — new ones arrive tomorrow.
                </p>
            ) : (
                <div className="flex-1 flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-semibold text-white leading-snug">
                            {featured.description || featured.name}
                        </p>

                        <div className="mt-3.5 h-[7px] rounded-full bg-[var(--track)] overflow-hidden">
                            <span
                                className="block h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-bright)] transition-[width] duration-700 ease-[var(--ease-hud)]"
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                        <p className="mt-2 font-display text-[12px] font-black tabular-nums text-white/60">
                            {featured.progress} <span className="text-white/30 font-bold">/ {featured.criteria_value}</span>
                        </p>
                    </div>

                    {/* the pay, struck as a hex */}
                    <div className="shrink-0 flex flex-col items-center gap-1.5">
                        <span className="relative block w-[58px] h-[58px]">
                            <span
                                aria-hidden
                                className="absolute inset-0"
                                style={{
                                    clipPath: HEX,
                                    background: paysXp
                                        ? "linear-gradient(160deg, var(--xp-bright) 0%, var(--xp) 55%, var(--xp-deep) 100%)"
                                        : "linear-gradient(160deg, #fcd34d 0%, #f59e0b 55%, #b45309 100%)",
                                    filter: paysXp
                                        ? "drop-shadow(0 0 12px color-mix(in srgb, var(--xp) 55%, transparent))"
                                        : "drop-shadow(0 0 12px rgba(245,158,11,0.45))",
                                }}
                            />
                            <span aria-hidden className="absolute inset-[3px]" style={{ clipPath: HEX, background: "#0d0b0a" }} />
                            <span className="absolute inset-0 flex items-center justify-center font-display text-[13px] font-black text-white">
                                {paysXp ? "XP" : "B"}
                            </span>
                        </span>
                        <span
                            className="font-display text-[14px] font-black tabular-nums leading-none"
                            style={{ color: paysXp ? "var(--xp-bright)" : "#fbbf24" }}
                        >
                            {paysXp ? featured.xp_reward : featured.bounty_reward}
                        </span>
                    </div>
                </div>
            )}

            <Link
                href="#daily-missions"
                className="mt-4 inline-flex items-center justify-center gap-1.5 h-10 w-full rounded-[8px] border border-white/[0.12] bg-white/[0.04] font-display text-[11px] font-bold uppercase tracking-[0.1em] text-white hover:bg-white/[0.09] hover:border-white/25 transition-colors duration-300"
            >
                View all challenges <ChevronRight className="w-4 h-4" />
            </Link>
        </Panel>
    );
}
