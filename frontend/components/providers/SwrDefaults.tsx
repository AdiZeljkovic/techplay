"use client";

import { SWRConfig } from "swr";

/**
 * One default, applied once, instead of eighty-six times.
 *
 * Every `useSWR` call that set `revalidateOnFocus` set it to `false` — thirty-
 * seven of them, unanimously. The other forty-nine did not set it at all and so
 * inherited SWR's default of `true`, which refetches on every window focus.
 *
 * That is what a developer sees when they click through the site with the
 * Network tab open: each return to the tab reissues the page's queries, and it
 * reads as the app requesting the same thing over and over. Measured on /games:
 * the catalogue query went out at 216ms and again at 7,280ms, same URL, for no
 * reason a reader would notice.
 *
 * Setting it here matches what every call site that bothered to say so already
 * asked for. Local options still win, so anything that genuinely wants to
 * refresh on focus can say so and be believed.
 */
export default function SwrDefaults({ children }: { children: React.ReactNode }) {
    return (
        <SWRConfig
            value={{
                revalidateOnFocus: false,
                // Reconnect stays on: coming back from a dead network is the one
                // moment stale data is actually likely.
                revalidateOnReconnect: true,

                /*
                 * A refused request is not a lost one, and 429 least of all.
                 *
                 * SWR retries a failed fetch by default, backing off but never
                 * giving up. Against a rate limit that is the worst possible
                 * answer: the reply says "you have asked too often", and the
                 * library's response is to ask again. On 20 Sep 2026 a reader
                 * who tripped the API limit had every query on the page retrying
                 * into it at once, which is why the feed stayed empty rather
                 * than filling a moment later.
                 *
                 * 4xx is the server saying the request itself is wrong —
                 * forbidden, missing, malformed, too frequent — and repeating it
                 * unchanged cannot fix any of those. 408 and 425 are the two
                 * that mean "not yet", so they keep the retry. 5xx keeps it too:
                 * that one really can be transient.
                 */
                onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
                    const status = error?.response?.status ?? error?.status;

                    if (status >= 400 && status < 500 && status !== 408 && status !== 425) return;
                    if (retryCount >= 5) return;

                    setTimeout(() => revalidate({ retryCount }), 2000 * 2 ** retryCount);
                },
            }}
        >
            {children}
        </SWRConfig>
    );
}
