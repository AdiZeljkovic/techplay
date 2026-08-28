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
    /** A series slug, resolved to its key by the API — see /games/series. */
    series?: string;
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
    if (preset.series) q.set("series", preset.series);

    if (preset.yearFrom) {
        q.set("year_from", String(preset.yearFrom));
        q.set("year_to", String(preset.yearTo ?? preset.yearFrom));
    }

    /*
     * The hub's own defaults: highest rated first, thirty to a page.
     *
     * A series is the exception. "Final Fantasy games" is a question about a
     * sequence, and answering it with the best-reviewed entry first buries
     * where the sequence starts — so these open oldest-first, and the hub is
     * told the same so the grid does not reshuffle on hydration.
     */
    q.set("ordering", preset.series ? "released" : "-rating");
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
