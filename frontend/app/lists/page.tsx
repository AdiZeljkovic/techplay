import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import { getApiUrl } from "@/lib/api";
import { fetchContent } from "@/lib/fetchContent";
import type { GameListPreview } from "@/lib/types/profile";
import ListsClient from "./ListsClient";

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata("/lists", {
        title: "Game Lists",
        description:
            "Rankings made by the community — Top 10s, Top 100s and genre lists, with the games in the order somebody put them.",
    });
}

/**
 * The index that was missing.
 *
 * `/lists/{username}/{slug}` has always served a single list, and two places
 * linked to `/lists` for the directory above it — the user menu's "My Lists"
 * and the community rail's "View all" — but no page.tsx ever sat here, so both
 * landed on a 404. The menu entry now goes to your own Lists tab, where your
 * lists actually live; this page is what the community rail was pointing at.
 */
export const revalidate = 600;

export default async function ListsPage() {
    const listing = await fetchContent<{ data: GameListPreview[] }>(
        `${getApiUrl()}/game-lists/discover?limit=20`,
        { next: { revalidate: 600 } },
    ).catch(() => null);

    return <ListsClient initialLists={listing?.data ?? []} />;
}
