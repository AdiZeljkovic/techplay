"use client";

import { useEffect } from "react";

/**
 * The exit half of the page transition.
 *
 * App Router gives us no exit animations — the old page unmounts the moment
 * the new one is ready, so navigation reads as a hard cut. This listens for
 * the click that starts a navigation and dims the outgoing page while the
 * next one loads; the template removes the class the moment the new page
 * mounts and plays its entrance. Together they read as one fluid handoff.
 *
 * The dim is applied via a class on <body> so the CSS can delay it ~90ms:
 * a navigation that resolves instantly (prefetched, cached) never shows it
 * at all, instead of flashing dark for one frame.
 */

const NAVIGATING = "tp-navigating";

/** A click that will actually change the page, and nothing else. */
function startsNavigation(event: MouseEvent): boolean {
    // Only a plain left click navigates in this tab.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    // Something upstream already claimed this click (lightbox, player, tab).
    if (event.defaultPrevented) return false;

    const anchor = (event.target as Element | null)?.closest?.("a");
    if (!anchor) return false;
    if (anchor.target === "_blank" || anchor.hasAttribute("download")) return false;

    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#")) return false;

    let url: URL;
    try {
        url = new URL(anchor.href, window.location.href);
    } catch {
        return false;
    }

    if (url.origin !== window.location.origin) return false;
    // Same page: either a no-op or an in-page hash jump.
    if (url.pathname === window.location.pathname && url.search === window.location.search) return false;

    return true;
}

export default function PageTransition() {
    useEffect(() => {
        let timeout: number | undefined;

        const begin = () => {
            document.body.classList.add(NAVIGATING);
            // If nothing ever remounts — a navigation aborted by an error
            // boundary, a download the checks missed — the page must not stay
            // dimmed. Four seconds was long enough that when the release did go
            // missing it read as a fault rather than a transition; a second and
            // a bit is past any navigation worth dimming for.
            window.clearTimeout(timeout);
            timeout = window.setTimeout(() => document.body.classList.remove(NAVIGATING), 1200);
        };

        const onClick = (event: MouseEvent) => {
            if (startsNavigation(event)) begin();
        };

        /*
         * Back and forward do not get the dim.
         *
         * They used to, on the reasoning that they re-fetch a route the same
         * way a click does. They do not behave the same way afterwards: a click
         * mounts a new template, and mounting is what lifts the dim. Going back
         * returns a page the router already holds, nothing remounts, and the
         * class sat there until the safety timeout — four seconds of the page
         * held at 45% opacity. Readers saw the screen go dark on Back and stay
         * dark, with nothing in the console to explain it.
         *
         * There is also nothing for the dim to cover here. The reader is
         * returning to a page they were just on, and it is served from memory.
         * Clearing instead: a click-dim may still be in flight when Back is
         * pressed, and that one has to go too.
         */
        const onPop = () => {
            window.clearTimeout(timeout);
            document.body.classList.remove(NAVIGATING);
        };

        // Bubble phase, not capture: React's own handlers run first, so
        // defaultPrevented is already settled by the time we look at it.
        document.addEventListener("click", onClick);
        window.addEventListener("popstate", onPop);

        return () => {
            document.removeEventListener("click", onClick);
            window.removeEventListener("popstate", onPop);
            window.clearTimeout(timeout);
        };
    }, []);

    return null;
}
