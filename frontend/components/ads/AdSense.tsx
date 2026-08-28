"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AD_CLIENT, adsAllowedHere } from "./config";

/**
 * The three AdSense units, and the rules that come with them.
 *
 * Auto ads are off. Google places those wherever it likes, which on this site
 * meant inside game grids and over the profile hero; these three are placed by
 * hand, in the three shapes AdSense actually distinguishes:
 *
 *   in-article  strictly between paragraphs of an article body
 *   in-feed     strictly inside a list of similar items
 *   display     the general responsive banner, for rails and section breaks
 *
 * Using the wrong one is a policy problem, not a taste one: an in-feed unit
 * outside a feed is a native ad pretending to be content nobody published.
 *
 * Three things this component exists to get right, all of which are silent
 * failures rather than errors:
 *
 * 1. push() runs once per <ins>. A second push against an element that already
 *    carries an ad throws "All ins elements in the body of the page already
 *    have ads in them", and in development React mounts effects twice.
 *
 * 2. push() with the slot at zero width fills nothing and never retries — the
 *    reader gets a permanently blank space. It waits for real width.
 *
 * 3. A client-side route change leaves the old filled <ins> in the tree, so
 *    the next page renders a slot that is already "done" and stays empty. The
 *    pathname is part of the key, so every route gets its own element.
 */

const CLIENT = AD_CLIENT;

const SLOTS = {
    inFeed: "1379142765",
    display: "7162640847",
    inArticle: "3011788639",
} as const;

declare global {
    interface Window {
        adsbygoogle?: Record<string, unknown>[] & { requestNonPersonalizedAds?: number };
    }
}

/**
 * Whether this reader agreed to marketing cookies.
 *
 * Not a gate on whether ads appear — a blank page earns nothing and the
 * banner is ignored by most people. It decides whether the ads are
 * personalised: without consent AdSense is asked for non-personalised ones,
 * which is Google's own documented answer for exactly this case and the only
 * one that is honest about what the reader agreed to.
 */
function useMarketingConsent(): boolean {
    const [granted, setGranted] = useState(false);

    useEffect(() => {
        const read = () => {
            try {
                const raw = localStorage.getItem("cookie_preferences");
                setGranted(raw ? !!JSON.parse(raw)?.marketing : false);
            } catch {
                setGranted(false);
            }
        };

        read();
        // The banner writes localStorage in this same tab, which fires no
        // storage event — it dispatches its own so the ads on screen can
        // change their mind the moment somebody accepts.
        window.addEventListener("techplay:consent", read);
        window.addEventListener("storage", read);

        return () => {
            window.removeEventListener("techplay:consent", read);
            window.removeEventListener("storage", read);
        };
    }, []);

    return granted;
}

interface SlotProps {
    /** Reserved height while the slot is empty, so nothing below it jumps. */
    minHeight?: number;
    className?: string;
}

