/**
 * Where advertising is allowed to exist, and under whose account.
 *
 * The publisher ID used to be written out twice — once in the component and
 * once in the script URL in the root layout — which is the same shape of
 * hazard as a cache key spelled in three places. It lives here now.
 *
 * The host check exists because AdSense reported two sites we never added to
 * the account: `127.0.0.1` with 9 page views and `46.224.110.57` with 1. The
 * ID is compiled into the bundle, and nothing looked at the hostname, so a
 * local `npm run dev` session in a browser — or anyone opening the origin by
 * its bare IP — loaded real ad units and billed real impressions against the
 * account. Google's policies allow ads only on sites you have added; an IP
 * address and a loopback address are not sites, and this account is already
 * under an ad serving limit, so the signal is the last thing it needs.
 *
 * The decision has to be made in the browser: the server renders the same
 * markup for every host, and reading the Host header in the root layout would
 * make every page on the site dynamic to answer a question about advertising.
 */
export const AD_CLIENT = "ca-pub-7427807317921666";

const PRODUCTION_HOSTS = new Set(["techplay.gg", "www.techplay.gg"]);

/** False during SSR, on localhost, on the bare origin IP, and on previews. */
export function adsAllowedHere(): boolean {
    if (typeof window === "undefined") return false;

    return PRODUCTION_HOSTS.has(window.location.hostname);
}
