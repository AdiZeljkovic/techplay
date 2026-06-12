"use client";

import { Article, PaginatedResponse } from "@/types";
import { Newspaper } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import { NEWS_CATEGORIES } from "@/lib/categories";
import PageHero from "@/components/ui/PageHero";
import ListingHeader from "@/components/ui/ListingHeader";
import ListingPagination from "@/components/ui/ListingPagination";
import ListingEmptyState from "@/components/ui/ListingEmptyState";
import NewsCard from "@/components/news/NewsCard";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface NewsCategoryViewProps {
    categorySlug: string;
}

export default function NewsCategoryView({ categorySlug }: NewsCategoryViewProps) {
    const category = NEWS_CATEGORIES.find(c => c.slug === categorySlug) || NEWS_CATEGORIES[0];
    const [page, setPage] = useState(1);

    // Use the backend ID for fetching
    const queryParams = new URLSearchParams({
        page: page.toString(),
        category: category.id
    });

    const { data, isLoading, isValidating } = useSWR<PaginatedResponse<Article>>(
        `/news?${queryParams.toString()}`,
        fetcher
    );

    const articles = data?.data || [];

    return (
        <div className="min-h-screen">

            <PageHero
                title={category.label}
                description={`Latest news and updates from the ${category.label} world.`}
                icon={category.icon}
                categories={NEWS_CATEGORIES}
                selectedCategory={category.id}
                basePath="/news"
            />

            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-8">

                <ListingHeader title={`${category.label} News`} count={data?.meta?.total || data?.total || 0} countLabel="ARTICLES FOUND" />

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="h-80 bg-zinc-100 dark:bg-[#0B0E14] rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : articles.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                            {articles.map((article, idx) => (
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
                    <ListingEmptyState icon={Newspaper} title="No stories found" description="No news available in this category yet." />
                )}
            </div>
        </div>
    );
}
