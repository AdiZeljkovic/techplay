"use client";

import Link from "next/link";
import Image from "next/image";
import { Lock, MessageSquare, Pin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { decodeHtml } from "@/lib/decode";
import { fmtStat, getAvatarSrc } from "@/lib/forum";
import { isOwnUpload } from "@/lib/imageUrl";

/**
 * One thread, as a row.
 *
 * What this replaces put the counts in two bordered boxes on the right — a
 * hundred and thirty pixels of chrome to say "0" twice — and gave the row no
 * column headers to explain them. A forum list is a table people scan, so the
 * numbers are text in a fixed column, the state lives at the left edge where
 * the eye starts, and the last activity is the thing on the right, because that
 * is what tells you whether a thread is alive.
 */

export interface ThreadRowData {
    id: number;
    title: string;
    slug: string;
    is_pinned?: boolean;
    is_locked?: boolean;
    view_count?: number;
    posts_count?: number;
    created_at: string;
    last_activity_at?: string | null;
    author?: {
        username: string;
        avatar_url?: string | null;
        post_color?: string | null;
    } | null;
    category?: { name: string; slug: string } | null;
}

function when(value?: string | null): string {
    if (!value) return "";
    try {
        return formatDistanceToNow(new Date(value), { addSuffix: true });
    } catch {
        return "";
    }
}

export default function ThreadRow({
    thread,
    showCategory = false,
    unread = false,
}: {
    thread: ThreadRowData;
    showCategory?: boolean;
    /** Has moved since this reader last opened it, or dismissed everything. */
    unread?: boolean;
}) {
    const avatar = getAvatarSrc(thread.author?.avatar_url ?? undefined);
    const replies = thread.posts_count ?? 0;
    const activity = thread.last_activity_at || thread.created_at;

    return (
        <Link
            href={`/forum/thread/${thread.slug}`}
            className="group flex items-center gap-3 px-3.5 py-3 hover:bg-white/[0.025] transition-colors"
        >
            {/* State first: pinned and locked change how you read everything else.
                Unread outranks both — it is the reason you came back. */}
            <span
                className={`hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-inner)] border ${
                    unread
                        ? "border-[color-mix(in_srgb,var(--accent)_45%,transparent)] bg-[var(--accent-soft)]"
                        : "border-[var(--line)] bg-[var(--surface-2)]"
                }`}
            >
                {thread.is_pinned ? (
                    <Pin aria-label="Pinned" className={`h-[15px] w-[15px] ${unread ? "text-[var(--accent)]" : "text-[var(--accent)]"}`} strokeWidth={1.6} />
                ) : thread.is_locked ? (
                    <Lock aria-label="Locked" className={`h-[15px] w-[15px] ${unread ? "text-[var(--accent)]" : "text-[var(--ink-faint)]"}`} strokeWidth={1.6} />
                ) : (
                    <MessageSquare
                        aria-hidden
                        className={`h-[15px] w-[15px] ${unread ? "text-[var(--accent)]" : "text-[var(--ink-faint)]"}`}
                        strokeWidth={unread ? 2 : 1.6}
                    />
                )}
            </span>

            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                    {/* Titles arrive HTML-escaped; printed raw, an ampersand reads
                        as "&amp;" — which it did, on this row and in search. */}
                    <span className={`truncate font-display text-[14px] transition-colors group-hover:text-[var(--accent-ink)] ${unread ? "font-bold text-white" : "font-medium text-[var(--ink-mid)]"}`}>
                        {decodeHtml(thread.title)}
                    </span>
                    {unread && (
                        <span
                            className="shrink-0 rounded-full bg-[var(--accent)] px-1.5 py-[1px] font-display text-[8.5px] font-bold uppercase tracking-[0.1em] text-white"
                            title="New since your last visit"
                        >
                            New
                        </span>
                    )}
                    {thread.is_locked && !thread.is_pinned && (
                        <Lock aria-label="Locked" className="h-3 w-3 shrink-0 text-[var(--ink-faint)]" />
                    )}
                </span>

                <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-[var(--ink-faint)]">
                    {avatar && (
                        <Image
                            src={avatar}
                            alt=""
                            aria-hidden
                            width={16}
                            height={16}
                            unoptimized={!isOwnUpload(avatar)}
                            className="h-4 w-4 rounded-full object-cover"
                        />
                    )}
                    {thread.author?.username && (
                        <span className="font-medium text-[var(--ink-low)]">{thread.author.username}</span>
                    )}
                    {showCategory && thread.category?.name && (
                        <>
                            <span aria-hidden>·</span>
                            <span>{thread.category.name}</span>
                        </>
                    )}
                    <span aria-hidden>·</span>
                    <span>{when(thread.created_at)}</span>
                </span>
            </span>

            {/* Fixed columns so the numbers line up down the list. */}
            <span className="hidden sm:flex shrink-0 items-baseline gap-1 w-[74px] justify-end">
                <span className="font-numeric text-[13px] text-[var(--ink-mid)]">{fmtStat(replies)}</span>
                <span className="text-[10.5px] text-[var(--ink-faint)]">{replies === 1 ? "reply" : "replies"}</span>
            </span>

            <span className="hidden md:block shrink-0 w-[104px] text-right text-[11.5px] text-[var(--ink-faint)]">
                {when(activity)}
            </span>
        </Link>
    );
}

/** The header the rows are counted under. Stated once, not per row. */
export function ThreadRowHeader({ showCategory = false }: { showCategory?: boolean }) {
    return (
        <div className="flex items-center gap-3 border-b border-[var(--line)] px-3.5 py-2">
            <span className="hidden sm:block h-8 w-8 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1 font-display text-[9.5px] font-bold uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                {showCategory ? "Thread and board" : "Thread"}
            </span>
            <span className="hidden sm:block shrink-0 w-[74px] text-right font-display text-[9.5px] font-bold uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                Replies
            </span>
            <span className="hidden md:block shrink-0 w-[104px] text-right font-display text-[9.5px] font-bold uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                Activity
            </span>
        </div>
    );
}
