"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * The page views a single-page app would otherwise never report.
 *
 * GA4 sends the first one by itself; every navigation after that happens in the
 * router without a document load, so it has to be told. That is all this does
 * now — the library and its config moved into the document head in
 * app/layout.tsx.
 *
 * They were here, mounted through next/script with `afterInteractive`, which
 * holds a script back until React has hydrated. A reader who leaves before
 * that was never counted, and those are exactly the readers a bounce rate is
 * about: on 1 September GA saw 52 of the 127 people who arrived from a paid ad.
 * Nothing measures the first page view from inside the app that is waiting to
 * become interactive, so it belongs in the HTML instead.
 */
export default function ConsentAwareAnalytics() {
    const pathname = usePathname();

    // The first view is GA4's own (`send_page_view: true`), fired the moment
    // the library lands. Sending another here would count every entry twice.
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        if (typeof window === "undefined" || !(window as any).gtag) return;
        (window as any).gtag("event", "page_view", {
            page_path: pathname,
        });
    }, [pathname]);

    return null;
}
