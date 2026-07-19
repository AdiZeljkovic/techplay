"use client";

import { Coins, Target, ChevronRight } from "lucide-react";
import SeasonBanner from "@/components/ui/SeasonBanner";
import DailyStreakWidget from "./DailyStreakWidget";
import QuestPanel from "./QuestPanel";

interface Props {
    bounty: number;
    onOpenTab: (tab: string) => void;
}

/**
 * The owner's daily engagement hub: bounty wallet, active season,
 * daily streak claim and quests — one card instead of four.
 */
export default function DailyHub({ bounty, onOpenTab }: Props) {
    return (
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden">
            {/* Wallet row */}
            <button
                onClick={() => onOpenTab("rewards")}
                className="group w-full flex items-center justify-between px-5 py-4 border-b border-[var(--border)] hover:bg-white/[0.02] transition-colors"
            >
                <span className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/25 flex items-center justify-center">
                        <Coins className="w-4 h-4 text-amber-400" />
                    </span>
                    <span className="text-left">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Bounty</span>
                        <span className="block text-[17px] font-black text-white tabular-nums leading-tight">{bounty.toLocaleString()}</span>
                    </span>
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/35 group-hover:text-[var(--accent)] transition-colors">
                    Rewards <ChevronRight className="w-3.5 h-3.5" />
                </span>
            </button>

            <div className="p-4 space-y-4">
                <SeasonBanner />
                <DailyStreakWidget />
                <div>
                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/40 mb-3">
                        <Target className="w-3.5 h-3.5 text-[var(--accent)]" /> Active Quests
                    </h4>
                    <QuestPanel isOwnProfile compact />
                </div>
            </div>
        </div>
    );
}
