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

    const lists = listing?.data ?? [];
    const url = "https://techplay.gg/lists";

    const breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://techplay.gg" },
            { "@type": "ListItem", position: 2, name: "Game Lists", item: url },
        ],
    };

    /*
     * The lists on the page, named — not a count of them.
     *
     * Only the ones with an author are listed: the URL is
     * /lists/{username}/{slug}, so a list whose author did not come back with
     * the payload has no address to give, and an ItemList entry without a URL
     * describes something a reader cannot reach.
     *
     * `numberOfItems` counts what is actually listed below rather than what
     * the API returned, so the two can never disagree.
     */
    const addressable = lists.filter((list) => list.user?.username);

    const itemList = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Game Lists",
        url,
        description:
            "Rankings made by the community — Top 10s, Top 100s and genre lists, with the games in the order somebody put them.",
        mainEntity: {
            "@type": "ItemList",
            numberOfItems: addressable.length,
            itemListElement: addressable.map((list, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: list.name,
                url: `https://techplay.gg/lists/${list.user!.username}/${list.slug}`,
            })),
        },
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
            <ListsClient initialLists={lists} />
        </>
    );
}
