import HardwareSlugClient from "./HardwareSlugClient";
import { Metadata } from "next";
import { HARDWARE_CATEGORIES } from "@/lib/categories";

type Props = {
    params: Promise<{ category: string }>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function getSeoSettings() {
    try {
        const res = await fetch(`${API_URL}/settings`, { next: { revalidate: 3600 } });
        if (!res.ok) return {};
        return res.json();
    } catch { return {}; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { category: slug } = await params;
    const categoryDef = HARDWARE_CATEGORIES.find(c => c.slug === slug);
    const settings = await getSeoSettings();

    const noindexCategories = settings.seo_noindex_categories === true ||
        settings.seo_noindex_categories === '1' ||
        settings.seo_noindex_categories === 'true';

    if (categoryDef) {
        return {
            title: `${categoryDef.label} - Hardware Lab`,
            description: `Latest ${categoryDef.label} reviews and benchmarks.`,
            robots: noindexCategories ? { index: false, follow: true } : undefined,
        };
    }

    return {
        title: "Hardware Lab - TechPlay",
        description: "In-depth hardware reviews and benchmarks.",
    };
}

export default async function HardwareSlugPage({ params }: Props) {
    const { category: slug } = await params;
    return <HardwareSlugClient slug={slug} />;
}
