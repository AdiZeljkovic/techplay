import ReviewCategoryClient from "./ReviewCategoryClient";
import { Metadata } from "next";
import { REVIEW_CATEGORIES } from "@/lib/categories";
import { notFound } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function getSeoSettings() {
    try {
        const res = await fetch(`${API_URL}/settings`, { next: { revalidate: 3600 } });
        if (!res.ok) return {};
        return res.json();
    } catch { return {}; }
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

    return <ReviewCategoryClient categorySlug={slug} />;
}
