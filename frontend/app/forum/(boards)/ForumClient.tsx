"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, LayoutGrid, Sparkles, HelpCircle, Clock, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useForumReads } from "@/hooks/useForumReads";
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
    const { isUnread } = useForumReads();
    const [activeTab, setActiveTab] = useState<TabType>("all");

    const { data: categories, isLoading: categoriesLoading } = useSWR<ForumCategory[]>("/forum/categories", fetcher);
    const { data: activeThreads } = useSWR<ActiveThread[]>("/forum/active", fetcher);
    const { data: unansweredThreads } = useSWR<ActiveThread[]>("/forum/unanswered", fetcher);

    /* The hero that used to open this page — title, search, four stat chips —
       is now the boards layout's bar, where it survives a click into a board
       instead of vanishing. What is left here is only what belongs to the
       index itself: the view switcher and the boards. */
    return (
        <div className="py-5">
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
                                            <ThreadRow
                                                key={thread.id}
                                                thread={asThreadRow(thread)}
                                                showCategory
                                                unread={isUnread(thread.id, thread.updated_at)}
                                            />
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
                                            <ThreadRow
                                                key={thread.id}
                                                thread={asThreadRow(thread)}
                                                showCategory
                                                unread={isUnread(thread.id, thread.updated_at)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )
                        )}
        </div>
    );
}
