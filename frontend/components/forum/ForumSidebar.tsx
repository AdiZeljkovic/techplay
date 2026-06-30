"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import {
    Trophy, MessageCircle, Megaphone, HelpCircle, Gamepad2,
    Star, Monitor, Coffee, ShoppingBag,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import useSWR from "swr";
import axios from "@/lib/axios";
import { getImageUrl } from "@/lib/imageUrl";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface ActiveThread {
    id: number;
    title: string;
    slug: string;
    posts_count: number;
    updated_at: string;
    author: { username: string; avatar_url?: string };
    category?: { name: string; slug: string };
}

interface LeaderboardEntry {
    position: number;
    username: string;
    name: string;
    avatar_url?: string;
    value: number;
    label: string;
}

interface ForumSidebarProps {
    activeThreads?: ActiveThread[];
}

const panelClass =
    "bg-[#0D1117] border border-[#1A2030] rounded-2xl overflow-hidden";

function SidebarHeader({ title }: { title: string }) {
    return (
        <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.12em] mb-4">
            {title}
        </h3>
    );
}

const categoryColors: Record<string, string> = {
    "news-announcements": "#FC4100",
    "general-gaming": "#7C3AED",
    "game-reviews": "#F59E0B",
    "tech-hardware": "#06B6D4",
    "tech-pc-builds": "#06B6D4",
    "off-topic": "#6B7280",
    "feedback-support": "#3B82F6",
    community: "#EC4899",
    gaming: "#7C3AED",
    hardware: "#06B6D4",
};

