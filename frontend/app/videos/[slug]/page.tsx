import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";

// Force dynamic rendering since we depend on params
export const dynamic = 'force-dynamic';

interface VideoItem {
    id: number;
    title: string;
    slug: string;
    youtube_url: string;
    youtube_id: string;
    thumbnail_url?: string;
    published_at: string;
}

async function getVideo(slug: string): Promise<VideoItem | null> {
    let apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (apiUrl && apiUrl.includes('localhost')) {
        apiUrl = apiUrl.replace('localhost', '127.0.0.1');
    }

    try {
        const res = await fetch(`${apiUrl}/videos/${slug}`, {
            next: { revalidate: 60 },
        });

        if (!res.ok) {
            return null;
        }

        return res.json();
    } catch (error) {
        return null;
    }
}

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const { slug } = await params;
    const video = await getVideo(slug);

    if (!video) {
        return {
            title: 'Video Not Found',
        };
    }

    const title = video.title;
    const description = `Watch ${video.title} on TechPlay.`;
    const thumbnailUrl = video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`;

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            type: 'video.other',
            url: `${process.env.NEXT_PUBLIC_APP_URL}/videos/${video.slug}`,
            images: [thumbnailUrl],
        },
        twitter: {
            card: 'player',
            title: title,
            description: description,
            images: [thumbnailUrl],
        },
    };
}

export default async function VideoPage({ params }: Props) {
    const { slug } = await params;
    const video = await getVideo(slug);

    if (!video) {
        notFound();
    }

    const thumbnailUrl = video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`;
    const embedUrl = `https://www.youtube.com/embed/${video.youtube_id}`;

    // VideoObject Schema
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": video.title,
        "description": `Watch ${video.title} on TechPlay.`,
        "thumbnailUrl": [thumbnailUrl],
        "uploadDate": video.published_at,
        "embedUrl": embedUrl,
        "contentUrl": video.youtube_url, // Or same as embed? Usually contentUrl is raw file, embedUrl is player. YouTube uses embedUrl.
        "interactionStatistic": {
            "@type": "InteractionCounter",
            "interactionType": { "@type": "WatchAction" },
            "userInteractionCount": 0 // We don't track views yet
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Script
                id="video-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {/* Header */}
            <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <div className="container mx-auto px-4 py-6">
                    <Link
                        href="/videos"
                        className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Videos
                    </Link>

                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-4">
                        {video.title}
                    </h1>

                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Published {formatDistanceToNow(new Date(video.published_at), { addSuffix: true })}</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-5xl mx-auto">
                    <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-[var(--border)] bg-black mb-8">
                        <iframe
                            src={embedUrl}
                            title={video.title}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>

                    {/* Here we could add comments or related videos later */}
                </div>
            </div>
        </div>
    );
}
