import GiveawayClient from "./GiveawayClient";
import { getServerApiUrl, serverHeaders } from "@/lib/api";
import { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://techplay.gg";

/**
 * The share card's picture, as an address the outside world can reach.
 *
 * Two shapes arrive here and they need opposite treatment, which is the trap
 * this function fell into.
 *
 * Laravel's asset() builds its URL from the host that asked, and the server
 * component asks over 127.0.0.1 — so the API answers
 * `https://127.0.0.1:8000/storage/giveaways/x.jpg`. That is already a full
 * path including /storage; only the origin is wrong. The old code took the
 * pathname and glued it onto NEXT_PUBLIC_STORAGE_URL, which itself ends in
 * /storage, and produced `…/storage/storage/giveaways/x.jpg`. Every giveaway
 * shared to Facebook, Discord or X carried an og:image that answered 404, and
 * nothing showed it: the tag was present and well-formed, the page rendered,
 * and the only symptom was a link preview with no picture.
 *
 * A bare `giveaways/x.jpg` has no /storage in it and does need the whole base.
 * Hence two branches rather than one clever line.
 */
function fixImageUrl(url: string | null): string | null {
    if (!url) return null;

    const storageBase = (process.env.NEXT_PUBLIC_STORAGE_URL || '').replace(/\/$/, '');

    if (url.startsWith('http')) {
        // A full URL. If it points at this box under a name the outside world
        // cannot resolve, swap the origin and keep the path exactly as it is.
        try {
            const parsed = new URL(url);

            if (['localhost', '127.0.0.1'].includes(parsed.hostname)) {
                const publicOrigin = storageBase ? new URL(storageBase).origin : siteUrl;

                return `${publicOrigin}${parsed.pathname}`;
            }
        } catch {
            // Not parseable. Better to hand back what we were given than to
            // invent an address; a wrong picture is worse than none.
        }

        return url;
    }

    // A stored path, relative to the storage root.
    return `${storageBase}/${url.replace(/^\//, '')}`;
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
            headers: serverHeaders(),
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

        /*
         * The real pixel size, not a guess.
         *
         * These were hard-coded to 1200x630 for every giveaway. The live GTA 6
         * banner is 1916x821, and a scraper that believes the declared size
         * lays the picture out to the wrong shape — or, when it checks, decides
         * the tag is unreliable and drops the card's image altogether. The API
         * measures the file, so the honest numbers are already in the payload;
         * when it cannot read the file it sends nothing, and then declaring no
         * size is better than declaring a wrong one.
         */
        const measured = giveaway.featured_image_size;
        const images = imageUrl
            ? [{
                url: imageUrl,
                alt: title,
                ...(measured?.width && measured?.height
                    ? { width: measured.width, height: measured.height }
                    : {}),
            }]
            : [];

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