function getCategoryColor(slug: string): string {
    return categoryColors[slug] ?? "#FC4100";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCategoryIcon(slug: string): React.ComponentType<any> {
    if (slug?.includes("news") || slug?.includes("announcement")) return Megaphone;
    if (slug?.includes("review")) return Star;
    if (slug?.includes("hardware") || slug?.includes("tech") || slug?.includes("pc")) return Monitor;
    if (slug?.includes("gaming") || slug?.includes("game")) return Gamepad2;
    if (slug?.includes("feedback") || slug?.includes("support")) return HelpCircle;
    if (slug?.includes("off") || slug?.includes("random")) return Coffee;
    if (slug?.includes("shop")) return ShoppingBag;
    return MessageCircle;
}

function getAvatarSrc(avatarUrl?: string): string | null {
    if (!avatarUrl) return null;
    const url = avatarUrl.startsWith("http")
        ? avatarUrl
        : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${avatarUrl}`;
    return getImageUrl(url, "thumb");
}

export default function ForumSidebar({ activeThreads }: ForumSidebarProps) {
    const { user } = useAuth();

    const { data: leaderboardResponse } = useSWR("/leaderboard?type=reputation", fetcher);
    const topContributors: LeaderboardEntry[] = leaderboardResponse?.data?.slice(0, 5) ?? [];

    const avatarSrc = getAvatarSrc(user?.avatar_url);
    const xp = user?.xp ?? 0;
    const level = user?.level ?? 1;
    const nextRankXp = user?.next_rank?.min_xp ?? xp + 1000;
    const xpProgress = Math.min(100, Math.round((xp / Math.max(1, nextRankXp)) * 100));

    return (
        <div className="space-y-4 sticky top-[130px]">
            {/* ── PROFILE ── */}
            {user ? (
                <div className={`${panelClass} p-5`}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="relative w-14 h-14 flex-shrink-0">
                            <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-[#FC4100]/40">
                                {avatarSrc ? (
                                    <Image
                                        src={avatarSrc}
                                        alt={user.username}
                                        width={56}
                                        height={56}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-[#FC4100] to-[#FF6B35] flex items-center justify-center text-white text-[18px] font-black">
                                        {user.username?.charAt(0)?.toUpperCase() || "?"}
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FC4100] border-2 border-[#0D1117] flex items-center justify-center text-[10px] font-black text-white">
                                {level}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-bold text-white truncate">{user.username}</p>
                            {user.rank?.name && (
                                <p
                                    className="text-[11px] font-bold uppercase tracking-wide truncate"
                                    style={{ color: user.rank.color || "#FC4100" }}
                                >
                                    {user.rank.name}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#4B5563]">
                            Level {level} XP
                        </span>
                        <span className="text-[10px] font-bold text-[#9CA3AF]">
                            {xp.toLocaleString()} / {nextRankXp.toLocaleString()}
                        </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden mb-4">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-[#FC4100] to-[#FF6B35]"
                            style={{ width: `${xpProgress}%` }}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="text-center bg-white/[0.02] rounded-xl py-2">
                            <div className="text-[15px] font-black text-white leading-none">
                                {user.posts_count || 0}
                            </div>
                            <div className="text-[8px] font-bold uppercase tracking-widest text-[#4B5563] mt-1">
                                Posts
                            </div>
                        </div>
                        <div className="text-center bg-white/[0.02] rounded-xl py-2">
                            <div className="text-[15px] font-black text-white leading-none">
                                {user.forum_reputation || 0}
                            </div>
                            <div className="text-[8px] font-bold uppercase tracking-widest text-[#4B5563] mt-1">
                                Rep
                            </div>
                        </div>
                    </div>

                    <Link
                        href={`/profile/${user.username}`}
                        className="flex items-center justify-center w-full h-9 rounded-xl bg-[#FC4100] hover:bg-[#FC4100]/90 text-white text-[10px] font-bold uppercase tracking-[0.1em] transition-colors"
                    >
                        View Profile
                    </Link>
                </div>
            ) : (
                <div className={`${panelClass} p-5`}>
                    <p className="text-[13px] font-bold text-white mb-1">Join the Community</p>
                    <p className="text-[11px] text-[#4B5563] mb-4 leading-relaxed">
                        Log in to post, earn XP, and climb the ranks.
                    </p>
                    <div className="flex gap-2">
                        <Link
                            href="/login"
                            className="flex-1 h-9 rounded-xl bg-[#FC4100] hover:bg-[#FC4100]/90 text-white text-[11px] font-bold uppercase tracking-widest flex items-center justify-center transition-colors"
                        >
                            Log In
                        </Link>
                        <Link
                            href="/register"
                            className="flex-1 h-9 rounded-xl border border-[#2A3040] hover:border-[#FC4100]/40 text-[#9CA3AF] text-[11px] font-bold uppercase tracking-widest flex items-center justify-center transition-colors"
                        >
                            Register
                        </Link>
                    </div>
                </div>
            )}

            {/* ── TOP CONTRIBUTORS ── */}
            <div className={`${panelClass} p-5`}>
                <SidebarHeader title="Top Contributors" />

                {topContributors.length === 0 ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 bg-white/[0.03] rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="divide-y divide-[#1A2030]">
                        {topContributors.map((entry) => {
                            const avatarSrc = getAvatarSrc(entry.avatar_url);
                            return (
                                <Link key={entry.username} href={`/profile/${entry.username}`}>
                                    <div className="flex items-center gap-3 py-3 hover:opacity-80 transition-opacity">
                                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-[#FC4100]/10">
                                            {avatarSrc ? (
                                                <Image
                                                    src={avatarSrc}
                                                    alt={entry.username}
                                                    width={40}
                                                    height={40}
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[14px] font-black text-white bg-gradient-to-br from-[#FC4100] to-[#FF6B35]">
                                                    {entry.username.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-bold text-white truncate leading-tight">
                                                {entry.name || entry.username}
                                            </p>
                                            <p className="text-[11px] text-[#4B5563] mt-0.5">
                                                {entry.value.toLocaleString()} rep
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                <Link
                    href="/leaderboard"
                    className="mt-4 flex items-center justify-center gap-2 w-full h-9 rounded-xl border border-[#2A3040] hover:border-[#FC4100]/40 hover:bg-[#FC4100]/5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF] hover:text-[#FC4100] transition-colors"
                >
                    <Trophy className="w-3.5 h-3.5" />
                    View Leaderboard
                </Link>
            </div>

            {/* ── LATEST POSTS ── */}
            <div className={`${panelClass} p-5`}>
                <SidebarHeader title="Latest Posts" />

                {!activeThreads ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-14 bg-white/[0.03] rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : activeThreads.length === 0 ? (
                    <p className="text-[12px] text-[#4B5563]">No recent posts.</p>
                ) : (
                    <div className="divide-y divide-[#1A2030]">
                        {activeThreads.map((thread) => {
                            const catSlug = thread.category?.slug ?? "";
                            const color = getCategoryColor(catSlug);
                            const Icon = getCategoryIcon(catSlug);
                            return (
                                <Link key={thread.id} href={`/forum/thread/${thread.slug}`}>
                                    <div className="flex items-start gap-3 py-3 hover:opacity-80 transition-opacity">
                                        {/* Category icon circle */}
                                        <div
                                            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                                            style={{ background: `linear-gradient(135deg, ${color}cc 0%, ${color}55 100%)` }}
                                        >
                                            <Icon className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        {/* Title + meta */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[12px] font-bold text-white line-clamp-2 leading-snug">
                                                {thread.title}
                                            </p>
                                            <p className="text-[10px] text-[#4B5563] mt-0.5">
                                                {thread.category?.name ?? "Forum"}
                                                {" · "}
                                                <span suppressHydrationWarning>
                                                    {formatDistanceToNow(new Date(thread.updated_at), { addSuffix: true })}
                                                </span>
                                            </p>
                                        </div>
                                        {/* Reply count */}
                                        <div className="flex items-center gap-1 text-[#4B5563] flex-shrink-0 mt-0.5">
                                            <MessageCircle className="w-3 h-3" />
                                            <span className="text-[10px] font-bold">{thread.posts_count}</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                <Link
                    href="/forum"
                    className="mt-4 flex items-center justify-center w-full h-9 rounded-xl border border-[#2A3040] hover:border-[#FC4100]/40 hover:bg-[#FC4100]/5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF] hover:text-[#FC4100] transition-colors"
                >
                    View All Latest Posts &rsaquo;
                </Link>
            </div>
        </div>
    );
}
