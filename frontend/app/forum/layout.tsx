import { ReactNode } from "react";
import { Metadata } from "next";

/**
 * Metadata here is inherited by every page under /forum, and the pages below
 * are client components, which cannot export metadata to override it. So the
 * canonical that used to sit in this object — `/forum` — was being declared by
 * every board, every thread and the rules page as well: each of them telling
 * Google "the real address of this page is /forum". That is an instruction to
 * drop those URLs from the index, which is the opposite of what a forum wants.
 *
 * Nothing claims a canonical from here now; a page without one self-canonicalises
 * to its own URL, which is correct for all of them. Real per-page titles still
 * need server segments of their own — that is the next piece of work, not this
 * one — but the wrong claim stops being made today.
 */
export const metadata: Metadata = {
    /**
     * A default *and* a template.
     *
     * This was a plain string, which gave the forum its own title and left
     * every page beneath it without the site suffix — measured: a board came
     * out as "Consoles & Peripherals" where every other page on the site ends
     * "| TechPlay". A string here names this page; the template names the ones
     * below it.
     */
    title: {
        default: 'Community Forums - Gaming Discussions & Help',
        template: '%s | TechPlay Forum',
    },
    description: "Join the TechPlay community forums. Discuss games, share PC builds, get technical help, trade in the marketplace, and connect with fellow gamers. Active community since 2024.",
    keywords: ["gaming forum", "PC gaming community", "gaming discussions", "PC build help", "gaming marketplace", "esports community"],
    openGraph: {
        title: "TechPlay Forums - Gaming Community Discussions",
        description: "A thriving community of gamers discussing games, hardware, esports, and more.",
        type: "website",
    },
};

export default function ForumLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}

