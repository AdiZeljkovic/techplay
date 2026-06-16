"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import { Review, PaginatedResponse } from "@/types";
import ReviewCard from "@/components/reviews/ReviewCard";
import { Cpu, Gauge, Globe } from "lucide-react";
import NewsroomHero from "@/components/news/NewsroomHero";
import ListingHeader from "@/components/ui/ListingHeader";
import ListingPagination from "@/components/ui/ListingPagination";
import ListingEmptyState from "@/components/ui/ListingEmptyState";
import { HARDWARE_CATEGORIES } from "@/lib/categories";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const HARDWARE_STATS = [
    { icon: Cpu,   label: "Benchmark-Driven" },
    { icon: Gauge, label: "Real World Tests" },
    { icon: Globe, label: "Latest Hardware" },
];

interface HardwareCategoryClientProps {
    categorySlug: string;
    initialData?: any;
}

export default function HardwareCategoryClient({ categorySlug, initialData }: HardwareCategoryClientProps) {
    const [page, setPage] = useState(1);

    const categoryDef = HARDWARE_CATEGORIES.find(c => c.slug === categorySlug);

    if (!categoryDef) {
        return <div>Category not found</div>;
    }

    const queryParams = new URLSearchParams({
        page: page.toString(),
        category: categoryDef.id
    });

    const { data, isLoading, isValidating } = useSWR<PaginatedResponse<Review>>(
        `/tech?${queryParams.toString()}`,
        fetcher,
        page === 1 && initialData ? { fallbackData: initialData, revalidateOnMount: false } : {}
    );

    const { data: categoryData } = useSWR(`/categories/${categorySlug}`, fetcher);

    const reviews = data?.data || [];

    return (
        <div className="min-h-screen">

            <NewsroomHero
                sectionLabel={`TECHPLAY.GG · ${categoryDef.label.toUpperCase()}`}
                headline={categoryDef.label.toUpperCase()}
                headlineAccent="TECH"
                tagline={`Latest ${categoryDef.label} from our labs.`}
                stats={HARDWARE_STATS}
                categories={HARDWARE_CATEGORIES}
                selectedCategory={categoryDef.id}
                basePath="/hardware"
                categoryBase="/hardware"
                featuredItem={reviews[0] as any}
                featuredBasePath="/hardware"
            />

            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-8">

                <ListingHeader title={categoryDef.label} count={data?.meta?.total || data?.total || 0} countLabel="ITEMS" />

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-80 bg-zinc-100 dark:bg-[#0B0E14] rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : reviews.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                            {reviews.slice(1).map((review, idx) => (
                                <ReviewCard key={review.id} review={review} index={idx} basePath="/hardware" hideRating={true} />
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
                    <ListingEmptyState icon={Cpu} title="No content found" description="There are no items in this category yet." />
                )}
            </div>

            {categoryData?.data?.seo_text && (
                <div className="max-w-[1320px] mx-auto px-4 xl:px-0 pb-16">
                    <div className="bg-white dark:bg-[#0B0E14]/50 rounded-[24px] p-8 border border-zinc-200 dark:border-[#161B22] transition-colors duration-300">
                        <div
                            className="prose dark:prose-invert prose-p:text-zinc-600 dark:prose-p:text-[#A1A1AA] prose-headings:text-zinc-900 dark:prose-headings:text-white max-w-none"
                            dangerouslySetInnerHTML={{ __html: categoryData.data.seo_text }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
