"use client";

import { useState, type ReactNode } from "react";
import { TrendingUp, TrendingDown, Star, ChevronUp, ChevronDown } from "lucide-react";
import HexBadge from "./HexBadge";
import type { ProfileStats, ProfileUser, ReputationData } from "@/lib/types/profile";

interface Props {
    stats: ProfileStats;
    userData: ProfileUser;
    reputation?: ReputationData;
    footer?: ReactNode;
}

/**
 * "Reputation & Power" card — top-right of the profile header. Holds reputation
 * (with MoM delta), community percentile, bounty balance, loyalty tier, and an
 * action-button footer (Edit/Customize, or Message/Add Friend).
 */
export default function ReputationPowerCard({ stats, userData, reputation, footer }: Props) {
    const [open, setOpen] = useState(true);
    const rep = reputation?.reputation ?? stats?.reputation ?? 0;
    const delta = reputation?.reputation_delta_percent ?? null;
    const percentile = reputation?.percentile ?? null;
    const bounty = stats?.bounty_balance ?? 0;
    const loyaltyTier = userData.active_support?.tier?.name ?? "Bronze";
    const loyaltyColor = userData.active_support?.tier?.color ?? "#CD7F32";

    return (
        <div className="rounded-2xl bg-black/55 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col">
            {/* Header */}
            <button onClick={() => setOpen((v) => !v)} className="flex items-center justify-between px-5 py-3.5 w-full">
                <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-white">
                    <Star className="w-4 h-4 text-[var(--accent)] fill-[var(--accent)]" /> Reputation &amp; Power
                </span>
                {open ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
            </button>

            {open && (
                <div className="px-5 pb-5 space-y-4">
                    {/* Reputation + Top percentile */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 mb-1.5">Reputation</span>
                            <div className="flex items-center gap-2">
                                <span className="text-3xl font-black text-white tabular-nums leading-none">{rep.toLocaleString()}</span>
                                {delta !== null && (
                                    <span className={`inline-flex items-center gap-0.5 text-[12px] font-bold ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                        {delta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                        {delta >= 0 ? "+" : ""}{delta}%
                                    </span>
                                )}
                            </div>
                            <span className="block mt-1 text-[11px] text-white/40">from last month</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 mb-1.5">Top</span>
                            <span className="text-3xl font-black text-white tabular-nums leading-none">{percentile !== null ? `${percentile}%` : "—"}</span>
                            <span className="block mt-1 text-[11px] text-white/40">of the community</span>
                        </div>
                    </div>

                    {/* Bounty + Loyalty */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] px-4 py-3">
                            <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-white/40 mb-2">Bounty Balance</span>
                            <span className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-[11px] font-black text-amber-900 shadow">$</span>
                                <span className="text-xl font-black text-white tabular-nums leading-none">{bounty.toLocaleString()}</span>
                            </span>
                        </div>
                        <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] px-4 py-3">
                            <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-white/40 mb-2">Loyalty Tier</span>
                            <span className="flex items-center gap-2">
                                <HexBadge size={22} color={loyaltyColor} />
                                <span className="text-lg font-black uppercase tracking-wide leading-none" style={{ color: loyaltyColor }}>{loyaltyTier}</span>
                            </span>
                        </div>
                    </div>

                    {footer && <div className="grid grid-cols-2 gap-3 pt-1">{footer}</div>}
                </div>
            )}
        </div>
    );
}
