"use client";

import Link from "next/link";
import useSWR from "swr";
import { Clock3, Sparkles, ChevronRight } from "lucide-react";
import axios from "@/lib/axios";
import Panel from "@/components/ui/Panel";
import Meter from "@/components/ui/Meter";
import StatIcon from "./StatIcon";
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

/**
 * The reward, struck as a hex medal. Violet when the quest pays XP
 * (progression), amber when it pays only bounty (currency) — the same colour
 * law as everywhere else. It breathes while the quest is still open.
 */
function RewardHex({ amount, paysXp }: { amount: number; paysXp: boolean }) {
    const shown = useCountUp(amount, 1100);
    const bright = paysXp ? "var(--xp-bright)" : "#fbbf24";

    return (
        <span className="shrink-0 flex flex-col items-center gap-2">
            {/* The reward, as the object it is. A flat hexagon with the letters
                XP printed on it was a label; the cell and the token are the
                same two things the rest of the profile already uses to mean
                progression and currency. */}
            <StatIcon
                src={paysXp ? "/images/profile/v2-xp.webp" : "/images/profile/v2-bounty.webp"}
                size={62}
                idle="pulse"
            />
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
    const paysXp = !!featured && featured.xp_reward > 0;

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
            material="instrument"
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

                        {/* Countable when there is something to count. A
                            challenge asking for three games drawn as a smooth
                            bar hid the one number that mattered. */}
                        <Meter
                            value={done}
                            max={featured.criteria_value}
                            showCount
                            className="mt-3.5"
                        />
                    </div>

                    <RewardHex amount={paysXp ? featured.xp_reward : featured.bounty_reward} paysXp={paysXp} />
                </div>
            )}

            <Link
                href="/profile/me?tab=progression"
                className="mt-4 inline-flex items-center justify-center gap-1.5 h-10 w-full rounded-[8px] border border-white/[0.12] bg-white/[0.04] font-display text-[11px] font-bold uppercase tracking-[0.1em] text-white hover:bg-white/[0.09] hover:border-white/25 transition-colors duration-300"
            >
                View all challenges <ChevronRight className="w-4 h-4" />
            </Link>
        </Panel>
    );
}
