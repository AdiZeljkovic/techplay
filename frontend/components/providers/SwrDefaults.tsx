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
            }}
        >
            {children}
        </SWRConfig>
    );
}