function AdSlot({
    slot, format, layout, layoutKey, minHeight = 120, className = "", label = true,
}: SlotProps & {
    slot: string;
    format: string;
    layout?: string;
    layoutKey?: string;
    label?: boolean;
}) {
    const pathname = usePathname();
    const host = useRef<HTMLDivElement>(null);
    const pushed = useRef(false);
    const consent = useMarketingConsent();
    const [filled, setFilled] = useState(false);

    /*
     * The <ins> is mounted in the browser, never rendered on the server.
     *
     * `ins.adsbygoogle` is on every ad blocker's hiding list, and the ones that
     * strip the node rather than merely hiding it take it out of the document
     * before React hydrates. React then finds a child it rendered on the server
     * missing from the DOM, and a structural mismatch is not repaired in place:
     * it throws the whole server-rendered tree away and redraws the page on the
     * client. That redraw is visible — the screen darkens for a moment — and it
     * lands on whichever page a reader arrives at with a full load, which is why
     * it showed up on browser Back and never on an in-page link.
     *
     * Nothing is lost by keeping it out of the server's HTML. The slot is filled
     * from an IntersectionObserver below, so it was never part of the first
     * paint anyway, and ad markup is not something the crawler should be reading
     * in the document it indexes.
     */
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    /*
     * Off entirely anywhere but techplay.gg — see ./config. `blocked` starts
     * false so the first client render matches what the server sent; the
     * effect then collapses the reserved space on hosts that get no ads, which
     * is a layout shift nobody but a developer will ever see.
     */
    const [blocked, setBlocked] = useState(false);
    useEffect(() => { setBlocked(!adsAllowedHere()); }, []);

    useEffect(() => {
        pushed.current = false;
    }, [pathname]);

    useEffect(() => {
        const el = host.current;
        if (!el || blocked) return;

        const fill = () => {
            if (pushed.current || el.offsetWidth === 0) return;
            pushed.current = true;

            try {
                window.adsbygoogle = window.adsbygoogle || [];
                if (!consent) window.adsbygoogle.requestNonPersonalizedAds = 1;
                window.adsbygoogle.push({});
            } catch {
                // A failed fill must never take the page with it.
                pushed.current = false;
            }
        };

        // Fill as it comes into view rather than on mount: it keeps ads out of
        // the first paint, and it is also what guarantees the slot has width by
        // the time push() runs.
        const io = new IntersectionObserver(
            (entries) => { if (entries.some((e) => e.isIntersecting)) fill(); },
            { rootMargin: "300px" }
        );
        io.observe(el);

        // AdSense stamps data-ad-status="filled" or "unfilled" on the element
        // once it has decided. Watching the attribute is the only way to know;
        // there is no callback.
        const ins = el.querySelector("ins");
        const mo = ins
            ? new MutationObserver(() => setFilled(ins.getAttribute("data-ad-status") === "filled"))
            : null;
        mo?.observe(ins!, { attributes: true, attributeFilter: ["data-ad-status"] });

        return () => { io.disconnect(); mo?.disconnect(); };
        // `mounted` belongs here: the <ins> does not exist on the first pass,
        // so without it the observers would be wired to an empty host.
    }, [pathname, consent, mounted, blocked]);

    // A new route means a new element and an undecided slot.
    useEffect(() => { setFilled(false); }, [pathname]);

    return (
        <div ref={host} className={className} key={pathname} style={{ minHeight: blocked ? 0 : minHeight }}>
            {/* The label appears only once an ad actually arrives. AdSense
                leaves the slot empty when it has nothing to serve, and a word
                reading "Advertisement" over 250px of nothing is worse than no
                label — it tells the reader something is broken. `filled` is
                set from the data-ad-status AdSense writes on the element. */}
            {label && filled && (
                <p className="mb-1.5 font-display text-[8.5px] font-bold uppercase tracking-[0.18em] text-white/45">
                    Advertisement
                </p>
            )}
            {mounted && !blocked && <ins
                key={pathname}
                className="adsbygoogle block"
                style={{ display: "block", minHeight, ...(layout === "in-article" ? { textAlign: "center" } : null) }}
                data-ad-client={CLIENT}
                data-ad-slot={slot}
                data-ad-format={format}
                {...(layout ? { "data-ad-layout": layout } : {})}
                {...(layoutKey ? { "data-ad-layout-key": layoutKey } : {})}
                {...(format === "auto" ? { "data-full-width-responsive": "true" } : {})}
            />}
        </div>
    );
}

/**
 * Between the paragraphs of an article body, and nowhere else.
 *
 * The in-article format is drawn to sit in running text — Google styles it
 * with the surrounding type — so putting it in a rail or under a grid gives a
 * unit that looks like a paragraph in a place that has none.
 */
export function InArticleAd({ className = "" }: SlotProps) {
    return (
        <AdSlot
            slot={SLOTS.inArticle}
            format="fluid"
            layout="in-article"
            minHeight={250}
            className={`my-10 ${className}`}
        />
    );
}

/**
 * Inside a list of similar items, matched to the cards around it.
 *
 * The layout key is the one generated against our own card, so the unit
 * inherits its proportions. It belongs between cards in the same list — never
 * above the first one, where it would be the first thing on a page that has
 * not shown any content yet.
 */
export function InFeedAd({ className = "" }: SlotProps) {
    return (
        <AdSlot
            slot={SLOTS.inFeed}
            format="fluid"
            layoutKey="-fb+5w+4e-db+86"
            minHeight={200}
            className={className}
        />
    );
}

/** The general responsive banner: rails, and the gap between two sections. */
export function DisplayAd({ className = "", minHeight = 250 }: SlotProps) {
    return (
        <AdSlot
            slot={SLOTS.display}
            format="auto"
            minHeight={minHeight}
            className={className}
        />
    );
}
