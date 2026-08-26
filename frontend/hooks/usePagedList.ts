"use client";

import { useCallback, useRef } from "react";

/**
 * Send the reader to the top of a list when its page turns.
 *
 * Every pager on the site sits under the list it controls, and several render
 * one at each end. So a reader asking for page two has almost always just
 * scrolled to the foot of page one — and the list then swapped underneath
 * them, leaving them standing at its end, looking at the last few rows of a
 * page they had not read yet. Reported on /news, and it behaved the same way
 * on the profile, the forum, /studios and author pages.
 *
 * Not for "load more" lists — the shelf on a profile, the game database — where
 * the next page is appended and the reader is already looking at the right
 * place. Those want no scroll at all.
 *
 * The offset clears the fixed header (72px from md up), which an element's own
 * position knows nothing about.
 */
const HEADER_CLEARANCE = 88;

export function usePagedList<T extends HTMLElement = HTMLDivElement>() {
    const ref = useRef<T>(null);

    const scrollToTop = useCallback(() => {
        const el = ref.current;
        if (!el || typeof window === "undefined") return;

        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({
            top: el.getBoundingClientRect().top + window.scrollY - HEADER_CLEARANCE,
            behavior: reduced ? "auto" : "smooth",
        });
    }, []);

    return { ref, scrollToTop };
}
