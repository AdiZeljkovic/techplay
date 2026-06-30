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

interface ForumStats {
    total_threads: number;
    total_posts: number;
    members: number;
    online_users: number;
}

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
    stats?: ForumStats;
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

function fmtStat(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
    return String(n);
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

export default function ForumSidebar({ stats, activeThreads }: ForumSidebarProps) {
    const { user } = useAuth();

    const { data: leaderboardResponse } = useSWR("/leaderboard?type=reputation", fetcher);
    const topContributors: LeaderboardEntry[] = leaderboardResponse?.data?.slice(0, 5) ?? [];

    return (
        <div className="space-y-4 sticky top-[130px]">
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

            {/* ── FORUM STATISTICS ── */}
            <div className={`${panelClass} overflow-hidden`}>
                {/* Orange waveform graph */}
                <div className="bg-[#080B10] relative">
                    <svg
                        viewBox="0 0 300 72"
                        className="w-full"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                    >
                        <defs>
                            <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#FC4100" stopOpacity="0.55" />
                                <stop offset="100%" stopColor="#FC4100" stopOpacity="0.02" />
                            </linearGradient>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="1.5" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        {/* Fill area */}
                        <path
                            d="M0,68 C15,66 22,55 35,52 C48,49 55,42 68,36 C81,30 90,24 105,19 C120,14 128,10 142,12 C156,14 163,9 178,11 C193,13 200,20 215,18 C230,16 238,24 252,28 C266,32 274,40 288,44 L300,46 L300,72 L0,72 Z"
                            fill="url(#waveGrad)"
                        />
                        {/* Stroke line */}
                        <path
                            d="M0,68 C15,66 22,55 35,52 C48,49 55,42 68,36 C81,30 90,24 105,19 C120,14 128,10 142,12 C156,14 163,9 178,11 C193,13 200,20 215,18 C230,16 238,24 252,28 C266,32 274,40 288,44 L300,46"
                            fill="none"
                            stroke="#FC4100"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            filter="url(#glow)"
                        />
                    </svg>
                </div>

                <div className="p-5">
                    <SidebarHeader title="Forum Statistics" />

                    {/* Stats row */}
                    <div className="grid grid-cols-4 gap-1 mb-4">
                        {[
                            { label: "THREADS", value: stats?.total_threads },
                            { label: "POSTS", value: stats?.total_posts },
                            { label: "MEMBERS", value: stats?.members },
                            { label: "ONLINE", value: stats?.online_users },
                        ].map(({ label, value }) => (
                            <div key={label} className="text-center">
                                <div className="text-[15px] font-black text-white leading-none">
                                    {fmtStat(value ?? 0)}
                                </div>
                                <div className="text-[8px] font-bold uppercase tracking-widest text-[#4B5563] mt-1">
                                    {label}
                                </div>
                            </div>
                        ))}
                    </div>

                    <Link
                        href="/forum"
                        className="flex items-center justify-center w-full h-9 rounded-xl border border-[#2A3040] hover:border-[#FC4100]/40 hover:bg-[#FC4100]/5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF] hover:text-[#FC4100] transition-colors"
                    >
                        Full Forum Statistics &rsaquo;
                    </Link>
                </div>
            </div>

            {/* ── User quick card (logged in only) ── */}
            {user && (
                <div className={`${panelClass} p-4`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#FC4100]/30">
                            {user.avatar_url ? (
                                <Image
                                    src={getImageUrl(
                                        user.avatar_url.startsWith("http")
                                            ? user.avatar_url
                                            : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${user.avatar_url}`,
                                        "thumb"
                                    )}
                                    alt={user.username}
                                    width={40}
                                    height={40}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#FC4100] to-[#FF6B35] flex items-center justify-center text-white text-[15px] font-black">
                                    {user.username?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-white truncate">{user.username}</p>
                            <p className="text-[11px] text-[#4B5563]">{user.posts_count || 0} posts</p>
                        </div>
                        <Link
                            href={`/profile/${user.username}`}
                            className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#FC4100] hover:text-[#FC4100]/80 transition-colors"
                        >
                            Profile
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
