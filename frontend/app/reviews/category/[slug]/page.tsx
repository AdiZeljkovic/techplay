import ReviewCategoryClient from "./ReviewCategoryClient";
import { Metadata } from "next";
import { REVIEW_CATEGORIES } from "@/lib/categories";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const categoryDef = REVIEW_CATEGORIES.find(c => c.slug === slug);

    if (!categoryDef) {
        return {
            title: "Category Not Found",
        };
    }

    return {
        title: `${categoryDef.label} Reviews - TechPlay`,
        description: `Read our in-depth ${categoryDef.label} reviews and ratings.`,
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
