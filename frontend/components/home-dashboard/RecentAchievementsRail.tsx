"use client";

import { Trophy, Medal } from "lucide-react";
import type { DashboardAchievement } from "@/lib/types/dashboard";
import { getStorageUrl } from "@/lib/imageUrl";
import Panel from "@/components/ui/Panel";
import { timeAgo } from "@/lib/timeAgo";
import EmptyState from "@/components/ui/EmptyState";

const HEX = "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";

/**
 * Achievement tiers derived from `points` (the catalog runs 15 → 1000).
 * Without this every unlock renders in the same metal and the shelf reads
 * as five copies of one trophy.
 */
const TIERS = [
    { min: 500, label: "Legendary", color: "#d500f9" },
    { min: 200, label: "Platinum", color: "#b9f2ff" },
    { min: 75, label: "Gold", color: "#ffd700" },
    { min: 25, label: "Silver", color: "#c0c0c0" },
    { min: 0, label: "Bronze", color: "#cd7f32" },
];

const tierFor = (points: number) => TIERS.find((t) => points >= t.min) ?? TIERS[TIERS.length - 1];

/**
 * The artwork already ships as a finished badge with its own framing, so
 * when an icon exists it stands alone — wrapping it in a second hex would
 * be a frame inside a frame. The struck medal is the fallback for
 * achievements that have no artwork yet.
 */
function Medallion({ achievement, size = 66 }: { achievement: DashboardAchievement; size?: number }) {
    const tier = tierFor(achievement.points);
    const icon = getStorageUrl(achievement.icon_path);

    if (icon) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={icon}
                alt=""
                aria-hidden
                loading="lazy"
                className="block shrink-0 object-contain"
                style={{
                    width: size + 12,
                    height: size + 12,
                    filter: `drop-shadow(0 3px 10px color-mix(in srgb, ${tier.color} 40%, transparent))`,
                }}
            />
        );
    }

    return (
        <span className="relative block shrink-0" style={{ width: size, height: size }}>
            {/* struck rim */}
            <span
                aria-hidden
                className="absolute inset-0"
                style={{
                    clipPath: HEX,
                    background: `linear-gradient(155deg, ${tier.color} 0%, color-mix(in srgb, ${tier.color} 45%, black) 100%)`,
                    filter: `drop-shadow(0 0 9px color-mix(in srgb, ${tier.color} 45%, transparent))`,
                }}
            />
            {/* dark face */}
            <span aria-hidden className="absolute" style={{ inset: 3, clipPath: HEX, background: "var(--surface-2)" }} />
            {/* sheen across the face */}
            <span
                aria-hidden
                className="absolute"
                style={{
                    inset: 3,
                    clipPath: HEX,
                    background: `linear-gradient(150deg, color-mix(in srgb, ${tier.color} 26%, transparent) 0%, transparent 55%)`,
                }}
            />
            <span className="absolute inset-0 flex items-center justify-center">
                <Trophy style={{ width: size * 0.34, height: size * 0.34, color: tier.color }} />
            </span>
        </span>
    );
}

/** Latest unlocks as struck medals — the bragging shelf. */
export default function RecentAchievementsRail({
    achievements,
    total,
}: {
    achievements: DashboardAchievement[];
    total: number;
}) {
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
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {achievements.slice(0, 5).map((a, i) => {
                            const tier = tierFor(a.points);
                            return (
                                <div
                                    key={a.id}
                                    title={a.description ?? a.name}
                                    className={`group relative flex flex-col items-center text-center gap-2.5 p-3.5 rounded-[var(--radius-card)] bg-white/[0.02] border border-white/[0.07] overflow-hidden transition-colors duration-300 tp-fade-up tp-d${Math.min(6, i + 1)}`}
                                    style={{ ["--tier" as string]: tier.color }}
                                >
                                    {/* the tier's own light blooms in on hover */}
                                    <span
                                        aria-hidden
                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                        style={{ background: `radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, ${tier.color} 18%, transparent) 0%, transparent 70%)` }}
                                    />
                                    <span
                                        aria-hidden
                                        className="absolute inset-0 rounded-[var(--radius-card)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                        style={{ boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${tier.color} 45%, transparent)` }}
                                    />

                                    <span className="relative transition-transform duration-500 ease-[var(--ease-hud)] group-hover:scale-[1.08]">
                                        <Medallion achievement={a} />
                                    </span>

                                    <span className="relative min-w-0 w-full">
                                        <span
                                            className="block text-[8px] font-black uppercase tracking-[0.16em] mb-1"
                                            style={{ color: tier.color }}
                                        >
                                            {tier.label}
                                        </span>
                                        <span className="block text-[11px] font-bold text-[var(--ink-hi)] leading-tight line-clamp-2 min-h-[26px]">
                                            {a.name}
                                        </span>
                                        <span className="mt-1.5 flex items-center justify-center gap-1.5 text-[9px] uppercase tracking-wider">
                                            <span className="font-display font-bold tabular-nums" style={{ color: tier.color }}>
                                                +{a.points}
                                            </span>
                                            <span aria-hidden className="w-0.5 h-0.5 rounded-full bg-[var(--ink-faint)]" />
                                            <span className="text-[var(--ink-faint)]">{timeAgo(a.unlocked_at)}</span>
                                        </span>
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {total > achievements.length && (
                        <p className="mt-3 text-center text-[11px] text-[var(--ink-faint)]">
                            <span className="font-display font-bold tabular-nums text-[var(--ink-low)]">{total}</span> unlocked in total
                        </p>
                    )}
                </>
            )}
        </Panel>
    );
}
