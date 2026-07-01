"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    MessageCircle, Megaphone, Gamepad2, Star, Coffee, Monitor,
    HelpCircle, Trophy, ShoppingBag, Users2, MessageSquare,
    FileText, Users, Search, LayoutGrid, List, Clock, ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import ForumSidebar from "@/components/forum/ForumSidebar";
import { decodeHtml } from "@/lib/decode";
import { getImageUrl } from "@/lib/imageUrl";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

function getAvatarSrc(avatarUrl?: string): string | null {
    if (!avatarUrl) return null;
    const url = avatarUrl.startsWith("http")
        ? avatarUrl
        : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${avatarUrl}`;
    return getImageUrl(url, "thumb");
}

interface ForumCategory {
    id: number;
    name: string;
    slug: string;
    description?: string;
    threads_count: number;
    posts_count: number;
    children?: ForumCategory[];
    latest_thread?: {
        title: string;
        slug: string;
        created_at: string;
        author: { username: string; avatar_url?: string };
    };
}

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

type TabType = "all" | "new" | "unanswered";

const fmtStat = (n: number): string => {
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
    return n.toString();
};

const getCategoryColor = (slug: string): string => {
    const map: Record<string, string> = {
        "news-announcements": "#ef4444",
        "feedback-support": "#3b82f6",
        "general-gaming": "#8b5cf6",
        "user-reviews": "#f59e0b",
        esports: "#10b981",
        "pc-builds": "#06b6d4",
        consoles: "#6366f1",
        "the-lounge": "#ec4899",
        marketplace: "#14b8a6",
        "game-guides": "#f97316",
        "hardware-tech": "#84cc16",
    };
    return map[slug] ?? "#64748b";
};

const getCategoryIcon = (slug: string) => {
    const map: Record<string, React.ComponentType<{ className?: string }>> = {
        // Parent categories
        community: Users2,
        gaming: Gamepad2,
        hardware: Monitor,
        // Child categories
        "news-announcements": Megaphone,
        "feedback-support": HelpCircle,
        "general-gaming": Gamepad2,
        "game-reviews": Star,
        "user-reviews": Star,
        esports: Trophy,
        "pc-builds": Monitor,
        "pc-builds-upgrades": Monitor,
        consoles: Gamepad2,
        "consoles-peripherals": Gamepad2,
        "the-lounge": Coffee,
        marketplace: ShoppingBag,
        "game-guides": Star,
        "hardware-tech": Monitor,
        "tech-gear-talk": ShoppingBag,
    };
    return map[slug] ?? MessageCircle;
};

function CategoryCard({ category, viewMode }: { category: ForumCategory; viewMode: "grid" | "list" }) {
    const Icon = getCategoryIcon(category.slug);
    const color = getCategoryColor(category.slug);

    if (viewMode === "list") {
        return (
            <Link href={`/forum/${category.slug}`}>
                <div
                    className="group relative bg-[#0D1117] border border-[#1A2030] rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:border-white/10 overflow-hidden"
                    style={{ borderLeft: `4px solid ${color}` }}
                >
                    <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{ background: `linear-gradient(90deg, ${color}08 0%, transparent 100%)` }}
                    />
                    <div className="relative z-10 flex items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center"
                                style={{
                                    background: `linear-gradient(135deg, ${color}dd 0%, ${color}66 100%)`,
                                    boxShadow: `0 4px 12px -2px ${color}40`,
                                }}
                            >
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-bold text-white mb-0.5 group-hover:text-tp-accent transition-colors">
                                    {decodeHtml(category.name)}
                                </h3>
                                {category.description && (
                                    <p className="text-[#6B7280] text-[12px] line-clamp-1 max-w-md">
                                        {decodeHtml(category.description)}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-8 flex-shrink-0">
                            <div className="hidden sm:block text-center">
                                <div className="font-display text-[18px] font-black text-white leading-none">
                                    {fmtStat(category.threads_count || 0)}
                                </div>
                                <div className="text-[9px] font-bold uppercase tracking-widest text-[#6B7280] mt-0.5">Threads</div>
                            </div>
                            <div className="hidden sm:block text-center">
                                <div className="font-display text-[18px] font-black text-white leading-none">
                                    {fmtStat(category.posts_count || 0)}
                                </div>
                                <div className="text-[9px] font-bold uppercase tracking-widest text-[#6B7280] mt-0.5">Posts</div>
                            </div>
                            <div className="w-7 h-7 rounded-full border border-[#2A3040] flex items-center justify-center text-[#6B7280] group-hover:border-tp-accent/40 group-hover:text-tp-accent transition-all duration-300">
                                <ChevronRight className="w-3.5 h-3.5" />
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

    // ── Grid card — matches reference design exactly ──
    return (
        <Link href={`/forum/${category.slug}`} className="h-full">
            <div className="group h-full bg-[#0D1117] border border-[#1A2030] rounded-2xl overflow-hidden hover:border-white/10 transition-all duration-300 flex flex-col">

                {/* TOP: icon + name + description */}
                <div className="p-4 sm:p-5 flex gap-3 sm:gap-4">
                    <div
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex-shrink-0 flex items-center justify-center"
                        style={{
                            background: `linear-gradient(135deg, ${color}ee 0%, ${color}77 100%)`,
                            boxShadow: `0 8px 20px -4px ${color}50`,
                        }}
                    >
                        <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                        <h3 className="text-[15px] sm:text-[16px] font-bold text-white mb-1 group-hover:text-tp-accent transition-colors leading-snug">
                            {decodeHtml(category.name)}
                        </h3>
                        <p className="text-[12px] text-[#6B7280] leading-relaxed line-clamp-2">
                            {category.description ? decodeHtml(category.description) : "Explore discussions in this category."}
                        </p>
                    </div>
                </div>

                {/* STATS */}
                <div className="px-4 sm:px-5 py-3 sm:py-4 flex gap-8 border-t border-[#1A2030]">
                    <div>
                        <div className="font-display text-[22px] sm:text-[24px] font-black text-white leading-none">
                            {fmtStat(category.threads_count || 0)}
                        </div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-[#6B7280] mt-1">
                            THREADS
                        </div>
                    </div>
                    <div>
                        <div className="font-display text-[22px] sm:text-[24px] font-black text-white leading-none">
                            {fmtStat(category.posts_count || 0)}
                        </div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-[#6B7280] mt-1">
                            POSTS
                        </div>
                    </div>
                </div>

                {/* LATEST TOPIC */}
                <div className="mt-auto border-t border-[#1A2030] px-4 sm:px-5 py-3 sm:py-4">
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-tp-accent mb-2.5">
                        LATEST TOPIC
                    </p>
                    {category.latest_thread ? (
                        <div className="flex items-start gap-2.5">
                            <div
                                className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white mt-0.5 overflow-hidden"
                                style={{ background: `linear-gradient(135deg, ${color}cc 0%, ${color}66 100%)` }}
                            >
                                {getAvatarSrc(category.latest_thread.author?.avatar_url) ? (
                                    <Image
                                        src={getAvatarSrc(category.latest_thread.author?.avatar_url)!}
                                        alt={category.latest_thread.author?.username || ""}
                                        width={28}
                                        height={28}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    category.latest_thread.author?.username?.charAt(0)?.toUpperCase() || "?"
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] sm:text-[13px] font-semibold text-white leading-snug line-clamp-2 group-hover:text-tp-accent transition-colors">
                                    {decodeHtml(category.latest_thread.title)}
                                </p>
                                <p className="text-[11px] text-[#6B7280] mt-0.5" suppressHydrationWarning>
                                    by {category.latest_thread.author?.username}
                                    {" · "}
                                    {formatDistanceToNow(new Date(category.latest_thread.created_at), { addSuffix: true })}
                                </p>
                            </div>
                            <div className="w-6 h-6 rounded-full border border-[#2A3040] flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:border-tp-accent/40 group-hover:text-tp-accent transition-all duration-300">
                                <ChevronRight className="w-3.5 h-3.5 text-[#6B7280] group-hover:text-tp-accent" />
                            </div>
                        </div>
                    ) : (
                        <p className="text-[12px] text-[#4A5060] italic">No topics yet.</p>
                    )}
                </div>
            </div>
        </Link>
    );
}

export default function ForumPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");

    const { data: categories, isLoading: categoriesLoading } = useSWR<ForumCategory[]>("/forum/categories", fetcher);
    const { data: stats } = useSWR<ForumStats>("/forum/stats", fetcher);
    const { data: activeThreads } = useSWR<ActiveThread[]>("/forum/active", fetcher);
    const { data: unansweredThreads } = useSWR<ActiveThread[]>("/forum/unanswered", fetcher);

    const tabLabels: Record<TabType, string> = {
        all: "All Categories",
        new: "New Posts",
        unanswered: "Unanswered",
    };

    return (
        <div className="min-h-screen">
            {/* ── HERO ── */}
            <section className="relative overflow-hidden bg-[#060810]" style={{ minHeight: 340 }}>
                {/* Warrior background image */}
                <Image
                    src="/forum-hero.png"
                    alt=""
                    fill
                    priority
                    unoptimized
                    className="object-cover object-center"
                />

                {/* Left-heavy gradient so text stays readable, warrior shows through center */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#060810] from-[28%] via-[#060810]/60 via-[55%] to-[#060810]/65" />
                {/* Extra bottom darkness so the whole hero blends into page */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#060810] to-transparent" />

                <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-14 lg:py-20 relative z-10">
                    <div className="grid lg:grid-cols-[1fr_auto] gap-8 xl:gap-16 items-center">
                        {/* Left */}
                        <div className="max-w-[520px]">
                            <p className="text-tp-accent text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] mb-3 sm:mb-4">
                                DISCUSS. SHARE. CONNECT.
                            </p>
                            <h1 className="font-display text-[38px] sm:text-5xl xl:text-[58px] font-black text-white uppercase leading-none mb-4 sm:mb-5">
                                COMMUNITY{" "}
                                <span className="text-tp-accent">FORUMS</span>
                            </h1>
                            <p className="text-[#A1A1AA] text-[14px] sm:text-[15px] leading-relaxed mb-8 sm:mb-10">
                                Join the discussion, share your thoughts, and connect with fellow gamers and tech enthusiasts.
                            </p>

                            {/* Stats row */}
                            <div className="flex flex-wrap gap-x-6 gap-y-4">
                                {[
                                    { icon: Users2, value: stats?.online_users ?? 0, label: "MEMBERS ONLINE" },
                                    { icon: MessageSquare, value: stats?.total_threads ?? 0, label: "THREADS" },
                                    { icon: FileText, value: stats?.total_posts ?? 0, label: "POSTS" },
                                    { icon: Users, value: stats?.members ?? 0, label: "MEMBERS" },
                                ].map(({ icon: Icon, value, label }) => (
                                    <div key={label} className="flex items-center gap-2">
                                        <Icon className="w-4 h-4 text-tp-accent flex-shrink-0" />
                                        <span className="font-display font-black text-white text-[22px] leading-none">
                                            {fmtStat(value)}
                                        </span>
                                        <span className="text-[#6B7280] text-[9px] font-bold uppercase tracking-widest leading-tight">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right — auth / search panel */}
                        <div className="hidden lg:block w-[300px] xl:w-[320px]">
                            <div className="space-y-3">
                                {/* Search bar */}
                                <div className="flex items-center gap-2 bg-[#0D1117]/80 border border-white/[0.10] rounded-lg px-4 py-3 backdrop-blur-md">
                                    <input
                                        type="text"
                                        placeholder="Search forums..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && searchQuery.trim()) {
                                                router.push(`/forum/search?q=${encodeURIComponent(searchQuery.trim())}`);
                                            }
                                        }}
                                        className="flex-1 bg-transparent text-[14px] text-white placeholder:text-[#6B7280] outline-none min-w-0"
                                    />
                                    <Search className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
                                </div>

                                {user ? (
                                    <Link
                                        href={`/profile/${user.username}`}
                                        className="flex items-center justify-center w-full h-11 rounded-lg bg-tp-accent hover:bg-tp-accent/90 text-white text-[12px] font-black uppercase tracking-widest transition-colors shadow-lg shadow-tp-accent/25"
                                    >
                                        GO TO PROFILE
                                    </Link>
                                ) : (
                                    <>
                                        <div className="flex gap-2">
                                            <Link
                                                href="/login"
                                                className="flex-1 h-11 rounded-lg bg-tp-accent hover:bg-tp-accent/90 text-white text-[12px] font-black uppercase tracking-widest flex items-center justify-center transition-colors shadow-lg shadow-tp-accent/25"
                                            >
                                                LOG IN
                                            </Link>
                                            <Link
                                                href="/register"
                                                className="flex-1 h-11 rounded-lg border border-white/25 hover:border-white/50 text-white text-[12px] font-black uppercase tracking-widest flex items-center justify-center transition-colors"
                                            >
                                                REGISTER
                                            </Link>
                                        </div>
                                        <p className="text-[12px] text-[#9CA3AF] text-center leading-relaxed">
                                            New here? Create an account and join the TechPlay community.
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-tp-accent/50 to-transparent" />
            </section>

            {/* ── MAIN CONTENT ── */}
            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-8">
                {/* Filter Tabs */}
                <div className="flex items-center justify-between mb-8 border-b border-zinc-200 dark:border-[#161B22]">
                    <div className="flex">
                        {(["all", "new", "unanswered"] as TabType[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 -mb-px transition-all ${
                                    activeTab === tab
                                        ? "border-tp-accent text-tp-accent"
                                        : "border-transparent text-zinc-500 dark:text-[#71717A] hover:text-zinc-800 dark:hover:text-white"
                                }`}
                            >
                                {tabLabels[tab]}
                            </button>
                        ))}
                    </div>

                    {activeTab === "all" && (
                        <div className="flex items-center gap-1 pb-1">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-1.5 rounded transition-colors ${
                                    viewMode === "grid"
                                        ? "text-tp-accent"
                                        : "text-zinc-400 dark:text-[#71717A] hover:text-zinc-800 dark:hover:text-white"
                                }`}
                                title="Grid view"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`p-1.5 rounded transition-colors ${
                                    viewMode === "list"
                                        ? "text-tp-accent"
                                        : "text-zinc-400 dark:text-[#71717A] hover:text-zinc-800 dark:hover:text-white"
                                }`}
                                title="List view"
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* ── Main ── */}
                    <div className="lg:col-span-3">
                        {/* ALL CATEGORIES */}
                        {activeTab === "all" && (
                            <div className="space-y-10">
                                {categoriesLoading ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {[...Array(6)].map((_, i) => (
                                            <div key={i} className="h-72 bg-[#0D1117] border border-[#1A2030] rounded-2xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : (
                                    categories?.map((parent) => {
                                        const ParentIcon = getCategoryIcon(parent.slug) ?? Gamepad2;
                                        return (
                                        <div key={parent.id}>
                                            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.06]">
                                                <ParentIcon className="w-5 h-5 text-tp-accent flex-shrink-0" />
                                                <h2 className="font-display text-[16px] sm:text-[18px] font-bold text-white uppercase tracking-[0.08em] leading-none">
                                                    {decodeHtml(parent.name)}
                                                </h2>
                                            </div>

                                            <div
                                                className={
                                                    viewMode === "grid"
                                                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                                                        : "grid grid-cols-1 gap-3"
                                                }
                                            >
                                                {parent.children?.map((category) => (
                                                    <CategoryCard key={category.id} category={category} viewMode={viewMode} />
                                                ))}
                                            </div>
                                        </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {/* NEW POSTS */}
                        {activeTab === "new" && (
                            <div className="space-y-5">
                                {!activeThreads ? (
                                    <div className="space-y-5">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="h-24 bg-[#0D1117] border border-[#1A2030] rounded-2xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : activeThreads.length === 0 ? (
                                    <div className="bg-[#0D1117] border border-[#1A2030] rounded-2xl p-12 text-center">
                                        <MessageCircle className="w-10 h-10 text-[#3F3F46] mx-auto mb-3" />
                                        <p className="text-[#71717A] text-sm">No recent posts yet.</p>
                                    </div>
                                ) : (
                                    activeThreads.map((thread) => (
                                        <Link key={thread.id} href={`/forum/thread/${thread.slug}`} className="block">
                                            <div className="group bg-[#0D1117] border border-[#1A2030] rounded-2xl px-5 py-5 sm:px-6 sm:py-6 hover:border-tp-accent/30 hover:shadow-lg hover:shadow-tp-accent/5 transition-all duration-300 flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-full bg-tp-accent/10 ring-1 ring-white/[0.06] flex items-center justify-center text-[14px] font-bold text-tp-accent flex-shrink-0 overflow-hidden">
                                                    {getAvatarSrc(thread.author?.avatar_url) ? (
                                                        <Image
                                                            src={getAvatarSrc(thread.author?.avatar_url)!}
                                                            alt={thread.author?.username || ""}
                                                            width={48}
                                                            height={48}
                                                            className="object-cover w-full h-full"
                                                        />
                                                    ) : (
                                                        thread.author?.username?.charAt(0)?.toUpperCase() || "?"
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-[15px] sm:text-[16px] font-bold text-white truncate group-hover:text-tp-accent transition-colors mb-1.5">
                                                        {decodeHtml(thread.title)}
                                                    </h3>
                                                    <div className="flex items-center gap-2.5">
                                                        {thread.category && (
                                                            <span className="px-2 py-0.5 rounded-full bg-tp-accent/10 text-[10px] font-bold uppercase tracking-widest text-tp-accent">
                                                                {thread.category.name}
                                                            </span>
                                                        )}
                                                        <span className="text-[12px] text-[#6B7280]" suppressHydrationWarning>
                                                            {formatDistanceToNow(new Date(thread.updated_at), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[#6B7280] flex-shrink-0 bg-white/[0.02] border border-[#1A2030] rounded-full px-3 py-1.5">
                                                    <MessageCircle className="w-3.5 h-3.5" />
                                                    <span className="text-[12px] font-bold">{thread.posts_count}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        )}

                        {/* UNANSWERED */}
                        {activeTab === "unanswered" && (
                            <div className="space-y-5">
                                {!unansweredThreads ? (
                                    <div className="space-y-5">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="h-24 bg-[#0D1117] border border-[#1A2030] rounded-2xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : unansweredThreads.length === 0 ? (
                                    <div className="bg-[#0D1117] border border-[#1A2030] rounded-2xl p-14 text-center">
                                        <Clock className="w-12 h-12 text-[#3F3F46] mx-auto mb-4" />
                                        <h3 className="font-display text-[17px] font-bold text-white uppercase tracking-wide mb-2">
                                            All Caught Up
                                        </h3>
                                        <p className="text-[#71717A] text-[13px]">
                                            Every thread has at least one reply. Nice work, community.
                                        </p>
                                    </div>
                                ) : (
                                    unansweredThreads.map((thread) => (
                                        <Link key={thread.id} href={`/forum/thread/${thread.slug}`} className="block">
                                            <div className="group bg-[#0D1117] border border-[#1A2030] rounded-2xl px-5 py-5 sm:px-6 sm:py-6 hover:border-tp-accent/30 hover:shadow-lg hover:shadow-tp-accent/5 transition-all duration-300 flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-full bg-tp-accent/10 ring-1 ring-white/[0.06] flex items-center justify-center text-[14px] font-bold text-tp-accent flex-shrink-0 overflow-hidden">
                                                    {getAvatarSrc(thread.author?.avatar_url) ? (
                                                        <Image
                                                            src={getAvatarSrc(thread.author?.avatar_url)!}
                                                            alt={thread.author?.username || ""}
                                                            width={48}
                                                            height={48}
                                                            className="object-cover w-full h-full"
                                                        />
                                                    ) : (
                                                        thread.author?.username?.charAt(0)?.toUpperCase() || "?"
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-[15px] sm:text-[16px] font-bold text-white truncate group-hover:text-tp-accent transition-colors mb-1.5">
                                                        {decodeHtml(thread.title)}
                                                    </h3>
                                                    <div className="flex items-center gap-2.5">
                                                        {thread.category && (
                                                            <span className="px-2 py-0.5 rounded-full bg-tp-accent/10 text-[10px] font-bold uppercase tracking-widest text-tp-accent">
                                                                {thread.category.name}
                                                            </span>
                                                        )}
                                                        <span className="text-[12px] text-[#6B7280]" suppressHydrationWarning>
                                                            {formatDistanceToNow(new Date(thread.updated_at), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-tp-accent flex-shrink-0 bg-tp-accent/10 border border-tp-accent/20 rounded-full px-3 py-1.5">
                                                    <MessageCircle className="w-3.5 h-3.5" />
                                                    <span className="text-[11px] font-bold uppercase tracking-wide">Reply</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Sidebar ── */}
                    <div className={`lg:col-span-1 ${activeTab === "all" ? "lg:pt-[57px]" : ""}`}>
                        <ForumSidebar activeThreads={activeThreads} />
                    </div>
                </div>

            </div>
        </div>
    );
}
