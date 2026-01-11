"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import {
    MessageCircle, ChevronRight, Megaphone, Gamepad2, Cpu, Star,
    Coffee, Monitor, HelpCircle, Trophy, ShoppingBag, Info
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import PageHero from "@/components/ui/PageHero";
import ForumSidebar from "@/components/forum/ForumSidebar";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface ForumCategory {
    id: number;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    threads_count: number;
    children?: ForumCategory[];
    latest_thread?: {
        title: string;
        slug: string;
        created_at: string;
        author: {
            username: string;
        };
    };
}

const getCategoryColor = (slug: string) => {
    switch (slug) {
        case 'news-announcements': return '#ef4444'; // red
        case 'feedback-support': return '#3b82f6'; // blue
        case 'general-gaming': return '#8b5cf6'; // violet
        case 'user-reviews': return '#f59e0b'; // amber
        case 'esports': return '#10b981'; // emerald
        case 'pc-builds': return '#06b6d4'; // cyan
        case 'consoles': return '#6366f1'; // indigo
        case 'the-lounge': return '#ec4899'; // pink
        case 'marketplace': return '#14b8a6'; // teal
        default: return '#64748b'; // slate
    }
};

const getCategoryIcon = (slug: string) => {
    switch (slug) {
        case 'news-announcements': return Megaphone;
        case 'feedback-support': return HelpCircle;
        case 'general-gaming': return Gamepad2;
        case 'user-reviews': return Star;
        case 'esports': return Trophy;
        case 'pc-builds': return Monitor;
        case 'consoles': return Gamepad2; // controller
        case 'the-lounge': return Coffee;
        case 'marketplace': return ShoppingBag;
        default: return MessageCircle;
    }
};

export default function ForumPage() {
    const { data: categories, isLoading } = useSWR<ForumCategory[]>('/forum/categories', fetcher);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Hero Section */}
            <PageHero
                title="Community Forums"
                description="Join the discussion, share your thoughts, and connect with fellow gamers and tech enthusiasts."
                icon={MessageCircle}
            />

            {/* Content & Sidebar */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-8">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-32 bg-[var(--bg-card)] rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : categories && categories.length > 0 ? (
                            categories.map((parent) => (
                                <div key={parent.id} className="space-y-4">
                                    {/* Section Header */}
                                    <div className="flex items-center gap-3 px-2 border-b border-[var(--border)] pb-2 mb-4">
                                        <div className="p-1.5 rounded-lg bg-[var(--bg-elevated)] text-[var(--accent)]">
                                            {/* Attempt to map parent name to generic icon if needed, or just use Info */}
                                            <Info className="w-5 h-5" />
                                        </div>
                                        <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                                            {parent.name}
                                        </h2>
                                    </div>

                                    {/* Children Grid */}
                                    <div className="grid grid-cols-1 gap-4">
                                        {parent.children?.map((category) => {
                                            const Icon = getCategoryIcon(category.slug);
                                            const color = getCategoryColor(category.slug);

                                            return (
                                                <Link key={category.id} href={`/forum/${category.slug}`}>
                                                    <div
                                                        className="group relative bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg overflow-hidden"
                                                        style={{
                                                            borderLeft: `4px solid ${color}`,
                                                        }}
                                                    >
                                                        {/* Dynamic Hover Glow */}
                                                        <div
                                                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                                            style={{
                                                                background: `linear-gradient(90deg, ${color}10 0%, transparent 100%)`,
                                                            }}
                                                        />

                                                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                            <div className="flex items-center gap-5">
                                                                <div
                                                                    className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl shadow-lg transition-transform duration-300 group-hover:scale-110"
                                                                    style={{
                                                                        backgroundColor: `${color}`,
                                                                        color: '#ffffff',
                                                                        boxShadow: `0 8px 16px -4px ${color}60`
                                                                    }}
                                                                >
                                                                    <Icon className="w-7 h-7" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent)] transition-colors">
                                                                        {category.name}
                                                                    </h3>
                                                                    {category.description && (
                                                                        <p className="text-[var(--text-secondary)] text-sm mb-0 line-clamp-1 max-w-xl">
                                                                            {category.description}
                                                                        </p>
                                                                    )}

                                                                    {/* Mobile Stats */}
                                                                    <div className="flex md:hidden items-center gap-4 text-xs font-medium text-[var(--text-muted)] mt-2">
                                                                        <span className="bg-[var(--bg-elevated)] px-2 py-1 rounded-md">
                                                                            {category.threads_count || 0} Threads
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Desktop Stats & Latest */}
                                                            <div className="flex items-center gap-8 flex-shrink-0">
                                                                <div className="hidden md:flex flex-col items-center min-w-[60px]">
                                                                    <span className="text-xl font-bold text-[var(--text-primary)]">{category.threads_count || 0}</span>
                                                                    <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Threads</span>
                                                                </div>

                                                                {category.latest_thread && (
                                                                    <>
                                                                        <div className="hidden lg:block w-px h-10 bg-[var(--border)]" />

                                                                        <div className="hidden lg:block min-w-[200px] max-w-[240px]">
                                                                            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Latest Activity</div>
                                                                            <div className="flex gap-2">
                                                                                <div className="w-6 h-6 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] text-[10px] border border-[var(--border)]">
                                                                                    {category.latest_thread.author?.username?.charAt(0) || '?'}
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="text-xs font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">
                                                                                        {category.latest_thread.title}
                                                                                    </div>
                                                                                    <div className="text-[10px] text-[var(--text-secondary)] truncate">
                                                                                        {formatDistanceToNow(new Date(category.latest_thread.created_at), { addSuffix: true })}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                )}

                                                                <div className="h-8 w-8 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center group-hover:bg-[var(--accent)] group-hover:text-white transition-all duration-300">
                                                                    <ChevronRight className="w-4 h-4" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-16 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl">
                                <MessageCircle className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                                <p className="text-[var(--text-secondary)]">No forum categories available yet.</p>
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
