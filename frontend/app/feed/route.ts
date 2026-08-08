import { GET as rssGet } from "../rss/route";

/**
 * The feed has two published addresses: the <link rel="alternate"> and the
 * backend's own atom:self both say /feed, while the footer says /rss. This is
 * the same document under the older name, so neither breaks.
 */
export const revalidate = 900;

export function GET(request: Request) {
    return rssGet(request);
}
