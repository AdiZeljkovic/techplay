
import HardwareCategoryClient from "./HardwareCategoryClient";
import { Metadata } from "next";
import { HARDWARE_CATEGORIES } from "@/lib/categories";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
    const { category } = await params;
    const categoryDef = HARDWARE_CATEGORIES.find(c => c.slug === category);

    if (!categoryDef) {
        return {
            title: "Category Not Found",
        };
    }

    return {
        title: `${categoryDef.label} - Hardware Lab`,
        description: `Latest ${categoryDef.label} reviews and benchmarks.`,
    };
}

export default async function HardwareCategoryPage({ params }: { params: Promise<{ category: string }> }) {
    const { category } = await params;

    // Validate category exists
    const categoryDef = HARDWARE_CATEGORIES.find(c => c.slug === category);
    if (!categoryDef) {
        notFound();
    }

    return <HardwareCategoryClient categorySlug={category} />;
}
