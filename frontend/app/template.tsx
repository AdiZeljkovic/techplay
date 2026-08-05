"use client";

import { useEffect } from "react";

/**
 * The entrance half of the page transition — a template remounts on every
 * navigation, so this runs exactly when a new page arrives.
 *
 * CSS animation rather than framer-motion, on purpose: the old version drove
 * opacity and transform from JS across the entire page tree on every route
 * change, and had no reduced-motion guard. The keyframes live in globals.css
 * next to the rest of the motion language, compositor-only, and fall away
 * cleanly when the animation ends.
 */
export default function Template({ children }: { children: React.ReactNode }) {
    // The new page is here — release the outgoing dim PageTransition applied.
    useEffect(() => {
        document.body.classList.remove("tp-navigating");
    }, []);

    return <div className="tp-page">{children}</div>;
}
