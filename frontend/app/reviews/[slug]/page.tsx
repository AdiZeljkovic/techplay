import { Review } from "@/types";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import ReviewsCategoryView from "@/components/reviews/ReviewsCategoryView";
import ReviewDetailView from "@/components/reviews/ReviewDetailView";
import { REVIEW_CATEGORIES } from "@/lib/categories";
import { getServerApiUrl } from "@/lib/api";

// ISR enabled with on-demand revalidation
export const revalidate = false; // 10 minutes (reviews change less frequently than news)

async function getReview(slug: string): Promise<Review | null> {
    try {
        const res = await fetch(`${getServerApiUrl()}/reviews/${slug}`, {
            next: {
                revalidate: 600,
                tags: ['reviews', `review-${slug}`]
            }
        });

        if (!res.ok) {
            return null;
        }

        const json = await res.json();
        return json.data;
    } catch (error) {
        return null;
    }
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
        // Render Client Component for Category View
        return <ReviewsCategoryView categorySlug={category.slug} />;
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
                "url": `${siteUrl}/profile/${review.author?.username}`,
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
