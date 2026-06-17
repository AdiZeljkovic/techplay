"use client";

import { LayoutGrid, Library, Activity, Trophy, ListChecks, Gift, BarChart3 } from "lucide-react";

export type ProfileTab = "overview" | "collection" | "activity" | "achievements" | "lists" | "rewards" | "stats";

export const PROFILE_TABS: { id: ProfileTab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "collection", label: "Collection", icon: Library },
    { id: "activity", label: "Activity", icon: Activity },
    { id: "achievements", label: "Achievements", icon: Trophy },
    { id: "lists", label: "Lists", icon: ListChecks },
    { id: "rewards", label: "Rewards", icon: Gift },
    { id: "stats", label: "Stats", icon: BarChart3 },
];

interface Props {
    activeTab: ProfileTab;
    onTabChange: (tab: ProfileTab) => void;
}

export default function ProfileTabs({ activeTab, onTabChange }: Props) {
    return (
        <div className="sticky top-[64px] z-30 bg-[var(--bg-primary)]/85 backdrop-blur-xl border-y border-white/[0.06] mt-8">
            <div className="max-w-[1320px] mx-auto px-4 xl:px-0">
                <div className="flex items-center gap-0 overflow-x-auto no-scrollbar">
                    {PROFILE_TABS.map((tab) => {
                        const active = activeTab === tab.id;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3.5 text-[12px] font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-all ${
                                    active
                                        ? "border-[var(--accent)] text-[var(--accent)]"
                                        : "border-transparent text-white/45 hover:text-white/75"
                                }`}
                            >
                                <Icon className="w-4 h-4" /> {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
