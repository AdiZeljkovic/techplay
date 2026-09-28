import { getServerApiUrl, serverHeaders } from "@/lib/api";
import type { PublicMasteryRegion, PublicRecipe } from "@/lib/gw2";

/**
 * The Guild Wars 2 reference, read on the server.
 *
 * Separate from `lib/gw2.ts` because the difference matters. That file talks to
 * the API as a signed-in person, through axios, with a Bearer token out of
 * `localStorage`. This one talks to it as nobody, from Node, at build and
 * request time — which is the only way these pages can be server-rendered, and
 * server-rendering them is the only way they can be indexed. A crawler has no
 * localStorage, and a page that needs one renders an empty shell for it.
 *
 * That is also the whole point of the section: the public pages are what brings
 * people in, and connecting an account personalises them rather than unlocking
 * them.
 */

/** How long a page may serve a cached copy. A game patch is what changes any of this. */
export const GW2_REVALIDATE = 86400;

interface Envelope<T> {
    success: boolean;
    data: T;
}

async function read<T>(path: string, revalidate = GW2_REVALIDATE): Promise<T | null> {
    try {
        const response = await fetch(`${getServerApiUrl()}${path}`, {
            headers: serverHeaders(),
            next: { revalidate },
        });

        if (!response.ok) {
            return null;
        }

        const body = (await response.json()) as Envelope<T>;

        return body.data ?? null;
    } catch {
        /*
         * A page that cannot reach the API renders its not-found rather than a
         * stack trace. The catalogue is not going anywhere; a bad minute is not
         * a reason to serve a 500 to a crawler and have the URL dropped.
         */
        return null;
    }
}

export function getPublicRecipe(itemId: number): Promise<PublicRecipe | null> {
    return read<PublicRecipe>(`/gw2/public/recipe/${itemId}`);
}

export function getPublicMasteries(): Promise<PublicMasteryRegion[] | null> {
    return read<PublicMasteryRegion[]>("/gw2/public/masteries");
}

export interface CraftablePage {
    items: { id: number; name: string; slug: string; rarity: string | null; type: string | null; icon: string | null }[];
    page: number;
    pages: number;
    total: number;
}

export function getCraftable(page = 1): Promise<CraftablePage | null> {
    return read<CraftablePage>(`/gw2/public/craftable?page=${page}`);
}

/**
 * The URL an item's page lives at.
 *
 * Id first, always. Names in this catalogue are not unique — 74,265 items share
 * 51,604 names and one of them appears 135 times — so the id is the identifier
 * and the slug is there for the reader and the search engine. A route that
 * matched on the slug would break on "Fallen Adventurer's Backpack" and nowhere
 * else, which is the worst kind of bug to find later.
 */
export function craftingHref(itemId: number, slug: string | null): string {
    return slug ? `/gw2/database/crafting/${itemId}-${slug}` : `/gw2/database/crafting/${itemId}`;
}

/** The leading digits of `{id}-{slug}`, ignoring whatever follows. */
export function itemIdFromSlug(segment: string): number | null {
    const id = Number.parseInt(segment, 10);

    return Number.isFinite(id) && id > 0 ? id : null;
}

export interface PublicGuide {
    family: string;
    slug: string;
    path: string;
    title: string;
    standfirst: string | null;
    body: string | null;
    hero_image: string | null;
    next_steps: Record<string, string>;
    /**
     * What the reader's own account adds, named rather than resolved.
     *
     * The figures behind it are one person's and cannot sit in a page cached
     * for everyone, so the guide carries the key and a client island fetches
     * the rest. The guide has to read correctly without it — §20.2, and also
     * simple arithmetic: a page that is empty for a crawler cannot rank.
     */
    personalise_as: string | null;
    seo: { title: string; description: string | null; keywords: string[] };
    reviewed_at: string | null;
    updated_at: string | null;
}

export function getGuide(family: string, slug: string): Promise<PublicGuide | null> {
    return read<PublicGuide>(`/gw2/public/guides/${encodeURIComponent(family)}/${encodeURIComponent(slug)}`, 3600);
}

export function getGuides(): Promise<{ family: string; slug: string; title: string; standfirst: string | null; path: string; updated_at: string | null }[] | null> {
    return read("/gw2/public/guides", 3600);
}

export function regionHref(region: string): string {
    return `/gw2/database/masteries/${region.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
