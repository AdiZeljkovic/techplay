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

    const active = (quests ?? []).filter((q) => !q.completed).slice(0, 4);
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
            bodyClassName="p-4"
        >
            {/* ── the streak: today's one guaranteed reward ── */}
            <div
                className={`relative rounded-[12px] border p-4 overflow-hidden transition-colors duration-300 ${
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

                <div className="relative flex items-center gap-3.5">
                    <span className="relative shrink-0">
                        <span
                            className={`w-12 h-12 rounded-[var(--radius-inner)] flex items-center justify-center transition-colors duration-300 ${
                                streak.streak > 0
                                    ? "bg-[var(--accent)] text-white shadow-[var(--glow-accent)]"
                                    : "bg-[var(--fill-2)] border border-[var(--line)] text-[var(--ink-faint)]"
                            }`}
                        >
                            <Flame className="w-6 h-6" />
                        </span>
                        {streak.streak > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-[var(--surface-0)] border border-[var(--accent)] flex items-center justify-center font-display text-[10px] font-bold tabular-nums text-[var(--accent)]">
                                {streak.streak > 99 ? "99+" : streak.streak}
                            </span>
                        )}
                    </span>

                    <span className="min-w-0 flex-1">
                        <span className="block font-display text-[14px] font-black text-white">
                            {streak.streak > 0 ? `${streak.streak}-day streak` : "Start your streak"}
                        </span>
                        <span className="block text-[11px] text-white/45">
                            {doneToday
                                ? "Claimed today — come back tomorrow to keep it alive"
                                : `Check in today to claim +${streak.next_bounty} bounty`}
                        </span>
                    </span>

                    <button
                        onClick={claim}
                        disabled={doneToday || claiming}
                        className={`shrink-0 inline-flex items-center gap-2 h-10 px-5 rounded-[var(--radius-card)] font-display text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                            doneToday
                                ? "bg-[var(--accent-soft)] text-[var(--accent)] cursor-default"
                                : claiming
                                  ? "bg-[var(--fill-2)] text-[var(--ink-low)]"
                                  : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-[var(--glow-accent)] active:scale-[0.97]"
                        }`}
                    >
                        {doneToday ? (
                            <><Check className="w-4 h-4" /> Claimed</>
                        ) : claiming ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>Claim +{streak.next_bounty}</>
                        )}
                    </button>
                </div>

                {/* the week, so a streak is something you can see */}
                <div className="relative mt-3.5 flex items-center gap-1.5">
                    {DAYS.map((d, i) => {
                        const on = i < lit;
                        return (
                            <span key={i} className="flex-1 flex flex-col items-center gap-1.5">
                                <span
                                    className={`w-full h-1.5 rounded-full transition-colors duration-300 ${on ? "bg-[var(--accent)]" : "bg-[var(--track)]"}`}
                                    style={on ? { boxShadow: "0 0 8px color-mix(in srgb, var(--accent) 45%, transparent)" } : undefined}
                                />
                                <span className={`font-display text-[9px] font-bold leading-none ${i === todayIdx ? "text-white" : "text-white/30"}`}>
                                    {d}
                                </span>
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* ── the quest board ── */}
            <div className="mt-4">
                <div className="flex items-center justify-between mb-2.5">
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
                            <div key={i} className="h-[76px] rounded-[12px] bg-white/[0.04] animate-pulse" />
                        ))}
                    </div>
                )}

                {quests && active.length === 0 && (
                    <p className="flex items-center justify-center gap-2 py-5 text-[12px] text-white/45">
                        <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                        All quests cleared — new ones arrive tomorrow.
                    </p>
                )}

                <div className="space-y-2">
                    {active.map((q) => {
                        const percent = Math.min(100, Math.round((q.progress / Math.max(1, q.criteria_value)) * 100));
                        const remaining = timeLeft(q.expires_at);

                        return (
                            <div
                                key={q.id}
                                className="group rounded-[12px] border border-white/[0.07] bg-white/[0.02] p-3 hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)] transition-colors duration-300"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-display text-[13px] font-bold text-white">{q.name}</span>
                                            <span
                                                className={`inline-flex items-center h-[18px] px-1.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                                                    q.is_seasonal
                                                        ? "text-[var(--accent)] bg-[var(--accent-soft)] border-[color-mix(in_srgb,var(--accent)_30%,transparent)]"
                                                        : "text-[var(--ink-low)] bg-[var(--fill-2)] border-[var(--line)]"
                                                }`}
                                            >
                                                {q.is_seasonal ? "Season" : TYPE_LABEL[q.type]}
                                            </span>
                                            {remaining && (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">
                                                    <Clock3 className="w-3 h-3" /> {remaining}
                                                </span>
                                            )}
                                        </div>
                                        {/* what to actually do — the whole point */}
                                        {q.description && (
                                            <p className="mt-1 text-[11px] text-white/45 leading-snug">{q.description}</p>
                                        )}
                                    </div>

                                    <div className="shrink-0 text-right leading-tight">
                                        {q.bounty_reward > 0 && (
                                            <p className="font-display text-[11px] font-bold tabular-nums text-amber-400">
                                                +{q.bounty_reward} <span className="text-[var(--ink-faint)] font-normal">B</span>
                                            </p>
                                        )}
                                        {q.xp_reward > 0 && (
                                            <p className="font-display text-[11px] font-black tabular-nums text-[var(--xp-bright)]">
                                                +{q.xp_reward} <span className="text-white/30 font-normal">XP</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-2.5 flex items-center gap-2.5">
                                    <span className="flex-1 h-1.5 rounded-full bg-[var(--track)] overflow-hidden">
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

            {/* how the loop pays out — stated once, at the bottom */}
            <p className="mt-4 pt-3 border-t border-white/[0.07] text-[10px] leading-relaxed text-white/35">
                Quests complete themselves as you play — no claiming needed.{" "}
                <span className="text-amber-400 font-semibold">Bounty (B)</span> is spent in the rewards store;{" "}
                <span className="text-[var(--xp-bright)] font-semibold">XP</span> raises your level and rank. The daily
                bounty grows +5 for each consecutive day, up to +50.
            </p>
        </Panel>
    );
}
