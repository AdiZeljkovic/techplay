import { Review } from "@/types";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import SectionHub from "@/components/editorial/SectionHub";
import ReviewDetailView from "@/components/reviews/ReviewDetailView";
import { REVIEW_CATEGORIES } from "@/lib/categories";
import { getServerApiUrl } from "@/lib/api";
import { fetchContent } from "@/lib/fetchContent";

// ISR enabled with on-demand revalidation
export const revalidate = false; // 10 minutes (reviews change less frequently than news)

/**
 * A category page is a real, indexed page, so its first screen is rendered on
 * the server rather than left to the client to fetch.
 */
async function getInitialCategoryData(categorySlug: string) {
    try {
        const params = new URLSearchParams({ page: '1', category: categorySlug });
        const res = await fetch(`${getServerApiUrl()}/reviews?${params.toString()}`, {
            next: { revalidate: 600, tags: ['reviews'] },
            headers: { 'Accept': 'application/json' },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

async function getReview(slug: string): Promise<Review | null> {
    const json = await fetchContent<{ data: Review }>(`${getServerApiUrl()}/reviews/${slug}`, {
        next: { revalidate: 600, tags: ['reviews', `review-${slug}`] },
    });

    return json?.data ?? null;
}

type Props = {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const { slug } = await params;

    // Check if category
    const category = REVIEW_CATEGORIES.find(c => c.slug === slug);
    if (category) {
        return {
            title: `${category.label} Reviews - TechPlay`,
            description: category.label === "Latest" ? "The freshest reviews hot off the press." : `Browsing ${category.label} reviews.`,
            openGraph: {
                title: `${category.label} Reviews - TechPlay`,
                description: category.label === "Latest" ? "The freshest reviews hot off the press." : `Browsing ${category.label} reviews.`,
            }
        };
    }

    const review = await getReview(slug);

    if (!review) {
        return {
            title: 'Review Not Found',
        };
    }

    const title = review.seo_title || review.title;
    // Construct a rich description with score
    const scoreStr = `Rating: ${review.rating}/10.`;
    const description = review.seo_description || review.summary || review.excerpt || `${scoreStr} Read our full review of ${review.item_name || review.title} on TechPlay.`;
    const images = review.cover_image || review.featured_image_url
        ? [(review.cover_image || review.featured_image_url)!.startsWith('http')
            ? (review.cover_image || review.featured_image_url)!
            : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${review.cover_image || review.featured_image_url}`]
        : [];

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            url: review.canonical_url || `${process.env.NEXT_PUBLIC_APP_URL}/reviews/${slug}`,
            siteName: 'TechPlay',
            type: 'article',
            publishedTime: review.published_at || review.created_at,
            modifiedTime: review.updated_at,
            authors: [review.author?.display_name || review.author?.username || 'TechPlay'],
            images: images,
            locale: 'en_US',
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description: description,
            images: images,
        },
        alternates: {
            canonical: review.canonical_url || `${process.env.NEXT_PUBLIC_APP_URL}/reviews/${slug}`,
        },
        robots: {
            index: !review.is_noindex,
            follow: !review.is_noindex,
        }
    };
}

// ... existing imports

// ... existing imports

export default async function ReviewSlugPage({ params }: Props) {
    const { slug } = await params;

    // Check if slug matches a category
    const category = REVIEW_CATEGORIES.find(c => c.slug === slug);

    if (category) {
        // `id` is the slug the database and the API use; `slug` is the segment
        // in the URL. The hub filters on the former.
        const initialData = await getInitialCategoryData(category.id);
        return <SectionHub section="reviews" category={category.id} categoryName={category.label} initialData={initialData} />;
    }

    const review = await getReview(slug);

    if (!review) {
        notFound();
    }

    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://techplay.gg';
    const reviewUrl = review.canonical_url || `${siteUrl}/reviews/${slug}`;
    const coverImage = (review.cover_image || review.featured_image_url)?.startsWith('http')
        ? (review.cover_image || review.featured_image_url)
        : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${review.cover_image || review.featured_image_url}`;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": review.item_name || review.title,
        "image": coverImage ? [coverImage] : [],
        "description": review.seo_description || review.summary || review.excerpt || "",
        "review": {
            "@type": "Review",
            "name": review.seo_title || review.title,
            "url": reviewUrl,
            "datePublished": review.published_at || review.created_at,
            "author": {
                "@type": "Person",
                "name": review.author?.display_name || review.author?.username || "TechPlay Editor",
                "url": `${siteUrl}/author/${review.author?.author_slug || review.author?.username}`,
            },
            "publisher": {
                "@type": "Organization",
                "name": "TechPlay",
                "logo": {
                    "@type": "ImageObject",
                    "url": `${siteUrl}/logo.png`,
                },
            },
            "reviewRating": review.rating ? {
                "@type": "Rating",
                "ratingValue": review.rating,
                "bestRating": "10",
                "worstRating": "1",
            } : undefined,
        },
        "aggregateRating": review.rating ? {
            "@type": "AggregateRating",
            "ratingValue": review.rating,
            "bestRating": "10",
            "worstRating": "1",
            "ratingCount": "1",
        } : undefined,
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ReviewDetailView review={review} />
        </>
    );
}
