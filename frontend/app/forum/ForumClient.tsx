"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    MessageCircle, LayoutGrid, Sparkles, HelpCircle,
    Search, Clock, ChevronRight, Users2, MessageSquare, FileText, Users, Plus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import ForumSidebar from "@/components/forum/ForumSidebar";
import { decodeHtml } from "@/lib/decode";
import { fmtStat, getCategoryColor, getCategoryIcon, getCategoryArt, getAvatarSrc } from "@/lib/forum";

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
    } | null;
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

const TABS = [
    { id: "all" as const, label: "All categories", icon: LayoutGrid },
    { id: "new" as const, label: "New posts", icon: Sparkles },
    { id: "unanswered" as const, label: "Unanswered", icon: HelpCircle },
];

/* ── one board, one row ───────────────────────────────────────────────── */

function BoardRow({ category }: { category: ForumCategory }) {
    const art = getCategoryArt(category.slug);
    const Icon = getCategoryIcon(category.slug);
    const color = getCategoryColor(category.slug);
    const latest = category.latest_thread;

    return (
        <Link
            href={`/forum/${category.slug}`}
            className="group flex items-center gap-4 rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-1)] p-3.5 hover:border-[color-mix(in_srgb,var(--accent)_38%,transparent)] transition-colors"
        >
            {/* The mark IS the icon — it arrives with its own colour and its
                own edge, and a tinted rounded box around it only made every
                board look like the same grey square. */}
            <span className="w-[52px] h-[52px] shrink-0 flex items-center justify-center" style={{ color }}>
                {art ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={art}
                        alt=""
                        aria-hidden
                        loading="lazy"
                        className="max-w-[42px] max-h-[42px] w-auto h-auto select-none group-hover:scale-110 transition-transform duration-300"
                    />
                ) : (
                    <Icon className="w-7 h-7" />
                )}
            </span>

            <span className="min-w-0 flex-1">
                <span className="block font-display text-[14.5px] font-black text-white leading-tight group-hover:text-[var(--accent)] transition-colors">
                    {decodeHtml(category.name)}
                </span>
                {category.description && (
                    <span className="mt-0.5 block text-[12px] text-white/35 line-clamp-1">
                        {decodeHtml(category.description)}
                    </span>
                )}
            </span>

            {/* What was last said here. On a board index this is the one thing
                worth more than the counters — it is why you click. */}
            <span className="hidden lg:block w-[248px] shrink-0 min-w-0 pl-4 border-l border-white/[0.06]">
                {latest ? (
                    <>
                        <span className="flex items-center gap-2">
                            <span className="w-5 h-5 shrink-0 rounded-full overflow-hidden bg-[var(--accent-soft)] flex items-center justify-center font-display text-[9px] font-black text-[var(--accent)]">
                                {getAvatarSrc(latest.author?.avatar_url) ? (
                                    <Image
                                        unoptimized
                                        src={getAvatarSrc(latest.author?.avatar_url)!}
                                        alt=""
                                        width={20}
                                        height={20}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    latest.author?.username?.charAt(0)?.toUpperCase() ?? "?"
                                )}
                            </span>
                            <span className="min-w-0 flex-1 text-[12px] font-bold text-white/80 truncate">
                                {decodeHtml(latest.title)}
                            </span>
                        </span>
                        <span className="mt-1 block text-[10.5px] text-white/25 truncate" suppressHydrationWarning>
                            {latest.author?.username}
                            {" · "}
                            {formatDistanceToNow(new Date(latest.created_at), { addSuffix: true })}
                        </span>
                    </>
                ) : (
                    <span className="text-[11.5px] text-white/20">No topics yet.</span>
                )}
            </span>

            <span className="hidden sm:flex shrink-0 items-center gap-6 pl-4 border-l border-white/[0.06]">
                <RowStat value={category.threads_count} label="Threads" />
                <RowStat value={category.posts_count} label="Posts" />
            </span>

            <ChevronRight className="w-4 h-4 shrink-0 text-white/20 group-hover:text-[var(--accent)] transition-colors" />
        </Link>
    );
}

