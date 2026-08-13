"use client";

import { Trophy } from "lucide-react";
import type { DashboardAchievement } from "@/lib/types/dashboard";
import { getStorageUrl } from "@/lib/imageUrl";
import Panel from "@/components/ui/Panel";
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
            // Fitted to the cell's height, not its width.
            //
            // These are hand-drawn cards and no two share an aspect ratio, so
            // fitting them to a common width left every one of them a
            // different height and the shelf came out as a ragged line. The
            // cell is now wider than the art needs, which makes height the
            // limiting edge — so they all stand exactly as tall as each other
            // and the small differences fall on the sides, where a centred row
            // absorbs them.
            //
            // No drop shadow either: the art already carries its own glow, and
            // a coloured one underneath read as a smear on the panel floor.
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={icon}
                alt=""
                aria-hidden
                loading="lazy"
                className="block w-full h-full object-contain"
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
            action={{ label: "All achievements", href: "/profile/me?tab=achievements" }}
            className="h-full flex flex-col"
            bodyClassName="p-4 flex-1 flex flex-col"
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
                    {/* Ten badges, and nothing else. The artwork already carries
                        its name and its points, so repeating them under each one
                        said everything twice and left room for very little art.
                        No plate either — the card has its own frame; a tile
                        behind it was a frame around a frame.

                        Ten across on a wide screen, one row: this panel sits
                        under the day's two cards and beside Today, and the
                        badges at their old size ran it three hundred pixels
                        past Today's floor. */}
                    <div className="flex-1 grid grid-cols-5 sm:grid-cols-7 xl:grid-cols-10 gap-2 content-center justify-items-center">
                        {achievements.slice(0, 10).map((a, i) => (
                            <div
                                key={a.id}
                                title={`${a.name}${a.description ? ` — ${a.description}` : ""}`}
                                className={`group relative w-full h-[86px] xl:h-[100px] flex items-center justify-center tp-fade-up tp-d${Math.min(6, i + 1)}`}
                            >
                                <span className="flex items-center justify-center w-full h-full transition-transform duration-500 ease-[var(--ease-hud)] group-hover:scale-[1.08]">
                                    <Medallion achievement={a} size={72} />
                                </span>
                            </div>
                        ))}
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
