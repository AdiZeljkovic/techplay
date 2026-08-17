import * as Sentry from "@sentry/nextjs";

/**
 * Error reporting from the visitor's browser.
 *
 * This is the one failure nothing on our server can see. When React throws
 * during hydration and the page goes blank, nginx recorded a 200, Netdata shows
 * a healthy machine, and the log file has nothing in it — because nothing went
 * wrong on the server. It went wrong on somebody's laptop.
 *
 * The SDK is Sentry's; the receiver is GlitchTip, self-hosted at
 * glitchtip.techplay.gg. Same protocol, same DSN format, and the events stay on
 * our own machine.
 *
 * ## What is deliberately off
 *
 * `tracesSampleRate: 0` — performance tracing turns every navigation into a
 * transaction. Netdata already measures how fast pages are served, at
 * one-second resolution; paying storage for a coarser second copy buys nothing.
 *
 * Session replay is not initialised at all. GlitchTip does not ingest replays,
 * and a tool that records what visitors do on screen is not something to switch
 * on because a config key exists.
 *
 * ## Why it only runs in production
 *
 * A development error is already on the screen in front of whoever caused it.
 * Sending those would bury the real ones.
 */
Sentry.init({
    dsn: process.env.NEXT_PUBLIC_GLITCHTIP_DSN,
    enabled: process.env.NODE_ENV === "production" && !!process.env.NEXT_PUBLIC_GLITCHTIP_DSN,

    tracesSampleRate: 0,

    // GlitchTip does not track sessions, so sending them is traffic for
    // nothing. Its own documentation says `autoSessionTracking: false`, which
    // was removed in SDK v8 — the docs predate the package. In v10 the same
    // thing is done by dropping the integration that sends them.
    integrations: (defaults) => defaults.filter((i) => i.name !== "BrowserSession"),

    // Half the events a browser produces are not ours. A visitor's extension
    // throwing inside our page is indistinguishable from our own bug until you
    // read the stack, and it arrives in far greater numbers.
    ignoreErrors: [
        "ResizeObserver loop limit exceeded",
        "ResizeObserver loop completed with undelivered notifications",
        "Non-Error promise rejection captured",
        /^Failed to fetch$/,
        /extension\//i,
        /^chrome-extension:/,
        /^moz-extension:/,
    ],

    beforeSend(event) {
        // Anything thrown by a file that is not ours is not our bug. This drops
        // the whole class rather than filtering message by message.
        const frames = event.exception?.values?.[0]?.stacktrace?.frames;
        const top = frames?.[frames.length - 1]?.filename ?? "";

        if (/^(chrome|moz|safari-web)-extension:/.test(top)) {
            return null;
        }

        return event;
    },
});

/**
 * Next calls this on every client-side navigation. With tracing off there is
 * nothing to time, but the SDK expects the export to exist and warns when it
 * does not.
 */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
