import NewsCategoryClient from "./NewsCategoryClient";
import { Metadata } from "next";
import { NEWS_CATEGORIES } from "@/lib/categories";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const categoryDef = NEWS_CATEGORIES.find(c => c.slug === slug);

    if (!categoryDef) {
        return {
            title: "Category Not Found",
        };
    }

    return {
        title: `${categoryDef.label} News - TechPlay`,
        description: `Latest ${categoryDef.label} news, updates, and announcements.`,
    };
}

export default async function NewsCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Validate category exists
    const categoryDef = NEWS_CATEGORIES.find(c => c.slug === slug);
    if (!categoryDef) {
        notFound();
    }

    return <NewsCategoryClient categorySlug={slug} />;
}
