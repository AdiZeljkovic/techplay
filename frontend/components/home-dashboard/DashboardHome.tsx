"use client";

import useSWR from "swr";
import { Users } from "lucide-react";
import axios from "@/lib/axios";
import DashboardSkeleton from "./DashboardSkeleton";
import ProfileHero from "./ProfileHero";
import ProfileTabStrip from "./ProfileTabStrip";
import HighlightStrip from "./HighlightStrip";
import FavoriteGamesRail from "./FavoriteGamesRail";
import RecentAchievementsRail from "./RecentAchievementsRail";
import RecentReviews from "./RecentReviews";
import CurrentlyPlayingSidebar from "./CurrentlyPlayingSidebar";
import ProfileCompletionWidget from "./ProfileCompletionWidget";
import FriendsOnlineWidget from "./FriendsOnlineWidget";
import UpcomingForYouRow from "./UpcomingForYouRow";
import YourActivity from "./YourActivity";
import RecommendedNext from "./RecommendedNext";
import BacklogProgressCard from "./BacklogProgressCard";
import QuickActionsGrid from "./QuickActionsGrid";
import FollowedGamesFeed from "./FollowedGamesFeed";
import OnboardingCard from "./OnboardingCard";
import Panel from "@/components/ui/Panel";
import DailyStreakWidget from "@/components/profile/dashboard/DailyStreakWidget";
import QuestPanel from "@/components/profile/dashboard/QuestPanel";
import FriendActivityFeed from "@/components/profile/FriendActivityFeed";
import type { DashboardData } from "@/lib/types/dashboard";

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data as DashboardData);

interface DashboardHomeProps {
    /** Resolved user from hooks/useAuth — used only as a fetch guard. */
    user: { username?: string } | null;
}

/**
 * Logged-in homepage — the gamer profile hub. One aggregated /me/dashboard
 * payload drives the hero and rails; self-refreshing widgets (streak,
 * quests, feeds) keep their own endpoints.
 */
export default function DashboardHome({ user }: DashboardHomeProps) {
    const { data } = useSWR(user ? "/me/dashboard" : null, fetcher, {
        dedupingInterval: 30_000,
        revalidateOnFocus: false,
    });

    if (!data) return <DashboardSkeleton />;

    const hasGames = data.stats.games_count > 0;

    return (
        <main className="min-h-screen bg-[var(--surface-0)] bg-hud-grid">
            <div className="container-page py-8 space-y-6">
                {/* Identity — the whole page hangs off this */}
                <div className="tp-fade-up tp-d1">
                    <ProfileHero data={data} />
                    <ProfileTabStrip />
                </div>

                <div className="tp-fade-up tp-d2">
                    <HighlightStrip highlights={data.highlights} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* ── Main column ── */}
                    <div className="lg:col-span-8 space-y-6 min-w-0">
                        {!hasGames && (
                            <div className="tp-fade-up tp-d2">
                                <OnboardingCard />
                            </div>
                        )}

                        <div className="tp-fade-up tp-d2">
                            <FavoriteGamesRail favorites={data.favorites} username={data.user.username} />
                        </div>

                        <div className="tp-fade-up tp-d3">
                            <RecentAchievementsRail achievements={data.recent_achievements} />
                        </div>

                        <div className="tp-fade-up tp-d3">
                            <UpcomingForYouRow />
                        </div>

                        {hasGames && (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch tp-fade-up tp-d4">
                                <RecommendedNext games={data.backlog_preview} />
                                <BacklogProgressCard stats={data.stats} suggestion={data.backlog_suggestion} />
                            </div>
                        )}

                        <div className="tp-fade-up tp-d4">
                            <RecentReviews reviews={data.recent_reviews} />
                        </div>

                        <div className="tp-fade-up tp-d5">
                            <YourActivity />
                        </div>

                        <div className="tp-fade-up tp-d5">
                            <FollowedGamesFeed />
                        </div>

                        <div className="tp-fade-up tp-d6">
                            <Panel
                                title="Community Feed"
                                icon={<Users className="w-3.5 h-3.5 text-[var(--accent)]" />}
                                action={{ label: "Friends", href: "/friends" }}
                                bodyClassName="p-3"
                            >
                                <FriendActivityFeed />
                            </Panel>
                        </div>
                    </div>

                    {/* ── Sidebar ── */}
                    <div className="lg:col-span-4 space-y-6 min-w-0">
                        <div className="tp-fade-up tp-d2">
                            <CurrentlyPlayingSidebar games={data.playing_now} />
                        </div>

                        <div className="tp-fade-up tp-d3">
                            <ProfileCompletionWidget completion={data.profile_completion} />
                        </div>

                        {/* shared wrapper: both may render null pre-data — no stray gaps */}
                        <div className="space-y-6 tp-fade-up tp-d4">
                            <DailyStreakWidget />
                            <QuestPanel isOwnProfile compact />
                        </div>

                        <div className="tp-fade-up tp-d5">
                            <FriendsOnlineWidget friends={data.friends_online} />
                        </div>

                        <div className="tp-fade-up tp-d6">
                            <QuickActionsGrid />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
