"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    MessageCircle, LayoutGrid, Sparkles, HelpCircle,
    Search, Clock, Users2, MessageSquare, FileText, Users, Plus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import ForumSidebar from "@/components/forum/ForumSidebar";
import ThreadRow, { ThreadRowHeader, type ThreadRowData } from "@/components/forum/ThreadRow";
import { decodeHtml } from "@/lib/decode";
import { fmtStat, getCategoryIcon, getAvatarSrc, type BoardMarkComponent } from "@/lib/forum";

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

/**
 * Boards used to float as separate bordered cards with 10px of ground between
 * them, while a board's own page listed its threads as rows inside one panel.
 * Same forum, two grammars. A board index is a table, so it gets the table:
 * one panel per group, hairlines between rows, counts in fixed columns under
 * headings that say what they are.
 */
function BoardRow({ category }: { category: ForumCategory }) {
    const Icon = getCategoryIcon(category.slug);
    const latest = category.latest_thread;
    const latestAvatar = getAvatarSrc(latest?.author?.avatar_url);

    return (
        <Link
            href={`/forum/${category.slug}`}
            className="group flex items-center gap-3 px-3.5 py-3 hover:bg-white/[0.025] transition-colors"
        >
            {/* The mark IS the icon — it arrives with its own colour and its
                own edge, and a tinted rounded box around it only made every
                board look like the same grey square. */}
            <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                <Icon className="h-[30px] w-[30px]" />
            </span>

            <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[14px] font-bold text-white transition-colors group-hover:text-[var(--accent-ink)]">
                    {decodeHtml(category.name)}
                </span>
                {category.description && (
                    <span className="mt-0.5 block line-clamp-1 text-[11.5px] text-[var(--ink-faint)]">
                        {decodeHtml(category.description)}
                    </span>
                )}
            </span>

            {/* What was last said here. On a board index this is the one thing
                worth more than the counters — it is why you click. */}
            <span className="hidden lg:block w-[240px] shrink-0 min-w-0">
                {latest ? (
                    <>
                        <span className="flex items-center gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--accent-soft)] font-display text-[9px] font-bold text-[var(--accent)]">
                                {latestAvatar ? (
                                    <Image
                                        unoptimized
                                        src={latestAvatar}
                                        alt=""
                                        width={20}
                                        height={20}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    latest.author?.username?.charAt(0)?.toUpperCase() ?? "?"
                                )}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[var(--ink-mid)]">
                                {decodeHtml(latest.title)}
                            </span>
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-[var(--ink-faint)]" suppressHydrationWarning>
                            {latest.author?.username}
                            {" · "}
                            {formatDistanceToNow(new Date(latest.created_at), { addSuffix: true })}
                        </span>
                    </>
                ) : (
                    <span className="text-[11.5px] text-[var(--ink-faint)]">No topics yet.</span>
                )}
            </span>

            <span className="hidden sm:block w-[62px] shrink-0 text-right font-numeric text-[13px] text-[var(--ink-mid)]">
                {fmtStat(category.threads_count || 0)}
            </span>
            <span className="hidden sm:block w-[62px] shrink-0 text-right font-numeric text-[13px] text-[var(--ink-mid)]">
                {fmtStat(category.posts_count || 0)}
            </span>
        </Link>
    );
}

/** The group's name doubles as the column header for the boards under it. */
function BoardGroupHeader({ name, mark: Mark }: { name: string; mark: BoardMarkComponent }) {
    const label = "shrink-0 font-display text-[9.5px] font-bold uppercase tracking-[0.1em] text-[var(--ink-faint)]";

    return (
        <div className="flex items-center gap-3 border-b border-[var(--line)] px-3.5 py-2.5">
            <Mark aria-hidden className="h-4 w-4 shrink-0 text-[var(--accent)]" />
            <h2 className="min-w-0 flex-1 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-white">
                {name}
            </h2>
            <span className={`hidden lg:block w-[240px] ${label}`}>Latest</span>
            <span className={`hidden sm:block w-[62px] text-right ${label}`}>Threads</span>
            <span className={`hidden sm:block w-[62px] text-right ${label}`}>Posts</span>
        </div>
    );
}

/**
 * The tab lists are threads, so they use the row a board uses. Mapped rather
 * than reshaped: this endpoint reports a single `updated_at`, which is both the
 * time shown and the activity column.
 */
