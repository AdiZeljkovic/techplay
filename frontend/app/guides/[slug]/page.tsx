import { notFound } from "next/navigation";
import GuideDetailView from "@/components/guides/GuideDetailView";
import axios from "@/lib/axios";
import { Metadata } from "next";

// Force dynamic
export const dynamic = 'force-dynamic';

async function getGuide(slug: string) {
    let apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl && apiUrl.includes('localhost')) {
        apiUrl = apiUrl.replace('localhost', '127.0.0.1');
    }

    try {
        const res = await fetch(`${apiUrl}/guides/${slug}`, {
            next: { revalidate: 60 }
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
    return {
        title: `${guide.title} - TechPlay Guides`,
        description: guide.excerpt || `Read our guide on ${guide.title}`,
        openGraph: {
            title: guide.title,
            description: guide.excerpt,
            images: guide.featured_image_url ? [guide.featured_image_url] : []
        }
    };
}

export default async function GuidePage({ params }: Props) {
    const { slug } = await params;
    const data = await getGuide(slug);

    if (!data || !data.guide) {
        return notFound();
    }

    return <GuideDetailView guide={data.guide} userVote={data.user_vote} />;
}
