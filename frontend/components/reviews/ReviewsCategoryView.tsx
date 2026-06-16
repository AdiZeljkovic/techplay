"use client";

import { Review, PaginatedResponse } from "@/types";
import { Star, Globe, Gamepad2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import { REVIEW_CATEGORIES } from "@/lib/categories";
import NewsroomHero from "@/components/news/NewsroomHero";
import ListingHeader from "@/components/ui/ListingHeader";
import ListingPagination from "@/components/ui/ListingPagination";
import ListingEmptyState from "@/components/ui/ListingEmptyState";
import ReviewCard from "@/components/reviews/ReviewCard";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface ReviewsCategoryViewProps {
    categorySlug: string;
}

export default function ReviewsCategoryView({ categorySlug }: ReviewsCategoryViewProps) {
    const category = REVIEW_CATEGORIES.find(c => c.slug === categorySlug) || REVIEW_CATEGORIES[0];
    const [page, setPage] = useState(1);

    // Use the backend ID for fetching
    // For 'all', we search without category filter. 
    // For 'latest', we send 'reviews-latest' which the backend handles specially (shows all reviews sorted by date).
    // For others, we use category.id which matches the backend slug (e.g. 'reviews-aaa-titles').
    const categoryParam = category.slug === 'all'
        ? 'all'
        : category.id;

    const queryParams = new URLSearchParams({
        page: page.toString(),
        category: categoryParam,
        per_page: '12'
    });

    const { data, isLoading, isValidating } = useSWR<PaginatedResponse<Review>>(
        `/reviews?${queryParams.toString()}`,
        fetcher
    );

    const reviews = data?.data || [];

    return (
        <div className="min-h-screen">

            <NewsroomHero
                sectionLabel={`TECHPLAY.GG · ${category.label.toUpperCase()}`}
                headline={category.label.toUpperCase()}
                headlineAccent="REVIEWS"
                tagline={category.label === "Latest" ? "The freshest reviews hot off the press." : `Latest ${category.label} reviews and analysis.`}
                stats={[
                    { icon: Star,     label: "Expert Reviews" },
                    { icon: Globe,    label: "Global Coverage" },
                    { icon: Gamepad2, label: "Built for Players" },
                ]}
                categories={REVIEW_CATEGORIES}
                selectedCategory={category.id}
                basePath="/reviews"
                featuredItem={reviews[0] as any}
                featuredBasePath="/reviews"
            />

            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-8">

                <ListingHeader title={category.label} count={data?.meta?.total || data?.total || 0} countLabel="REVIEWS FOUND" />

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-80 bg-zinc-100 dark:bg-[#0B0E14] rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : reviews.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                            {reviews.slice(1).map((review, idx) => (
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
