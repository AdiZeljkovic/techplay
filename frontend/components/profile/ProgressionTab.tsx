"use client";

import { useState } from "react";
import { Flame, Trophy } from "lucide-react";
import Segmented from "@/components/ui/Segmented";
import SeasonPanel from "./dashboard/SeasonPanel";
import QuestBoard from "./dashboard/QuestBoard";
import SectionCard from "./dashboard/SectionCard";
import SteamAchievements from "./dashboard/SteamAchievements";
import AchievementsTab from "./AchievementsTab";

type View = "season" | "achievements";

/**
 * Progression — what is running, and what you have earned from it.
 *
 * Five full sections used to be stacked here: season, quest board, our
 * achievements with their own filters and sidebar, Steam's, and the whole
 * rewards store. That is not one page, it is five pages that happen to share
 * a scrollbar — and every one of them fetched on mount, so opening this tab
 * fired eight requests before you had looked at anything.
 *
 * Two lenses now, and only the one you are in loads. The store left entirely:
 * it is the part of the loop you *do* something in and the only part a
 * visitor can never see, so as a lens here it held a switch position that was
 * empty for half the people looking at the page. It has its own tab.
 *
 * A visitor lands on achievements rather than the season, because the season
 * is the same for everyone and the badges are the reason they opened somebody
 * else's profile.
 */
export default function ProgressionTab({ username, isOwnProfile }: { username: string; isOwnProfile: boolean }) {
    const [view, setView] = useState<View>(isOwnProfile ? "season" : "achievements");

    const views = [
        { id: "season", label: "Season", icon: Flame, title: "What is running, and what it asks of you" },
        { id: "achievements", label: "Achievements", icon: Trophy, title: "Everything unlocked, ours and Steam's" },
    ];

    return (
        <div className="space-y-5">
            <Segmented
                ariaLabel="Progression views"
                value={view}
                onChange={(id) => setView(id as View)}
                items={views}
            />

            {view === "season" && (
                <div className="space-y-5">
                    <SeasonPanel />
                    {/* Owner only — a quest board is a to-do list, and somebody
                        else's to-do list is not a thing to read. */}
                    {isOwnProfile && <QuestBoard />}
                </div>
            )}

            {view === "achievements" && (
                <div className="space-y-5">
                    <AchievementsTab username={username} />
                    {/* Platform unlocks under the same roof as ours, rather
                        than in a section of their own further down. */}
                    <SectionCard title="Steam Achievements">
                        <SteamAchievements username={username} />
                    </SectionCard>
                </div>
            )}

        </div>
    );
}
