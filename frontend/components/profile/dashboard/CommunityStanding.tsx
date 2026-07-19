"use client";

import Link from "next/link";
import { Box, TrendingUp, TrendingDown, Award, Lightbulb, Users, Sprout } from "lucide-react";
import HexMedal from "./HexMedal";
import Sparkline from "./Sparkline";
import type { Recognition, ReputationData } from "@/lib/types/profile";

const RECOGNITION_META: Record<string, { icon: any; color: string }> = {
    helpful: { icon: Award, color: "#f472b6" },
    insightful: { icon: Lightbulb, color: "#fbbf24" },
    friendly: { icon: Users, color: "#60a5fa" },
    leader: { icon: Sprout, color: "#34d399" },
};

/**
 * The single "community" card: reputation score + trend, Standing level,
 * percentile, monthly contribution and peer recognitions.
 * Replaces ReputationPowerCard + ReputationBountyCard + CommunityRanking.
 */
export default function CommunityStanding({ reputation, recognitions = [] }: {
    reputation?: ReputationData;
    recognitions?: Recognition[];
}) {
    if (!reputation) return null;

    const delta = reputation.reputation_delta_percent ?? null;
    const history = reputation.history ?? [];
    const contribDelta = reputation.monthly_contribution_delta_percent ?? null;
    const givenRecognitions = recognitions.filter((r) => r.count > 0);

    return (
        <div className="space-y-5">
            {/* Standing level + percentile */}
            <div className="flex items-center gap-4">
                <HexMedal size={72} color={reputation.tier_color}>
                    <Box className="w-7 h-7" strokeWidth={2.2} />
                </HexMedal>
                <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 mb-0.5">Community Standing</div>
                    <div className="text-lg font-black text-white leading-tight">
                        {reputation.tier} {reputation.division}
                    </div>
                    <div className="text-[12px] font-bold" style={{ color: reputation.tier_color }}>
                        Top {reputation.percentile}% of the community
                    </div>
                </div>
            </div>

            {/* Reputation score + trend */}
            <div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white tabular-nums leading-none">
                        {reputation.reputation.toLocaleString("en-US")}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Reputation</span>
                    {delta !== null && (
                        <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ml-auto ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {delta >= 0 ? "+" : ""}{delta}% MoM
                        </span>
                    )}
                </div>
                {history.length >= 2 && <Sparkline data={history} height={40} className="mt-2" />}
            </div>

            {/* Monthly contribution */}
            <div className="flex items-center justify-between py-3 border-y border-[var(--border)]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">This month</span>
                <span className="flex items-baseline gap-1.5">
                    <span className="text-[15px] font-black text-white tabular-nums">{reputation.monthly_contribution.toLocaleString("en-US")}</span>
                    <span className="text-[11px] text-white/40">pts</span>
                    {contribDelta !== null && (
                        <span className={`text-[10px] font-bold ${contribDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {contribDelta >= 0 ? "+" : ""}{contribDelta}%
                        </span>
                    )}
                </span>
            </div>

            {/* Recognitions — only earned ones */}
            {givenRecognitions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {givenRecognitions.map((r) => {
                        const meta = RECOGNITION_META[r.type] ?? { icon: Award, color: "#9ca3af" };
                        const Icon = meta.icon;
                        return (
                            <span key={r.type}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold"
                                style={{ color: meta.color, borderColor: `${meta.color}35`, backgroundColor: `${meta.color}12` }}>
                                <Icon className="w-3.5 h-3.5" /> {r.label} <span className="tabular-nums">{r.count}</span>
                            </span>
                        );
                    })}
                </div>
            )}

            <Link href="/leaderboard" className="block text-center py-2 rounded-lg border border-[var(--border)] text-[10.5px] font-bold uppercase tracking-widest text-white/45 hover:text-[var(--accent)] hover:border-[var(--accent)]/40 transition-all">
                View Leaderboard
            </Link>
        </div>
    );
}
