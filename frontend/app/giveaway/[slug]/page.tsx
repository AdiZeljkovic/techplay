import GiveawayClient from "./GiveawayClient";
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

    let apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl && apiUrl.includes('localhost')) {
        apiUrl = apiUrl.replace('localhost', '127.0.0.1');
    }

    try {
        const res = await fetch(`${apiUrl}/giveaways/${slug}`, {
            next: { revalidate: 60 },
        });

        if (!res.ok) {
            return { title: "Giveaway | TechPlay" };
        }

        const data = await res.json();
        const giveaway = data.data;

        const title = giveaway.title;
        const prizeValue = giveaway.prize.value ? ` worth €${giveaway.prize.value}` : '';
        const description = `Win ${giveaway.prize.name}${prizeValue}! Enter the giveaway and complete tasks to increase your chances of winning.`;

        const imageUrl = fixImageUrl(giveaway.featured_image || giveaway.prize?.image);
        const images = imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: title }] : [];

        return {
            title: `${title} | TechPlay Giveaway`,
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
        return { title: "Giveaway | TechPlay" };
    }
}

export default async function GiveawayPage({ params }: PageProps) {
    const { slug } = await params;

    return <GiveawayClient slug={slug} />;
}
