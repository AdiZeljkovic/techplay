"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import { Review, PaginatedResponse } from "@/types";
import ReviewCard from "@/components/reviews/ReviewCard";
import { Star, Globe, Gamepad2 } from "lucide-react";
import NewsroomHero from "@/components/news/NewsroomHero";
import ListingHeader from "@/components/ui/ListingHeader";
import ListingPagination from "@/components/ui/ListingPagination";
import ListingEmptyState from "@/components/ui/ListingEmptyState";
import AdUnit from "@/components/ads/AdUnit";
import { REVIEW_CATEGORIES } from "@/lib/categories";
import { useRealTimeReviews } from "@/hooks";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const REVIEWS_STATS = [
    { icon: Star,     label: "Expert Reviews" },
    { icon: Globe,    label: "Global Coverage" },
    { icon: Gamepad2, label: "Built for Players" },
];

interface ReviewsClientProps {
    initialData?: any;
}

export default function ReviewsClient({ initialData }: ReviewsClientProps) {
    const [page, setPage] = useState(1);

    const selectedCategory = "all";
    const queryParams = new URLSearchParams({ page: page.toString() });

    const { data, isLoading, isValidating } = useSWR<PaginatedResponse<Review>>(
        `/reviews?${queryParams.toString()}`,
        fetcher,
        page === 1 && initialData ? { fallbackData: initialData, revalidateOnMount: false } : {}
    );

    const { reviews: realtimeReviews, newCount } = useRealTimeReviews([]);

    const fetchedReviews = data?.data || [];
    const reviews = page === 1
        ? [...realtimeReviews.filter(rt => !fetchedReviews.some(f => f.id === rt.id)), ...fetchedReviews]
        : fetchedReviews;

    return (
        <div className="min-h-screen">

            <NewsroomHero
                sectionLabel="TECHPLAY.GG REVIEWS"
                headline="REVIEW"
                headlineAccent="HUB"
                tagline="In-depth analysis. Final verdicts you can trust."
                description="Benchmark-driven reviews, scores, pros and cons — across games, hardware and more."
                stats={REVIEWS_STATS}
                categories={REVIEW_CATEGORIES}
                selectedCategory={selectedCategory}
                basePath="/reviews"
                featuredItem={reviews[0] as any}
                featuredBasePath="/reviews"
            />

            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-8">

                {/* Top Banner Ad */}
                <div className="mb-8">
                    <AdUnit position="listing_top" />
                </div>

                <ListingHeader title="All Reviews" count={data?.meta?.total || data?.total || 0} countLabel="REVIEWS FOUND" />

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-80 bg-zinc-100 dark:bg-[#0B0E14] rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : reviews.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                            {reviews.map((review: any, idx: number) => (
                                <ReviewCard key={review.id} review={review} index={idx} />
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
                    <ListingEmptyState icon={Star} title="No reviews found" description="Check back later." />
                )}
            </div>
        </div>
    );
}
