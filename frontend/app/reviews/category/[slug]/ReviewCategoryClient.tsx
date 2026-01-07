"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import { Review, PaginatedResponse } from "@/types";
import ReviewCard from "@/components/reviews/ReviewCard";
import { Button } from "@/components/ui/Button";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import { REVIEW_CATEGORIES } from "@/lib/categories";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface ReviewCategoryClientProps {
    categorySlug: string;
}

export default function ReviewCategoryClient({ categorySlug }: ReviewCategoryClientProps) {
    const [page, setPage] = useState(1);

    // Find the category definition
    const categoryDef = REVIEW_CATEGORIES.find(c => c.slug === categorySlug);

    if (!categoryDef) {
        return <div>Category not found</div>;
    }

    const queryParams = new URLSearchParams({
        page: page.toString(),
        category: categoryDef.id // e.g. 'reviews-latest', 'reviews-rpg'
    });

    const { data, isLoading, isValidating } = useSWR<PaginatedResponse<Review>>(
        `/reviews?${queryParams.toString()}`,
        fetcher
    );

    const reviews = data?.data || [];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">

            <PageHero
                title={categoryDef.label}
                description={`Latest ${categoryDef.label} reviews and analysis.`}
                categories={REVIEW_CATEGORIES}
                selectedCategory={categoryDef.id}
                basePath="/reviews"
                categoryBase="/reviews/category"
            />

            <div className="container mx-auto px-4 py-8">

                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                        {categoryDef.label}
                    </h2>
                    <span className="text-sm text-[var(--text-muted)] font-mono">
                        {data?.total || 0} REVIEWS FOUND
                    </span>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-80 bg-[var(--bg-card)] rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : reviews.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                            {reviews.map((review, idx) => (
                                <ReviewCard key={review.id} review={review} index={idx} />
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
                        <Star className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-6 opacity-50" />
                        <h3 className="text-xl font-bold text-white mb-2">No reviews found</h3>
                        <p className="text-[var(--text-secondary)]">Check back later.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
