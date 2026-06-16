"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import { Article, PaginatedResponse } from "@/types";
import NewsCard from "@/components/news/NewsCard";
import { Newspaper } from "lucide-react";
import NewsroomHero from "@/components/news/NewsroomHero";
import ListingHeader from "@/components/ui/ListingHeader";
import ListingPagination from "@/components/ui/ListingPagination";
import ListingEmptyState from "@/components/ui/ListingEmptyState";
import AdUnit from "@/components/ads/AdUnit";
import { NEWS_CATEGORIES } from "@/lib/categories";
import { useRealTimeNews } from "@/hooks";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface NewsClientProps {
    initialData?: any;
}

export default function NewsClient({ initialData }: NewsClientProps) {
    const [page, setPage] = useState(1);

    // Default to 'all' for the main index page
    const selectedCategory = "all";
    const queryParams = new URLSearchParams({ page: page.toString() });

    const { data, isLoading, isValidating } = useSWR<PaginatedResponse<Article>>(
        `/news?${queryParams.toString()}`,
        fetcher,
        page === 1 && initialData ? { fallbackData: initialData, revalidateOnMount: false } : {}
    );

    // Real-time hook - new articles will appear at the top
    const { articles: realtimeArticles, newArticleCount, clearNewCount } = useRealTimeNews([]);

    // Combine real-time articles with fetched articles (on first page only)
    const fetchedArticles = data?.data || [];
    const articles = page === 1
        ? [...realtimeArticles.filter(rt => !fetchedArticles.some(f => f.id === rt.id)), ...fetchedArticles]
        : fetchedArticles;

    // Clear new count when page changes
    useEffect(() => {
        if (page === 1) clearNewCount();
    }, [page, clearNewCount]);

    return (
        <div className="min-h-screen">

            <NewsroomHero
                headline="NEWS"
                headlineAccent="ROOM"
                tagline="The latest from gaming, tech and the industry."
                description="Breaking news, reviews, release updates, hardware coverage and deep dives — all in one place for players who want more than headlines."
                categories={NEWS_CATEGORIES}
                selectedCategory={selectedCategory}
                basePath="/news"
                featuredItem={articles[0] as Article}
                featuredBasePath="/news"
            />

            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-8">

                {/* Top Banner Ad */}
                <div className="mb-8">
                    <AdUnit position="listing_top" />
                </div>

                <ListingHeader title="All News" count={data?.meta?.total || data?.total || 0} countLabel="ARTICLES FOUND" />

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="h-80 bg-zinc-100 dark:bg-[#0B0E14] rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : articles.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                            {articles.map((article: any, idx: number) => (
                                <NewsCard key={article.id} article={article} index={idx} />
                            ))}
                        </div>

                        <ListingPagination
                            page={data?.meta?.current_page || data?.current_page || page}
                            lastPage={data?.meta?.last_page || data?.last_page}
                            onPrev={() => setPage((p) => Math.max(1, p - 1))}
                            onNext={() => setPage((p) => p + 1)}
                            prevDisabled={page === 1 || isValidating}
                            nextDisabled={(!data?.links?.next && !data?.next_page_url) || isValidating}
                        />
                    </>
                ) : (
                    <ListingEmptyState icon={Newspaper} title="No stories found" description="Check back later." />
                )}
            </div>
        </div>
    );
}
