"use client";

import { useState } from "react";
import { Flame, Trophy, ShoppingBag } from "lucide-react";
import Segmented from "@/components/ui/Segmented";
import SeasonPanel from "./dashboard/SeasonPanel";
import QuestBoard from "./dashboard/QuestBoard";
import SectionCard from "./dashboard/SectionCard";
import SteamAchievements from "./dashboard/SteamAchievements";
import AchievementsTab from "./AchievementsTab";
import RewardsStore from "./RewardsStore";

type View = "season" | "achievements" | "rewards";

/**
 * Progression — earn, receive, spend. Three lenses, not one long page.
 *
 * The loop is right and the order is right: you unlock something, it pays XP
 * and bounty, and the bounty buys what is in the store. Putting all of it on
 * one screen was how that loop became visible after Achievements and Rewards
 * had spent months as two tabs that never mentioned each other.
 *
 * But five full sections stacked — season, quest board, our achievements with
 * its own filters and sidebar, Steam's, and a store with a wallet, a history
 * and an inventory — is not one page, it is five pages that happen to share a
 * scrollbar. Nobody arrives at Progression wanting all five at once; they come
 * to check the season, or to look at badges, or to spend.
 *
 * The switch also fixes something that was never visible: every one of those
 * sections fetches on mount, so opening this tab fired eight requests before
 * you had looked at anything. Only the lens you are in loads now.
 *
 * A visitor gets the season and the achievements and stops there, which is
 * exactly what was public before. They also land on achievements rather than
 * the season, because the season is the same for everyone and the badges are
 * the reason they opened somebody else's profile.
 */
export default function ProgressionTab({ username, isOwnProfile }: { username: string; isOwnProfile: boolean }) {
    const [view, setView] = useState<View>(isOwnProfile ? "season" : "achievements");

    const views = [
        { id: "season", label: "Season", icon: Flame, title: "What is running, and what it asks of you" },
        { id: "achievements", label: "Achievements", icon: Trophy, title: "Everything unlocked, ours and Steam's" },
        ...(isOwnProfile
            ? [{ id: "rewards", label: "Rewards", icon: ShoppingBag, title: "What your bounty buys" }]
            : []),
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

            {view === "rewards" && isOwnProfile && (
                <RewardsStore username={username} isOwnProfile={isOwnProfile} />
            )}
        </div>
    );
}
