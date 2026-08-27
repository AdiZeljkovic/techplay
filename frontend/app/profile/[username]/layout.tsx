import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerApiUrl, serverHeaders } from "@/lib/api";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://techplay.gg";

interface ProfileHead {
    user?: { username?: string; display_name?: string | null };
    is_private?: boolean;
    can_view?: boolean;
    stats?: { games_count?: number; achievements_count?: number } | null;
    player_card?: { hours?: number; span?: { from: number; to: number } | null } | null;
}

/**
 * What a search result should say about a player.
 *
 * "Check out X's gaming profile on TechPlay.gg" was true of all fifty-three
 * accounts and told a reader nothing about any of them — the same sentence in
 * every snippet, which is the shape of a page with no content. The numbers
 * were already in the payload this function fetches; they just never reached
 * the description. Each clause appears only if it has something behind it, so
 * an empty profile gets the short form rather than a row of zeroes.
 */
function describe(name: string, profile: ProfileHead | null): string {
    const parts: string[] = [];
    const games = profile?.stats?.games_count ?? 0;
    const hours = profile?.player_card?.hours ?? 0;
    const span = profile?.player_card?.span;
    const achievements = profile?.stats?.achievements_count ?? 0;

    if (games > 0) parts.push(`${games.toLocaleString()} ${games === 1 ? "game" : "games"}`);
    if (hours > 0) parts.push(`${hours.toLocaleString()} hours played`);
    if (achievements > 0) parts.push(`${achievements.toLocaleString()} achievements`);

    if (parts.length === 0) return `${name}'s gaming profile on TechPlay — collection, achievements and activity.`;

    const since = span ? `, playing since ${span.from}` : "";

    return `${name} on TechPlay: ${parts.join(", ")}${since}.`;
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

    // A locked profile's numbers are not the crawler's business either — it
    // gets the name and nothing more.
    const description = hidden ? `${name} on TechPlay.gg` : describe(name, profile);

    return {
        title: `${name}'s Profile`,
        description,
        robots: hidden ? { index: false, follow: false } : undefined,
        alternates: { canonical: `${APP_URL}/profile/${username}` },
        openGraph: {
            title: `${name} on TechPlay`,
            description,
            images: [{ url: ogImage, width: 1200, height: 630, alt: `${name}'s TechPlay profile` }],
            type: "profile",
        },
        twitter: {
            card: "summary_large_image",
            title: `${name} on TechPlay`,
            description,
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
    const lookup = username === "me" ? null : await loadProfile(username);

    if (lookup?.state === "missing") {
        notFound();
    }

    const profile = lookup?.state === "found" ? lookup.profile : null;
    const name = profile?.user?.display_name || profile?.user?.username || username;

    return (
        <>
            {/*
              * The profile's primary heading.
              *
              * Everything on this page — the hero, the name, the level ring —
              * is drawn on the client, so the server sent a document with no
              * h1 at all. The name reached search engines only through the
              * meta description, which is the one place it was already
              * excellent ("281 games, 3,104 hours played"). The lookup above
              * has the profile in hand either way, so the heading costs
              * nothing and changes nothing visually.
              */}
            <h1 className="sr-only">{name} on TechPlay</h1>
            {children}
        </>
    );
}
