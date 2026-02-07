"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { User, Activity, Gamepad2, Cpu, Trophy } from "lucide-react";
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
                <div className="h-48 md:h-64 bg-[var(--bg-secondary)] animate-pulse" />
                <div className="container mx-auto px-4 py-8 max-w-5xl animate-pulse -mt-20">
                    <div className="flex items-end gap-6">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[var(--bg-card)]" />
                        <div className="flex-1 space-y-3 pb-4">
                            <div className="h-8 w-48 bg-[var(--bg-card)] rounded" />
                            <div className="h-4 w-32 bg-[var(--bg-card)] rounded" />
                            <div className="h-3 w-64 bg-[var(--bg-card)] rounded-full" />
                        </div>
                    </div>
                    <div className="grid grid-cols-6 gap-3 mt-8">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-24 bg-[var(--bg-card)] rounded-xl" />
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

    const tabs = [
        { id: "overview", label: "Overview", icon: Activity },
        { id: "ids", label: "Ids", icon: Gamepad2 },
        { id: "gear", label: "Gear", icon: Cpu },
        { id: "achievements", label: "Achievements", icon: Trophy },
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Hero: Cover + Avatar + User Info + XP */}
            <div className="pt-16">
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
                />
            </div>

            {/* Stats Bar */}
            <ProfileStats stats={stats} isStaff={isStaffUser} />

            {/* Navigation Tabs */}
            <div className="container mx-auto px-4 max-w-5xl mt-8">
                <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 border-b border-[var(--border)] overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-6 py-3 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                                activeTab === tab.id
                                    ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-elevated)]/50 rounded-t-lg"
                                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border)]"
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                {activeTab === "overview" && (
                    <ProfileOverview
                        userData={userData}
                        stats={stats}
                        isStaff={isStaffUser}
                        recentArticles={profile.recent_articles}
                    />
                )}

                {activeTab === "ids" && (
                    <div className="max-w-2xl mx-auto">
                        <GamertagsCard tags={userData.gamertags} />
                    </div>
                )}

                {activeTab === "gear" && (
                    <div className="max-w-3xl mx-auto">
                        <SpecsCard specs={userData.pc_specs} />
                    </div>
                )}

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
