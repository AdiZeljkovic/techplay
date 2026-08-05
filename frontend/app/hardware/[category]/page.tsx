import SectionHub from "@/components/editorial/SectionHub";
import ArticleDetailView from "@/components/news/ArticleDetailView";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { HARDWARE_CATEGORIES } from "@/lib/categories";
import { getServerApiUrl } from "@/lib/api";
import { fetchContent } from "@/lib/fetchContent";
import type { Article } from "@/types";

// ISR: revalidate every 10 minutes
export const revalidate = 600;

type Props = {
    params: Promise<{ category: string }>;
};

async function getSeoSettings() {
    try {
        const res = await fetch(`${getServerApiUrl()}/settings`, { next: { revalidate: 3600 } });
        if (!res.ok) return {};
        return res.json();
    } catch { return {}; }
}

async function getInitialCategoryData(categoryId: string) {
    try {
        const params = new URLSearchParams({ page: '1', category: categoryId });
        const res = await fetch(`${getServerApiUrl()}/tech?${params.toString()}`, {
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
    const json = await fetchContent<{ data?: Article } & Article>(
        `${getServerApiUrl()}/tech/${slug}`,
        { next: { revalidate: 600, tags: ['tech', `tech-${slug}`] } },
    );

    return json ? (json.data ?? json) : null;
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

    let imageUrl = article.featured_image_url;
    if (imageUrl && !imageUrl.startsWith('http')) {
        const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL?.replace(/\/$/, '') || '';
        const path = imageUrl.replace(/^\//, '');
        imageUrl = `${storageUrl}/${path}`;
    }
    const images = imageUrl ? [imageUrl] : [];

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `${process.env.NEXT_PUBLIC_APP_URL}/hardware/${slug}`,
            siteName: 'TechPlay',
            type: 'article',
            publishedTime: article.published_at || article.created_at,
            modifiedTime: article.updated_at,
            authors: [article.author?.display_name || article.author?.username || 'TechPlay'],
            images: images,
            locale: 'en_US',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: images,
        },
        alternates: {
            canonical: article.canonical_url || `${process.env.NEXT_PUBLIC_APP_URL}/hardware/${slug}`,
        },
    };
}

export default async function HardwareSlugPage({ params }: Props) {
    const { category: slug } = await params;

    // Check if it's a known category
    const categoryDef = HARDWARE_CATEGORIES.find(c => c.slug === slug);

    if (categoryDef) {
        const initialData = await getInitialCategoryData(categoryDef.id);
        return <SectionHub section="tech" category={categoryDef.id} categoryName={categoryDef.label} initialData={initialData} />;
    }

    // It's an article slug — fetch server-side
    const article = await getArticle(slug);
    if (!article) {
        notFound();
    }

    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://techplay.gg';
    const articleUrl = `${siteUrl}/hardware/${slug}`;

    let featuredImage = article.featured_image_url;
    if (featuredImage && !featuredImage.startsWith('http')) {
        const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL?.replace(/\/$/, '') || '';
        featuredImage = `${storageUrl}/${featuredImage.replace(/^\//, '')}`;
    }

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "mainEntityOfPage": { "@type": "WebPage", "@id": articleUrl },
        "headline": article.seo_title || article.title,
        "description": article.seo_description || article.excerpt || "",
        "image": featuredImage ? [featuredImage] : [],
        "datePublished": article.published_at || article.created_at,
        "dateModified": article.updated_at,
        "author": article.author ? [{
            "@type": "Person",
            "name": article.author.display_name || article.author.username || "TechPlay",
            "url": `${siteUrl}/author/${article.author.username}`,
        }] : [{ "@type": "Organization", "name": "TechPlay", "url": siteUrl }],
        "publisher": {
            "@type": "Organization",
            "name": "TechPlay",
            "logo": { "@type": "ImageObject", "url": `${siteUrl}/logo.png` },
        },
        "url": articleUrl,
        "speakable": { "@type": "SpeakableSpecification", "cssSelector": ["h1", ".article-excerpt"] },
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <ArticleDetailView article={article} initialComments={article.comments || []} />
        </>
    );
}
