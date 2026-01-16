"use client";

import { useEffect, useState, useCallback } from 'react';
import { getEcho } from '@/lib/echo';

interface ThreadAuthor {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
}

interface Thread {
    id: number;
    title: string;
    slug: string;
    content: string;
    category: {
        id: number;
        name: string;
        slug: string;
    } | null;
    author: ThreadAuthor;
    created_at: string;
}

interface ForumReply {
    id: number;
    thread_id: number;
    content: string;
    author: ThreadAuthor;
    created_at: string;
}

/**
 * Hook for real-time forum updates (new threads).
 */
export function useRealTimeForum(initialThreads: Thread[] = []) {
    const [threads, setThreads] = useState<Thread[]>(initialThreads);
    const [newCount, setNewCount] = useState(0);

    useEffect(() => {
        const echo = getEcho();
        if (!echo) return;

        const channel = echo.channel('forum');

        channel.listen('.thread.created', (data: Thread) => {
            console.log('📝 New forum thread:', data.title);

            setThreads(prev => {
                if (prev.some(t => t.id === data.id)) return prev;
                return [data, ...prev];
            });

            setNewCount(prev => prev + 1);
        });

        return () => echo.leaveChannel('forum');
    }, []);

    return { threads, newCount, setThreads };
}

/**
 * Hook for real-time thread replies.
 */
export function useRealTimeThreadReplies(threadId: number, initialReplies: ForumReply[] = []) {
    const [replies, setReplies] = useState<ForumReply[]>(initialReplies);
    const [newCount, setNewCount] = useState(0);

    useEffect(() => {
        const echo = getEcho();
        if (!echo || !threadId) return;

        const channelName = `forum.thread.${threadId}`;
        const channel = echo.channel(channelName);

        channel.listen('.reply.posted', (data: ForumReply) => {
            console.log('💬 New reply in thread:', data.content.substring(0, 50));

            setReplies(prev => {
                if (prev.some(r => r.id === data.id)) return prev;
                return [...prev, data];
            });

            setNewCount(prev => prev + 1);
        });

        return () => echo.leaveChannel(channelName);
    }, [threadId]);

    return { replies, newCount, setReplies };
}
