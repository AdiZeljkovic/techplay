"use client";

import { Target } from "lucide-react";
import SeasonBanner from "@/components/ui/SeasonBanner";
import DailyStreakWidget from "./DailyStreakWidget";
import QuestPanel from "./QuestPanel";

interface Props {
    username?: string;
    onOpenTab: (tab: string) => void;
}

/**
 * Today: the season, the streak, and the work.
 *
 * It used to carry the wallet, a "now playing" picker and two shortcut tiles
 * as well, which made it a drawer of everything owner-shaped rather than a
 * panel about the day. The wallet moved to the end of the section bar — that
 * is where a game keeps its currency, always in view and one press from where
 * it is spent — and the shortcuts went, because a panel with a deadline should
 * not end in a list of places to wander off to.
 *
 * What is left is ordered the way the day runs: the season frames it, the
 * streak expires tonight, and the quests are the thing to actually do.
 */
export default function DailyHub({ onOpenTab }: Props) {
    return (
        <div
            className="h-full flex flex-col rounded-[var(--radius-panel)] border overflow-hidden"
            style={{
                background: "var(--surface-2)",
                borderColor: "var(--line-strong)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
        >
            <header className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/[0.07]">
                <Target className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="font-display text-[11px] font-black uppercase tracking-[0.15em] text-white">Today</h3>
            </header>

            <div className="flex-1 p-4 space-y-3.5">
                {/* The frame the day sits in. */}
                <SeasonBanner />

                {/* The one thing that expires tonight. */}
                <DailyStreakWidget />

                <div className="pt-1">
                    <h4 className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="font-display text-[9.5px] font-black uppercase tracking-[0.16em] text-white/40">
                            Active quests
                        </span>
                        <button
                            onClick={() => onOpenTab("progression")}
                            className="font-display text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/30 hover:text-[var(--accent-ink)] transition-colors"
                        >
                            All quests
                        </button>
                    </h4>
                    <QuestPanel isOwnProfile compact />
                </div>
            </div>
        </div>
    );
}
