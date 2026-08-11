"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    MessageCircle, Users2, MessageSquare,
    FileText, Users, Search, LayoutGrid, List, Clock, ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import ForumSidebar from "@/components/forum/ForumSidebar";
import { decodeHtml } from "@/lib/decode";
import { fmtStat, getCategoryColor, getCategoryIcon, getAvatarSrc } from "@/lib/forum";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

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

/** Stat pair used inside a category card — the number leads, the word follows. */
function CardStat({ value, label }: { value: number; label: string }) {
    return (
        <span>
            <span className="block font-display text-[20px] font-black tabular-nums text-white leading-none">
                {fmtStat(value || 0)}
            </span>
            <span className="mt-1 block font-display text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/30">
                {label}
            </span>
        </span>
    );
}

function CategoryCard({ category, viewMode }: { category: ForumCategory; viewMode: "grid" | "list" }) {
    const Icon = getCategoryIcon(category.slug);
    const color = getCategoryColor(category.slug);

    const iconBox = (size: "sm" | "lg") => (
        <span
            className={`${size === "lg" ? "w-12 h-12" : "w-10 h-10"} shrink-0 rounded-[var(--radius-card)] flex items-center justify-center`}
            style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
        >
            <Icon className={size === "lg" ? "w-6 h-6" : "w-5 h-5"} />
        </span>
    );

    if (viewMode === "list") {
        return (
            <Link
                href={`/forum/${category.slug}`}
                className="group flex items-center justify-between gap-6 rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-1)] p-4 hover:border-[color-mix(in_srgb,var(--accent)_38%,transparent)] transition-colors"
            >
                <div className="flex items-center gap-3.5 min-w-0">
                    {iconBox("sm")}
                    <div className="min-w-0">
                        <h3 className="font-display text-[14.5px] font-black text-white leading-tight group-hover:text-[var(--accent)] transition-colors">
                            {decodeHtml(category.name)}
                        </h3>
                        {category.description && (
                            <p className="mt-0.5 text-[12px] text-white/35 line-clamp-1 max-w-md">
                                {decodeHtml(category.description)}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-7 shrink-0">
                    <span className="hidden sm:block text-center"><CardStat value={category.threads_count} label="Threads" /></span>
                    <span className="hidden sm:block text-center"><CardStat value={category.posts_count} label="Posts" /></span>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-[var(--accent)] transition-colors" />
                </div>
            </Link>
        );
    }

    return (
        <Link
            href={`/forum/${category.slug}`}
            className="group h-full flex flex-col rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-1)] overflow-hidden hover:border-[color-mix(in_srgb,var(--accent)_38%,transparent)] transition-colors"
        >
            {/* the board, named */}
            <div className="p-4 flex gap-3.5">
                {iconBox("lg")}
                <div className="min-w-0">
                    <h3 className="font-display text-[15px] font-black text-white leading-tight group-hover:text-[var(--accent)] transition-colors">
                        {decodeHtml(category.name)}
                    </h3>
                    <p className="mt-1 text-[12px] text-white/35 leading-relaxed line-clamp-2">
                        {category.description ? decodeHtml(category.description) : "Explore discussions in this category."}
                    </p>
                </div>
            </div>

            <div className="px-4 py-3 flex gap-8 border-t border-white/[0.05]">
                <CardStat value={category.threads_count} label="Threads" />
                <CardStat value={category.posts_count} label="Posts" />
            </div>

            <div className="mt-auto px-4 py-3 border-t border-white/[0.05]">
                <p className="font-display text-[8.5px] font-black uppercase tracking-[0.16em] text-[var(--accent)] mb-2">
                    Latest topic
                </p>
                {category.latest_thread ? (
                    <div className="flex items-start gap-2.5">
                        <span
                            className="w-7 h-7 shrink-0 rounded-full overflow-hidden flex items-center justify-center font-display text-[11px] font-black text-white mt-0.5"
                            style={{ background: `color-mix(in srgb, ${color} 22%, transparent)` }}
                        >
                            {getAvatarSrc(category.latest_thread.author?.avatar_url) ? (
                                <Image unoptimized
                                    src={getAvatarSrc(category.latest_thread.author?.avatar_url)!}
                                    alt={category.latest_thread.author?.username || ""}
                                    width={28}
                                    height={28}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                category.latest_thread.author?.username?.charAt(0)?.toUpperCase() || "?"
                            )}
                        </span>
                        <div className="min-w-0">
                            <p className="font-display text-[12.5px] font-black text-white leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                                {decodeHtml(category.latest_thread.title)}
                            </p>
                            <p className="mt-0.5 text-[11px] text-white/25" suppressHydrationWarning>
                                by {category.latest_thread.author?.username}
                                {" · "}
                                {formatDistanceToNow(new Date(category.latest_thread.created_at), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="text-[12px] text-white/20">No topics yet.</p>
                )}
            </div>
        </Link>
    );
}

/** A thread as it appears in the New posts / Unanswered lists. */
function ThreadRow({ thread, cta }: { thread: ActiveThread; cta: "replies" | "reply" }) {
    return (
        <Link
            href={`/forum/thread/${thread.slug}`}
            className="group flex items-center gap-4 rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-1)] px-4 py-3.5 hover:border-[color-mix(in_srgb,var(--accent)_38%,transparent)] transition-colors"
        >
            <span className="w-11 h-11 shrink-0 rounded-full overflow-hidden bg-[var(--accent-soft)] flex items-center justify-center font-display text-[14px] font-black text-[var(--accent)]">
                {getAvatarSrc(thread.author?.avatar_url) ? (
                    <Image unoptimized
                        src={getAvatarSrc(thread.author?.avatar_url)!}
                        alt={thread.author?.username || ""}
                        width={44}
                        height={44}
                        className="object-cover w-full h-full"
                    />
                ) : (
                    thread.author?.username?.charAt(0)?.toUpperCase() || "?"
                )}
            </span>

            <div className="flex-1 min-w-0">
                <h3 className="font-display text-[15px] font-black text-white truncate group-hover:text-[var(--accent)] transition-colors">
                    {decodeHtml(thread.title)}
                </h3>
                <div className="mt-1 flex items-center gap-2.5">
                    {thread.category && (
                        <span className="inline-flex items-center h-[19px] px-2 rounded-[var(--radius-inner)] bg-[var(--accent-soft)] font-display text-[9px] font-black uppercase tracking-[0.12em] text-[var(--accent)]">
                            {thread.category.name}
                        </span>
                    )}
                    <span className="text-[11.5px] text-white/25" suppressHydrationWarning>
                        {formatDistanceToNow(new Date(thread.updated_at), { addSuffix: true })}
                    </span>
                </div>
            </div>

            {cta === "replies" ? (
                <span className="shrink-0 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[var(--radius-card)] bg-white/[0.04] border border-white/[0.07] text-white/45">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="font-display text-[11px] font-black tabular-nums">{thread.posts_count}</span>
                </span>
            ) : (
                <span className="shrink-0 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[var(--radius-card)] bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] text-[var(--accent)]">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="font-display text-[9.5px] font-black uppercase tracking-[0.1em]">Reply</span>
                </span>
            )}
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
        all: "All categories",
        new: "New posts",
        unanswered: "Unanswered",
    };

    return (
        <div className="min-h-screen bg-[var(--surface-0)]">
            {/* ── hero ── */}
            <section className="relative overflow-hidden border-b border-white/[0.07]">
                <Image
                    src="/forum-hero.png"
                    alt=""
                    fill
                    priority
                    unoptimized
                    className="object-cover object-center"
                />
                {/* a dark pool behind the words, so the fire never fights them */}
                <span aria-hidden className="absolute inset-0 bg-[radial-gradient(58%_120%_at_50%_40%,rgba(5,7,10,0.86),rgba(5,7,10,0.5)_72%)]" />
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--surface-0)] to-transparent" />

                <div className="relative z-10 container-page py-12 md:py-16 text-center">
                    <p className="font-display text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
                        Discuss. Share. Connect.
                    </p>
                    <h1 className="mt-3 font-display text-3xl md:text-5xl font-black uppercase tracking-tight leading-none">
                        <span className="text-white">Community </span>
                        <span className="text-[var(--accent)]">Forums</span>
                    </h1>
                    <p className="mt-3 text-[13.5px] text-white/45 max-w-[520px] mx-auto leading-relaxed">
                        Join the discussion, share your thoughts, and connect with fellow gamers and tech enthusiasts.
                    </p>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
                        {[
                            { icon: Users2, value: stats?.online_users ?? 0, label: "Members online" },
                            { icon: MessageSquare, value: stats?.total_threads ?? 0, label: "Threads" },
                            { icon: FileText, value: stats?.total_posts ?? 0, label: "Posts" },
                            { icon: Users, value: stats?.members ?? 0, label: "Members" },
                        ].map(({ icon: Icon, value, label }) => (
                            <span key={label} className="flex items-center gap-2">
                                <Icon className="w-4 h-4 shrink-0 text-[var(--accent)]" />
                                <span className="font-display text-[21px] font-black tabular-nums text-white leading-none">
                                    {fmtStat(value)}
                                </span>
                                <span className="font-display text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/30 text-left leading-tight max-w-[54px]">
                                    {label}
                                </span>
                            </span>
                        ))}
                    </div>

                    <div className="mt-6 mx-auto max-w-[380px] relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search forums…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && searchQuery.trim()) {
                                    router.push(`/forum/search?q=${encodeURIComponent(searchQuery.trim())}`);
                                }
                            }}
                            className="w-full h-10 pl-10 pr-3 rounded-[var(--radius-panel)] bg-[var(--surface-1)]/85 backdrop-blur-sm border border-white/[0.1] text-[13.5px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
                        />
                    </div>
                </div>
            </section>

            {/* ── main ── */}
            <div className="container-page py-8">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-7">
                    <div className="flex flex-wrap gap-1.5">
                        {(["all", "new", "unanswered"] as TabType[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`inline-flex items-center h-8 px-3.5 rounded-[8px] border font-display text-[9.5px] font-black uppercase tracking-[0.1em] transition-colors ${
                                    activeTab === tab
                                        ? "bg-[var(--accent)] border-transparent text-white"
                                        : "bg-white/[0.03] border-white/[0.07] text-white/45 hover:text-white hover:border-white/[0.16]"
                                }`}
                            >
                                {tabLabels[tab]}
                            </button>
                        ))}
                    </div>

                    {activeTab === "all" && (
                        <div className="flex gap-1 p-1 rounded-[8px] border border-white/[0.07] bg-white/[0.03]">
                            {([
                                ["grid", LayoutGrid, "Grid view"],
                                ["list", List, "List view"],
                            ] as const).map(([mode, Icon, title]) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    title={title}
                                    className={`p-1.5 rounded-[var(--radius-inner)] transition-colors ${
                                        viewMode === mode
                                            ? "bg-[var(--accent)] text-white"
                                            : "text-white/35 hover:text-white"
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                        {/* all categories */}
                        {activeTab === "all" && (
                            <div className="space-y-9">
                                {categoriesLoading ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {[...Array(6)].map((_, i) => (
                                            <div key={i} className="h-64 rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-1)] animate-pulse" />
                                        ))}
                                    </div>
                                ) : (
                                    categories?.map((parent) => {
                                        const ParentIcon = getCategoryIcon(parent.slug);
                                        return (
                                            <div key={parent.id}>
                                                <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/[0.06]">
                                                    <ParentIcon className="w-4 h-4 shrink-0 text-[var(--accent)]" />
                                                    <h2 className="font-display text-[15px] font-black text-white uppercase tracking-[0.1em] leading-none">
                                                        {decodeHtml(parent.name)}
                                                    </h2>
                                                </div>

                                                <div
                                                    className={
                                                        viewMode === "grid"
                                                            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                                                            : "grid grid-cols-1 gap-2.5"
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

                        {/* new posts */}
                        {activeTab === "new" && (
                            <div className="space-y-3">
                                {!activeThreads ? (
                                    [...Array(5)].map((_, i) => (
                                        <div key={i} className="h-[74px] rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-1)] animate-pulse" />
                                    ))
                                ) : activeThreads.length === 0 ? (
                                    <div className="rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-1)] p-12 text-center">
                                        <MessageCircle className="w-9 h-9 text-white/12 mx-auto mb-3" />
                                        <p className="text-[13px] text-white/35">No recent posts yet.</p>
                                    </div>
                                ) : (
                                    activeThreads.map((thread) => (
                                        <ThreadRow key={thread.id} thread={thread} cta="replies" />
                                    ))
                                )}
                            </div>
                        )}

                        {/* unanswered */}
                        {activeTab === "unanswered" && (
                            <div className="space-y-3">
                                {!unansweredThreads ? (
                                    [...Array(5)].map((_, i) => (
                                        <div key={i} className="h-[74px] rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-1)] animate-pulse" />
                                    ))
                                ) : unansweredThreads.length === 0 ? (
                                    <div className="rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-1)] p-14 text-center">
                                        <Clock className="w-10 h-10 text-white/12 mx-auto mb-4" />
                                        <h3 className="font-display text-[16px] font-black text-white uppercase tracking-[0.08em] mb-1.5">
                                            All caught up
                                        </h3>
                                        <p className="text-[13px] text-white/35">
                                            Every thread has at least one reply. Nice work, community.
                                        </p>
                                    </div>
                                ) : (
                                    unansweredThreads.map((thread) => (
                                        <ThreadRow key={thread.id} thread={thread} cta="reply" />
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-1">
                        <ForumSidebar />
                    </div>
                </div>
            </div>
        </div>
    );
}
