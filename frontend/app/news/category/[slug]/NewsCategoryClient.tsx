"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import { Article, PaginatedResponse } from "@/types";
import NewsCard from "@/components/news/NewsCard";
import { Button } from "@/components/ui/Button";
import { Newspaper, ChevronLeft, ChevronRight } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import { NEWS_CATEGORIES } from "@/lib/categories";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface NewsCategoryClientProps {
    categorySlug: string;
}

export default function NewsCategoryClient({ categorySlug }: NewsCategoryClientProps) {
    const [page, setPage] = useState(1);

    // Find the category definition
    const categoryDef = NEWS_CATEGORIES.find(c => c.slug === categorySlug);

    if (!categoryDef) {
        return <div>Category not found</div>;
    }

    const queryParams = new URLSearchParams({
        page: page.toString(),
        category: categoryDef.id // use the ID (e.g., 'news-gaming') for API filtering
    });

    const { data, isLoading, isValidating } = useSWR<PaginatedResponse<Article>>(
        `/news?${queryParams.toString()}`,
        fetcher
    );

    const articles = data?.data || [];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">

            <PageHero
                title={categoryDef.label}
                description={`Latest ${categoryDef.label} news and updates.`}
                categories={NEWS_CATEGORIES}
                selectedCategory={categoryDef.id}
                basePath="/news/category"
            />

            <div className="container mx-auto px-4 py-8">

                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                        {categoryDef.label}
                    </h2>
                    <span className="text-sm text-[var(--text-muted)] font-mono">
                        {data?.total || 0} ARTICLES FOUND
                    </span>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="h-80 bg-[var(--bg-card)] rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : articles.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                            {articles.map((article, idx) => (
                                <NewsCard key={article.id} article={article} index={idx} />
                            ))}
                        </div>

                        <div className="flex items-center justify-center gap-2 mb-12">
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
                        <Newspaper className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-6 opacity-50" />
                        <h3 className="text-xl font-bold text-white mb-2">No articles found</h3>
                        <p className="text-[var(--text-secondary)]">Check back later.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
