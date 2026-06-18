"use client";

import { Award, Lightbulb, Users, Sprout, TrendingUp, TrendingDown } from "lucide-react";
import Sparkline from "./Sparkline";
import type { Recognition, ReputationData } from "@/lib/types/profile";

const RECOGNITION_META: Record<string, { icon: any; color: string }> = {
    helpful: { icon: Award, color: "#CD7F32" },
    insightful: { icon: Lightbulb, color: "#fb923c" },
    friendly: { icon: Users, color: "#60a5fa" },
    leader: { icon: Sprout, color: "#34d399" },
};

export default function ReputationBountyCard({ recognitions, bounty = 0, reputation }: { recognitions: Recognition[]; bounty?: number; reputation?: ReputationData }) {
    const delta = reputation?.reputation_delta_percent ?? null;
    const history = reputation?.history ?? [];

    return (
        <div>
            {/* Top: reputation + sparkline | bounty */}
            <div className="grid grid-cols-2 gap-5 pb-4 border-b border-white/[0.06]">
                {/* Reputation */}
                <div className="pr-5 border-r border-white/[0.06]">
                    <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 mb-1.5">Reputation</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white tabular-nums leading-none">{(reputation?.reputation ?? 0).toLocaleString()}</span>
                        {delta !== null && (
                            <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {delta >= 0 ? "+" : ""}{delta}%
                            </span>
                        )}
                    </div>
                    <div className="text-[10px] text-white/35 mt-0.5 mb-1">from last month</div>
                    {history.length >= 2 && <Sparkline data={history} height={36} />}
                </div>

                {/* Bounty */}
                <div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 mb-1.5">Bounty Balance</div>
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-[12px] font-black text-amber-900 shadow">$</span>
                        <span className="text-2xl font-black text-white tabular-nums leading-none">{bounty.toLocaleString()}</span>
                    </div>
                    <div className="text-[10px] text-white/35 mt-2 leading-snug">Use Bounty in the<br />Bounty Store</div>
                </div>
            </div>

            {/* Recognitions */}
            <div className="pt-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 mb-3">Top Recognitions</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {recognitions.map((r) => {
                        const meta = RECOGNITION_META[r.type] ?? { icon: Award, color: "#9ca3af" };
                        const Icon = meta.icon;
                        return (
                            <div key={r.type} className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border" style={{ backgroundColor: `${meta.color}1A`, borderColor: `${meta.color}40` }}>
                                    <Icon className="w-4 h-4" style={{ color: meta.color }} />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[11px] font-semibold text-white/60 truncate">{r.label}</div>
                                    <div className="text-[13px] font-black text-white tabular-nums leading-none">{r.count.toLocaleString()}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
