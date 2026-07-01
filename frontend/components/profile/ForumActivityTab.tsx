"use client";

import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import { Bell, Bookmark, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import SectionCard from "./dashboard/SectionCard";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface ForumThreadSummary {
    id: number;
    title: string;
    slug: string;
    posts_count: number;
    updated_at: string;
    category?: { name: string; slug: string };
}

interface Props {
    isOwnProfile: boolean;
}

function ThreadList({ threads }: { threads: ForumThreadSummary[] }) {
    if (threads.length === 0) {
        return <p className="text-[13px] text-white/40 py-4">Nothing here yet.</p>;
    }

    return (
        <div className="divide-y divide-white/[0.06]">
            {threads.map((thread) => (
                <Link key={thread.id} href={`/forum/thread/${thread.slug}`} className="block py-3 group">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[13px] font-bold text-white truncate group-hover:text-[var(--accent)] transition-colors">
                                {thread.title}
                            </p>
                            <p className="text-[11px] text-white/40 mt-0.5">
                                {thread.category?.name ?? "Forum"}
                                {" · "}
                                <span suppressHydrationWarning>
                                    {formatDistanceToNow(new Date(thread.updated_at), { addSuffix: true })}
                                </span>
                            </p>
                        </div>
                        <div className="flex items-center gap-1 text-white/40 flex-shrink-0">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold">{thread.posts_count}</span>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}

export default function ForumActivityTab({ isOwnProfile }: Props) {
    const { data: watched, isLoading: watchedLoading } = useSWR<ForumThreadSummary[]>(
        isOwnProfile ? "/user/watched-threads" : null,
        fetcher
    );
    const { data: bookmarked, isLoading: bookmarkedLoading } = useSWR<ForumThreadSummary[]>(
        isOwnProfile ? "/user/bookmarked-threads" : null,
        fetcher
    );

    if (!isOwnProfile) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <MessageCircle className="w-8 h-8 text-white/20 mb-3" />
                <p className="text-[13px] text-white/40">Forum activity is only visible to the profile owner.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SectionCard title="Watched Threads" icon={<Bell className="w-4 h-4 text-[var(--accent)]" />}>
                {watchedLoading ? (
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-12 bg-white/[0.04] rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <ThreadList threads={watched ?? []} />
                )}
            </SectionCard>

            <SectionCard title="Saved Threads" icon={<Bookmark className="w-4 h-4 text-[var(--accent)]" />}>
                {bookmarkedLoading ? (
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-12 bg-white/[0.04] rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <ThreadList threads={bookmarked ?? []} />
                )}
            </SectionCard>
        </div>
    );
}
