import { Review } from "@/types";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import ReviewsCategoryView from "@/components/reviews/ReviewsCategoryView";
import ReviewDetailView from "@/components/reviews/ReviewDetailView";
import { REVIEW_CATEGORIES } from "@/lib/categories";

// Force dynamic rendering since we depend on params
export const dynamic = 'force-dynamic';

async function getReview(slug: string): Promise<Review | null> {
    let apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (apiUrl && apiUrl.includes('localhost')) {
        apiUrl = apiUrl.replace('localhost', '127.0.0.1');
    }

    try {
        const res = await fetch(`${apiUrl}/reviews/${slug}`, {
            next: { revalidate: 60 },
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
            type: 'article',
            publishedTime: review.published_at || review.created_at,
            modifiedTime: review.updated_at,
            authors: [review.author?.username || 'TechPlay'],
            images: images,
            // Custom properties if needed, but 'article' type covers mostly
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
            // Snippet preview control could be here too
        }
    };
}

export default async function ReviewSlugPage({ params }: Props) {
    const { slug } = await params;

    // Check if slug matches a category
    const category = REVIEW_CATEGORIES.find(c => c.slug === slug);

    if (category) {
        // Render Client Component for Category View
        return <ReviewsCategoryView categorySlug={category.slug} />;
    }

    // Fetch review data server side for initial render (optional, but good for SEO HTML)
    // Note: ReviewDetailView might fetch again or use passed prop.
    // I refactored ReviewDetailView to accept `review` prop and it does NOT fetch internally anymore.
    // Wait, let's verify ReviewDetailView.tsx Content...
    // I copied ReviewDetailView logic... but the original `ReviewDetailView` in page.tsx fetched data!
    // My new `ReviewDetailView` (and ArticleDetailView) accepts `review`/`article` as PROP.
    // But does it FETCH? 
    // Let's check the code I wrote for them.

    const review = await getReview(slug);

    if (!review) {
        notFound();
    }

    return <ReviewDetailView review={review} />;
}
