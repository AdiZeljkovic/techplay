"use client";

import { ThumbsUp, Lightbulb, Heart, Crown, Coins } from "lucide-react";
import type { Recognition } from "@/lib/types/profile";

const RECOGNITION_META: Record<string, { icon: any; color: string }> = {
    helpful: { icon: ThumbsUp, color: "#34d399" },
    insightful: { icon: Lightbulb, color: "#facc15" },
    friendly: { icon: Heart, color: "#f472b6" },
    leader: { icon: Crown, color: "#FC4100" },
};

export default function ReputationBountyCard({ recognitions }: { recognitions: Recognition[] }) {
    return (
        <div className="space-y-4">
            {/* Bounty placeholder (Phase 3) */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400/70" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/45">Bounty Balance</span>
                </div>
                <span className="text-lg font-black text-white/40 tabular-nums">— <span className="text-[10px] font-semibold text-white/25">soon</span></span>
            </div>

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
