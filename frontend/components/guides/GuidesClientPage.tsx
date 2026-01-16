"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import { BookOpen, Search, ChevronLeft, ChevronRight, Zap, Target, Rocket, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import PageHero from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";
import { useRealTimeGuides } from "@/hooks";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface Guide {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    featured_image_url?: string;
    created_at: string;
    author: {
        username: string;
        avatar_url?: string;
    };
}

interface GuidesResponse {
    data: Guide[];
    current_page: number;
    last_page: number;
    total: number;
    next_page_url: string | null;
}

const difficultyColors = {
    beginner: 'text-green-400 bg-green-500/20 border-green-500/30',
    intermediate: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
    advanced: 'text-red-400 bg-red-500/20 border-red-500/30',
};

const GUIDE_CATEGORIES = [
    { id: 'all', label: 'All Guides', icon: BookOpen, slug: 'all' },
    { id: 'beginner', label: 'Beginner', icon: Zap, slug: 'beginner' },
    { id: 'intermediate', label: 'Intermediate', icon: Target, slug: 'intermediate' },
    { id: 'advanced', label: 'Advanced', icon: Rocket, slug: 'advanced' },
];

export default function GuidesClientPage() {
    const [difficulty, setDifficulty] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [page, setPage] = useState(1);

    // Build API URL with filters
    const apiUrl = useMemo(() => {
        const params = new URLSearchParams();
        if (difficulty && difficulty !== 'all') params.append('difficulty', difficulty);
        if (searchQuery.trim()) params.append('search', searchQuery.trim());
        params.append('page', page.toString());
        return `/guides?${params.toString()}`;
    }, [difficulty, searchQuery, page]);

    const { data, isLoading, isValidating } = useSWR<GuidesResponse>(apiUrl, fetcher);

    // Real-time hook
    const { guides: realtimeGuides, newCount } = useRealTimeGuides([]);

    // Combine real-time with fetched
    const fetchedGuides = data?.data || [];
    const displayGuides = page === 1 && difficulty === 'all' && !searchQuery
        ? [...realtimeGuides.filter((rt: any) => !fetchedGuides.some(f => f.id === rt.id)), ...fetchedGuides]
        : fetchedGuides;

    const handleCategorySelect = (id: string) => {
        setDifficulty(id);
        setPage(1);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Hero Section with Categories */}
            <PageHero
                title="Guides Hub"
                description="Master your gear and games with expert guides from our community."
                icon={BookOpen}
                categories={GUIDE_CATEGORIES}
                selectedCategory={difficulty}
                onSelectCategory={handleCategorySelect}
            />

            {/* Search Bar */}
            <div className="container mx-auto px-4 -mt-4 relative z-30">
                <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
                    <div className="relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search guides..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0f1221]/95 backdrop-blur-xl border border-white/10 rounded-full py-4 pl-14 pr-6 text-white placeholder:text-gray-500 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all shadow-2xl"
                        />
                    </div>
                </form>
            </div>

            {/* Guides Grid */}
            <div className="container mx-auto px-4 py-12">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                        {difficulty === 'all' ? 'All Guides' : `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Guides`}
                        {searchQuery && <span className="text-[var(--accent)] ml-2">• "{searchQuery}"</span>}
                    </h2>
                    <span className="text-sm text-[var(--text-muted)] font-mono">
                        {data?.total || 0} GUIDES
                    </span>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-80 bg-[var(--bg-card)] rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : displayGuides.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                            {displayGuides.map((guide: any) => (
                                <Link
                                    key={guide.id}
                                    href={`/guides/${guide.slug}`}
                                    className="group bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--accent)] transition-all flex flex-col"
                                >
                                    <div className="relative h-48 overflow-hidden bg-[var(--bg-elevated)]">
                                        {guide.featured_image_url ? (
                                            <Image
                                                src={guide.featured_image_url.startsWith('http')
                                                    ? guide.featured_image_url
                                                    : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${guide.featured_image_url}`}
                                                alt={guide.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--accent)]/20 to-purple-900/20">
                                                <BookOpen className="w-16 h-16 text-[var(--accent)]/50" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                        <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold uppercase border ${difficultyColors[guide.difficulty as keyof typeof difficultyColors] || 'text-gray-400 bg-gray-500/20 border-gray-500/30'}`}>
                                            {guide.difficulty}
                                        </div>
                                    </div>

                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                                            {guide.title}
                                        </h3>
                                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4 flex-1">
                                            {guide.excerpt || "Click to read the full guide..."}
                                        </p>

                                        <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                                            <span className="text-xs text-[var(--text-muted)]">By {guide.author?.username || 'TechPlay'}</span>
                                            <span className="text-xs text-[var(--text-muted)]">
                                                {formatDistanceToNow(new Date(guide.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1 || isValidating}
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </Button>

                            <div className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)]">
                                Page <span className="font-bold text-white">{data?.current_page}</span> of {data?.last_page}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={!data?.next_page_url || isValidating}
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-24 bg-[var(--bg-card)]/50 border border-[var(--border)] rounded-3xl">
                        <BookOpen className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-6 opacity-50" />
                        <h3 className="text-xl font-bold text-white mb-2">No guides found</h3>
                        <p className="text-[var(--text-secondary)]">
                            {searchQuery ? `No results for "${searchQuery}"` : 'Try adjusting your filters or check back later.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
