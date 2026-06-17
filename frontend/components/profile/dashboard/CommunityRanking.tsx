"use client";

import { Medal, TrendingUp, TrendingDown } from "lucide-react";
import type { ReputationData } from "@/lib/types/profile";

export default function CommunityRanking({ reputation }: { reputation: ReputationData }) {
    const { tier, tier_color, division, percentile, monthly_contribution, monthly_contribution_delta_percent: contribDelta } = reputation;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 border" style={{ backgroundColor: `${tier_color}1A`, borderColor: `${tier_color}40` }}>
                    <Medal className="w-6 h-6" style={{ color: tier_color }} />
                </div>
                <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Current Rank</div>
                    <div className="text-xl font-black text-white leading-tight">{tier} {division}</div>
                    <div className="text-[11px] font-semibold" style={{ color: tier_color }}>Top {percentile}% of the community</div>
                </div>
            </div>

            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 flex items-center justify-between">
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40 mb-0.5">Monthly Contribution</div>
                    <div className="text-lg font-black text-white tabular-nums leading-none">{monthly_contribution.toLocaleString()} <span className="text-[11px] font-semibold text-white/40">pts</span></div>
                </div>
                {contribDelta !== null && (
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${contribDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {contribDelta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {contribDelta >= 0 ? "+" : ""}{contribDelta}%
                    </span>
                )}
            </div>
        </div>
    );
}
