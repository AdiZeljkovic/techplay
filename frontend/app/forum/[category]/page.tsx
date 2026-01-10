"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { MessageSquare, Lock, Pin, Eye, ArrowLeft, Plus, Clock, TrendingUp, Users, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import ForumSidebar from "@/components/forum/ForumSidebar";

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
        links: any[];
    };
}

const getCategoryColor = (slug: string) => {
    switch (slug) {
        case 'the-lounge': return '#8b5cf6';
        case 'general-chat': return '#3b82f6';
        case 'news-announcements': return '#ef4444';
        case 'hardware-tech': return '#10b981';
        case 'game-reviews': return '#f59e0b';
        case 'off-topic': return '#64748b';
        default: return '#3b82f6';
    }
};

export default function CategoryThreadsPage() {
    const params = useParams();
    const categorySlug = params.category as string;
    const { user } = useAuth();
    const color = getCategoryColor(categorySlug);

    const { data, isLoading } = useSWR<CategoryData>(
        categorySlug ? `/forum/categories/${categorySlug}` : null,
        fetcher
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)]">
                <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                    <div className="container mx-auto px-4 py-8">
                        <div className="animate-pulse space-y-4">
                            <div className="h-6 w-32 bg-[var(--bg-card)] rounded" />
                            <div className="h-10 w-64 bg-[var(--bg-card)] rounded" />
                        </div>
                    </div>
                </div>
                <div className="container mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-3 space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-20 bg-[var(--bg-card)] rounded-xl animate-pulse" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-4">
                <MessageSquare className="w-16 h-16 text-[var(--text-muted)]" />
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Category Not Found</h1>
                <Link href="/forum">
                    <Button>Back to Forums</Button>
                </Link>
            </div>
        );
    }

    const { category, threads } = data;
    const totalViews = threads.data.reduce((acc, t) => acc + t.view_count, 0);
    const totalReplies = threads.data.reduce((acc, t) => acc + (t.posts_count || 0), 0);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Hero Header */}
            <div className="relative bg-[var(--bg-secondary)] border-b border-[var(--border)] overflow-hidden">
                {/* Background Accent */}
                <div
                    className="absolute inset-0 opacity-5"
                    style={{ background: `linear-gradient(135deg, ${color} 0%, transparent 60%)` }}
                />

                <div className="container mx-auto px-4 py-8 relative z-10">
                    {/* Breadcrumb */}
                    <Link
                        href="/forum"
                        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Forums
                    </Link>

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        {/* Category Info */}
                        <div className="flex items-center gap-5">
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg transition-transform hover:scale-105"
                                style={{
                                    backgroundColor: color,
                                    color: '#ffffff',
                                    boxShadow: `0 8px 24px -4px ${color}50`
                                }}
                            >
                                {category.name?.charAt(0)?.toUpperCase() || '#'}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-1">{category.name}</h1>
                                {category.description && (
                                    <p className="text-[var(--text-secondary)] max-w-xl">{category.description}</p>
                                )}
                            </div>
                        </div>

                        {/* Action Button */}
                        {user && (
                            <Link href={`/forum/create?category=${category.slug}`}>
                                <Button className="shadow-lg shadow-[var(--accent)]/20">
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Thread
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Stats Bar */}
                    <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-[var(--border)]">
                        <div className="flex items-center gap-2 text-sm">
                            <MessageCircle className="w-4 h-4 text-[var(--accent)]" />
                            <span className="font-bold text-[var(--text-primary)]">{threads.data.length}</span>
                            <span className="text-[var(--text-muted)]">Threads</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <MessageSquare className="w-4 h-4 text-[var(--accent)]" />
                            <span className="font-bold text-[var(--text-primary)]">{totalReplies}</span>
                            <span className="text-[var(--text-muted)]">Replies</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Eye className="w-4 h-4 text-[var(--accent)]" />
                            <span className="font-bold text-[var(--text-primary)]">{totalViews}</span>
                            <span className="text-[var(--text-muted)]">Views</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Threads List */}
                    <div className="lg:col-span-3">
                        {threads.data.length > 0 ? (
                            <div className="space-y-3">
                                {/* Pinned threads first */}
                                {threads.data
                                    .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
                                    .map((thread) => {
                                        const isStaff = thread.author?.role === 'admin' || thread.author?.role === 'editor';
                                        return (
                                            <Link key={thread.id} href={`/forum/thread/${thread.slug}`}>
                                                <div className={`group relative bg-[var(--bg-card)] border rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer ${thread.is_pinned
                                                        ? 'border-[var(--accent)]/50 bg-[var(--accent)]/5'
                                                        : 'border-[var(--border)] hover:border-[var(--accent)]/50'
                                                    }`}>
                                                    <div className="flex items-center gap-4">
                                                        {/* Status Icon */}
                                                        <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all ${thread.is_pinned
                                                                ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30'
                                                                : thread.is_locked
                                                                    ? 'bg-red-500/10 text-red-400'
                                                                    : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] group-hover:bg-[var(--accent)]/10 group-hover:text-[var(--accent)]'
                                                            }`}>
                                                            {thread.is_pinned ? (
                                                                <Pin className="w-5 h-5" />
                                                            ) : thread.is_locked ? (
                                                                <Lock className="w-5 h-5" />
                                                            ) : (
                                                                <MessageSquare className="w-5 h-5" />
                                                            )}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                {thread.is_pinned && (
                                                                    <span className="text-[10px] uppercase font-bold bg-[var(--accent)] text-white px-2 py-0.5 rounded">Pinned</span>
                                                                )}
                                                                {thread.is_locked && (
                                                                    <span className="text-[10px] uppercase font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Locked</span>
                                                                )}
                                                                <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">
                                                                    {thread.title}
                                                                </h3>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className={`w-5 h-5 rounded-full overflow-hidden ${isStaff ? 'ring-1 ring-[var(--accent)]' : ''}`}>
                                                                        {thread.author?.avatar_url ? (
                                                                            <Image src={thread.author.avatar_url} alt={thread.author?.username || 'User'} width={20} height={20} className="object-cover" />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center bg-[var(--accent)] text-[8px] font-bold text-white">
                                                                                {thread.author?.username?.charAt(0)?.toUpperCase() || '?'}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <span className={`font-medium ${isStaff ? 'text-[var(--accent)]' : ''}`}>
                                                                        {thread.author?.username || 'Unknown'}
                                                                    </span>
                                                                </div>
                                                                <span className="hidden sm:inline">•</span>
                                                                <span className="hidden sm:flex items-center gap-1">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Stats */}
                                                        <div className="hidden md:flex items-center gap-4 text-center">
                                                            <div className="px-4 py-2 bg-[var(--bg-elevated)]/50 rounded-lg min-w-[70px]">
                                                                <div className="text-lg font-bold text-[var(--text-primary)]">{thread.posts_count || 0}</div>
                                                                <div className="text-[10px] uppercase text-[var(--text-muted)]">Replies</div>
                                                            </div>
                                                            <div className="px-4 py-2 bg-[var(--bg-elevated)]/50 rounded-lg min-w-[70px]">
                                                                <div className="text-lg font-bold text-[var(--text-primary)]">{thread.view_count}</div>
                                                                <div className="text-[10px] uppercase text-[var(--text-muted)]">Views</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
                                <div className="w-20 h-20 bg-[var(--bg-elevated)] rounded-full flex items-center justify-center mx-auto mb-6">
                                    <MessageSquare className="w-10 h-10 text-[var(--text-muted)]" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No threads yet</h3>
                                <p className="text-[var(--text-secondary)] mb-6">Be the first to start a discussion in this category!</p>
                                {user ? (
                                    <Link href={`/forum/create?category=${category.slug}`}>
                                        <Button className="shadow-lg shadow-[var(--accent)]/20">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Start the first discussion
                                        </Button>
                                    </Link>
                                ) : (
                                    <Link href="/login">
                                        <Button>Log in to post</Button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <ForumSidebar />
                    </div>
                </div>
            </div>
        </div>
    );
}
