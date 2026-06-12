"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import { BookOpen, Search, Zap, Target, Rocket, User, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import PageHero from "@/components/ui/PageHero";
import ListingHeader from "@/components/ui/ListingHeader";
import ListingPagination from "@/components/ui/ListingPagination";
import ListingEmptyState from "@/components/ui/ListingEmptyState";
import { useRealTimeGuides } from "@/hooks";
import { decodeHtml } from "@/lib/decode";

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

interface GuidesClientPageProps {
    initialData?: any;
}

export default function GuidesClientPage({ initialData }: GuidesClientPageProps) {
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

    // Use server data as fallback only for the default unfiltered page 1
    const isDefaultView = page === 1 && difficulty === 'all' && !searchQuery;

    const { data, isLoading, isValidating } = useSWR<GuidesResponse>(
        apiUrl,
        fetcher,
        isDefaultView && initialData ? { fallbackData: initialData, revalidateOnMount: false } : {}
    );

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
        <div className="min-h-screen">
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
            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 -mt-2 relative z-30">
                <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
                    <div className="relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-400 dark:text-[#71717A]" />
                        <input
                            type="text"
                            placeholder="Search guides..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-full h-[52px] pl-14 pr-6 text-[14px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#71717A] focus:outline-none focus:border-tp-accent/50 transition-all shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                        />
                    </div>
                </form>
            </div>

            {/* Guides Grid */}
            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-12">
                <ListingHeader
                    title={difficulty === 'all' ? 'All Guides' : `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Guides`}
                    count={data?.total || 0}
                    countLabel="GUIDES"
                    extra={searchQuery ? <span className="text-tp-accent text-[13px] font-medium normal-case">&bull; &ldquo;{searchQuery}&rdquo;</span> : undefined}
                />

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-80 bg-zinc-100 dark:bg-[#0B0E14] rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : displayGuides.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                            {displayGuides.map((guide: any) => (
                                <Link
                                    key={guide.id}
                                    href={`/guides/${guide.slug}`}
                                    className="group bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-xl overflow-hidden hover:border-tp-accent/50 dark:hover:border-tp-accent/50 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] transition-all duration-300 flex flex-col"
                                >
                                    <div className="relative h-48 overflow-hidden bg-zinc-100 dark:bg-[#1A1F26]">
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
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-tp-accent/15 to-zinc-100 dark:to-[#1A1F26]">
                                                <BookOpen className="w-16 h-16 text-tp-accent/50" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                                        <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border backdrop-blur-md ${difficultyColors[guide.difficulty as keyof typeof difficultyColors] || 'text-gray-400 bg-gray-500/20 border-gray-500/30'}`}>
                                            {guide.difficulty}
                                        </div>
                                    </div>

                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 className="text-[16px] font-bold text-zinc-900 dark:text-white leading-snug mb-2 group-hover:text-tp-accent transition-colors line-clamp-2">
                                            {decodeHtml(guide.title)}
                                        </h3>
                                        <p className="text-[13px] text-zinc-600 dark:text-[#A1A1AA] leading-relaxed line-clamp-2 mb-4 flex-1">
                                            {decodeHtml(guide.excerpt) || "Click to read the full guide..."}
                                        </p>

                                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#71717A] pt-4 border-t border-zinc-200 dark:border-white/[0.04]">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <User className="w-3.5 h-3.5 shrink-0 text-tp-accent" />
                                                <span className="truncate">{guide.author?.username || 'TechPlay'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <Clock className="w-3.5 h-3.5 text-tp-accent" />
                                                <span suppressHydrationWarning>
                                                    {formatDistanceToNow(new Date(guide.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <ListingPagination
                            page={data?.current_page || page}
                            lastPage={data?.last_page}
                            onPrev={() => setPage((p) => Math.max(1, p - 1))}
                            onNext={() => setPage((p) => p + 1)}
                            prevDisabled={page === 1 || isValidating}
                            nextDisabled={!data?.next_page_url || isValidating}
                        />
                    </>
                ) : (
                    <ListingEmptyState
                        icon={BookOpen}
                        title="No guides found"
                        description={searchQuery ? `No results for "${searchQuery}"` : 'Try adjusting your filters or check back later.'}
                    />
                )}
            </div>
        </div>
    );
}
