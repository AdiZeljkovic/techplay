"use client";

import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import { MessageSquare, MessageCircle, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getAvatarSrc } from "@/lib/forum";
import Image from "next/image";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface GameThread {
    id: number;
    title: string;
    slug: string;
    posts_count: number;
    updated_at: string;
    author: { username: string; avatar_url?: string };
    category?: { name: string; slug: string };
}

export default function GameForumThreads({ gameSlug }: { gameSlug: string }) {
    const { data: threads, isLoading } = useSWR<GameThread[]>(`/games/${gameSlug}/threads`, fetcher);

    if (!isLoading && (!threads || threads.length === 0)) {
        return null;
    }

    return (
        <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 text-[var(--accent)]" />
                    Community Discussion
                </h2>
                <Link
                    href={`/forum/create?game=${gameSlug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--accent)] hover:underline"
                >
                    <Plus className="w-3.5 h-3.5" /> Start a Thread
                </Link>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-white/[0.04] rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {threads!.map((thread) => {
                        const avatarSrc = getAvatarSrc(thread.author?.avatar_url);
                        return (
                            <Link key={thread.id} href={`/forum/thread/${thread.slug}`} className="block">
                                <div className="flex items-center gap-3 bg-[#0D1117] border border-[#1A2030] rounded-xl p-4 hover:border-[var(--accent)]/30 transition-colors">
                                    <div className="w-9 h-9 rounded-full overflow-hidden bg-white/[0.03] flex-shrink-0">
                                        {avatarSrc ? (
                                            <Image src={avatarSrc} alt={thread.author?.username || ""} width={36} height={36} className="object-cover w-full h-full" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[var(--accent)]">
                                                {thread.author?.username?.charAt(0)?.toUpperCase() || "?"}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{thread.title}</p>
                                        <p className="text-xs text-white/40 mt-0.5">
                                            {thread.category?.name ?? "Forum"}
                                            {" · "}
                                            <span suppressHydrationWarning>
                                                {formatDistanceToNow(new Date(thread.updated_at), { addSuffix: true })}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-white/40 flex-shrink-0">
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        <span className="text-xs font-bold">{thread.posts_count}</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
