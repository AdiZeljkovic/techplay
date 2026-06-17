"use client";

import { TrendingUp, TrendingDown, Star, Coins, Award } from "lucide-react";
import type { ProfileStats, ProfileUser, ReputationData } from "@/lib/types/profile";

interface Props {
    stats: ProfileStats;
    userData: ProfileUser;
    reputation?: ReputationData;
}

/**
 * "Reputation & Power" glass card shown top-right in the profile header.
 * Reputation MoM delta + percentile from Phase 2; bounty arrives in Phase 3.
 */
export default function ReputationPowerCard({ stats, userData, reputation }: Props) {
    const rep = reputation?.reputation ?? stats?.reputation ?? 0;
    const delta = reputation?.reputation_delta_percent ?? null;
    const percentile = reputation?.percentile ?? null;
    const loyaltyTier = userData.active_support?.tier?.name ?? "Free";
    const loyaltyColor = userData.active_support?.tier?.color ?? "#A1A1AA";

    return (
        <div className="w-full md:w-[340px] shrink-0 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-5 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
                <Star className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">Reputation &amp; Power</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-white/35 mb-1">Reputation</span>
                    <span className="text-2xl font-black text-white tabular-nums leading-none">{rep.toLocaleString()}</span>
                    {delta !== null ? (
                        <span className={`mt-1 inline-flex items-center gap-1 text-[10px] font-bold ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {delta >= 0 ? "+" : ""}{delta}% <span className="text-white/30 font-semibold">vs last month</span>
                        </span>
                    ) : (
                        <span className="mt-1 block text-[10px] font-semibold text-white/25">from last month</span>
                    )}
                </div>
                <div>
                    <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-white/35 mb-1">Top Percentile</span>
                    <span className="text-2xl font-black text-white tabular-nums leading-none">{percentile !== null ? `${percentile}%` : "—"}</span>
                    <span className="block mt-1 text-[10px] font-semibold text-white/25">of the community</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2.5">
                    <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/35 mb-1">
                        <Coins className="w-3 h-3 text-amber-400/70" /> Bounty
                    </span>
                    <span className="text-lg font-black text-white/40 tabular-nums leading-none">—</span>
                </div>
                <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2.5">
                    <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/35 mb-1">
                        <Award className="w-3 h-3" style={{ color: loyaltyColor }} /> Loyalty
                    </span>
                    <span className="text-sm font-black uppercase tracking-wide leading-none" style={{ color: loyaltyColor }}>
                        {loyaltyTier}
                    </span>
                </div>
            </div>
        </div>
    );
}
