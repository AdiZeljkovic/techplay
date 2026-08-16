import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerApiUrl, serverHeaders } from "@/lib/api";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://techplay.gg";

interface ProfileHead {
    user?: { username?: string; display_name?: string | null };
    is_private?: boolean;
    can_view?: boolean;
}

/**
 * Does this account exist, and what does it want said about it?
 *
 * Three answers, not two. "missing" is the backend saying so; "unknown" is the
 * backend not answering, and a hiccup there must never turn every profile on
 * the site into a 404.
 *
 * Both generateMetadata and the layout need this, and Next dedupes identical
 * fetches inside one render pass, so asking twice costs one request. Five
 * minutes of cache: a just-created profile is worth that wait, and a username
 * nobody will ever take is not worth asking about repeatedly.
 */
type ProfileLookup = { state: "found"; profile: ProfileHead } | { state: "missing" } | { state: "unknown" };

async function loadProfile(username: string): Promise<ProfileLookup> {
    try {
        const res = await fetch(`${getServerApiUrl()}/users/${encodeURIComponent(username)}`, {
            next: { revalidate: 300 },
            headers: serverHeaders(),
        });

        if (res.status === 404) return { state: "missing" };
        if (!res.ok) return { state: "unknown" };

        return { state: "found", profile: (await res.json()) as ProfileHead };
    } catch {
        return { state: "unknown" };
    }
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
    const { username } = await params;
    const lookup = await loadProfile(username);
    const profile = lookup.state === "found" ? lookup.profile : null;
    const name = profile?.user?.display_name || profile?.user?.username || username;
    const ogImage = `${APP_URL}/og/profile?username=${encodeURIComponent(username)}`;

    // Two kinds of page must stay out of the index. A username nobody has
    // taken is an infinite crawl surface — every string was a 200 with an
    // OG image rendered on demand. A friends-only profile is a locked door,
    // and a locked door in the search results is a worse result than none.
    const hidden = lookup.state !== "found" || profile?.can_view === false;

    return {
        title: `${name}'s Profile`,
        description: `Check out ${name}'s gaming profile on TechPlay.gg`,
        robots: hidden ? { index: false, follow: false } : undefined,
        alternates: { canonical: `${APP_URL}/profile/${username}` },
        openGraph: {
            title: `${name} on TechPlay`,
            description: `Check out ${name}'s gaming profile on TechPlay.gg`,
            images: [{ url: ogImage, width: 1200, height: 630, alt: `${name}'s TechPlay profile` }],
            type: "profile",
        },
        twitter: {
            card: "summary_large_image",
            title: `${name} on TechPlay`,
            description: `Check out ${name}'s gaming profile on TechPlay.gg`,
            images: [ogImage],
        },
    };
}

export default async function ProfileLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ username: string }>;
}) {
    const { username } = await params;

    // `me` resolves on the client against the stored session — the server has
    // no way to know who that is, so it is never checked here.
    if (username !== "me" && (await loadProfile(username)).state === "missing") {
        notFound();
    }

    return <>{children}</>;
}
