import HardwareCategoryClient from "./HardwareCategoryClient";
import ArticleDetailView from "@/components/news/ArticleDetailView";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { HARDWARE_CATEGORIES } from "@/lib/categories";

// ISR: revalidate every 10 minutes
export const revalidate = 600;

type Props = {
    params: Promise<{ category: string }>;
};

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

async function getInitialCategoryData(categoryId: string) {
    try {
        const params = new URLSearchParams({ page: '1', category: categoryId });
        const res = await fetch(`${getApiUrl()}/tech?${params.toString()}`, {
            next: { revalidate: 600 },
            headers: { 'Accept': 'application/json' },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

async function getArticle(slug: string) {
    try {
        const res = await fetch(`${getApiUrl()}/tech/${slug}`, {
            next: { revalidate: 600, tags: ['tech', `tech-${slug}`] },
            headers: { 'Accept': 'application/json' },
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.data || json;
    } catch {
        return null;
    }
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

    // It's an article slug — fetch article for metadata
    const article = await getArticle(slug);
    if (!article) {
        return { title: "Hardware Lab - TechPlay", description: "In-depth hardware reviews and benchmarks." };
    }

    const title = article.seo_title || article.title;
    const description = article.seo_description || article.excerpt || "Read more on TechPlay.";

    return {
        title,
        description,
        openGraph: { title, description, type: 'article' },
    };
}

export default async function HardwareSlugPage({ params }: Props) {
    const { category: slug } = await params;

    // Check if it's a known category
    const categoryDef = HARDWARE_CATEGORIES.find(c => c.slug === slug);

    if (categoryDef) {
        const initialData = await getInitialCategoryData(categoryDef.id);
        return <HardwareCategoryClient categorySlug={slug} initialData={initialData} />;
    }

    // It's an article slug — fetch server-side
    const article = await getArticle(slug);
    if (!article) {
        notFound();
    }

    return <ArticleDetailView article={article} initialComments={article.comments || []} />;
}
