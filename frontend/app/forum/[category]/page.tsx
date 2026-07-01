"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { MessageSquare, Lock, Pin, Eye, ArrowLeft, Plus, Clock, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import ForumSidebar from "@/components/forum/ForumSidebar";
import ListingPagination from "@/components/ui/ListingPagination";
import { useRealTimeForum } from "@/hooks";
import { fmtStat, getCategoryColor, getCategoryIcon, getAvatarSrc } from "@/lib/forum";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface Thread {
    id: number;
    title: string;
    slug: string;
    is_pinned: boolean;
    is_locked: boolean;
    view_count: number;
    created_at: string;
    author: {
        username: string;
        avatar_url?: string;
        role?: string;
    };
    posts_count: number;
}

interface CategoryData {
    category: {
        id: number;
        name: string;
        slug: string;
        description?: string;
    };
    threads: {
        data: Thread[];
        current_page: number;
        last_page: number;
    };
}

export default function CategoryThreadsPage() {
    const params = useParams();
    const categorySlug = params.category as string;
    const { user } = useAuth();
    const color = getCategoryColor(categorySlug);
    const Icon = getCategoryIcon(categorySlug);
    const [page, setPage] = useState(1);

    const { data, isLoading } = useSWR<CategoryData>(
        categorySlug ? `/forum/categories/${categorySlug}?page=${page}` : null,
        fetcher
    );

    // Real-time forum hook — only surface newly-created threads on page 1
    const { threads: realtimeThreads } = useRealTimeForum([]);

    const fetchedThreads = data?.threads?.data || [];
    const categoryRealtimeThreads = page === 1
        ? realtimeThreads.filter((rt) =>
            rt.category?.slug === categorySlug && !fetchedThreads.some((f) => f.id === rt.id)
        )
        : [];
    const allThreads = [...categoryRealtimeThreads, ...fetchedThreads] as Thread[];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#060810]">
                <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-8">
                    <div className="animate-pulse space-y-4 mb-8">
                        <div className="h-6 w-32 bg-[#0D1117] rounded" />
                        <div className="h-16 w-full bg-[#0D1117] rounded-2xl" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-3 space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-20 bg-[#0D1117] border border-[#1A2030] rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-[#060810] flex flex-col items-center justify-center gap-4">
                <MessageSquare className="w-16 h-16 text-[#3F3F46]" />
                <h1 className="text-2xl font-bold text-white">Category Not Found</h1>
                <Link href="/forum" className="inline-flex items-center gap-2 h-[42px] px-5 bg-tp-accent hover:bg-tp-accent/90 text-white font-bold rounded-lg transition-colors uppercase tracking-[0.08em] text-[12px]">
                    Back to Forums
                </Link>
            </div>
        );
    }

    const { category, threads } = data;
    const totalViews = threads.data.reduce((acc, t) => acc + t.view_count, 0);
    const totalReplies = threads.data.reduce((acc, t) => acc + (t.posts_count || 0), 0);

    return (
        <div className="min-h-screen bg-[#060810]">
            {/* Header */}
            <div className="relative bg-[#0B0E1A] border-b border-[#1A2030] overflow-hidden">
                <div
                    className="absolute inset-0 opacity-10"
                    style={{ background: `linear-gradient(135deg, ${color} 0%, transparent 60%)` }}
                />

                <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-8 relative z-10">
                    <Link
                        href="/forum"
                        className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-tp-accent transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Forums
                    </Link>

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div
                                className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center"
                                style={{
                                    background: `linear-gradient(135deg, ${color}ee 0%, ${color}77 100%)`,
                                    boxShadow: `0 8px 24px -4px ${color}50`,
                                }}
                            >
                                <Icon className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-1">{category.name}</h1>
                                {category.description && (
                                    <p className="text-[#9CA3AF] max-w-xl">{category.description}</p>
                                )}
                            </div>
                        </div>

                        {user && (
                            <Link href={`/forum/create?category=${category.slug}`} className="inline-flex items-center gap-2 h-[42px] px-5 bg-tp-accent hover:bg-tp-accent/90 text-white font-bold rounded-lg transition-colors uppercase tracking-[0.08em] text-[12px] shadow-lg shadow-tp-accent/20">
                                <Plus className="w-4 h-4" />
                                New Thread
                            </Link>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-[#1A2030]">
                        <div className="flex items-center gap-2 text-sm">
                            <MessageCircle className="w-4 h-4 text-tp-accent" />
                            <span className="font-bold text-white">{fmtStat(threads.data.length)}</span>
                            <span className="text-[#6B7280]">Threads</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <MessageSquare className="w-4 h-4 text-tp-accent" />
                            <span className="font-bold text-white">{fmtStat(totalReplies)}</span>
                            <span className="text-[#6B7280]">Replies</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Eye className="w-4 h-4 text-tp-accent" />
                            <span className="font-bold text-white">{fmtStat(totalViews)}</span>
                            <span className="text-[#6B7280]">Views</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3">
                        {allThreads.length > 0 ? (
                            <div className="space-y-3">
                                {allThreads
                                    .slice()
                                    .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
                                    .map((thread) => {
                                        const isStaff = thread.author?.role === "admin" || thread.author?.role === "editor";
                                        const avatarSrc = getAvatarSrc(thread.author?.avatar_url);
                                        return (
                                            <Link key={thread.id} href={`/forum/thread/${thread.slug}`} className="block">
                                                <div className={`group relative bg-[#0D1117] border rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:border-tp-accent/30 ${
                                                    thread.is_pinned ? "border-tp-accent/40" : "border-[#1A2030]"
                                                }`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                                                            thread.is_pinned
                                                                ? "bg-tp-accent text-white shadow-lg shadow-tp-accent/30"
                                                                : thread.is_locked
                                                                    ? "bg-red-500/10 text-red-400"
                                                                    : "bg-white/[0.03] text-[#6B7280] group-hover:bg-tp-accent/10 group-hover:text-tp-accent"
                                                        }`}>
                                                            {thread.is_pinned ? (
                                                                <Pin className="w-5 h-5" />
                                                            ) : thread.is_locked ? (
                                                                <Lock className="w-5 h-5" />
                                                            ) : (
                                                                <MessageSquare className="w-5 h-5" />
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                {thread.is_pinned && (
                                                                    <span className="text-[10px] uppercase font-bold bg-tp-accent text-white px-2 py-0.5 rounded-full">Pinned</span>
                                                                )}
                                                                {thread.is_locked && (
                                                                    <span className="text-[10px] uppercase font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Locked</span>
                                                                )}
                                                                <h3 className="text-base font-semibold text-white group-hover:text-tp-accent transition-colors truncate">
                                                                    {thread.title}
                                                                </h3>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-sm text-[#6B7280]">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className={`w-5 h-5 rounded-full overflow-hidden flex-shrink-0 ${isStaff ? "ring-1 ring-tp-accent" : ""}`}>
                                                                        {avatarSrc ? (
                                                                            <Image src={avatarSrc} alt={thread.author?.username || "User"} width={20} height={20} className="object-cover w-full h-full" />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center bg-tp-accent text-[8px] font-bold text-white">
                                                                                {thread.author?.username?.charAt(0)?.toUpperCase() || "?"}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <span className={`font-medium ${isStaff ? "text-tp-accent" : ""}`}>
                                                                        {thread.author?.username || "Unknown"}
                                                                    </span>
                                                                </div>
                                                                <span className="hidden sm:inline">&middot;</span>
                                                                <span className="hidden sm:flex items-center gap-1" suppressHydrationWarning>
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="hidden md:flex items-center gap-4 text-center">
                                                            <div className="px-4 py-2 bg-white/[0.02] rounded-xl min-w-[70px]">
                                                                <div className="text-lg font-bold text-white">{fmtStat(thread.posts_count || 0)}</div>
                                                                <div className="text-[10px] uppercase text-[#6B7280]">Replies</div>
                                                            </div>
                                                            <div className="px-4 py-2 bg-white/[0.02] rounded-xl min-w-[70px]">
                                                                <div className="text-lg font-bold text-white">{fmtStat(thread.view_count)}</div>
                                                                <div className="text-[10px] uppercase text-[#6B7280]">Views</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-[#0D1117] border border-[#1A2030] rounded-2xl">
                                <div className="w-20 h-20 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-6">
                                    <MessageSquare className="w-10 h-10 text-[#3F3F46]" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">No threads yet</h3>
                                <p className="text-[#9CA3AF] mb-6">Be the first to start a discussion in this category!</p>
                                {user ? (
                                    <Link href={`/forum/create?category=${category.slug}`} className="inline-flex items-center gap-2 h-[42px] px-5 bg-tp-accent hover:bg-tp-accent/90 text-white font-bold rounded-lg transition-colors uppercase tracking-[0.08em] text-[12px] shadow-lg shadow-tp-accent/20">
                                        <Plus className="w-4 h-4" />
                                        Start the first discussion
                                    </Link>
                                ) : (
                                    <Link href="/login" className="inline-flex items-center gap-2 h-[42px] px-5 bg-tp-accent hover:bg-tp-accent/90 text-white font-bold rounded-lg transition-colors uppercase tracking-[0.08em] text-[12px]">
                                        Log in to post
                                    </Link>
                                )}
                            </div>
                        )}

                        {threads.last_page > 1 && (
                            <div className="mt-8">
                                <ListingPagination
                                    page={threads.current_page}
                                    lastPage={threads.last_page}
                                    onPrev={() => setPage((p) => Math.max(1, p - 1))}
                                    onNext={() => setPage((p) => p + 1)}
                                    prevDisabled={threads.current_page === 1}
                                    nextDisabled={threads.current_page >= threads.last_page}
                                />
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-1">
                        <ForumSidebar />
                    </div>
                </div>
            </div>
        </div>
    );
}
