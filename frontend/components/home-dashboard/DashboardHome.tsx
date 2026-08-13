"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import DashboardSkeleton from "./DashboardSkeleton";
import ProfileHero from "./ProfileHero";
import FavoriteGamesRail from "./FavoriteGamesRail";
import ContinuePlayingCard from "./ContinuePlayingCard";
import LatestArticlesFeed from "./LatestArticlesFeed";
import RecentAchievementsRail from "./RecentAchievementsRail";
import FriendsOnlineWidget from "./FriendsOnlineWidget";
import UpcomingForYouRow from "./UpcomingForYouRow";
import RecommendedNext from "./RecommendedNext";
import BacklogProgressCard from "./BacklogProgressCard";
import OnboardingCard from "./OnboardingCard";
import DailyHub from "@/components/profile/dashboard/DailyHub";
import ProfileChecklist from "@/components/profile/dashboard/ProfileChecklist";
import { useRouter } from "next/navigation";
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
    const router = useRouter();
    const { data } = useSWR(user ? "/me/dashboard" : null, fetcher, {
        dedupingInterval: 30_000,
        revalidateOnFocus: false,
    });

    if (!data) return <DashboardSkeleton />;

    const hasGames = data.stats.games_count > 0;

    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            <div className="container-page py-8 space-y-6">
                {/* Identity — the whole page hangs off this (tabs live inside it) */}
                <div className="tp-fade-up tp-d1">
                    <ProfileHero hero={heroFromDashboard(data)} />
                </div>

                {/* ── two pillars: what you're playing, and what you love ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch tp-fade-up tp-d2">
                    <div className="lg:col-span-5 min-w-0">
                        <ContinuePlayingCard games={data.playing_now} />
                    </div>
                    {/* Daily Challenge stood here and showed a quest, while
                        the Daily Hub below shows the quest list — one of them
                        was always the other's first row. The hub keeps it,
                        because that is where the streak, the season and the
                        wallet the quest pays into already are. */}
                    <div className="lg:col-span-7 min-w-0">
                        <FavoriteGamesRail
                            favorites={data.favorites}
                            username={data.user.username}
                            total={data.stats.favorites_count}
                        />
                    </div>
                </div>

                {/* The owner's daily hub — season, streak, quests and the
                    bounty wallet. It used to live on the profile Overview,
                    which the owner never reaches: their Overview is this page,
                    and an early return sent them here before it rendered. So
                    none of it was on screen anywhere. */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start tp-fade-up tp-d2">
                    <div className="lg:col-span-5 min-w-0">
                        <DailyHub
                            bounty={data.stats.bounty_balance ?? 0}
                            username={data.user.username}
                            onOpenTab={(tab) => router.push(`/profile/${data.user.username}?tab=${tab}`)}
                        />
                    </div>
                    <div className="lg:col-span-7 min-w-0 space-y-6">
                        {!hasGames && (
                            <ProfileChecklist
                                stats={data.stats}
                                listsCount={0}
                                hasGamertags={Object.keys(data.user.gamertags ?? {}).length > 0}
                                steamConnected={(data.stats.games_count ?? 0) > 0}
                                onOpenTab={(tab) => router.push(`/profile/${data.user.username}?tab=${tab}`)}
                            />
                        )}
                        <LatestArticlesFeed />
                    </div>
                </div>

                {/* ── what you've earned, and who's around ──

                    Daily Missions stood between these two and drew the streak
                    and the quest list a second time — the Daily Hub in the
                    sidebar carries both, and it is the column the eye is
                    already in. */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch tp-fade-up tp-d3">
                    <div className="lg:col-span-8 min-w-0">
                        <RecentAchievementsRail
                            achievements={data.recent_achievements}
                            total={data.stats.achievements_count}
                        />
                    </div>
                    <div className="lg:col-span-4 min-w-0">
                        <FriendsOnlineWidget friends={data.friends_online} />
                    </div>
                </div>

                {/* ── everything below runs full width or in pairs; the old
                    8/4 sidebar emptied out when its two widgets moved up ── */}
                <div className="space-y-6">
                    {!hasGames && (
                        <div className="tp-fade-up tp-d4">
                            <OnboardingCard stats={data.stats} />
                        </div>
                    )}

                    <div className="tp-fade-up tp-d4">
                        <UpcomingForYouRow />
                    </div>

                    {hasGames && (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch tp-fade-up tp-d5">
                            <RecommendedNext games={data.backlog_preview} />
                            <BacklogProgressCard stats={data.stats} suggestion={data.backlog_suggestion} />
                        </div>
                    )}

                </div>
            </div>
        </main>
    );
}
