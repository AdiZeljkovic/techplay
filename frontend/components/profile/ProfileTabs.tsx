"use client";

import { User, Gamepad2, Sparkles, Award, List, Gift, BarChart3 } from "lucide-react";

export type ProfileTab = "overview" | "collection" | "lists" | "achievements" | "activity" | "rewards" | "stats";

export const PROFILE_TABS: { id: ProfileTab; label: string; icon: any; ownOnly?: boolean }[] = [
    { id: "overview", label: "Overview", icon: User },
    { id: "collection", label: "Collection", icon: Gamepad2 },
    { id: "lists", label: "Lists", icon: List },
    { id: "achievements", label: "Achievements", icon: Award },
    { id: "activity", label: "Activity", icon: Sparkles },
    { id: "stats", label: "Stats", icon: BarChart3 },
    { id: "rewards", label: "Rewards", icon: Gift, ownOnly: true },
];

interface Props {
    activeTab: ProfileTab;
    onTabChange: (tab: ProfileTab) => void;
    isOwnProfile: boolean;
    /** Optional per-tab counts rendered as small badges (e.g. Collection 148). */
    counts?: Partial<Record<ProfileTab, number>>;
}

export default function ProfileTabs({ activeTab, onTabChange, isOwnProfile, counts }: Props) {
    const tabs = PROFILE_TABS.filter((t) => !t.ownOnly || isOwnProfile);

    return (
        <div className="sticky top-[64px] z-30 bg-[var(--bg-primary)]/90 backdrop-blur-xl border-b border-[var(--border)] mt-6">
            <div className="relative max-w-[1320px] mx-auto px-2 sm:px-4 xl:px-0">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => {
                        const active = activeTab === tab.id;
                        const Icon = tab.icon;
                        const count = counts?.[tab.id];
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`relative flex items-center gap-2 px-4 lg:px-5 py-4 text-[12px] font-bold uppercase tracking-[0.1em] whitespace-nowrap transition-colors ${
                                    active ? "text-[var(--accent)]" : "text-white/45 hover:text-white/75"
                                }`}
                            >
                                <Icon className="w-[17px] h-[17px]" />
                                {tab.label}
                                {typeof count === "number" && count > 0 && (
                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none ${
                                        active ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "bg-white/[0.06] text-white/40"
                                    }`}>
                                        {count.toLocaleString()}
                                    </span>
                                )}
                                {active && <span className="absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-[var(--accent)]" />}
                            </button>
                        );
                    })}
                </div>
                {/* Edge fade — scroll affordance on mobile */}
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[var(--bg-primary)] to-transparent sm:hidden" />
            </div>
        </div>
    );
}
