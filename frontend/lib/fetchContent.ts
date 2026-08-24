/**
 * Fetching a single piece of content for a server-rendered page.
 *
 * Every detail page used to do this:
 *
 *     if (!res.ok) return null;
 *     ...
 *     catch { return null }
 *     ...
 *     if (!thing) notFound();
 *
 * which turns *any* failure into "this page does not exist". A backend restart,
 * a dropped connection, a 502 from the proxy, a query that timed out — all of
 * them told the reader the article was gone. Hence the 404-then-refresh-and-
 * it-works that people kept hitting: the second attempt simply got through.
 *
 * This tells the two apart. A 404 or 410 from the API means the thing is
 * genuinely not there, and the caller should call notFound(). Anything else is
 * the API failing to answer, which is retried once and then thrown — so the
 * reader sees an error they can retry rather than a wrong claim that the page
 * does not exist, and Next does not cache it as a valid 404.
 */

export class ContentUnavailable extends Error {
    constructor(
        readonly url: string,
        readonly status: number | null,
        cause?: unknown,
    ) {
        super(
            status === null
                ? `Could not reach the API for ${url}`
                : `The API answered ${status} for ${url}`,
        );
        this.name = "ContentUnavailable";
        this.cause = cause;
    }
}

/**
 * Nothing here for this reader — the caller should render a 404.
 *
 * 403 belongs with the other two. It used to fall through to the throw below
 * and surface as a 500, so a list somebody had set to private answered with a
 * server error page: a crash, on a page that was working exactly as intended.
 *
 * And a 404 is the better answer anyway. Telling a stranger "this exists but
 * you may not see it" confirms that it exists, which is half of what was
 * being kept from them.
 */
const MEANS_MISSING = [403, 404, 410];

/** One retry, after a short pause, for the blip that caused this in the first place. */
const RETRY_AFTER_MS = 300;

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @returns the parsed body, or null when the API says it does not exist
 * @throws ContentUnavailable when the API could not answer
 */
export async function fetchContent<T = unknown>(
    url: string,
    init?: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } },
): Promise<T | null> {
    let lastStatus: number | null = null;
    let lastCause: unknown;

    for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) await pause(RETRY_AFTER_MS);

        try {
            const res = await fetch(url, {
                ...init,
                // The internal token lifts the backend's per-IP rate limit for
                // our own SSR process — every server render arrives from
                // 127.0.0.1, so without it the whole site shared one
                // visitor's budget. Runtime env only; never reaches clients.
                headers: {
                    Accept: "application/json",
                    ...(process.env.INTERNAL_API_TOKEN
                        ? { "X-Internal-Token": process.env.INTERNAL_API_TOKEN }
                        : {}),
                    ...init?.headers,
                },
            });

            if (MEANS_MISSING.includes(res.status)) return null;

            if (!res.ok) {
                lastStatus = res.status;
                // 4xx other than the two above is the request's own fault and
                // will fail again identically; only server-side trouble is
                // worth a second attempt.
                if (res.status < 500 && res.status !== 429) break;
                continue;
            }

            return (await res.json()) as T;
        } catch (error) {
            lastStatus = null;
            lastCause = error;
        }
    }

    // At request time a 5xx must be loud: an empty page published as if it were
    // the real one is worse than an error. During the production build the same
    // throw is a different thing entirely — `next build` prerenders every
    // article, game and character it can name, so one API hiccup on one of them
    // fails the whole build and blocks a deploy that had nothing to do with it.
    //
    // That is not hypothetical: on 11 August 2026 a dropped Redis connection
    // lasting seconds took down a deploy on /gta6/characters/lucia-caminos,
    // a page whose data was fine a minute later.
    //
    // So the build treats an unanswerable page as missing and moves on. ISR
    // renders it properly on the first request after the deploy.
    if (process.env.NEXT_PHASE === "phase-production-build") {
        console.warn(`[fetchContent] skipped during build: ${url} (${lastStatus ?? "no response"})`);
        return null;
    }

    throw new ContentUnavailable(url, lastStatus, lastCause);
}
