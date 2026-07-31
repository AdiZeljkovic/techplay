"use client";

import { Trophy, Medal } from "lucide-react";
import type { DashboardAchievement } from "@/lib/types/dashboard";
import Panel from "@/components/ui/Panel";
import EmptyState from "@/components/ui/EmptyState";

function timeAgo(iso: string | null): string {
    if (!iso) return "";
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
}

/** Latest unlocks as trophy cards — the bragging shelf. */
export default function RecentAchievementsRail({ achievements }: { achievements: DashboardAchievement[] }) {
    return (
        <Panel
            title="Recent Achievements"
            icon={<Medal className="w-3.5 h-3.5 text-[var(--accent)]" />}
            action={{ label: "All achievements", href: "/profile/me?tab=achievements" }}
            bodyClassName="p-4"
        >
            {achievements.length === 0 ? (
                <EmptyState
                    variant="compact"
                    title="No achievements unlocked yet"
                    body="Add games, keep your streak, and publish reviews — trophies follow."
                    action={{ label: "See what's unlockable", href: "/profile/me?tab=achievements" }}
                />
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {achievements.slice(0, 5).map((a, i) => (
                        <div
                            key={a.id}
                            title={a.description ?? a.name}
                            className={`group flex flex-col items-center text-center gap-2 p-3 rounded-[var(--radius-card)] bg-[var(--fill-1)] border border-[var(--line)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:bg-[var(--fill-2)] transition-colors duration-300 tp-fade-up tp-d${Math.min(6, i + 1)}`}
                        >
                            <span className="w-12 h-12 rounded-[var(--radius-inner)] bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] flex items-center justify-center overflow-hidden transition-transform duration-500 ease-[var(--ease-hud)] group-hover:scale-[1.08] group-hover:shadow-[var(--glow-accent)]">
                                {a.icon_path ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={a.icon_path} alt="" aria-hidden loading="lazy" className="w-full h-full object-cover" />
                                ) : (
                                    <Trophy className="w-5 h-5 text-[var(--accent)]" />
                                )}
                            </span>
                            <span className="min-w-0 w-full">
                                <span className="block text-[11px] font-bold text-[var(--ink-hi)] leading-tight line-clamp-2">
                                    {a.name}
                                </span>
                                <span className="mt-1 flex items-center justify-center gap-1.5 text-[9px] uppercase tracking-wider">
                                    <span className="font-display font-bold tabular-nums text-[var(--accent)]">+{a.points} pts</span>
                                    <span aria-hidden className="w-0.5 h-0.5 rounded-full bg-[var(--ink-faint)]" />
                                    <span className="text-[var(--ink-faint)]">{timeAgo(a.unlocked_at)}</span>
                                </span>
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </Panel>
    );
}
