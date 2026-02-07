"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { User } from "lucide-react";
import { useState } from "react";
import { GamertagsCard } from "@/components/profile/GamertagsCard";
import { SpecsCard } from "@/components/profile/SpecsCard";
import { AchievementGrid } from "@/components/profile/AchievementGrid";
import { SendMessageModal } from "@/components/messaging/SendMessageModal";
import ProfileHero from "@/components/profile/ProfileHero";
import ProfileStats from "@/components/profile/ProfileStats";
import ProfileOverview from "@/components/profile/ProfileOverview";
import type { UserProfile } from "@/lib/types/profile";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function ProfilePage() {
    const params = useParams();
    const { user: currentUser, isLoading: authLoading } = useAuth();

    const rawUsername = params.username as string;
    const username = rawUsername === "me" && currentUser ? currentUser.username : rawUsername;
    const shouldFetch = username && username !== "me";

    const [friendStatus, setFriendStatus] = useState<"none" | "pending" | "accepted">("none");
    const [loadingAction, setLoadingAction] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "ids" | "gear" | "achievements">("overview");
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

    const { data: profile, isLoading } = useSWR<UserProfile>(shouldFetch ? `/users/${username}` : null, fetcher);

    const handleSendRequest = async () => {
        if (!currentUser) return alert("Please login first.");
        setLoadingAction(true);
        try {
            await axios.post("/friends/request", { username });
            setFriendStatus("pending");
        } catch {
            alert("Failed to send request.");
        } finally {
            setLoadingAction(false);
        }
    };

    if (isLoading || authLoading || (rawUsername === "me" && !currentUser)) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)]">
                <div className="-mt-[120px] md:-mt-[116px] h-[460px] md:h-[536px] bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)] animate-pulse relative">
                    <div className="absolute bottom-16 left-0 right-0">
                        <div className="container mx-auto px-4 max-w-5xl flex items-end gap-6">
                            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-white/5" />
                            <div className="flex-1 space-y-3 pb-2">
                                <div className="h-8 w-48 bg-white/5 rounded" />
                                <div className="h-4 w-32 bg-white/5 rounded" />
                                <div className="h-2.5 w-64 bg-white/5 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-[var(--bg-secondary)] py-4">
                    <div className="container mx-auto px-4 max-w-5xl flex gap-8">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex-1 space-y-2 py-2">
                                <div className="h-6 w-10 bg-white/5 rounded mx-auto" />
                                <div className="h-3 w-16 bg-white/5 rounded mx-auto" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!profile || !profile.user) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-4">
                <User className="w-16 h-16 text-[var(--text-muted)]" />
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">User Not Found</h1>
                <Link href="/">
                    <Button>Go Home</Button>
                </Link>
            </div>
        );
    }

    const { user: userData, stats, achievements } = profile;
    const isOwnProfile = currentUser?.username === userData.username;
    const isStaffUser = ["admin", "editor", "moderator", "journalist", "super_admin"].includes(userData.role?.toLowerCase() || "");

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <div>
                <ProfileHero
                    userData={userData}
                    stats={stats}
                    nextRank={profile.next_rank}
                    isOwnProfile={isOwnProfile}
                    currentUser={currentUser}
                    friendStatus={friendStatus}
                    loadingAction={loadingAction}
                    onSendRequest={handleSendRequest}
                    onOpenMessage={() => setIsMessageModalOpen(true)}
                    activeTab={activeTab}
                    onTabChange={(tab) => setActiveTab(tab as any)}
                />
            </div>

            <ProfileStats stats={stats} isStaff={isStaffUser} />

            <div className="container mx-auto px-4 py-8 max-w-5xl">
                {activeTab === "overview" && (
                    <ProfileOverview
                        userData={userData}
                        stats={stats}
                        isStaff={isStaffUser}
                        recentArticles={profile.recent_articles}
                        achievements={achievements || []}
                    />
                )}
                {activeTab === "ids" && <GamertagsCard tags={userData.gamertags} />}
                {activeTab === "gear" && <SpecsCard specs={userData.pc_specs} />}
                {activeTab === "achievements" && <AchievementGrid achievements={achievements || []} />}
            </div>

            <SendMessageModal
                isOpen={isMessageModalOpen}
                onClose={() => setIsMessageModalOpen(false)}
                recipientUsername={userData.username}
            />
        </div>
    );
}
