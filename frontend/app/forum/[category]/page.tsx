"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MessageSquare, Lock, Pin, Eye, MessageCircle, ArrowLeft, Plus } from "lucide-react";
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
    };
    posts_count: number;
}

interface CategoryData {
    category: {
        id: number;
        name: string;
        slug: string;
        description?: string;
        // color: string; // Not in DB
    };
    threads: {
        data: Thread[];
        links: any[];
    };
}

const getCategoryColor = (slug: string) => {
    switch (slug) {
        case 'news-announcements': return '#3b82f6';
        case 'general-gaming': return '#8b5cf6';
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
                <div className="container mx-auto px-4 py-24">
                    <div className="h-64 bg-[var(--bg-card)] rounded-xl animate-pulse" />
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-4">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Category Not Found</h1>
                <Link href="/forum">
                    <Button>Back to Forums</Button>
                </Link>
            </div>
        );
    }

    const { category, threads } = data;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">

            {/* Header */}
            <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <div className="container mx-auto px-4 py-6">
                    <Link
                        href="/forum"
                        className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Forums
                    </Link>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl"
                                style={{ backgroundColor: `${color}20`, color: color }}
                            >
                                {category.name?.charAt(0) || '#'}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[var(--text-primary)]">{category.name}</h1>
                                {category.description && (
                                    <p className="text-sm text-[var(--text-secondary)]">{category.description}</p>
                                )}
                            </div>
                        </div>

                        {user ? (
                            <Link href={`/forum/create?category=${category.slug}`}>
                                <Button>
                                    <Plus className="w-4 h-4" />
                                    New Thread
                                </Button>
                            </Link>
                        ) : (
                            <Link href="/login">
                                <Button variant="outline">
                                    Log in to Post
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Content & Sidebar */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {threads.data.length > 0 ? (
                            <div className="space-y-3">
                                {threads.data.map((thread) => (
                                    <div
                                        key={thread.id}
                                        className={`group relative bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 transition-all hover:border-[var(--accent)] hover:shadow-md ${thread.is_pinned ? 'bg-[var(--bg-elevated)]/50 border-l-4 border-l-[var(--accent)]' : ''}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Icon/Status Column */}
                                            <div className="flex-shrink-0 flex flex-col items-center gap-2 min-w-[40px]">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${thread.is_pinned ? 'bg-[var(--accent)] text-white shadow-[0_0_10px_var(--accent)]' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] group-hover:bg-[var(--bg-elevated)]'}`}>
                                                    {thread.is_pinned ? (
                                                        <Pin className="w-5 h-5 rotate-45" />
                                                    ) : thread.is_locked ? (
                                                        <Lock className="w-5 h-5 text-red-500" />
                                                    ) : (
                                                        <MessageSquare className="w-5 h-5" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Main Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {thread.is_pinned && (
                                                        <span className="text-[10px] uppercase font-bold bg-[var(--accent)] text-white px-2 py-0.5 rounded-full">Pinned</span>
                                                    )}
                                                    <Link
                                                        href={`/forum/thread/${thread.slug}`}
                                                        className="text-lg font-bold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors truncate block"
                                                    >
                                                        {thread.title}
                                                    </Link>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-5 h-5 rounded-full bg-[var(--bg-secondary)] overflow-hidden border border-[var(--border)]">
                                                            {thread.author?.avatar_url ? (
                                                                <img src={thread.author.avatar_url} alt={thread.author?.username || 'User'} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-[var(--accent)] text-[8px] font-bold text-white">
                                                                    {thread.author?.username?.charAt(0) || '?'}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="font-medium hover:text-[var(--text-primary)] transition-colors">{thread.author?.username || 'Unknown'}</span>
                                                    </div>
                                                    <span className="text-[var(--text-muted)]">•</span>
                                                    <span className="text-[var(--text-muted)]">
                                                        {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Stats (Hidden on mobile) */}
                                            <div className="hidden md:flex items-center gap-6 px-4 border-l border-[var(--border)] border-r mx-2">
                                                <div className="text-center w-16">
                                                    <div className="text-lg font-bold text-[var(--text-primary)]">{thread.posts_count}</div>
                                                    <div className="text-[10px] uppercase text-[var(--text-muted)]">Replies</div>
                                                </div>
                                                <div className="text-center w-16">
                                                    <div className="text-lg font-bold text-[var(--text-primary)]">{thread.view_count}</div>
                                                    <div className="text-[10px] uppercase text-[var(--text-muted)]">Views</div>
                                                </div>
                                            </div>

                                            {/* Last Activity (Simplified) */}
                                            <div className="hidden lg:block w-32 text-right">
                                                <Link href={`/forum/thread/${thread.slug}`}>
                                                    <Button size="sm" variant="ghost" className="text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white">
                                                        View Thread
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl">
                                <MessageSquare className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                                <p className="text-[var(--text-secondary)] mb-4">No threads in this category yet.</p>
                                <Button>Start the first discussion</Button>
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
