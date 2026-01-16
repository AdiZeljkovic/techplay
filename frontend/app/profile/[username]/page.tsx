"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { User, UserPlus, UserCheck, Clock, MessageSquare, Award, Calendar, Gamepad2, Cpu, Trophy, Activity, Mail } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { GamertagsCard } from "@/components/profile/GamertagsCard";
import { SpecsCard } from "@/components/profile/SpecsCard";
import { AchievementGrid } from "@/components/profile/AchievementGrid";
import { motion } from "framer-motion";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface UserProfile {
    user: {
        id: number;
        username: string;
        display_name?: string;
        role: string;
        email: string;
        created_at: string;
        threads: any[];
        posts: any[];
        xp: number;
        gamertags: any;
        pc_specs: any;
        achievements: {
            id: number;
            name: string;
            description: string;
            points: number;
            icon_path?: string;
            is_unlocked: boolean;
            unlocked_at?: string;
        }[];
        avatar_url?: string;
        bio?: string;
        rank?: {
            name: string;
            icon?: string;
            color?: string;
        };
        active_support?: {
            tier: {
                name: string;
                color: string;
            };
        };
    };
    stats: {
        threads_count: number;
        posts_count: number;
        comments_count: number;
        reputation: number;
        joined_at: string;
        xp: number;
        achievements_count: number;
        level: number;
        reviews_count?: number;
    };
    achievements: {
        id: number;
        name: string;
        description: string;
        points: number;
        icon_path?: string;
        is_unlocked: boolean;
        unlocked_at?: string;
    }[];
    next_rank: any;
}

import { SendMessageModal } from "@/components/messaging/SendMessageModal";

