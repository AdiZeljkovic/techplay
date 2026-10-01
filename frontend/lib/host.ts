/**
 * Which hostnames are the real site.
 *
 * This started life inside the AdSense config, for a reason worth keeping:
 * AdSense reported two sites nobody had added to the account — `127.0.0.1`
 * with 9 page views and `46.224.110.57` with 1 — because the publisher ID is
 * compiled into the bundle and nothing looked at the hostname. A local
 * `npm run dev` session, or anyone opening the origin by its bare IP, loaded
 * real ad units and billed real impressions.
 *
 * Clarity has the same exposure with worse consequences: it records sessions.
 * Left ungated it would film developers working on the site and file the
 * footage under a production project. So the list moved here rather than being
 * written out a second time, because two copies of "which hosts are real" is
 * how one of them quietly goes stale.
 */

export const PRODUCTION_HOSTS = ["techplay.gg", "www.techplay.gg"] as const;

/**
 * False during SSR, on localhost, on the bare origin IP, and on previews.
 *
 * The question can only be answered in the browser. The server renders the
 * same markup for every host, and reading the Host header in the root layout
 * would make every page on the site dynamic to answer it.
 */
export function isProductionHost(): boolean {
    if (typeof window === "undefined") return false;

    return (PRODUCTION_HOSTS as readonly string[]).includes(window.location.hostname);
}
