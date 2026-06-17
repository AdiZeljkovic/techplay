"use client";

import { ThumbsUp, Lightbulb, Heart, Crown, Coins, TrendingUp, TrendingDown } from "lucide-react";
import Sparkline from "./Sparkline";
import type { Recognition, ReputationData } from "@/lib/types/profile";

const RECOGNITION_META: Record<string, { icon: any; color: string }> = {
    helpful: { icon: ThumbsUp, color: "#34d399" },
    insightful: { icon: Lightbulb, color: "#facc15" },
    friendly: { icon: Heart, color: "#f472b6" },
    leader: { icon: Crown, color: "#FC4100" },
};

export default function ReputationBountyCard({ recognitions, bounty = 0, reputation }: { recognitions: Recognition[]; bounty?: number; reputation?: ReputationData }) {
    const delta = reputation?.reputation_delta_percent ?? null;
    const history = reputation?.history ?? [];

    return (
        <div className="space-y-4">
            {/* Reputation + sparkline */}
            <div>
                <div className="flex items-end justify-between mb-1">
                    <div>
                        <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/35 mb-1">Reputation</div>
                        <div className="text-2xl font-black text-white tabular-nums leading-none">{(reputation?.reputation ?? 0).toLocaleString()}</div>
                    </div>
                    {delta !== null && (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {delta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            {delta >= 0 ? "+" : ""}{delta}%
                        </span>
                    )}
                </div>
                {history.length >= 2 ? (
                    <Sparkline data={history} height={44} />
                ) : (
                    <div className="text-[10px] text-white/25 py-2">Reputation trend builds up over time.</div>
                )}
            </div>

            {/* Bounty */}
            <div className="rounded-xl bg-amber-400/[0.06] border border-amber-400/15 px-4 py-3 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/45 mb-1"><Coins className="w-3 h-3 text-amber-400" /> Bounty Balance</div>
                    <div className="text-lg font-black text-amber-400 tabular-nums leading-none">{bounty.toLocaleString()}</div>
                </div>
                <span className="text-[10px] text-white/35 text-right max-w-[120px]">Use Bounty in the Bounty Store</span>
            </div>

            {/* Recognitions */}
            <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 mb-2.5">Top Recognitions</div>
                <div className="grid grid-cols-2 gap-2.5">
                    {recognitions.map((r) => {
                        const meta = RECOGNITION_META[r.type] ?? { icon: ThumbsUp, color: "#9ca3af" };
                        const Icon = meta.icon;
                        return (
                            <div key={r.type} className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${meta.color}1A` }}>
                                    <Icon className="w-4 h-4" style={{ color: meta.color }} />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-base font-black text-white tabular-nums leading-none">{r.count.toLocaleString()}</div>
                                    <div className="text-[10px] font-semibold text-white/40 truncate">{r.label}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