export default function ProfilePage() {
    const params = useParams();
    const { user: currentUser, isLoading: authLoading } = useAuth();

    // Resolve "me" to actual username
    const rawUsername = params.username as string;
    const username = (rawUsername === 'me' && currentUser) ? currentUser.username : rawUsername;

    // Don't fetch if 'me' but no user yet
    const shouldFetch = username && (username !== 'me');

    const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted'>('none');
    const [loadingAction, setLoadingAction] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'ids' | 'gear' | 'achievements'>('overview');

    // Messaging Modal State
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

    const { data: profile, isLoading } = useSWR<UserProfile>(shouldFetch ? `/users/${username}` : null, fetcher);

    const handleSendRequest = async () => {
        if (!currentUser) return alert("Please login first.");
        setLoadingAction(true);
        try {
            await axios.post('/friends/request', { username });
            setFriendStatus('pending');
        } catch (error) {
            alert("Failed to send request.");
        } finally {
            setLoadingAction(false);
        }
    };

    if (isLoading || authLoading || (rawUsername === 'me' && !currentUser)) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] pt-20">
                <div className="container mx-auto px-4 py-8 max-w-5xl animate-pulse">
                    <div className="h-48 bg-[var(--bg-card)] rounded-xl mb-8" />
                    <div className="h-96 bg-[var(--bg-card)] rounded-xl" />
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

    // XP Logic
    const currentXP = stats?.xp || 0;
    const level = stats?.level || 1;
    const xpForNextLevel = level * 1000; // Simplified
    const xpProgress = (currentXP % 1000) / 10; // % of 1000

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header / Hero */}
            <div className="relative pt-20 pb-8 bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)] border-b border-[var(--border)]">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 pb-6">
                        {/* Avatar container with Level Badge */}
                        <div className="relative">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[var(--bg-elevated)] border-4 border-[var(--bg-primary)] flex items-center justify-center overflow-hidden shadow-2xl relative z-10">
                                {userData.avatar_url ? (
                                    <img src={userData.avatar_url} alt={userData.username} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-5xl font-bold text-[var(--accent)]">
                                        {userData.username?.charAt(0)?.toUpperCase() || '?'}
                                    </span>
                                )}
                            </div>

                            {/* Level Badge */}
                            <div className="absolute -bottom-2 -right-2 md:bottom-2 md:right-2 z-20 bg-[var(--accent)] text-black font-bold w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-4 border-[var(--bg-primary)] shadow-lg text-lg">
                                {level}
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left mb-2 w-full">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center justify-center md:justify-start gap-3">
                                        <div className="flex flex-col">
                                            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
                                                {userData.display_name || userData.username}
                                            </h1>
                                            {userData.display_name && (
                                                <span className="text-sm text-[var(--text-muted)] font-mono">@{userData.username}</span>
                                            )}
                                        </div>

                                        {/* Removed Rank Badge "AFK" here. Ranks will be in stats or sidebar */}

                                        {userData.active_support && (
                                            <span
                                                className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1 shadow-[0_0_15px_-3px_var(--glow)] h-fit self-center"
                                                style={{
                                                    color: userData.active_support.tier.color || '#F59E0B',
                                                    borderColor: `${userData.active_support.tier.color || '#F59E0B'}40`,
                                                    backgroundColor: `${userData.active_support.tier.color || '#F59E0B'}10`,
                                                    '--glow': userData.active_support.tier.color || '#F59E0B'
                                                } as any}
                                            >
                                                <Award className="w-3 h-3" />
                                                {userData.active_support.tier.name}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[var(--text-muted)] mt-2 flex items-center justify-center md:justify-start gap-2 text-sm">
                                        <Calendar className="w-4 h-4" />
                                        Joined {format(new Date(userData.created_at), 'MMMM yyyy')}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 justify-center">
                                    {!isOwnProfile && (
                                        <>
                                            <Button variant="secondary" size="sm" onClick={() => setIsMessageModalOpen(true)}>
                                                <Mail className="w-4 h-4 mr-2" />
                                                Message
                                            </Button>
                                            {friendStatus === 'none' && (
                                                <Button onClick={handleSendRequest} disabled={loadingAction} className="shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]">
                                                    <UserPlus className="w-4 h-4 mr-2" />
                                                    Add Friend
                                                </Button>
                                            )}
                                            {friendStatus === 'pending' && (
                                                <Button variant="secondary" disabled>
                                                    <Clock className="w-4 h-4 mr-2" />
                                                    Sent
                                                </Button>
                                            )}
                                        </>
                                    )}
                                    {isOwnProfile && (
                                        <Link href="/settings">
                                            <Button variant="outline" size="sm">
                                                Edit Profile
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* XP Bar */}
                            <div className="mt-6 max-w-xl">
                                <div className="flex justify-between text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
                                    <span>XP {currentXP}</span>
                                    <span>Next Level: {xpForNextLevel} XP</span>
                                </div>
                                <div className="h-3 bg-[var(--bg-elevated)] rounded-full overflow-hidden border border-[var(--border)] relative">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${xpProgress}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-[var(--accent)] to-purple-500 rounded-full shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-1 md:gap-2 mt-8 border-b border-[var(--border)] overflow-x-auto no-scrollbar">
                        {[
                            { id: 'overview', label: 'Overview', icon: Activity },
                            { id: 'ids', label: 'Ids', icon: Gamepad2 },
                            { id: 'gear', label: 'Gear', icon: Cpu },
                            { id: 'achievements', label: 'Achievements', icon: Trophy },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 md:px-6 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-elevated)]/50 rounded-t-lg'
                                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border)]'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Left Sidebar: About & Mini Stats */}
                        <div className="space-y-6">
                            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
                                <h3 className="font-semibold text-[var(--text-primary)] mb-4">About</h3>
                                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                                    {userData.bio || "This user hasn't written a bio yet."}
                                </p>
                            </div>

                            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
                                <h3 className="font-semibold text-[var(--text-primary)] mb-4">Stats</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--text-muted)]">Threads Created</span>
                                        <span className="font-mono">{userData.threads?.length || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--text-muted)]">Forum Posts</span>
                                        <span className="font-mono">{userData.posts?.length || 0}</span>
                                    </div>

                                    {/* Conditional Stats */}
                                    {['admin', 'editor', 'moderator'].includes(userData.role) ? (
                                        <>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-[var(--text-muted)]">Articles Published</span>
                                                <span className="font-mono text-[var(--accent)]">{stats.reviews_count || 0}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-[var(--text-muted)]">Achievements</span>
                                            <span className="font-mono text-[var(--accent)]">{stats.achievements_count || 0}</span>
                                        </div>
                                    )}

                                    {/* XP / Level is already in header, but keeping strict stats here */}
                                    <div className="flex justify-between text-sm pt-2 border-t border-[var(--border)] mt-2">
                                        <span className="text-[var(--text-muted)]">Global Rank</span>
                                        <span className="font-bold text-white">{userData.rank?.name || 'Rookie'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Feed */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Recent Activity */}
                            <h3 className="font-bold text-xl text-[var(--text-primary)]">Recent Activity</h3>

                            <div className="flex flex-col gap-4">
                                {userData.posts?.slice(0, 5).map((post: any) => (
                                    <div key={post.id} className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] hover:border-[var(--accent)] transition-all">
                                        <div className="flex items-start gap-3">
                                            <MessageSquare className="w-5 h-5 text-[var(--text-muted)] mt-1" />
                                            <div>
                                                <p className="text-[var(--text-primary)] text-sm line-clamp-3">
                                                    "{post.content?.replace(/<[^>]*>?/gm, '').substring(0, 150)}..."
                                                </p>
                                                <div className="mt-2 text-xs text-[var(--text-muted)]">
                                                    Replied to a thread • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!userData.posts || userData.posts.length === 0) && (
                                    <div className="p-8 text-center border dashed border-[var(--border)] rounded-xl text-[var(--text-muted)]">
                                        No recent activity.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'ids' && (
                    <div className="max-w-2xl mx-auto">
                        <GamertagsCard tags={userData.gamertags} />
                    </div>
                )}

                {activeTab === 'gear' && (
                    <div className="max-w-3xl mx-auto">
                        <SpecsCard specs={userData.pc_specs} />
                    </div>
                )}

                {activeTab === 'achievements' && (
                    <AchievementGrid achievements={achievements || []} />
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
