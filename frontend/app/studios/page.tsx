import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import { getApiUrl } from "@/lib/api";
import { fetchContent } from "@/lib/fetchContent";
import StudiosClient, { type StudioCard, type Pagination } from "./StudiosClient";

export async function generateMetadata(): Promise<Metadata> {
    return generatePageMetadata("/studios", {
        title: "Game Studios",
        description:
            "The developers and publishers behind the games — who made what, where they are, and everything they have shipped.",
    });
}

/**
 * Rendered once, not per request.
 *
 * Filters live in the browser, the way they do on the games hub, but the first
 * page is fetched here and handed down. A crawler that never runs the client
 * component still gets a page with studios on it, which is the entire reason
 * this section exists.
 */
export const revalidate = 3600;

interface Listing {
    data: StudioCard[];
    pagination: Pagination;
}

export default async function StudiosPage() {
    const listing = await fetchContent<Listing>(`${getApiUrl()}/studios?sort=games`, {
        next: { revalidate: 3600 },
    }).catch(() => null);

    return (
        <StudiosClient
            initialStudios={listing?.data ?? []}
            initialPagination={listing?.pagination ?? null}
        />
    );
}
