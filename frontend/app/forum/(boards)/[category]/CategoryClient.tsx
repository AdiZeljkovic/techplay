"use client";

import { Suspense, useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { MessageSquare, Plus, ScrollText, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ForumShell from "@/components/forum/ForumShell";
import ThreadRow, { ThreadRowHeader, type ThreadRowData } from "@/components/forum/ThreadRow";
import ListingPagination from "@/components/ui/ListingPagination";
import { useRealTimeForum } from "@/hooks";
import { useForumReads } from "@/hooks/useForumReads";
import { decodeHtml } from "@/lib/decode";
import { fmtStat, getCategoryIcon } from "@/lib/forum";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface Thread extends ThreadRowData {
    tags?: { name: string; slug: string }[];
}

export interface CategoryData {
    category: {
        id: number;
        name: string;
        slug: string;
        description?: string;
        rules?: string;
        threads_count?: number;
        posts_count?: number;
        views_total?: number;
    };
    threads: {
        data: Thread[];
        current_page: number;
        last_page: number;
        total?: number;
    };
}

function CategoryThreadsPageInner({ initial }: { initial: CategoryData | null }) {
    const params = useParams();
    const searchParams = useSearchParams();
    const categorySlug = params.category as string;
    const { user } = useAuth();
    const Icon = getCategoryIcon(categorySlug);
    const [page, setPage] = useState(1);
    const [activeTag, setActiveTag] = useState<string | null>(searchParams.get("tag"));
    const [showRules, setShowRules] = useState(false);

    /**
     * The first page arrives already rendered.
     *
     * `fallbackData` is what the server fetched, so the board's rows are in the
     * HTML — for a reader that means no skeleton on arrival, and for a crawler
     * it means the thread titles exist at all. It only applies to the first
     * page with no tag filter, because that is the only request the server
     * made; anything else is a genuine fetch.
     *
     * Absent for a private board: the server fetch is unauthenticated and gets
     * a 404 there, which is correct — those pages should not be in HTML — so
     * the client fetches them with the reader's token instead.
     */
    const isInitialView = page === 1 && !activeTag;
    const { data, isLoading } = useSWR<CategoryData>(
        categorySlug ? `/forum/categories/${categorySlug}?page=${page}${activeTag ? `&tag=${activeTag}` : ""}` : null,
        fetcher,
        isInitialView && initial ? { fallbackData: initial } : undefined
    );

    // Real-time forum hook — only surface newly-created threads on page 1
    const { threads: realtimeThreads } = useRealTimeForum([]);
    const { isUnread } = useForumReads();

    const fetchedThreads = data?.threads?.data || [];
    const categoryRealtimeThreads = page === 1
        ? realtimeThreads.filter((rt) =>
            rt.category?.slug === categorySlug && !fetchedThreads.some((f) => f.id === rt.id)
        )
        : [];
    const allThreads = [...categoryRealtimeThreads, ...fetchedThreads] as Thread[];

    if (isLoading) {
        return (
            <ForumShell crumbs={[{ label: "Forum", href: "/forum" }]} title="Loading board…">
                <div className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)] divide-y divide-[var(--line)]">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-3 px-3.5 py-3.5 animate-pulse">
                            <span className="h-8 w-8 shrink-0 rounded-[var(--radius-inner)] bg-white/[0.05]" />
                            <span className="flex-1 space-y-2">
                                <span className="block h-3 w-2/5 rounded bg-white/[0.05]" />
                                <span className="block h-2.5 w-1/4 rounded bg-white/[0.035]" />
                            </span>
                        </div>
                    ))}
                </div>
            </ForumShell>
        );
    }

    if (!data) {
        return (
            <ForumShell crumbs={[{ label: "Forum", href: "/forum" }]} title="Board not found">
                <div className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)] px-5 py-10 text-center">
                    <MessageSquare aria-hidden className="mx-auto h-8 w-8 text-white/12" />
                    <p className="mt-3 text-[13px] text-[var(--ink-low)]">
                        This board does not exist, or it was renamed.
                    </p>
                    <Link
                        href="/forum"
                        className="btn-command mt-4 inline-flex h-9 items-center px-4 bg-[var(--accent)] font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-white"
                    >
                        All boards
                    </Link>
                </div>
            </ForumShell>
        );
    }

    const { category, threads } = data;

    const sorted = allThreads
        .slice()
        .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));

    return (
        <ForumShell
            crumbs={[{ label: "Forum", href: "/forum" }, { label: decodeHtml(category.name) }]}
            title={decodeHtml(category.name)}
            description={category.description ? decodeHtml(category.description) : undefined}
            mark={Icon}
            /* These used to be summed from the twenty rows on screen, so a
               board of a hundred threads said it had twenty, and its replies
               and views changed as you paged. They are the board's own totals
               now, counted by the API. */
            stats={[
                { label: "Threads", value: fmtStat(category.threads_count ?? 0) },
                { label: "Replies", value: fmtStat(category.posts_count ?? 0) },
                { label: "Views", value: fmtStat(category.views_total ?? 0) },
            ]}
            action={
                user ? (
                    <Link
                        href={`/forum/create?category=${category.slug}`}
                        className="btn-command inline-flex h-9 items-center gap-2 px-4 bg-[var(--accent)] font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-white"
                    >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2} /> New thread
                    </Link>
                ) : null
            }
        >
            {category.rules && (
                <div className="mb-4">
                    <button
                        onClick={() => setShowRules((v) => !v)}
                        aria-expanded={showRules}
                        className="inline-flex items-center gap-2 text-[11.5px] font-medium text-[var(--ink-low)] hover:text-[var(--accent-ink)] transition-colors"
                    >
                        <ScrollText className="h-3.5 w-3.5" strokeWidth={1.6} />
                        Board rules
                    </button>
                    {showRules && (
                        <p className="mt-2 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-1)] px-3.5 py-3 text-[12.5px] leading-relaxed text-[var(--ink-mid)]">
                            {decodeHtml(category.rules)}
                        </p>
                    )}
                </div>
            )}

            {activeTag && (
                <div className="mb-3 flex items-center gap-2 text-[11.5px] text-[var(--ink-faint)]">
                    Filtered by
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--accent-ink)]">
                        {activeTag}
                        <button onClick={() => { setActiveTag(null); setPage(1); }} aria-label="Clear tag filter">
                            <X className="h-3 w-3" />
                        </button>
                    </span>
                </div>
            )}

            {sorted.length > 0 ? (
                <>
                    <div className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)] overflow-hidden">
                        <ThreadRowHeader />
                        <div className="divide-y divide-[var(--line)]">
                            {sorted.map((thread) => (
                                <ThreadRow
                                    key={thread.id}
                                    thread={thread}
                                    unread={isUnread(thread.id, thread.last_activity_at || thread.created_at)}
                                />
                            ))}
                        </div>
                    </div>

                    {threads.last_page > 1 && (
                        <div className="mt-5">
                            <ListingPagination
                                page={threads.current_page}
                                lastPage={threads.last_page}
                                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                                onNext={() => setPage((p) => Math.min(threads.last_page, p + 1))}
                                prevDisabled={threads.current_page <= 1}
                                nextDisabled={threads.current_page >= threads.last_page}
                            />
                        </div>
                    )}
                </>
            ) : (
                /* An empty board used to be seven hundred pixels of nothing beside
                   a full sidebar. If there is nothing here, the page should say so
                   and offer the one thing that fixes it. */
                <div className="rounded-[var(--radius-panel)] border border-dashed border-[var(--line-strong)] bg-[var(--surface-1)] px-5 py-10 text-center">
                    <MessageSquare aria-hidden className="mx-auto h-7 w-7 text-white/12" strokeWidth={1.4} />
                    <p className="mt-3 font-display text-[14px] font-bold text-white">
                        {activeTag ? "Nothing under that tag yet" : "No threads here yet"}
                    </p>
                    <p className="mt-1 text-[12.5px] text-[var(--ink-faint)]">
                        {activeTag ? "Try clearing the filter." : "Be the first to start one."}
                    </p>
                    {user && !activeTag && (
                        <Link
                            href={`/forum/create?category=${category.slug}`}
                            className="btn-command mt-4 inline-flex h-9 items-center gap-2 px-4 bg-[var(--accent)] font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-white"
                        >
                            <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Start a thread
                        </Link>
                    )}
                </div>
            )}
        </ForumShell>
    );
}

export default function CategoryClient({ initial }: { initial: CategoryData | null }) {
    return (
        <Suspense fallback={null}>
            <CategoryThreadsPageInner initial={initial} />
        </Suspense>
    );
}
