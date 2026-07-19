"use client";

import { Box, TrendingUp, TrendingDown } from "lucide-react";
import HexMedal from "./HexMedal";
import type { ReputationData } from "@/lib/types/profile";

export default function CommunityRanking({ reputation }: { reputation: ReputationData }) {
    const { tier, tier_color, division, percentile, monthly_contribution, monthly_contribution_delta_percent: contribDelta } = reputation;

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-5">
                {/* Layered hexagon medal */}
                <HexMedal size={84} color={tier_color}>
                    <Box className="w-8 h-8" strokeWidth={2.2} />
                </HexMedal>

                {/* Rank + percentile */}
                <div className="flex-1 flex items-start justify-between gap-3 min-w-0">
                    <div className="min-w-0">
                        <div className="text-[11px] text-white/45 mb-0.5">Current Rank</div>
                        <div className="text-xl font-black text-white leading-tight">{tier} {division}</div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="text-[15px] font-black leading-tight" style={{ color: tier_color }}>Top {percentile}%</div>
                        <div className="text-[11px] text-white/45">of the community</div>
                    </div>
                </div>
            </div>

            {/* Monthly contribution */}
            <div>
                <div className="text-[11px] text-white/45 mb-1">Monthly Contribution</div>
                <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-white tabular-nums leading-none">{monthly_contribution.toLocaleString("en-US")} <span className="text-[12px] font-semibold text-white/45">pts</span></span>
                    {contribDelta !== null && (
                        <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${contribDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {contribDelta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            {contribDelta >= 0 ? "+" : ""}{contribDelta}%
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
