"use client";

import useSWR from "swr";
import { Users } from "lucide-react";
import axios from "@/lib/axios";
import DashboardSkeleton from "./DashboardSkeleton";
import WelcomeHero from "./WelcomeHero";
import ProfileSummaryCard from "./ProfileSummaryCard";
import ContinuePlayingRow from "./ContinuePlayingRow";
import UpcomingForYouRow from "./UpcomingForYouRow";
import RecommendedNext from "./RecommendedNext";
import BacklogProgressCard from "./BacklogProgressCard";
import QuickActionsGrid from "./QuickActionsGrid";
import FollowedGamesFeed from "./FollowedGamesFeed";
import OnboardingCard from "./OnboardingCard";
import SectionCard from "@/components/profile/dashboard/SectionCard";
import DailyStreakWidget from "@/components/profile/dashboard/DailyStreakWidget";
import QuestPanel from "@/components/profile/dashboard/QuestPanel";
import FriendActivityFeed from "@/components/profile/FriendActivityFeed";
import type { DashboardData } from "@/lib/types/dashboard";

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data as DashboardData);

interface DashboardHomeProps {
    /** Resolved user from hooks/useAuth — used only as a fetch guard. */
    user: { username?: string } | null;
}

export default function DashboardHome({ user }: DashboardHomeProps) {
    const { data } = useSWR(user ? "/me/dashboard" : null, fetcher, {
        dedupingInterval: 30_000,
        revalidateOnFocus: false,
    });

    if (!data) return <DashboardSkeleton />;

    const hasGames = data.stats.games_count > 0;

    return (
        <main className="min-h-screen bg-[var(--bg-primary)] profile-grid-bg">
            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 w-full py-8">
                {/* Welcome hero row — even split, panels stretch to match height */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10 items-stretch tp-fade-up tp-d1">
                    <WelcomeHero data={data} />
                    <ProfileSummaryCard data={data} />
                </div>

                {/* Continue playing rail */}
                {hasGames && (
                    <div className="mb-10 tp-fade-up tp-d2">
                        <ContinuePlayingRow games={data.playing_now} />
                    </div>
                )}

                {/* Upcoming releases rail with Remind Me / Following toggle */}
                <div className="mb-10 tp-fade-up tp-d3">
                    <UpcomingForYouRow />
                </div>

                {/* Backlog & recommendations */}
                {hasGames && (
                    <div className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch tp-fade-up tp-d4">
                        <RecommendedNext games={data.backlog_preview} />
                        <BacklogProgressCard stats={data.stats} suggestion={data.backlog_suggestion} />
                    </div>
                )}

                {/* Main + aside */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-8 space-y-6 min-w-0 tp-fade-up tp-d5">
                        {!hasGames && <OnboardingCard />}
                        <FollowedGamesFeed />
                        <SectionCard
                            title="Community Feed"
                            icon={<Users className="w-3.5 h-3.5 text-[var(--accent)]" />}
                            action={{ label: "Friends", href: "/friends" }}
                            bodyClassName="p-3"
                        >
                            <FriendActivityFeed />
                        </SectionCard>
                    </div>

                    <div className="lg:col-span-4 space-y-6 min-w-0 tp-fade-up tp-d6">
                        <DailyStreakWidget />
                        <QuestPanel isOwnProfile compact />
                        <QuickActionsGrid />
                    </div>
                </div>
            </div>
        </main>
    );
}
