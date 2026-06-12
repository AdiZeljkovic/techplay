"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import {
    MessageCircle, ChevronRight, Megaphone, Gamepad2, Star,
    Coffee, Monitor, HelpCircle, Trophy, ShoppingBag
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import PageHero from "@/components/ui/PageHero";
import ForumSidebar from "@/components/forum/ForumSidebar";
import ForumSearch from "@/components/forum/ForumSearch";
import ListingEmptyState from "@/components/ui/ListingEmptyState";
import { decodeHtml } from "@/lib/decode";

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
        <div className="min-h-screen">
            {/* Hero Section */}
            <PageHero
                title="Community Forums"
                description="Join the discussion, share your thoughts, and connect with fellow gamers and tech enthusiasts."
                icon={MessageCircle}
            />

            {/* Content & Sidebar */}
            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-8">
                {/* Forum Search Bar */}
                <div className="mb-8 flex justify-end">
                    <ForumSearch />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-10">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-32 bg-zinc-100 dark:bg-[#0B0E14] rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : categories && categories.length > 0 ? (
                            categories.map((parent) => (
                                <div key={parent.id}>
                                    {/* Section Header */}
                                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-zinc-200 dark:border-white/5">
                                        <span className="w-1.5 h-5 bg-tp-accent rounded-sm shrink-0" />
                                        <h2 className="font-display text-[20px] font-bold text-zinc-900 dark:text-white uppercase tracking-[0.04em] leading-none">
                                            {decodeHtml(parent.name)}
                                        </h2>
                                    </div>

                                    {/* Children Grid */}
                                    <div className="grid grid-cols-1 gap-3">
                                        {parent.children?.map((category) => {
                                            const Icon = getCategoryIcon(category.slug);
                                            const color = getCategoryColor(category.slug);

                                            return (
                                                <Link key={category.id} href={`/forum/${category.slug}`}>
                                                    <div
                                                        className="group relative bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-tp-accent/40 hover:shadow-lg dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] overflow-hidden"
                                                        style={{ borderLeft: `4px solid ${color}` }}
                                                    >
                                                        {/* Dynamic Hover Glow */}
                                                        <div
                                                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                                            style={{ background: `linear-gradient(90deg, ${color}10 0%, transparent 100%)` }}
                                                        />

                                                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                            <div className="flex items-center gap-3 sm:gap-5">
                                                                <div
                                                                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110"
                                                                    style={{
                                                                        backgroundColor: `${color}`,
                                                                        color: '#ffffff',
                                                                        boxShadow: `0 8px 16px -4px ${color}60`
                                                                    }}
                                                                >
                                                                    <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-[16px] font-bold text-zinc-900 dark:text-white mb-1 group-hover:text-tp-accent transition-colors">
                                                                        {decodeHtml(category.name)}
                                                                    </h3>
                                                                    {category.description && (
                                                                        <p className="text-zinc-600 dark:text-[#A1A1AA] text-[13px] leading-relaxed mb-0 line-clamp-1 max-w-xl">
                                                                            {decodeHtml(category.description)}
                                                                        </p>
                                                                    )}

                                                                    {/* Mobile Stats */}
                                                                    <div className="flex md:hidden items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#71717A] mt-2">
                                                                        <span className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 px-2 py-1 rounded-md">
                                                                            {category.threads_count || 0} Threads
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Desktop Stats & Latest */}
                                                            <div className="flex items-center gap-8 flex-shrink-0">
                                                                <div className="hidden md:flex flex-col items-center min-w-[60px]">
                                                                    <span className="font-display text-[20px] font-bold text-zinc-900 dark:text-white leading-none">{category.threads_count || 0}</span>
                                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-[#71717A] mt-1">Threads</span>
                                                                </div>

                                                                {category.latest_thread && (
                                                                    <>
                                                                        <div className="hidden lg:block w-px h-10 bg-zinc-200 dark:bg-white/[0.06]" />

                                                                        <div className="hidden lg:block min-w-[200px] max-w-[240px]">
                                                                            <div className="text-[9px] font-bold uppercase tracking-widest text-tp-accent mb-1.5">Latest Activity</div>
                                                                            <div className="flex gap-2">
                                                                                <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-[#1A1F26] flex items-center justify-center text-zinc-500 dark:text-[#8B949E] text-[10px] font-bold border border-zinc-200 dark:border-white/5">
                                                                                    {category.latest_thread.author?.username?.charAt(0)?.toUpperCase() || '?'}
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="text-[12px] font-bold text-zinc-800 dark:text-[#E4E4E5] truncate group-hover:text-tp-accent transition-colors">
                                                                                        {decodeHtml(category.latest_thread.title)}
                                                                                    </div>
                                                                                    <div className="text-[10px] text-zinc-500 dark:text-[#71717A] truncate" suppressHydrationWarning>
                                                                                        {formatDistanceToNow(new Date(category.latest_thread.created_at), { addSuffix: true })}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                )}

                                                                <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 flex items-center justify-center text-zinc-500 dark:text-[#A1A1AA] group-hover:bg-tp-accent group-hover:border-tp-accent group-hover:text-white transition-all duration-300">
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
                            <ListingEmptyState
                                icon={MessageCircle}
                                title="No categories yet"
                                description="No forum categories available yet. Check back soon!"
                            />
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
