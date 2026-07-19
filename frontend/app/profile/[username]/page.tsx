"use client";

import { Suspense, useEffect, useState } from "react";
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
import ProfileOverviewDashboard from "@/components/profile/ProfileOverviewDashboard";
import CollectionGrid from "@/components/profile/CollectionGrid";
import RewardsStore from "@/components/profile/RewardsStore";
import ListsTab from "@/components/profile/ListsTab";
import ForumActivityTab from "@/components/profile/ForumActivityTab";
import ActivityFeed from "@/components/profile/ActivityFeed";
import StatsPanel from "@/components/profile/StatsPanel";
import WelcomeOnboarding from "@/components/profile/WelcomeOnboarding";
import SectionCard from "@/components/profile/dashboard/SectionCard";
import SteamAchievements from "@/components/profile/dashboard/SteamAchievements";
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

    // Legacy ?tab=forum now lives inside the Activity tab
    const rawTabParam = searchParams.get("tab");
    const tabParam = (rawTabParam === "forum" ? "activity" : rawTabParam) as ProfileTab | null;
    const activeTab: ProfileTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "overview";

    const [friendStatus, setFriendStatus] = useState<"none" | "pending" | "accepted">("none");
    const [loadingAction, setLoadingAction] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [welcomeOpen, setWelcomeOpen] = useState(false);

    const { data: profile, isLoading } = useSWR<UserProfile>(shouldFetch ? `/users/${username}` : null, fetcher);

    const welcomeForced = searchParams.get("welcome") === "1";

    // Activation wizard: own EMPTY profile (once) or forced via ?welcome=1
    useEffect(() => {
        if (!profile?.user || !currentUser) return;
        if (currentUser.username !== profile.user.username) return;
        let dismissed = false;
        try { dismissed = localStorage.getItem("tp_welcome_dismissed") === "1"; } catch { /* ignore */ }
        if (welcomeForced || ((profile.stats?.games_count ?? 0) === 0 && !dismissed)) {
            setWelcomeOpen(true);
        }
    }, [profile, currentUser, welcomeForced]);

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

    // Rewards is the owner's economy hub — not part of the public profile
    const effectiveTab: ProfileTab = activeTab === "rewards" && ! isOwnProfile ? "overview" : activeTab;

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
                currentUsername={currentUser?.username}
                friendStatus={friendStatus}
                loadingAction={loadingAction}
                onSendRequest={handleSendRequest}
                onOpenMessage={() => setIsMessageModalOpen(true)}
                onOpenTab={setActiveTab}
                listsCount={profile.lists?.length ?? 0}
                reputation={profile.reputation}
                customization={profile.customization}
            />

            <ProfileTabs
                activeTab={effectiveTab}
                onTabChange={setActiveTab}
                isOwnProfile={isOwnProfile}
                counts={{
                    collection: stats?.games_count ?? 0,
                    lists: profile.lists?.length ?? 0,
                    achievements: stats?.achievements_count ?? 0,
                }}
            />

            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-8">
                {effectiveTab === "overview" && (
                    <ProfileOverviewDashboard
                        userData={userData}
                        stats={stats}
                        achievements={achievements || []}
                        isOwnProfile={isOwnProfile}
                        collectionSnapshot={profile.collection_snapshot}
                        playingNow={profile.playing_now}
                        showcase={profile.showcase}
                        platformsGenres={profile.platforms_genres}
                        gamerDna={profile.gamer_dna}
                        reputation={profile.reputation}
                        recognitions={profile.recognitions}
                        milestones={profile.milestones}
                        lists={profile.lists}
                        customization={profile.customization}
                        nextRank={profile.next_rank}
                        connectedAccounts={profile.connected_accounts}
                        clan={profile.clan}
                        onOpenTab={(t) => setActiveTab(t as ProfileTab)}
                    />
                )}

                {effectiveTab === "collection" && (
                    <CollectionGrid username={userData.username} isOwnProfile={isOwnProfile} />
                )}

                {effectiveTab === "activity" && (
                    <div className="space-y-6">
                        <SectionCard title="Activity" icon={<ActivityIcon className="w-4 h-4 text-[var(--accent)]" />}>
                            <ActivityFeed username={userData.username} />
                        </SectionCard>
                        {isOwnProfile && <ForumActivityTab isOwnProfile={isOwnProfile} />}
                    </div>
                )}

                {effectiveTab === "achievements" && (
                    <div className="space-y-6">
                        <AchievementGrid achievements={achievements || []} />
                        <SectionCard title="Steam Achievements" icon={<User className="w-4 h-4 text-[var(--accent)]" />}>
                            <SteamAchievements username={userData.username} />
                        </SectionCard>
                    </div>
                )}

                {effectiveTab === "lists" && (
                    <ListsTab username={userData.username} isOwnProfile={isOwnProfile} />
                )}

                {effectiveTab === "rewards" && isOwnProfile && (
                    <RewardsStore username={userData.username} isOwnProfile={isOwnProfile} />
                )}

                {effectiveTab === "stats" && (
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

            {welcomeOpen && isOwnProfile && (
                <WelcomeOnboarding
                    username={userData.username}
                    forced={welcomeForced}
                    onClose={() => setWelcomeOpen(false)}
                />
            )}
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
