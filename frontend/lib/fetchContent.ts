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

/** Gone for good — the caller should render a 404. */
const MEANS_MISSING = [404, 410];

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
                headers: { Accept: "application/json", ...init?.headers },
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

    throw new ContentUnavailable(url, lastStatus, lastCause);
}
