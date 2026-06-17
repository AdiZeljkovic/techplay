"use client";

import { Suspense, useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { User, Activity as ActivityIcon } from "lucide-react";
import toast from "react-hot-toast";
import { AchievementGrid } from "@/components/profile/AchievementGrid";
import { SendMessageModal } from "@/components/messaging/SendMessageModal";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileTabs, { type ProfileTab, PROFILE_TABS } from "@/components/profile/ProfileTabs";
import ProfileStatStrip from "@/components/profile/ProfileStatStrip";
import ProfileOverviewDashboard from "@/components/profile/ProfileOverviewDashboard";
import CollectionGrid from "@/components/profile/CollectionGrid";
import RewardsStore from "@/components/profile/RewardsStore";
import ListsTab from "@/components/profile/ListsTab";
import ActivityFeed from "@/components/profile/ActivityFeed";
import StatsPanel from "@/components/profile/StatsPanel";
import SectionCard from "@/components/profile/dashboard/SectionCard";
import type { UserProfile } from "@/lib/types/profile";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const VALID_TABS = PROFILE_TABS.map((t) => t.id);

function ProfilePageInner() {
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user: currentUser, isLoading: authLoading } = useAuth();

    const rawUsername = params.username as string;
    const username = rawUsername === "me" && currentUser ? currentUser.username : rawUsername;
    const shouldFetch = username && username !== "me";

    const tabParam = searchParams.get("tab") as ProfileTab | null;
    const activeTab: ProfileTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "overview";

    const [friendStatus, setFriendStatus] = useState<"none" | "pending" | "accepted">("none");
    const [loadingAction, setLoadingAction] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

    const { data: profile, isLoading } = useSWR<UserProfile>(shouldFetch ? `/users/${username}` : null, fetcher);

    const setActiveTab = (tab: ProfileTab) => {
        const qs = new URLSearchParams(searchParams.toString());
        if (tab === "overview") qs.delete("tab");
        else qs.set("tab", tab);
        router.replace(`${pathname}${qs.toString() ? `?${qs.toString()}` : ""}`, { scroll: false });
    };

    const handleSendRequest = async () => {
        if (!currentUser) return toast.error("Please login first.");
        setLoadingAction(true);
        try {
            await axios.post("/friends/request", { username });
            setFriendStatus("pending");
        } catch {
            toast.error("Failed to send request.");
        } finally {
            setLoadingAction(false);
        }
    };

    if (isLoading || authLoading || (rawUsername === "me" && !currentUser)) {
        return (
            <div className="min-h-screen">
                <div className="-mt-[120px] md:-mt-[116px] h-[460px] bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)] animate-pulse" />
                <div className="max-w-[1320px] mx-auto px-4 xl:px-0 -mt-24 space-y-4">
                    <div className="flex items-end gap-6">
                        <div className="w-32 h-32 rounded-full bg-white/5" />
                        <div className="flex-1 space-y-3 pb-2">
                            <div className="h-8 w-48 bg-white/5 rounded" />
                            <div className="h-4 w-32 bg-white/5 rounded" />
                        </div>
                    </div>
                    <div className="grid grid-cols-5 lg:grid-cols-10 gap-2.5">
                        {Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    if (!profile || !profile.user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <User className="w-16 h-16 text-[var(--text-muted)]" />
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">User Not Found</h1>
                <Link href="/" className="inline-flex items-center gap-2 h-[42px] px-5 bg-tp-accent hover:bg-tp-accent-hover text-white font-bold rounded-lg transition-colors uppercase tracking-[0.08em] text-[12px]">
                    Go Home
                </Link>
            </div>
        );
    }

    const { user: userData, stats, achievements } = profile;
    const isOwnProfile = currentUser?.username === userData.username;

    // Equipped theme overrides the accent color across the whole profile.
    const themeColor = profile.customization?.equipped?.theme?.value;
    const rootStyle = themeColor
        ? ({ ["--accent" as any]: themeColor, ["--accent-hover" as any]: themeColor } as React.CSSProperties)
        : undefined;

    return (
        <div className="min-h-screen" style={rootStyle}>
            <ProfileHeader
                userData={userData}
                stats={stats}
                nextRank={profile.next_rank}
                isOwnProfile={isOwnProfile}
                friendStatus={friendStatus}
                loadingAction={loadingAction}
                onSendRequest={handleSendRequest}
                onOpenMessage={() => setIsMessageModalOpen(true)}
                reputation={profile.reputation}
                customization={profile.customization}
            />

            <ProfileStatStrip stats={stats} nextXp={profile.next_rank?.min_xp ?? null} />

            <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-8">
                {activeTab === "overview" && (
                    <ProfileOverviewDashboard
                        userData={userData}
                        stats={stats}
                        achievements={achievements || []}
                        isOwnProfile={isOwnProfile}
                        collectionSnapshot={profile.collection_snapshot}
                        playingNow={profile.playing_now}
                        platformsGenres={profile.platforms_genres}
                        gamerDna={profile.gamer_dna}
                        reputation={profile.reputation}
                        recognitions={profile.recognitions}
                        milestones={profile.milestones}
                        lists={profile.lists}
                        customization={profile.customization}
                        nextRank={profile.next_rank}
                    />
                )}

                {activeTab === "collection" && (
                    <CollectionGrid username={userData.username} isOwnProfile={isOwnProfile} />
                )}

                {activeTab === "activity" && (
                    <SectionCard title="Activity" icon={<ActivityIcon className="w-4 h-4 text-[var(--accent)]" />}>
                        <ActivityFeed username={userData.username} />
                    </SectionCard>
                )}

                {activeTab === "achievements" && <AchievementGrid achievements={achievements || []} />}

                {activeTab === "lists" && (
                    <ListsTab username={userData.username} isOwnProfile={isOwnProfile} />
                )}

                {activeTab === "rewards" && (
                    <RewardsStore username={userData.username} isOwnProfile={isOwnProfile} />
                )}

                {activeTab === "stats" && (
                    <StatsPanel
                        stats={stats}
                        platformsGenres={profile.platforms_genres}
                        milestones={profile.milestones}
                        gamertags={userData.gamertags}
                        pcSpecs={userData.pc_specs}
                    />
                )}
            </div>

            <SendMessageModal
                isOpen={isMessageModalOpen}
                onClose={() => setIsMessageModalOpen(false)}
                recipientUsername={userData.username}
            />
        </div>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<div className="min-h-screen" />}>
            <ProfilePageInner />
        </Suspense>
    );
}
