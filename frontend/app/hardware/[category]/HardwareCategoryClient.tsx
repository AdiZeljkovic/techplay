"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import { Review, PaginatedResponse } from "@/types";
import ReviewCard from "@/components/reviews/ReviewCard";
import { Button } from "@/components/ui/Button";
import { Cpu, ChevronLeft, ChevronRight } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import { HARDWARE_CATEGORIES } from "@/lib/categories";
import { notFound } from "next/navigation";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface HardwareCategoryClientProps {
    categorySlug: string;
}

export default function HardwareCategoryClient({ categorySlug }: HardwareCategoryClientProps) {
    const [page, setPage] = useState(1);

    // Find the category definition to get its ID (which is used for API filtering)
    // The slug in URL (e.g. 'reviews') -> maps to definition with slug 'reviews' -> ID 'tech-reviews'
    const categoryDef = HARDWARE_CATEGORIES.find(c => c.slug === categorySlug);

    if (!categoryDef) {
        // If category doesn't exist in our definitions, show 404
        // Note: In Client Component, notFound() works but might be better handled by parent.
        // For now we return null or redirect. parent server component handles 404 better.
        return <div>Category not found</div>;
    }

    const queryParams = new URLSearchParams({
        page: page.toString(),
        category: categoryDef.id // use the ID for API filtering
    });

    const { data, isLoading, isValidating } = useSWR<PaginatedResponse<Review>>(
        `/tech?${queryParams.toString()}`,
        fetcher
    );

    const reviews = data?.data || [];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">

            <PageHero
                title={categoryDef.label}
                description={`Latest ${categoryDef.label} from our labs.`}
                basePath="/hardware"
            />

            <div className="container mx-auto px-4 py-8">

                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                        {categoryDef.label}
                    </h2>
                    <span className="text-sm text-[var(--text-muted)] font-mono">
                        {data?.meta?.total || data?.total || 0} ITEMS
                    </span>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
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
                                Page <span className="font-bold text-white">{data?.meta?.current_page || data?.current_page}</span> of {data?.meta?.last_page || data?.last_page}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={(!data?.links?.next && !data?.next_page_url) || isValidating}
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-24 bg-[var(--bg-card)]/50 border border-[var(--border)] rounded-3xl">
                        <Cpu className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-6 opacity-50" />
                        <h3 className="text-xl font-bold text-white mb-2">No content found</h3>
                        <p className="text-[var(--text-secondary)]">There are no items in this category yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
