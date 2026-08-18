import { notFound } from "next/navigation";
import GuideDetailView, { type Guide } from "@/components/guides/GuideDetailView";
import { Metadata } from "next";
import { getServerApiUrl } from "@/lib/api";
import { fetchContent } from "@/lib/fetchContent";

// ISR enabled with on-demand revalidation
export const revalidate = false; // 15 minutes (guides are more evergreen content)

async function getGuide(slug: string) {
    // Shape: { guide: {...}, user_vote: ... }
    return fetchContent<{ guide: Guide; game: import("@/components/games/GameInfoCard").LinkedGame | null; user_vote: boolean | null }>(`${getServerApiUrl()}/guides/${slug}`, {
        next: { revalidate: 900, tags: ['guides', `guide-${slug}`] },
    });
}

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const data = await getGuide(slug);

    if (!data || !data.guide) {
        return { title: 'Guide Not Found' };
    }

    const { guide } = data;

    let imageUrl = guide.featured_image_url;
    if (imageUrl) {
        if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
            try {
                const urlObj = new URL(imageUrl);
                imageUrl = `${process.env.NEXT_PUBLIC_STORAGE_URL}${urlObj.pathname}`;
            } catch (e) {
                imageUrl = imageUrl.replace(/http:\/\/localhost:\d+/, process.env.NEXT_PUBLIC_STORAGE_URL || '');
            }
        } else if (!imageUrl.startsWith('http')) {
            const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL?.replace(/\/$/, '') || '';
            const path = imageUrl.replace(/^\//, '');
            imageUrl = `${storageUrl}/${path}`;
        }
    }
    const images = imageUrl ? [imageUrl] : [];

    return {
        title: `${guide.title} - TechPlay Guides`,
        description: guide.excerpt || `Read our guide on ${guide.title}`,
        openGraph: {
            title: guide.title,
            description: guide.excerpt || `Read our guide on ${guide.title}`,
            url: `${process.env.NEXT_PUBLIC_APP_URL}/guides/${slug}`,
            siteName: 'TechPlay',
            type: 'article',
            publishedTime: guide.published_at || guide.created_at,
            modifiedTime: guide.updated_at,
            images: images,
            locale: 'en_US',
        },
        twitter: {
            card: 'summary_large_image',
            title: guide.title,
            description: guide.excerpt || `Read our guide on ${guide.title}`,
            images: images,
        },
        alternates: {
            canonical: `${process.env.NEXT_PUBLIC_APP_URL}/guides/${slug}`,
        },
        /*
         * "Hide from search engines" is offered on the guide editor and, until
         * now, was the only thing on that screen wired to nothing: flipping it
         * wrote a column and this page kept emitting the default index,follow.
         */
        robots: {
            index: !guide.is_noindex,
            follow: !guide.is_noindex,
        },
    };
}

// ... existing imports

export default async function GuidePage({ params }: Props) {
    const { slug } = await params;
    const data = await getGuide(slug);

    if (!data || !data.guide) {
        return notFound();
    }

    const { guide } = data;
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://techplay.gg';
    const guideUrl = `${siteUrl}/guides/${slug}`;

    let featuredImage = guide.featured_image_url;
    if (featuredImage && !featuredImage.startsWith('http')) {
        const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL?.replace(/\/$/, '') || '';
        featuredImage = `${storageUrl}/${featuredImage.replace(/^\//, '')}`;
    }

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        "mainEntityOfPage": { "@type": "WebPage", "@id": guideUrl },
        "headline": guide.title,
        "description": guide.excerpt || "",
        "image": featuredImage ? [featuredImage] : [],
        "datePublished": guide.published_at || guide.created_at,
        "dateModified": guide.updated_at,
        "author": guide.author ? [{
            "@type": "Person",
            "name": guide.author.display_name || guide.author.username || "TechPlay",
            "url": `${siteUrl}/author/${guide.author.author_slug || guide.author.username}`,
        }] : [{ "@type": "Organization", "name": "TechPlay", "url": siteUrl }],
        "publisher": {
            "@type": "Organization",
            "name": "TechPlay",
            "logo": { "@type": "ImageObject", "url": `${siteUrl}/logo.png` },
        },
        "url": guideUrl,
        "speakable": { "@type": "SpeakableSpecification", "cssSelector": ["h1", ".article-excerpt"] },
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <GuideDetailView guide={guide} game={data.game ?? null} userVote={data.user_vote} />
        </>
    );
}
