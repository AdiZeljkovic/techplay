import ReviewCategoryClient from "./ReviewCategoryClient";
import { Metadata } from "next";
import { REVIEW_CATEGORIES } from "@/lib/categories";
import { notFound } from "next/navigation";

// ISR: revalidate every 10 minutes
export const revalidate = 600;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function getApiUrl() {
    let apiUrl = API_URL;
    if (apiUrl && apiUrl.includes('localhost')) {
        apiUrl = apiUrl.replace('localhost', '127.0.0.1');
    }
    return apiUrl;
}

async function getSeoSettings() {
    try {
        const res = await fetch(`${getApiUrl()}/settings`, { next: { revalidate: 3600 } });
        if (!res.ok) return {};
        return res.json();
    } catch { return {}; }
}

async function getInitialReviews(categoryId: string) {
    try {
        const params = new URLSearchParams({ page: '1', category: categoryId });
        const res = await fetch(`${getApiUrl()}/reviews?${params.toString()}`, {
            next: { revalidate: 600 },
            headers: { 'Accept': 'application/json' },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const categoryDef = REVIEW_CATEGORIES.find(c => c.slug === slug);
    const settings = await getSeoSettings();

    if (!categoryDef) {
        return { title: "Category Not Found" };
    }

    const noindexCategories = settings.seo_noindex_categories === true ||
        settings.seo_noindex_categories === '1' ||
        settings.seo_noindex_categories === 'true';

    return {
        title: `${categoryDef.label} Reviews - TechPlay`,
        description: `Read our in-depth ${categoryDef.label} reviews and ratings.`,
        robots: noindexCategories ? { index: false, follow: true } : undefined,
    };
}

export default async function ReviewCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Validate category exists
    const categoryDef = REVIEW_CATEGORIES.find(c => c.slug === slug);
    if (!categoryDef) {
        notFound();
    }

    const initialData = await getInitialReviews(categoryDef.id);

    return <ReviewCategoryClient categorySlug={slug} initialData={initialData} />;
}
