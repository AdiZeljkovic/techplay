import { Article } from "@/types";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import SectionHub from "@/components/editorial/SectionHub";
import ArticleDetailView from "@/components/news/ArticleDetailView";
import { NEWS_CATEGORIES } from "@/lib/categories";
import { getServerApiUrl, serverHeaders } from "@/lib/api";
import { fetchContent } from "@/lib/fetchContent";

// On-demand ISR - no automatic revalidation, only manual via /api/revalidate
// Backend triggers revalidation when content is updated
export const revalidate = false; // Disable automatic revalidation - only on-demand

/**
 * A category page is a real, indexed page, so its first screen is rendered on
 * the server rather than left to the client to fetch.
 */
async function getInitialCategoryData(categorySlug: string) {
    try {
        const params = new URLSearchParams({ page: '1', category: categorySlug });
        const res = await fetch(`${getServerApiUrl()}/news?${params.toString()}`, {
            next: { revalidate: 300, tags: ['news'] },
            headers: serverHeaders() });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

async function getArticle(slug: string): Promise<Article | null> {
    const json = await fetchContent<{ data?: Article } & Article>(`${getServerApiUrl()}/news/${slug}`, {
        cache: 'force-cache', // Cache until manually revalidated
        next: { tags: ['news', `news-${slug}`] } });

    // null means the API said this article is gone; anything else the API
    // could not answer has already thrown, so the reader is not told a live
    // article does not exist.
    return json ? (json.data ?? json) : null;
}

// ... imports

// Fix for Next.js 15: params is a Promise
type Props = {
    params: Promise<{ slug: string }>; // Updated type
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const { slug } = await params;

    // Check if category first
    const category = NEWS_CATEGORIES.find(c => c.slug === slug);
    if (category) {
        return {
            title: `${category.label} News - TechPlay`,
            description: `Latest news and updates from the ${category.label} world.`,
            openGraph: {
                title: `${category.label} News - TechPlay`,
                description: `Latest news and updates from the ${category.label} world.` }
        };
    }

    const article = await getArticle(slug);
    // ... rest of metadata logic (using article)

    if (!article) {
        return {
            title: 'Article Not Found' };
    }

    const title = article.meta_title || article.title;
    const description = article.meta_description || article.excerpt || "Read more on TechPlay.";

    // Robust Image URL generation
    let imageUrl = article.featured_image_url;
    if (imageUrl) {
        // Fix localhost/127.0.0.1 in URLs (common dev/prod mismatch)
        if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
            try {
                const urlObj = new URL(imageUrl);
                imageUrl = `${process.env.NEXT_PUBLIC_STORAGE_URL}${urlObj.pathname}`;
            } catch (e) {
                // If invalid URL, fall back to simple replacement
                imageUrl = imageUrl.replace(/http:\/\/localhost:\d+/, process.env.NEXT_PUBLIC_STORAGE_URL || '');
            }
        }
        // Handle relative paths
        else if (!imageUrl.startsWith('http')) {
            const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL?.replace(/\/$/, '') || '';
            const path = imageUrl.replace(/^\//, '');
            imageUrl = `${storageUrl}/${path}`;
        }
    }

    const images = imageUrl ? [imageUrl] : [];

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            url: article.canonical_url || `${process.env.NEXT_PUBLIC_APP_URL}/news/${slug}`,
            siteName: 'TechPlay',
            type: 'article',
            publishedTime: article.published_at || article.created_at,
            modifiedTime: article.updated_at,
            authors: [article.author?.display_name || article.author?.username || 'TechPlay'],
            images: images,
            locale: 'en_US' },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description: description,
            images: images },
        alternates: {
            canonical: article.canonical_url || `${process.env.NEXT_PUBLIC_APP_URL}/news/${slug}` },
        keywords: Array.isArray(article.tags) && article.tags.length > 0
            ? article.tags.join(', ')
            : (article.focus_keyword || undefined),
        robots: {
            index: !article.is_noindex,
            follow: !article.is_noindex }
    };
}

async function getComments(id: number, type: string = 'article') {
    // The article itself already comes through getServerApiUrl; its comments
    // were the one call still going out to the public hostname and back.
    try {
        const res = await fetch(`${getServerApiUrl()}/comments/${type}/${id}`, {
            next: { revalidate: 0 }, // Comments should be fresh? Or short cache?
            // User requested "Instant".
            // Since we have cache tags/invalidation, we can cache it short term e.g 10s or 0.
            // Let's use 0 (no-store) ensuring fresh comments on page refresh, 
            // since we depend on hydration for persistence.
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.data || [];
    } catch (e) {
        return [];
    }
}

// ... imports

// ... types

export default async function NewsSlugPage({ params }: Props) {
    const { slug } = await params;

    // Check if slug matches a category
    const category = NEWS_CATEGORIES.find(c => c.slug === slug);

    if (category) {
        // `id` is the slug the database and the API use; `slug` is the segment
        // in the URL. The hub filters on the former.
        const initialData = await getInitialCategoryData(category.id);
        return <SectionHub section="news" category={category.id} categoryName={category.label} initialData={initialData} />;
    }

    const article = await getArticle(slug);

    if (!article) {
        notFound();
    }

    // Optimization: Comments are now included in the article payload (Eager Loaded)
    // No second request needed.
    // If article.comments is undefined (old api), fallback to empty array.
    // We assume the backend change is deployed.
    const comments = article.comments || [];

    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://techplay.gg';
    const articleUrl = article.canonical_url || `${siteUrl}/news/${article.slug}`;
    const featuredImage = article.featured_image_url?.startsWith('http')
        ? article.featured_image_url
        : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${article.featured_image_url}`;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": articleUrl },
        "headline": article.meta_title || article.title,
        "description": article.meta_description || article.excerpt || "",
        "image": featuredImage ? [featuredImage] : [],
        "datePublished": article.published_at || article.created_at,
        "dateModified": article.updated_at,
        "author": [{
            "@type": "Person",
            "name": article.author?.display_name || article.author?.username || "TechPlay Editor",
            "url": `${siteUrl}/author/${article.author?.author_slug || article.author?.username}` }],
        "publisher": {
            "@type": "Organization",
            "name": "TechPlay",
            "logo": {
                "@type": "ImageObject",
                "url": `${siteUrl}/logo.png` } },
        "url": articleUrl,
        "speakable": {
            "@type": "SpeakableSpecification",
            "cssSelector": ["h1", ".article-excerpt"] } };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ArticleDetailView article={article} initialComments={comments} />
        </>
    );
}
