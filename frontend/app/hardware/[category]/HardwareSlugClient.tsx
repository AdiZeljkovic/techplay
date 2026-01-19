"use client";

import { Article } from "@/types";
import ArticleDetailView from "@/components/news/ArticleDetailView";
import HardwareCategoryClient from "./HardwareCategoryClient";
import { HARDWARE_CATEGORIES } from "@/lib/categories";
import useSWR from "swr";
import axios from "@/lib/axios";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface HardwareSlugClientProps {
    slug: string;
}

export default function HardwareSlugClient({ slug }: HardwareSlugClientProps) {
    // First check if it's a known category
    const categoryDef = HARDWARE_CATEGORIES.find(c => c.slug === slug);

    // Fetch article from API
    const { data: articleData, error: articleError, isLoading } = useSWR<{ data: Article }>(
        !categoryDef ? `/tech/${slug}` : null, // Only fetch if not a category
        fetcher
    );

    // If it's a category, render category view
    if (categoryDef) {
        return <HardwareCategoryClient categorySlug={slug} />;
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    // If article found
    if (articleData?.data) {
        return <ArticleDetailView article={articleData.data} initialComments={[]} />;
    }

    // Not found
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-2">Not Found</h1>
                <p className="text-[var(--text-secondary)]">This content could not be found.</p>
            </div>
        </div>
    );
}
