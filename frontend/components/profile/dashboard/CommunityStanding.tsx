"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, Award, Lightbulb, Users, Sprout } from "lucide-react";
import { RankInsigniaMark } from "@/components/home-dashboard/RankInsignia";
import { getStorageUrl } from "@/lib/imageUrl";
import Sparkline from "./Sparkline";
import type { Recognition, StandingData } from "@/lib/types/profile";

const RECOGNITION_META: Record<string, { icon: any; color: string }> = {
    helpful: { icon: Award, color: "#f472b6" },
    insightful: { icon: Lightbulb, color: "#fbbf24" },
    friendly: { icon: Users, color: "#60a5fa" },
    leader: { icon: Sprout, color: "#34d399" },
};

/**
 * Where this player stands — on the one ladder the site has.
 *
 * This card used to run a ladder of its own: six "Community Standing" tiers
 * on forum reputation, three divisions each. It read "Rookie III · Top 100%"
 * on every profile on the site, because its first promotion sat at 2,000
 * reputation and the site record is 68. And four of its six names were also
 * XP rank names, so a reader saw "Noob" in the hero and "Rookie III" here and
 * reported a bug — two ladders wearing each other's words.
 *
 * It is the XP rank now: the same rank the hero draws, because there is only
 * one. What this card adds is the part the hero cannot say — where that rank
 * places you against everybody else, how far the next band is, and what the
 * community has handed you directly.
 *
 * Reputation stays as a line rather than a ladder. It is real, the
 * leaderboard ranks by it, and it is no longer dressed as a rank.
 */
export default function CommunityStanding({ standing, recognitions = [] }: {
    standing?: StandingData;
    recognitions?: Recognition[];
}) {
    if (!standing) return null;

    const rank = standing.rank;
    const next = standing.next_rank;
    const delta = standing.xp_delta_percent ?? null;
    const history = standing.history ?? [];
    const contribDelta = standing.monthly_contribution_delta_percent ?? null;
    const givenRecognitions = recognitions.filter((r) => r.count > 0);

    // How far across the current band. Null at the top, where there is no band
    // left and a bar that reads 100% would look like a stalled one.
    const floor = rank?.min_xp ?? 0;
    const ceiling = next?.min_xp ?? null;
    const fill = ceiling !== null && ceiling > floor
        ? Math.min(100, Math.max(0, Math.round(((standing.xp - floor) / (ceiling - floor)) * 100)))
        : null;

    const tint = rank?.color || "#9ca3af";

    return (
        <div className="space-y-5">
            {/* The rank, and what it is worth against everybody else. */}
            <div className="flex items-center gap-4">
                <RankInsigniaMark
                    icon={rank?.icon ? getStorageUrl(rank.icon) : null}
                    color={rank?.color ?? null}
                    name={rank?.name ?? null}
                    size={72}
                />
                <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55 mb-0.5">Community Standing</div>
                    <div className="text-lg font-black text-white leading-tight truncate">
                        {rank?.name ?? "Unranked"}
                    </div>
                    <div className="text-[12px] font-bold" style={{ color: tint }}>
                        Top {standing.percentile}% of the community
                    </div>
                </div>
            </div>

            {/* XP + trend. The line plots the same quantity as the number above
                it — it used to plot reputation under a reputation tier, and
                would have plotted reputation under an XP rank if left alone. */}
            <div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white tabular-nums leading-none">
                        {standing.xp.toLocaleString("en-US")}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/55">XP</span>
                    {delta !== null && (
                        <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ml-auto ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {delta >= 0 ? "+" : ""}{delta}% MoM
                        </span>
                    )}
                </div>

                {/* The next band, which is the only thing on this card that
                    says what happens next. */}
                {next && fill !== null && (
                    <div className="mt-3">
                        <div className="h-1.5 rounded-full overflow-hidden bg-white/[0.07]">
                            <span
                                className="block h-full rounded-full transition-[width] duration-700"
                                style={{ width: `${fill}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${tint} 55%, black), ${tint})` }}
                            />
                        </div>
                        <p className="mt-1.5 flex items-baseline justify-between gap-2 text-[10.5px] text-white/50">
                            <span>{(next.min_xp - standing.xp).toLocaleString("en-US")} XP to {next.name}</span>
                            <span className="tabular-nums">{fill}%</span>
                        </p>
                    </div>
                )}

                {history.length >= 2 && <Sparkline data={history} height={40} className="mt-3" />}
            </div>

            {/* Monthly contribution */}
            <div className="flex items-center justify-between py-3 border-y border-[var(--line)]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/55">This month</span>
                <span className="flex items-baseline gap-1.5">
                    <span className="text-[15px] font-black text-white tabular-nums">{standing.monthly_contribution.toLocaleString("en-US")}</span>
                    <span className="text-[11px] text-white/55">pts</span>
                    {contribDelta !== null && (
                        <span className={`text-[10px] font-bold ${contribDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {contribDelta >= 0 ? "+" : ""}{contribDelta}%
                        </span>
                    )}
                </span>
            </div>

            {/* Forum reputation — a number, not a rank. Drawn only when there
                is any: a zero here would read as a verdict on somebody who has
                simply never posted. */}
            {standing.reputation > 0 && (
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/55">Forum reputation</span>
                    <span className="text-[13px] font-black text-white tabular-nums">{standing.reputation.toLocaleString("en-US")}</span>
                </div>
            )}

            {/* Recognitions — only earned ones */}
            {givenRecognitions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {givenRecognitions.map((r) => {
                        const meta = RECOGNITION_META[r.type] ?? { icon: Award, color: "#9ca3af" };
                        const Icon = meta.icon;
                        return (
                            <span key={r.type}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-card)] border text-[11px] font-bold"
                                style={{ color: meta.color, borderColor: `${meta.color}35`, backgroundColor: `${meta.color}12` }}>
                                <Icon className="w-3.5 h-3.5" /> {r.label} <span className="tabular-nums">{r.count}</span>
                            </span>
                        );
                    })}
                </div>
            )}

            <Link href="/leaderboard" className="block text-center py-2 rounded-[var(--radius-card)] border border-[var(--line)] text-[10.5px] font-bold uppercase tracking-widest text-white/45 hover:text-[var(--accent)] hover:border-[var(--accent)]/40 transition-all">
                View Leaderboard
            </Link>
        </div>
    );
}