function RowStat({ value, label }: { value: number; label: string }) {
    return (
        <span className="text-center w-[46px]">
            <span className="block font-display text-[17px] font-black tabular-nums text-white leading-none">
                {fmtStat(value || 0)}
            </span>
            <span className="mt-1 block font-display text-[8px] font-bold uppercase tracking-[0.16em] text-white/30">
                {label}
            </span>
        </span>
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
                    <Image
                        unoptimized
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
    const [searchQuery, setSearchQuery] = useState("");

    const { data: categories, isLoading: categoriesLoading } = useSWR<ForumCategory[]>("/forum/categories", fetcher);
    const { data: stats } = useSWR<ForumStats>("/forum/stats", fetcher);
    const { data: activeThreads } = useSWR<ActiveThread[]>("/forum/active", fetcher);
    const { data: unansweredThreads } = useSWR<ActiveThread[]>("/forum/unanswered", fetcher);

    return (
        <div className="min-h-screen bg-[var(--surface-0)]">
            {/* ── hero, built like the games database's ── */}
            <section className="relative overflow-hidden border-b border-white/[0.07]">
                <Image src="/forum-hero.png" alt="" fill priority unoptimized className="object-cover object-center" />
                <span aria-hidden className="absolute inset-0 bg-[radial-gradient(58%_120%_at_50%_40%,rgba(5,7,10,0.88),rgba(5,7,10,0.55)_72%)]" />
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--surface-0)] to-transparent" />

                <div className="relative z-10 container-page py-11 text-center">
                    <h1 className="font-display font-black text-white tracking-tight leading-[0.9] text-[42px] md:text-[60px] uppercase">
                        <span className="text-white">Community </span>
                        <span className="text-[var(--accent)]">Forum</span>
                    </h1>

                    <p className="mt-3 max-w-[720px] mx-auto text-[13px] text-white/45">
                        Ask, argue, help and show off — {fmtStat(stats?.total_threads ?? 0)} threads across every board we run.
                    </p>

                    <div className="mt-6 max-w-[640px] mx-auto relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[var(--ink-faint)] group-focus-within:text-[var(--accent)] transition-colors" />
                        <input
                            type="text"
                            placeholder="Search threads, posts, people…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && searchQuery.trim()) {
                                    router.push(`/forum/search?q=${encodeURIComponent(searchQuery.trim())}`);
                                }
                            }}
                            className="w-full h-12 pl-11 pr-4 rounded-[var(--radius-card)] bg-[var(--surface-2)] border border-[var(--line-strong)] text-[13.5px] text-white placeholder:text-[var(--ink-faint)] outline-none focus:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] focus:ring-1 focus:ring-[var(--accent-soft)] transition-all"
                        />
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                        {[
                            { icon: Users2, value: stats?.online_users ?? 0, label: "Online" },
                            { icon: MessageSquare, value: stats?.total_threads ?? 0, label: "Threads" },
                            { icon: FileText, value: stats?.total_posts ?? 0, label: "Replies" },
                            { icon: Users, value: stats?.members ?? 0, label: "Members" },
                        ].map(({ icon: Icon, value, label }) => (
                            <span
                                key={label}
                                className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm"
                            >
                                <Icon className="w-3.5 h-3.5 text-[var(--accent)]" />
                                <span className="font-display text-[12px] font-black tabular-nums text-white leading-none">
                                    {fmtStat(value)}
                                </span>
                                <span className="font-display text-[9px] font-bold uppercase tracking-[0.12em] text-white/35">
                                    {label}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── main ── */}
            <div className="container-page py-7">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                    <div className="lg:col-span-3 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-5">
                            {/* The leaderboard's switcher, so every hub on the
                                site picks a view the same way. */}
                            <div className="flex flex-wrap gap-1.5 p-1.5 rounded-[12px] border border-white/[0.07] bg-[var(--surface-1)]">
                                {TABS.map((tab) => {
                                    const Icon = tab.icon;
                                    const active = activeTab === tab.id;

                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            aria-pressed={active}
                                            className={`inline-flex items-center justify-center gap-2 h-10 px-4 rounded-[8px] font-display text-[11px] font-bold uppercase tracking-[0.06em] transition-colors duration-200 ${
                                                active ? "bg-[var(--accent)] text-white" : "text-white/45 hover:text-white hover:bg-white/[0.05]"
                                            }`}
                                        >
                                            <Icon className="w-3.5 h-3.5" /> {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <span className="flex-1" />

                            {user && (
                                <Link
                                    href="/forum/create"
                                    className="inline-flex items-center gap-2 h-10 px-5 rounded-[10px] bg-[var(--accent)] hover:brightness-110 font-display text-[11px] font-black uppercase tracking-[0.08em] text-white transition-[filter]"
                                >
                                    <Plus className="w-3.5 h-3.5" /> New thread
                                </Link>
                            )}
                        </div>

                        {/* all categories */}
                        {activeTab === "all" && (
                            <div className="space-y-8">
                                {categoriesLoading ? (
                                    <div className="space-y-2.5">
                                        {[...Array(7)].map((_, i) => (
                                            <div key={i} className="h-[80px] rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-1)] animate-pulse" />
                                        ))}
                                    </div>
                                ) : (
                                    categories?.map((parent) => {
                                        const ParentIcon = getCategoryIcon(parent.slug);

                                        if (!parent.children?.length) return null;

                                        return (
                                            <div key={parent.id}>
                                                <div className="flex items-center gap-2.5 mb-3.5 pb-3 border-b border-white/[0.06]">
                                                    <ParentIcon className="w-4 h-4 shrink-0 text-[var(--accent)]" />
                                                    <h2 className="font-display text-[15px] font-black text-white uppercase tracking-[0.1em] leading-none">
                                                        {decodeHtml(parent.name)}
                                                    </h2>
                                                </div>

                                                <div className="space-y-2.5">
                                                    {parent.children.map((category) => (
                                                        <BoardRow key={category.id} category={category} />
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

                    <div className="lg:col-span-1 min-w-0">
                        <ForumSidebar />
                    </div>
                </div>
            </div>
        </div>
    );
}
