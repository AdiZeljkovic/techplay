"use client";

import { TrendingUp, Star, Coins, Award } from "lucide-react";
import type { ProfileStats, ProfileUser } from "@/lib/types/profile";

interface Props {
    stats: ProfileStats;
    userData: ProfileUser;
}

/**
 * "Reputation & Power" glass card shown top-right in the profile header.
 * Reputation MoM delta + percentile arrive in Phase 2; bounty in Phase 3.
 * Until then those slots render neutral placeholders.
 */
export default function ReputationPowerCard({ stats, userData }: Props) {
    const reputation = stats?.reputation ?? 0;
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
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-black text-white tabular-nums leading-none">{reputation.toLocaleString()}</span>
                    </div>
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-white/25">
                        <TrendingUp className="w-3 h-3" /> trend soon
                    </span>
                </div>
                <div>
                    <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-white/35 mb-1">Top Percentile</span>
                    <span className="text-2xl font-black text-white/40 tabular-nums leading-none">—</span>
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
