"use client";

import Link from "next/link";
import useSWR from "swr";
import { Clock3, Sparkles, ChevronRight } from "lucide-react";
import axios from "@/lib/axios";
import Panel from "@/components/ui/Panel";
import { useCountUp } from "@/hooks/useCountUp";
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
 * The reward, struck as a hex medal. Violet when the quest pays XP
 * (progression), amber when it pays only bounty (currency) — the same colour
 * law as everywhere else. It breathes while the quest is still open.
 */
function RewardHex({ amount, paysXp }: { amount: number; paysXp: boolean }) {
    const shown = useCountUp(amount, 1100);
    const tint = paysXp ? "var(--xp)" : "#f59e0b";
    const bright = paysXp ? "var(--xp-bright)" : "#fbbf24";

    return (
        <span className="shrink-0 flex flex-col items-center gap-2">
            <span className="relative block w-[62px] h-[62px]">
                {/* a slow halo, so the pay reads as live loot */}
                <span
                    aria-hidden
                    className="tp-pulse-ring absolute inset-0"
                    style={{ clipPath: HEX, background: tint }}
                />
                <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                        clipPath: HEX,
                        background: `linear-gradient(160deg, ${bright} 0%, ${tint} 55%, ${paysXp ? "var(--xp-deep)" : "#b45309"} 100%)`,
                        filter: `drop-shadow(0 0 14px color-mix(in srgb, ${tint} 55%, transparent))`,
                    }}
                />
                <span aria-hidden className="absolute inset-[3px]" style={{ clipPath: HEX, background: "var(--surface-1)" }} />
                <span
                    className="absolute inset-0 flex items-center justify-center font-display text-[14px] font-black"
                    style={{ color: bright }}
                >
                    {paysXp ? "XP" : "B"}
                </span>
            </span>
            <span className="font-display text-[17px] font-black tabular-nums leading-none" style={{ color: bright }}>
                {shown}
            </span>
        </span>
    );
}

/**
 * One featured challenge, not a board — the deadline in the header, the task,
 * a live bar, and what it pays. The full quest board stays in Daily Missions;
 * the footer link scrolls there.
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
    const target = Math.max(1, featured?.criteria_value ?? 1);
    const percent = featured ? Math.min(100, Math.round((featured.progress / target) * 100)) : 0;
    const paysXp = !!featured && featured.xp_reward > 0;

    const fill = useCountUp(percent, 1100);
    const done = useCountUp(featured?.progress ?? 0, 1100);

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
                <div className="flex-1 rounded-[12px] bg-white/[0.04] animate-pulse min-h-[110px]" />
            ) : !featured ? (
                <p className="flex-1 flex items-center justify-center gap-2 text-[12px] text-white/45 text-center">
                    <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                    All challenges cleared — new ones arrive tomorrow.
                </p>
            ) : (
                <div className="flex-1 flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-semibold text-white leading-snug line-clamp-2">
                            {featured.description || featured.name}
                        </p>

                        {/* the bar charges, and keeps a highlight moving while
                            there's still ground to cover */}
                        <span className="relative mt-3.5 block h-[8px] rounded-full bg-[var(--track)] overflow-hidden">
                            <span
                                className="absolute inset-y-0 left-0 rounded-full overflow-hidden transition-[width] duration-700 ease-[var(--ease-hud)]"
                                style={{
                                    width: `${fill}%`,
                                    background: "linear-gradient(90deg, var(--accent) 0%, var(--accent-bright) 100%)",
                                    boxShadow: "0 0 12px color-mix(in srgb, var(--accent) 55%, transparent)",
                                }}
                            >
                                {fill > 6 && fill < 100 && (
                                    <span className="tp-xp-shimmer absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent" />
                                )}
                            </span>
                        </span>

                        <p className="mt-2 font-display text-[13px] font-black tabular-nums text-white">
                            {done}
                            <span className="text-white/30"> / {featured.criteria_value}</span>
                        </p>
                    </div>

                    <RewardHex amount={paysXp ? featured.xp_reward : featured.bounty_reward} paysXp={paysXp} />
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
