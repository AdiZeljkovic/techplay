"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "@/lib/axios";
import { Search, Users2, MessageSquare, FileText, Users, CheckCheck } from "lucide-react";
import ForumSidebar from "@/components/forum/ForumSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useForumReads } from "@/hooks/useForumReads";
import { DisplayAd } from "@/components/ads/AdSense";
import { fmtStat } from "@/lib/forum";

/**
 * The forum's persistent frame.
 *
 * Nothing here reloaded before — clicking a board never fetched a new document
 * — but every page rebuilt its own opening and its own sidebar, so the whole
 * frame reassembled underneath you: the hero vanished, the content jumped up,
 * the rail remounted and refetched. Technically one window, visibly a new page
 * each time.
 *
 * A layout is the fix React already has. Everything in this file is mounted
 * once and *kept* across navigations between /forum, a board, a thread and
 * search — same DOM nodes, no refetch, no jump. Only the middle column swaps.
 *
 * Which is why the bar is a bar and not the old 300px hero: it is paid for on
 * every forum page now, so it has to be cheap. It carries the three things you
 * reach for from anywhere in a forum — the way back, the search, and the size
 * of the place.
 */

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface ForumStats {
    total_threads: number;
    total_posts: number;
    members: number;
    online_users: number;
}

export default function BoardsLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const { user } = useAuth();
    const { markAllRead } = useForumReads();
    const [query, setQuery] = useState("");

    // Fetched by the frame rather than by each page, so it is fetched once for
    // as long as the reader stays inside the forum.
    const { data: stats } = useSWR<ForumStats>("/forum/stats", fetcher);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const q = query.trim();
        if (q.length >= 3) router.push(`/forum/search?q=${encodeURIComponent(q)}`);
    };

    return (
        <div className="min-h-screen bg-[var(--surface-0)]">
            <section className="relative overflow-hidden border-b border-[var(--line)]">
                <Image src="/images/page-hero.webp" alt="" fill priority unoptimized className="object-cover object-center" />
                <span aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_140%_at_50%_40%,rgba(5,7,10,0.86),rgba(5,7,10,0.66)_75%)]" />

                <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3.5 md:px-6">
                    <Link href="/forum" className="group flex shrink-0 items-baseline gap-1.5">
                        <span className="font-display text-[17px] font-bold uppercase tracking-tight text-white transition-colors group-hover:text-[var(--accent-ink)]">
                            Community
                        </span>
                        <span className="font-display text-[17px] font-bold uppercase tracking-tight text-[var(--accent)]">
                            Forum
                        </span>
                    </Link>

                    <form role="search" onSubmit={submit} className="relative order-3 w-full min-w-0 md:order-none md:flex-1">
                        <label htmlFor="forum-bar-search" className="sr-only">Search the forum</label>
                        <Search
                            aria-hidden
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-faint)]"
                            strokeWidth={1.6}
                        />
                        <input
                            id="forum-bar-search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search threads, posts, people…"
                            className="h-10 w-full rounded-[var(--radius-card)] border border-[var(--line-strong)] bg-[color-mix(in_srgb,var(--surface-2)_82%,transparent)] pl-10 pr-3 text-[13px] text-white placeholder:text-[var(--ink-faint)] outline-none transition-colors focus:border-[color-mix(in_srgb,var(--accent)_60%,transparent)]"
                        />
                    </form>

                    {/* Dismissing everything belongs to the frame, not to any
                        one board: it is what you press on arriving, from
                        wherever you arrived. */}
                    {user && (
                        <button
                            type="button"
                            onClick={() => markAllRead()}
                            className="hidden shrink-0 items-center gap-1.5 text-[11px] font-medium text-[var(--ink-faint)] transition-colors hover:text-[var(--accent-ink)] sm:inline-flex"
                        >
                            <CheckCheck aria-hidden className="h-3.5 w-3.5" strokeWidth={1.7} />
                            Mark all read
                        </button>
                    )}

                    <div className="flex shrink-0 items-center gap-4 overflow-x-auto scrollbar-hide">
                        {[
                            { icon: Users2, value: stats?.online_users ?? 0, label: "Online" },
                            { icon: MessageSquare, value: stats?.total_threads ?? 0, label: "Threads" },
                            { icon: FileText, value: stats?.total_posts ?? 0, label: "Replies" },
                            { icon: Users, value: stats?.members ?? 0, label: "Members" },
                        ].map(({ icon: Icon, value, label }) => (
                            <span key={label} className="flex shrink-0 items-center gap-1.5">
                                <Icon aria-hidden className="h-3.5 w-3.5 text-[var(--accent)]" strokeWidth={1.7} />
                                <span className="font-numeric text-[12.5px] leading-none text-white">{fmtStat(value)}</span>
                                <span className="hidden font-display text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)] sm:inline">
                                    {label}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* The rail lives here, so it neither remounts nor refetches when the
                middle column changes. Below xl it stops being a column rather
                than squeezing the reading width. */}
            <div className="mx-auto w-full max-w-[1280px] px-4 pb-10 md:px-6">
                <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_324px]">
                    <div className="min-w-0">{children}</div>
                    <aside className="min-w-0 space-y-6 xl:sticky xl:top-24">
                        <ForumSidebar />

                        {/* It used to run on the thread page only. Threads are
                            reader-written, so nothing goes between the posts —
                            an ad dropped into a conversation reads as one of
                            the replies. Here it is beside them, on every board
                            page rather than one. */}
                        <DisplayAd />
                    </aside>
                </div>
            </div>
        </div>
    );
}
