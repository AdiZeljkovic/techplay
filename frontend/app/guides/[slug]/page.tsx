import { notFound } from "next/navigation";
import GuideDetailView from "@/components/guides/GuideDetailView";
import axios from "@/lib/axios";
import { Metadata } from "next";

// ISR enabled with on-demand revalidation
export const revalidate = false; // 15 minutes (guides are more evergreen content)

async function getGuide(slug: string) {
    let apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl && apiUrl.includes('localhost')) {
        apiUrl = apiUrl.replace('localhost', '127.0.0.1');
    }

    try {
        const res = await fetch(`${apiUrl}/guides/${slug}`, {
            next: {
                revalidate: 900,
                tags: ['guides', `guide-${slug}`]
            }
        });

        if (!res.ok) return null;

        // Return object structure: { guide: ..., user_vote: ... } or however backend returns it
        // The previous GuideDetail interface showed: { guide: {...}, user_vote: ... }
        return res.json();
    } catch (error) {
        return null;
    }
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

    const images = guide.featured_image_url ? [guide.featured_image_url] : [];

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
    };
}

// ... existing imports

export default async function GuidePage({ params }: Props) {
    const { slug } = await params;
    const data = await getGuide(slug);

    if (!data || !data.guide) {
        return notFound();
    }

    return <GuideDetailView guide={data.guide} userVote={data.user_vote} />;
}
