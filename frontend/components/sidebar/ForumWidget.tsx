"use client";

import Link from "next/link";
import { MessagesSquare, MessageCircle, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface ForumThread {
    id: number;
    title: string;
    slug: string;
    author: {
        username: string;
        display_name?: string;
    };
    posts_count: number;
}

export default function ForumWidget() {
    const [threads, setThreads] = useState<ForumThread[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchThreads() {
            try {
                let apiUrl = process.env.NEXT_PUBLIC_API_URL;
                if (apiUrl && apiUrl.includes('localhost')) {
                    apiUrl = apiUrl.replace('localhost', '127.0.0.1');
                }

                const res = await fetch(`${apiUrl}/forum/active`, {
                    next: { revalidate: 60 }
                });

                if (res.ok) {
                    const data = await res.json();
                    setThreads(data);
                }
            } catch (error) {
                console.error("Failed to load forum threads", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchThreads();
    }, []);

    if (isLoading) {
        return (
            <div className="bg-[#00215E] border border-white/10 rounded-2xl overflow-hidden shadow-lg animate-pulse h-64">
                <div className="p-4 border-b border-white/10">
                    <div className="h-4 w-32 bg-white/10 rounded" />
                </div>
            </div>
        );
    }

    if (threads.length === 0) {
        return null;
    }

    return (
        <div className="bg-[#00215E] border border-white/10 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold text-white text-sm uppercase tracking-wider">
                    <MessagesSquare className="w-4 h-4 text-[var(--accent)]" />
                    Active Discussions
                </h3>
            </div>

            <div className="divide-y divide-white/5">
                {threads.map((thread) => (
                    <Link
                        key={thread.id}
                        href={`/forum/thread/${thread.slug}`}
                        className="block p-4 hover:bg-white/5 transition-colors group"
                    >
                        <h4 className="text-sm font-semibold text-white/90 group-hover:text-[var(--accent)] transition-colors line-clamp-2 mb-2">
                            {thread.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-white/40">
                            <div className="flex items-center gap-1.5">
                                <UserIcon className="w-3 h-3" />
                                {thread.author?.display_name || thread.author?.username || 'User'}
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-full">
                                <MessageCircle className="w-3 h-3 text-[var(--accent)]" />
                                {thread.posts_count || 0}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <Link href="/forum" className="block py-3 text-center text-xs font-bold text-[var(--accent)] hover:text-white hover:bg-[var(--accent)] transition-all uppercase tracking-widest border-t border-white/5">
                Visit Forums
            </Link>
        </div>
    );
}
