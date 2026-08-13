"use client";

import SeasonPanel from "./dashboard/SeasonPanel";
import QuestBoard from "./dashboard/QuestBoard";
import SectionCard from "./dashboard/SectionCard";
import SteamAchievements from "./dashboard/SteamAchievements";
import AchievementsTab from "./AchievementsTab";
import RewardsStore from "./RewardsStore";

/**
 * Progression — earn, receive, spend, in that order and on one screen.
 *
 * Achievements and Rewards were two tabs that never mentioned each other,
 * which left the loop they form invisible: you unlock something, it pays XP and
 * bounty, and the bounty buys what is in the store. Split across two
 * destinations, a reader had to already understand the system to notice it.
 *
 * The season frames all of it and opens the page. It had been a strip inside
 * the daily hub, which is why almost nobody knew one was running.
 *
 * The store is the owner's — a visitor sees the season and the achievements
 * and stops there, which is exactly what was public before.
 */
export default function ProgressionTab({ username, isOwnProfile }: { username: string; isOwnProfile: boolean }) {
    return (
        <div className="space-y-6">
            <SeasonPanel />

            {/* The season's work, in the order the layers ask for it. Owner
                only — a quest board is a to-do list, and somebody else's to-do
                list is not a thing to read. */}
            {isOwnProfile && <QuestBoard />}

            <AchievementsTab username={username} />

            {/* Platform unlocks, under the same roof as ours rather than in a
                section of their own further down the page. */}
            <SectionCard title="Steam Achievements">
                <SteamAchievements username={username} />
            </SectionCard>

            {isOwnProfile && <RewardsStore username={username} isOwnProfile={isOwnProfile} />}
        </div>
    );
}
