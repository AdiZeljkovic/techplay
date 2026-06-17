"use client";

import { User, Gamepad2, Sparkles, Award, List, Gift, BarChart3 } from "lucide-react";

export type ProfileTab = "overview" | "collection" | "activity" | "achievements" | "lists" | "rewards" | "stats";

export const PROFILE_TABS: { id: ProfileTab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: User },
    { id: "collection", label: "Collection", icon: Gamepad2 },
    { id: "activity", label: "Activity", icon: Sparkles },
    { id: "achievements", label: "Achievements", icon: Award },
    { id: "lists", label: "Lists", icon: List },
    { id: "rewards", label: "Rewards", icon: Gift },
    { id: "stats", label: "Stats", icon: BarChart3 },
];

interface Props {
    activeTab: ProfileTab;
    onTabChange: (tab: ProfileTab) => void;
}

export default function ProfileTabs({ activeTab, onTabChange }: Props) {
    return (
        <div className="sticky top-[64px] z-30 bg-[var(--bg-primary)]/90 backdrop-blur-xl border-b border-white/[0.07] mt-6">
            <div className="max-w-[1320px] mx-auto px-2 sm:px-4 xl:px-0">
                <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
                    {PROFILE_TABS.map((tab) => {
                        const active = activeTab === tab.id;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`relative flex items-center gap-2 px-4 lg:px-5 py-4 text-[12px] font-bold uppercase tracking-[0.1em] whitespace-nowrap transition-colors ${
                                    active ? "text-[var(--accent)]" : "text-white/45 hover:text-white/75"
                                }`}
                            >
                                <Icon className="w-[18px] h-[18px]" />
                                {tab.label}
                                {active && <span className="absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-[var(--accent)]" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
