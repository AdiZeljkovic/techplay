"use client";

import { useEffect, useState } from "react";

/**
 * How much of the piece is left.
 *
 * A desktop reader has a scrollbar for this; a phone has nothing. On a long
 * feature the difference is between reading and wondering, and it is the one
 * piece of reading furniture every app has and this site did not.
 *
 * Phones only. The desktop layout is finished and a second accent line across
 * the top of it would be noise for information the scrollbar already gives.
 *
 * It measures the article element rather than the document, so the footer, the
 * recommendation rails and the comment section do not count as "article left
 * to read" — a bar that reaches 60% at the last paragraph is worse than none.
 */
export default function ReadingProgress({ targetId = "article-body" }: { targetId?: string }) {
    const [pct, setPct] = useState(0);

    useEffect(() => {
        const read = () => {
            const el = document.getElementById(targetId);
            if (!el) return;

            const top = el.offsetTop;
            // The last screenful needs no scrolling to be read, so the bar
            // fills when the end of the text reaches the bottom of the screen.
            const span = el.offsetHeight - window.innerHeight;
            if (span <= 0) { setPct(0); return; }

            const done = (window.scrollY - top) / span;
            setPct(Math.max(0, Math.min(1, done)));
        };

        read();
        window.addEventListener("scroll", read, { passive: true });
        window.addEventListener("resize", read);
        return () => {
            window.removeEventListener("scroll", read);
            window.removeEventListener("resize", read);
        };
    }, [targetId]);

    return (
        <div
            aria-hidden
            className="md:hidden fixed inset-x-0 top-0 z-[61] h-[2.5px] pointer-events-none"
        >
            <span
                className="block h-full origin-left bg-[var(--accent)]"
                // Transform rather than width: width animates on the layout
                // thread and this runs on every scroll frame.
                style={{ transform: `scaleX(${pct})`, transition: "transform 90ms linear" }}
            />
        </div>
    );
}
