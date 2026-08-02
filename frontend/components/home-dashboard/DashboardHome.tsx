"use client";

import useSWR from "swr";
import { Users } from "lucide-react";
import axios from "@/lib/axios";
import DashboardSkeleton from "./DashboardSkeleton";
import ProfileHero from "./ProfileHero";
import HighlightStrip from "./HighlightStrip";
import FavoriteGamesRail from "./FavoriteGamesRail";
import RecentAchievementsRail from "./RecentAchievementsRail";
import RecentReviews from "./RecentReviews";
import CurrentlyPlayingSidebar from "./CurrentlyPlayingSidebar";
import FriendsOnlineWidget from "./FriendsOnlineWidget";
import UpcomingForYouRow from "./UpcomingForYouRow";
import YourActivity from "./YourActivity";
import RecommendedNext from "./RecommendedNext";
import BacklogProgressCard from "./BacklogProgressCard";
import FollowedGamesFeed from "./FollowedGamesFeed";
import OnboardingCard from "./OnboardingCard";
import DailyMissions from "./DailyMissions";
import Panel from "@/components/ui/Panel";
import FriendActivityFeed from "@/components/profile/FriendActivityFeed";
import { heroFromDashboard } from "@/lib/hero";
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
                {/* Identity — the whole page hangs off this (tabs live inside it) */}
                <div className="tp-fade-up tp-d1">
                    <ProfileHero hero={heroFromDashboard(data)} />
                </div>

                <div className="tp-fade-up tp-d2">
                    <HighlightStrip highlights={data.highlights} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* ── Main column ── */}
                    <div className="lg:col-span-8 space-y-6 min-w-0">
                        {!hasGames && (
                            <div className="tp-fade-up tp-d2">
                                <OnboardingCard stats={data.stats} />
                            </div>
                        )}

                        <div className="tp-fade-up tp-d2">
                            <FavoriteGamesRail
                                favorites={data.favorites}
                                username={data.user.username}
                                total={data.stats.favorites_count}
                            />
                        </div>

                        <div className="tp-fade-up tp-d3">
                            <RecentAchievementsRail
                                achievements={data.recent_achievements}
                                total={data.stats.achievements_count}
                            />
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
                                title="Squad Feed"
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
                            <DailyMissions streak={data.streak} />
                        </div>

                        <div className="tp-fade-up tp-d5">
                            <FriendsOnlineWidget friends={data.friends_online} />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
