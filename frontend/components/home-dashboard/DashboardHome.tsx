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

    const openTab = (tab: string) => router.push(`/profile/${data.user.username}?tab=${tab}`);

    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            {/*
                The page runs on one seam.

                It used to change its mind on every band — 5/7, then 5/7 again
                with different contents, then 8/4, then full width, then 6/6 —
                so nothing lined up with the thing above it and the eye had to
                re-find the column five times on the way down. Every split row
                is 8/4 now: a main column and a rail, one edge straight through
                the page. The two bands that break out to full width do it
                because their contents are grids that need the room (five
                release cards across, six article cards across), and a
                deliberate full-width band between two aligned ones reads as
                punctuation rather than drift.

                Order is the day, then the reward, then what to do next: what
                you are in the middle of and what today asks of you → what you
                have earned and who is around → what is coming and what to
                start. Gaps are 20px rather than 24, which takes a screenful
                out of the scroll without crowding anything.
            */}
            <div className="container-page py-6 space-y-5">
                {/* Identity — the whole page hangs off this (tabs live inside it) */}
                <div className="tp-fade-up tp-d1">
                    <ProfileHero hero={heroFromDashboard(data)} />
                </div>

                {/* An empty account gets the way in first, before a page of
                    empty states. This used to be two cards — a checklist here
                    and a "Get Started" card near the bottom, both counting the
                    same first steps for the same person. The checklist kept
                    it: it is the one that can start a Steam import, which is
                    the step that fills everything else at once. */}
                {!hasGames && (
                    <div className="tp-fade-up tp-d2">
                        <ProfileChecklist
                            stats={data.stats}
                            listsCount={0}
                            hasGamertags={Object.keys(data.user.gamertags ?? {}).length > 0}
                            steamConnected={(data.stats.games_count ?? 0) > 0}
                            onOpenTab={openTab}
                        />
                    </div>
                )}

                {/* ── today: what you are in the middle of, and what the day asks ──

                    Daily Challenge stood in this band and showed a quest, while
                    the Daily Hub showed the quest list — one of them was always
                    the other's first row. The hub keeps it, because that is
                    where the streak, the season and the wallet the quest pays
                    into already are. */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start tp-fade-up tp-d2">
                    <div className="lg:col-span-8 min-w-0 flex flex-col gap-5">
                        <ContinuePlayingCard games={data.playing_now} />
                        <FavoriteGamesRail
                            favorites={data.favorites}
                            username={data.user.username}
                            total={data.stats.favorites_count}
                        />
                    </div>
                    <div className="lg:col-span-4 min-w-0">
                        <DailyHub username={data.user.username} onOpenTab={openTab} />
                    </div>
                </div>

                {/* ── what you've earned, and who's around ──

                    Daily Missions stood between these two and drew the streak
                    and the quest list a second time — the Daily Hub in the rail
                    above carries both, and it is the column the eye is already
                    in. */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch tp-fade-up tp-d3">
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

                {/* Six article cards across — this was living in a 7-column
                    slot, where three per row left each headline about 200px
                    beside a 104px picture. */}
                <div className="tp-fade-up tp-d3">
                    <LatestArticlesFeed />
                </div>

                {/* ── what to play next ── */}
                <div className="tp-fade-up tp-d4">
                    <UpcomingForYouRow />
                </div>

                {hasGames && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-stretch tp-fade-up tp-d5">
                        <RecommendedNext games={data.backlog_preview} />
                        <BacklogProgressCard stats={data.stats} suggestion={data.backlog_suggestion} />
                    </div>
                )}
            </div>
        </main>
    );
}
