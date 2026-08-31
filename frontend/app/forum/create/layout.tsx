import type { Metadata } from "next";

/**
 * The form is not a page anybody should arrive at from a search engine.
 *
 * Every game page carries a "Start a Thread" link, and there are 332,455 game
 * pages, so this one route had that many crawlable addresses hanging off it —
 * each one a login wall with no content behind it. Crawlers took the offer:
 * 570,096 requests over a fortnight, 12.5 per cent of everything the site
 * served, 222,060 of them from a single crawler walking `?game=` one slug at a
 * time.
 *
 * The links now carry rel="nofollow" and this says the same thing to anything
 * that arrives anyway. The page itself is unchanged — a member who clicks it
 * gets exactly what they got before.
 */
export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function CreateThreadLayout({ children }: { children: React.ReactNode }) {
    return children;
}
