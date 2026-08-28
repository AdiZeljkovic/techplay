import { getServerApiUrl, serverHeaders } from "@/lib/api";

/**
 * The first page of a facet, fetched on the server.
 *
 * GameDatabaseHub draws its grid from SWR, which answers in the browser and
 * nowhere else — so /games/genre/action rendered a heading and then an empty
 * shelf, and none of the 84 facet hubs pointed a single link into the
 * catalogue. Measured on production: 0 anchors to /games/{slug} from any of
 * them.
 *
 * The query below mirrors the one the hub builds on its own first render —
 * same filter, same ordering, same page size — so the rows the server sends
 * are the rows SWR replaces them with, and the grid does not jump on
 * hydration.
 *
 * Failure is quiet on purpose. A facet page without its grid is the situation
 * this fixes; a facet page that will not build is worse.
 */
export interface FacetPreset {
    genre?: string;
    platform?: string;
    tag?: string;
    yearFrom?: number;
    yearTo?: number;
}

export interface FacetGame {
    id: number;
    slug: string;
    name: string;
    released: string | null;
    cover_url: string | null;
    rating: number | null;
    platforms?: string[];
}

export async function fetchFacetGames(preset: FacetPreset): Promise<FacetGame[]> {
    const q = new URLSearchParams();

    if (preset.genre) q.set("genres", preset.genre);
    if (preset.platform) q.set("platforms", preset.platform);
    if (preset.tag) q.set("tags", preset.tag);

    if (preset.yearFrom) {
        q.set("year_from", String(preset.yearFrom));
        q.set("year_to", String(preset.yearTo ?? preset.yearFrom));
    }

    // The hub's own defaults: highest rated first, thirty to a page.
    q.set("ordering", "-rating");
    q.set("page", "1");
    q.set("page_size", "30");

    try {
        const res = await fetch(`${getServerApiUrl()}/games?${q.toString()}`, {
            next: { revalidate: 3600 },
            headers: serverHeaders(),
        });

        if (!res.ok) return [];

        const json = await res.json();

        return (json.results ?? []) as FacetGame[];
    } catch {
        return [];
    }
}
