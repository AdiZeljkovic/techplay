"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Flame, Check, Loader2, Target, Clock3, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import axios from "@/lib/axios";
import type { DashboardData } from "@/lib/types/dashboard";
import Panel from "@/components/ui/Panel";
import { timeLeft } from "@/lib/timeAgo";

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
    expires_at: string | null;
}

const questFetcher = (url: string) => axios.get(url).then((r) => r.data?.data as Quest[]);

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

const TYPE_LABEL: Record<Quest["type"], string> = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    permanent: "Ongoing",
};

/**
 * The streak and the quest board are one loop — show up, claim, make
 * progress — so they live in one panel. Every row states what to do, how
 * far along you are, and what it pays.
 */
export default function DailyMissions({ streak }: { streak: DashboardData["streak"] }) {
    const [claiming, setClaiming] = useState(false);
    const { data: quests } = useSWR("/user/quests", questFetcher, {
        dedupingInterval: 120_000,
        revalidateOnFocus: false,
    });

    const active = (quests ?? []).filter((q) => !q.completed).slice(0, 3);
    const doneToday = streak.claimed_today;

    // Monday-indexed, so the lit run ends on the right weekday
    const todayIdx = (new Date().getDay() + 6) % 7;
    const lit = Math.min(streak.streak, todayIdx + 1);

    const claim = async () => {
        if (claiming || doneToday) return;
        setClaiming(true);
        try {
            const res = await axios.post("/user/streak/claim");
            toast.success(res.data?.message ?? `Day ${res.data?.data?.streak} streak!`);
            // the dashboard payload carries the streak — refresh both
            mutate("/me/dashboard");
            mutate("/user/streak");
        } catch {
            toast.error("Couldn't claim your bounty — try again.");
        } finally {
            setClaiming(false);
        }
    };

    return (
        <Panel
            title="Daily Missions"
            icon={<Target className="w-3.5 h-3.5 text-[var(--accent)]" />}
            crown
            variant="console"
            className="h-full flex flex-col"
            bodyClassName="p-4 flex-1 flex flex-col"
        >
            {/* ── the streak: today's one guaranteed reward ── */}
            <div
                className={`relative rounded-[12px] border p-3 overflow-hidden transition-colors duration-300 ${
                    doneToday
                        ? "border-[color-mix(in_srgb,var(--accent)_25%,transparent)] bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]"
                        : "border-white/[0.07] bg-white/[0.02]"
                }`}
            >
                {!doneToday && (
                    <span
                        aria-hidden
                        className="pointer-events-none absolute -right-12 -top-16 w-[240px] h-[240px] rounded-full opacity-[0.13]"
                        style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
                    />
                )}

                <div className="relative flex items-center gap-3">
                    <span className="relative shrink-0">
                        <span
                            className={`w-10 h-10 rounded-[8px] flex items-center justify-center transition-colors duration-300 ${
                                streak.streak > 0
                                    ? "bg-[var(--accent)] text-white shadow-[var(--glow-accent)]"
                                    : "bg-[var(--fill-2)] border border-[var(--line)] text-[var(--ink-faint)]"
                            }`}
                        >
                            <Flame className="w-5 h-5" />
                        </span>
                        {streak.streak > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--surface-0)] border border-[var(--accent)] flex items-center justify-center font-display text-[9px] font-black tabular-nums text-[var(--accent)]">
                                {streak.streak > 99 ? "99+" : streak.streak}
                            </span>
                        )}
                    </span>

                    <span className="min-w-0 flex-1">
                        <span className="block font-display text-[13px] font-black text-white leading-none">
                            {streak.streak > 0 ? `${streak.streak}-day streak` : "Start your streak"}
                        </span>
                        <span className="block mt-1 text-[10.5px] text-white/40 truncate">
                            {doneToday ? "Back tomorrow to keep it alive" : `Claim +${streak.next_bounty} bounty today`}
                        </span>
                    </span>

                    <button
                        onClick={claim}
                        disabled={doneToday || claiming}
                        className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[8px] font-display text-[10.5px] font-bold uppercase tracking-[0.08em] transition-colors duration-300 ${
                            doneToday
                                ? "bg-[var(--accent-soft)] text-[var(--accent)] cursor-default"
                                : claiming
                                  ? "bg-[var(--fill-2)] text-[var(--ink-low)]"
                                  : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-[var(--glow-accent)] active:scale-[0.97]"
                        }`}
                    >
                        {doneToday ? (
                            <><Check className="w-3.5 h-3.5" /> Claimed</>
                        ) : claiming ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <>Claim +{streak.next_bounty}</>
                        )}
                    </button>
                </div>

                {/* the week, so a streak is something you can see */}
                <div className="relative mt-2.5 flex items-center gap-1">
                    {DAYS.map((d, i) => {
                        const on = i < lit;
                        return (
                            <span key={i} className="flex-1 flex flex-col items-center gap-1">
                                <span
                                    className={`w-full h-1 rounded-full transition-colors duration-300 ${on ? "bg-[var(--accent)]" : "bg-[var(--track)]"}`}
                                    style={on ? { boxShadow: "0 0 8px color-mix(in srgb, var(--accent) 45%, transparent)" } : undefined}
                                />
                                <span className={`font-display text-[8px] font-bold leading-none ${i === todayIdx ? "text-white" : "text-white/25"}`}>
                                    {d}
                                </span>
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* ── the quest board ── */}
            <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                        <span aria-hidden className="w-1 h-3 rounded-full bg-[var(--accent)]" />
                        Active quests
                    </span>
                    {active.length > 0 && (
                        <span className="font-display text-[10px] font-black tabular-nums text-white/40">
                            {active.length} open
                        </span>
                    )}
                </div>

                {!quests && (
                    <div className="space-y-2">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="h-[62px] rounded-[10px] bg-white/[0.04] animate-pulse" />
                        ))}
                    </div>
                )}

                {quests && active.length === 0 && (
                    <p className="flex items-center justify-center gap-2 py-5 text-[12px] text-white/45">
                        <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                        All quests cleared — new ones arrive tomorrow.
                    </p>
                )}

                <div className="space-y-1.5">
                    {active.map((q) => {
                        const percent = Math.min(100, Math.round((q.progress / Math.max(1, q.criteria_value)) * 100));
                        const remaining = timeLeft(q.expires_at);

                        return (
                            <div
                                key={q.id}
                                className="group rounded-[10px] border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)] transition-colors duration-300"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="font-display text-[12px] font-bold text-white truncate">{q.name}</span>
                                            <span
                                                className={`shrink-0 inline-flex items-center h-[16px] px-1.5 rounded-[3px] text-[8px] font-black uppercase tracking-[0.1em] border ${
                                                    q.is_seasonal
                                                        ? "text-[var(--accent)] bg-[var(--accent-soft)] border-[color-mix(in_srgb,var(--accent)_30%,transparent)]"
                                                        : "text-[var(--ink-low)] bg-[var(--fill-2)] border-[var(--line)]"
                                                }`}
                                            >
                                                {q.is_seasonal ? "Season" : TYPE_LABEL[q.type]}
                                            </span>
                                            {remaining && (
                                                <span className="shrink-0 inline-flex items-center gap-1 font-display text-[8px] font-bold uppercase tracking-[0.1em] text-white/25">
                                                    <Clock3 className="w-2.5 h-2.5" /> {remaining}
                                                </span>
                                            )}
                                        </div>
                                        {/* what to actually do — the whole point */}
                                        {q.description && (
                                            <p className="mt-0.5 text-[10.5px] text-white/40 leading-snug line-clamp-1">{q.description}</p>
                                        )}
                                    </div>

                                    <div className="shrink-0 flex items-center gap-2 font-display text-[10.5px] font-black tabular-nums">
                                        {q.bounty_reward > 0 && (
                                            <span className="text-amber-400">
                                                +{q.bounty_reward}<span className="text-white/25 font-bold"> B</span>
                                            </span>
                                        )}
                                        {q.xp_reward > 0 && (
                                            <span className="text-[var(--xp-bright)]">
                                                +{q.xp_reward}<span className="text-white/25 font-bold"> XP</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-2 flex items-center gap-2.5">
                                    <span className="flex-1 h-1 rounded-full bg-[var(--track)] overflow-hidden">
                                        <span
                                            className="block h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-bright)] transition-[width] duration-700 ease-[var(--ease-hud)]"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </span>
                                    <span className="shrink-0 font-display text-[10px] font-black tabular-nums text-white/60">
                                        {q.progress}/{q.criteria_value}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </Panel>
    );
}
