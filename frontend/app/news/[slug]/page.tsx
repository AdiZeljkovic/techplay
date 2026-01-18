import { Article } from "@/types";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import NewsCategoryView from "@/components/news/NewsCategoryView";
import ArticleDetailView from "@/components/news/ArticleDetailView";
import { NEWS_CATEGORIES } from "@/lib/categories";

// PERFORMANCE: ISR - Regenerate pages every 60 seconds
export const revalidate = 60;

async function getArticle(slug: string): Promise<Article | null> {
    let apiUrl = process.env.NEXT_PUBLIC_API_URL;

    // Fix for Node.js IPv6 localhost resolution issues
    if (apiUrl && apiUrl.includes('localhost')) {
        apiUrl = apiUrl.replace('localhost', '127.0.0.1');
    }

    try {
        const res = await fetch(`${apiUrl}/news/${slug}`, {
            next: { revalidate: 60 },
        });

        if (!res.ok) {
            return null;
        }

        const json = await res.json();
        // API returns { data: {...} } wrapper - extract the actual article
        return json.data || json;
    } catch (error) {
        return null;
    }
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
                description: `Latest news and updates from the ${category.label} world.`,
            }
        };
    }

    const article = await getArticle(slug);
    // ... rest of metadata logic (using article)

    if (!article) {
        return {
            title: 'Article Not Found',
        };
    }

    const title = article.seo_title || article.title;
    const description = article.seo_description || article.excerpt || "Read more on TechPlay.";
    const images = article.featured_image_url
        ? [article.featured_image_url.startsWith('http') ? article.featured_image_url : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${article.featured_image_url}`]
        : [];

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            type: 'article',
            publishedTime: article.published_at || article.created_at,
            modifiedTime: article.updated_at,
            authors: [article.author?.display_name || article.author?.username || 'TechPlay'],
            images: images,
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description: description,
            images: images,
        },
        alternates: {
            canonical: article.canonical_url || `${process.env.NEXT_PUBLIC_APP_URL}/news/${slug}`,
        },
        robots: {
            index: !article.is_noindex,
            follow: !article.is_noindex,
        }
    };
}

async function getComments(id: number, type: string = 'article') {
    let apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl && apiUrl.includes('localhost')) {
        apiUrl = apiUrl.replace('localhost', '127.0.0.1');
    }
    try {
        const res = await fetch(`${apiUrl}/comments/${type}/${id}`, {
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
        return <NewsCategoryView categorySlug={category.slug} />;
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

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": article.seo_title || article.title,
        "image": [
            article.featured_image_url?.startsWith('http')
                ? article.featured_image_url
                : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${article.featured_image_url}`
        ],
        "datePublished": article.published_at || article.created_at,
        "dateModified": article.updated_at,
        "author": [{
            "@type": "Person",
            "name": article.author?.display_name || article.author?.username || "TechPlay Editor",
            "url": `${process.env.NEXT_PUBLIC_APP_URL}/profile/${article.author?.username}`
        }]
    };

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
