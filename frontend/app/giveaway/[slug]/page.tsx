import GiveawayClient from "./GiveawayClient";
import { getServerApiUrl } from "@/lib/api";
import { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://techplay.gg";

function fixImageUrl(url: string | null): string | null {
    if (!url) return null;
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
        try {
            const parsed = new URL(url);
            return `${process.env.NEXT_PUBLIC_STORAGE_URL}${parsed.pathname}`;
        } catch {
            return url.replace(/http:\/\/localhost:\d+/, process.env.NEXT_PUBLIC_STORAGE_URL || '');
        }
    }
    if (!url.startsWith('http')) {
        const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL?.replace(/\/$/, '') || '';
        return `${storageUrl}/${url.replace(/^\//, '')}`;
    }
    return url;
}

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;

    // getServerApiUrl prefers NEXT_PRIVATE_API_URL — the address that does not
    // leave the box. Reaching for the public hostname from the server means
    // going out through Cloudflare and back, and this page was the one place
    // still doing it: the fetch never produced JSON, so every giveaway shared
    // to Discord or Facebook came out titled "Giveaway" with no description
    // and no image.
    try {
        const res = await fetch(`${getServerApiUrl()}/giveaways/${slug}`, {
            next: { revalidate: 60 },
        });

        if (!res.ok) {
            return { title: "Giveaway" };
        }

        const data = await res.json();
        const giveaway = data.data;

        const title = giveaway.title;
        const prizeValue = giveaway.prize.value ? ` worth €${giveaway.prize.value}` : '';
        const description = `Win ${giveaway.prize.name}${prizeValue}! Enter the giveaway and complete tasks to increase your chances of winning.`;

        const imageUrl = fixImageUrl(giveaway.featured_image || giveaway.prize?.image);
        const images = imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: title }] : [];

        return {
            title,
            description,
            openGraph: {
                title: `🎁 ${title}`,
                description,
                type: 'website',
                siteName: 'TechPlay',
                url: `${siteUrl}/giveaway/${slug}`,
                images,
            },
            twitter: {
                card: 'summary_large_image',
                title: `🎁 ${title}`,
                description,
                images: imageUrl ? [imageUrl] : [],
            },
        };
    } catch {
        return { title: "Giveaway" };
    }
}

export default async function GiveawayPage({ params }: PageProps) {
    const { slug } = await params;

    return <GiveawayClient slug={slug} />;
}
