"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
    Search, TrendingUp, MessageCircle, Clock, BarChart3,
    Users2, FileText, Users, MessageSquare,
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
    "bg-white dark:bg-[#0B0E14]/80 backdrop-blur-md border border-zinc-200 dark:border-[#161B22] rounded-[20px] shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden";

function PanelHeader({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
    return (
        <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-tp-accent/10 border border-tp-accent/20 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-tp-accent" />
            </div>
            <h3 className="font-display text-[12px] font-bold text-zinc-900 dark:text-white uppercase tracking-[0.1em]">
                {title}
            </h3>
        </div>
    );
}

const rankColors: Record<number, string> = {
    1: "text-yellow-400",
    2: "text-zinc-400",
    3: "text-amber-600",
};

export default function ForumSidebar({ stats, activeThreads }: ForumSidebarProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");

    const { data: leaderboardResponse } = useSWR("/leaderboard?type=reputation", fetcher);
    const topContributors: LeaderboardEntry[] = leaderboardResponse?.data?.slice(0, 5) ?? [];

    return (
        <div className="space-y-5 sticky top-[130px]">
            {/* ── Search ── */}
            <div className={`${panelClass} p-4`}>
                <div className="absolute top-0 left-[20%] w-[60%] h-[1px] bg-gradient-to-r from-transparent via-tp-accent/30 to-transparent" />
                <PanelHeader icon={Search} title="Search Forums" />
                <div className="flex items-center gap-2 bg-zinc-100 dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#1E2530] rounded-lg px-3 py-2">
                    <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-[#71717A] flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Search topics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && searchQuery.trim()) {
                                router.push(`/forum/search?q=${encodeURIComponent(searchQuery.trim())}`);
                            }
                        }}
                        className="bg-transparent text-[13px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#4A4A55] outline-none flex-1 min-w-0"
                    />
                </div>
            </div>

            {/* ── Auth / User card ── */}
            <div className={panelClass}>
                <div className="absolute top-0 left-[20%] w-[60%] h-[1px] bg-gradient-to-r from-transparent via-tp-accent/30 to-transparent" />
                {user ? (
                    <div className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-tp-accent/30 flex-shrink-0">
                            {user.avatar_url ? (
                                <Image
                                    src={getImageUrl(user.avatar_url.startsWith("http") ? user.avatar_url : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${user.avatar_url}`, "thumb")}
                                    alt={user.username}
                                    width={40}
                                    height={40}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <div className="w-full h-full bg-tp-accent flex items-center justify-center text-white text-[15px] font-bold font-display">
                                    {user.username?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-display font-bold text-[14px] text-zinc-900 dark:text-white truncate">{user.username}</p>
                            <p className="text-[11px] text-zinc-500 dark:text-[#71717A]">{user.posts_count || 0} posts</p>
                        </div>
                        <Link
                            href={`/profile/${user.username}`}
                            className="text-[10px] font-bold uppercase tracking-widest text-tp-accent hover:text-tp-accent/80 transition-colors"
                        >
                            Profile
                        </Link>
                    </div>
                ) : (
                    <div className="p-4">
                        <p className="text-[12px] font-bold text-zinc-900 dark:text-white mb-1">Join the Community</p>
                        <p className="text-[11px] text-zinc-500 dark:text-[#71717A] mb-3 leading-relaxed">
                            Log in to post, earn reputation, and unlock ranks.
                        </p>
                        <div className="flex gap-2">
                            <Link
                                href="/login"
                                className="flex-1 h-9 rounded-lg bg-tp-accent hover:bg-tp-accent/90 text-white text-[11px] font-bold uppercase tracking-widest flex items-center justify-center transition-colors shadow-sm shadow-tp-accent/20"
                            >
                                Log In
                            </Link>
                            <Link
                                href="/register"
                                className="flex-1 h-9 rounded-lg border border-zinc-200 dark:border-[#1E2530] hover:border-tp-accent/30 text-zinc-700 dark:text-[#A1A1AA] text-[11px] font-bold uppercase tracking-widest flex items-center justify-center transition-colors"
                            >
                                Register
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Top Contributors ── */}
            <div className={`${panelClass} p-4`}>
                <div className="absolute top-0 left-[20%] w-[60%] h-[1px] bg-gradient-to-r from-transparent via-tp-accent/30 to-transparent" />
                <PanelHeader icon={TrendingUp} title="Top Contributors" />

                {topContributors.length === 0 ? (
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-10 bg-zinc-100 dark:bg-white/[0.03] rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {topContributors.map((entry) => (
                            <Link key={entry.username} href={`/profile/${entry.username}`}>
                                <div className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-white/[0.03] transition-colors">
                                    <span
                                        className={`font-display font-black text-[12px] w-4 text-center flex-shrink-0 ${
                                            rankColors[entry.position] ?? "text-zinc-400 dark:text-[#71717A]"
                                        }`}
                                    >
                                        {entry.position}
                                    </span>
                                    <div className="w-7 h-7 rounded-full bg-tp-accent/10 border border-tp-accent/20 flex items-center justify-center text-[11px] font-bold text-tp-accent flex-shrink-0 overflow-hidden">
                                        {entry.avatar_url ? (
                                            <Image
                                                src={getImageUrl(entry.avatar_url.startsWith("http") ? entry.avatar_url : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${entry.avatar_url}`, "thumb")}
                                                alt={entry.username}
                                                width={28}
                                                height={28}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            entry.username.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <span className="flex-1 text-[12px] font-bold text-zinc-800 dark:text-[#E4E4E5] truncate">
                                        {entry.name}
                                    </span>
                                    <span className="text-[11px] font-bold text-zinc-400 dark:text-[#71717A] flex-shrink-0">
                                        {entry.value.toLocaleString()} REP
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-white/[0.04]">
                    <Link
                        href="/leaderboard"
                        className="flex items-center justify-center w-full h-8 rounded-lg border border-zinc-200 dark:border-[#1E2530] text-zinc-600 dark:text-[#71717A] hover:border-tp-accent/40 hover:text-tp-accent text-[10px] font-bold uppercase tracking-widest transition-colors"
                    >
                        View Leaderboard
                    </Link>
                </div>
            </div>

            {/* ── Latest Posts ── */}
            <div className={`${panelClass} p-4`}>
                <div className="absolute top-0 left-[20%] w-[60%] h-[1px] bg-gradient-to-r from-transparent via-tp-accent/30 to-transparent" />
                <PanelHeader icon={Clock} title="Latest Posts" />

                {!activeThreads ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-14 bg-zinc-100 dark:bg-white/[0.03] rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : activeThreads.length === 0 ? (
                    <p className="text-[12px] text-zinc-500 dark:text-[#71717A]">No recent posts.</p>
                ) : (
                    <div className="space-y-3">
                        {activeThreads.map((thread) => (
                            <Link key={thread.id} href={`/forum/thread/${thread.slug}`}>
                                <div className="flex items-start gap-2.5 group">
                                    <div className="w-7 h-7 rounded-full bg-tp-accent/10 border border-tp-accent/20 flex items-center justify-center text-[10px] font-bold text-tp-accent flex-shrink-0 mt-0.5 overflow-hidden">
                                        {thread.author?.avatar_url ? (
                                            <Image
                                                src={getImageUrl(thread.author.avatar_url.startsWith("http") ? thread.author.avatar_url : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${thread.author.avatar_url}`, "thumb")}
                                                alt={thread.author.username}
                                                width={28}
                                                height={28}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            thread.author?.username?.charAt(0)?.toUpperCase() || "?"
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-bold text-zinc-800 dark:text-[#E4E4E5] truncate group-hover:text-tp-accent transition-colors leading-snug">
                                            {thread.title}
                                        </p>
                                        <div className="flex items-center justify-between mt-0.5">
                                            <div className="flex items-center gap-1.5">
                                                {thread.category && (
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-tp-accent">
                                                        {thread.category.name}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-zinc-400 dark:text-[#71717A]" suppressHydrationWarning>
                                                    {formatDistanceToNow(new Date(thread.updated_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-zinc-400 dark:text-[#71717A]">
                                                <MessageCircle className="w-3 h-3" />
                                                <span className="text-[10px] font-bold">{thread.posts_count}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Forum Statistics ── */}
            <div className={`${panelClass} p-4`}>
                <div className="absolute top-0 left-[20%] w-[60%] h-[1px] bg-gradient-to-r from-transparent via-tp-accent/30 to-transparent" />
                <PanelHeader icon={BarChart3} title="Forum Statistics" />

                <div className="grid grid-cols-2 gap-2">
                    {[
                        { icon: MessageSquare, label: "Threads", value: stats?.total_threads },
                        { icon: FileText, label: "Posts", value: stats?.total_posts },
                        { icon: Users, label: "Members", value: stats?.members },
                        { icon: Users2, label: "Online Now", value: stats?.online_users },
                    ].map(({ icon: Icon, label, value }) => (
                        <div
                            key={label}
                            className="bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.04] rounded-xl p-3"
                        >
                            <Icon className="w-3.5 h-3.5 text-tp-accent mb-2" />
                            <div className="font-display text-[18px] font-black text-zinc-900 dark:text-white leading-none">
                                {value?.toLocaleString() ?? "—"}
                            </div>
                            <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-[#71717A] mt-0.5">
                                {label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
