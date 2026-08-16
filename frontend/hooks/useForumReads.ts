"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";

/**
 * Which threads this reader has already seen.
 *
 * The boards themselves are cached and served to everybody from one entry, so
 * unread marks cannot travel in that payload — one reader's would become the
 * next reader's. They arrive separately, once, and the rows decide for
 * themselves whether to look new.
 *
 * Deliberately not blocking: a board renders the moment its threads land, and
 * gains its marks when this does. A signed-out visitor never asks at all.
 */

interface ReadState {
    /** Everything older than this is read, whatever the map says. */
    watermark: string | null;
    /** thread id → when it was last opened. */
    threads: Record<string, string>;
}

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

export function useForumReads() {
    const { user } = useAuth();

    const { data, mutate } = useSWR<ReadState>(
        user ? "/forum/reads" : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    /**
     * A thread is unread when it has moved since the last time this reader
     * either opened it or dismissed everything.
     */
    const isUnread = (threadId: number, lastActivity?: string | null): boolean => {
        if (!user || !data || !lastActivity) return false;

        const activity = new Date(lastActivity).getTime();
        if (Number.isNaN(activity)) return false;

        const seen = data.threads?.[String(threadId)];
        if (seen) return activity > new Date(seen).getTime();

        if (data.watermark) return activity > new Date(data.watermark).getTime();

        // Never read, never dismissed: genuinely new to this reader.
        return true;
    };

    const markThreadRead = async (slug: string, threadId: number) => {
        if (!user) return;

        // Optimistic: the row should stop being bold the moment you open it,
        // not a round trip later.
        await mutate(
            async (current) => {
                await axios.post(`/forum/threads/${slug}/read`).catch(() => null);
                return {
                    watermark: current?.watermark ?? null,
                    threads: { ...(current?.threads ?? {}), [String(threadId)]: new Date().toISOString() },
                };
            },
            {
                optimisticData: (current) => ({
                    watermark: current?.watermark ?? null,
                    threads: { ...(current?.threads ?? {}), [String(threadId)]: new Date().toISOString() },
                }),
                revalidate: false,
            }
        );
    };

    const markAllRead = async () => {
        if (!user) return;

        await mutate(
            async () => {
                const res = await axios.post("/forum/reads/all");
                return { watermark: res.data.watermark, threads: {} };
            },
            {
                optimisticData: { watermark: new Date().toISOString(), threads: {} },
                revalidate: false,
            }
        );
    };

    return { isUnread, markThreadRead, markAllRead, ready: Boolean(data) };
}