function asThreadRow(t: ActiveThread): ThreadRowData & { category: { name: string; slug: string } | null } {
    return {
        id: t.id,
        title: t.title,
        slug: t.slug,
        posts_count: t.posts_count,
        created_at: t.updated_at,
        last_activity_at: t.updated_at,
        author: t.author ?? null,
        category: t.category ?? null,
    };
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
                <Image src="/images/page-hero.webp" alt="" fill priority unoptimized className="object-cover object-center" />
                <span aria-hidden className="absolute inset-0 bg-[radial-gradient(58%_120%_at_50%_45%,rgba(5,7,10,0.82),rgba(5,7,10,0.55)_72%)]" />
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--surface-0)] to-transparent" />

                <div className="relative z-10 container-page py-5 md:py-8 text-center">
                    <h1 className="font-display font-bold text-white tracking-tight leading-[0.95] text-[26px] md:text-[42px] uppercase">
                        <span className="text-white">Community </span>
                        <span className="text-[var(--accent)]">Forum</span>
                    </h1>

                    <p className="hidden md:block mt-2 max-w-[720px] mx-auto text-[13px] text-white/45">
                        Ask, argue, help and show off — {fmtStat(stats?.total_threads ?? 0)} threads across every board we run.
                    </p>

                    <div className="mt-4 md:mt-5 max-w-[640px] mx-auto relative group">
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

                    <div className="mt-4 flex flex-nowrap md:flex-wrap items-center justify-start md:justify-center gap-2 -mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto scrollbar-hide">
                        {[
                            { icon: Users2, value: stats?.online_users ?? 0, label: "Online" },
                            { icon: MessageSquare, value: stats?.total_threads ?? 0, label: "Threads" },
                            { icon: FileText, value: stats?.total_posts ?? 0, label: "Replies" },
                            { icon: Users, value: stats?.members ?? 0, label: "Members" },
                        ].map(({ icon: Icon, value, label }) => (
                            <span
                                key={label}
                                className="shrink-0 inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm"
                            >
                                <Icon className="w-3.5 h-3.5 text-[var(--accent)]" />
                                <span className="font-numeric text-[12px] text-white leading-none">
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
            <div className="container-page py-4 md:py-7">
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
                                    className="btn-command inline-flex h-10 items-center gap-2 bg-[var(--accent)] px-5 font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-white"
                                >
                                    <Plus className="h-3.5 w-3.5" strokeWidth={2} /> New thread
                                </Link>
                            )}
                        </div>

                        {/* all categories */}
                        {activeTab === "all" && (
                            <div className="space-y-5">
                                {categoriesLoading ? (
                                    <div className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)] divide-y divide-[var(--line)]">
                                        {[...Array(7)].map((_, i) => (
                                            <div key={i} className="flex items-center gap-3 px-3.5 py-3.5 animate-pulse">
                                                <span className="h-9 w-9 shrink-0 rounded-[var(--radius-inner)] bg-white/[0.05]" />
                                                <span className="flex-1 space-y-2">
                                                    <span className="block h-3 w-2/5 rounded bg-white/[0.05]" />
                                                    <span className="block h-2.5 w-1/3 rounded bg-white/[0.035]" />
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    categories?.map((parent) => {
                                        if (!parent.children?.length) return null;

                                        return (
                                            <div
                                                key={parent.id}
                                                className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)] overflow-hidden"
                                            >
                                                <BoardGroupHeader name={decodeHtml(parent.name)} mark={getCategoryIcon(parent.slug)} />
                                                <div className="divide-y divide-[var(--line)]">
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
                            !activeThreads ? (
                                <div className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)] divide-y divide-[var(--line)]">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex items-center gap-3 px-3.5 py-3.5 animate-pulse">
                                            <span className="h-8 w-8 shrink-0 rounded-[var(--radius-inner)] bg-white/[0.05]" />
                                            <span className="flex-1 space-y-2">
                                                <span className="block h-3 w-2/5 rounded bg-white/[0.05]" />
                                                <span className="block h-2.5 w-1/4 rounded bg-white/[0.035]" />
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : activeThreads.length === 0 ? (
                                <div className="rounded-[var(--radius-panel)] border border-dashed border-[var(--line-strong)] bg-[var(--surface-1)] px-5 py-10 text-center">
                                    <MessageCircle aria-hidden className="mx-auto h-7 w-7 text-white/12" strokeWidth={1.4} />
                                    <p className="mt-3 font-display text-[14px] font-bold text-white">Nothing posted yet</p>
                                    <p className="mt-1 text-[12.5px] text-[var(--ink-faint)]">New replies land here as they arrive.</p>
                                </div>
                            ) : (
                                <div className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)] overflow-hidden">
                                    <ThreadRowHeader showCategory />
                                    <div className="divide-y divide-[var(--line)]">
                                        {activeThreads.map((thread) => (
                                            <ThreadRow key={thread.id} thread={asThreadRow(thread)} showCategory />
                                        ))}
                                    </div>
                                </div>
                            )
                        )}

                        {/* unanswered */}
                        {activeTab === "unanswered" && (
                            !unansweredThreads ? (
                                <div className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)] divide-y divide-[var(--line)]">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex items-center gap-3 px-3.5 py-3.5 animate-pulse">
                                            <span className="h-8 w-8 shrink-0 rounded-[var(--radius-inner)] bg-white/[0.05]" />
                                            <span className="flex-1 space-y-2">
                                                <span className="block h-3 w-2/5 rounded bg-white/[0.05]" />
                                                <span className="block h-2.5 w-1/4 rounded bg-white/[0.035]" />
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : unansweredThreads.length === 0 ? (
                                <div className="rounded-[var(--radius-panel)] border border-dashed border-[var(--line-strong)] bg-[var(--surface-1)] px-5 py-10 text-center">
                                    <Clock aria-hidden className="mx-auto h-7 w-7 text-white/12" strokeWidth={1.4} />
                                    <p className="mt-3 font-display text-[14px] font-bold text-white">All caught up</p>
                                    <p className="mt-1 text-[12.5px] text-[var(--ink-faint)]">
                                        Every thread has at least one reply. Nice work, community.
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)] overflow-hidden">
                                    <ThreadRowHeader showCategory />
                                    <div className="divide-y divide-[var(--line)]">
                                        {unansweredThreads.map((thread) => (
                                            <ThreadRow key={thread.id} thread={asThreadRow(thread)} showCategory />
                                        ))}
                                    </div>
                                </div>
                            )
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
