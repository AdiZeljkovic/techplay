"use client";

import { BookOpen, Copy } from "lucide-react";
import toast from "react-hot-toast";
import type { Gw2WikiLink } from "@/lib/gw2";

/**
 * A link to the official Guild Wars 2 Wiki, and the chat code beside it.
 *
 * The backend builds the URL from our own catalogue — an item by its chat code,
 * which the wiki's search decodes to the exact page, anything else by its exact
 * name — so nothing here asks the wiki for anything. It is a place we send the
 * reader, never a source this tool reads.
 *
 * The copy button is the half that keeps working when the wiki does not. In
 * October 2026 the wiki was down for over a week; a chat code pasted into the
 * game still opens the item, whatever state the wiki is in.
 *
 * `nofollow` because the wiki's robots.txt disallows `index.php` and
 * `Special:` pages to crawlers. A reader following a link is not crawling, but
 * our indexed pages should not send search engines somewhere the operators
 * asked them not to go.
 */
export default function WikiLink({
    wiki,
    name,
    compact = false,
    className = "",
}: {
    wiki?: Gw2WikiLink | null;
    /** What the link is about, for the accessible label. "Wiki" alone says nothing to a screen reader. */
    name?: string | null;
    /** Icons only, for dense rows. */
    compact?: boolean;
    className?: string;
}) {
    if (!wiki) return null;

    const code = wiki.chat_link;
    const label = name ? `${name} on the Guild Wars 2 Wiki` : "Open on the Guild Wars 2 Wiki";

    async function copy() {
        if (!code) return;

        try {
            await navigator.clipboard.writeText(code);
            toast.success("Chat code copied — paste it in game to open it there.");
        } catch {
            // Some browsers and app views refuse the clipboard. The code is
            // short enough to read off the message and type.
            toast.error(`Could not copy. The chat code is ${code}`);
        }
    }

    return (
        <span className={`inline-flex shrink-0 items-center gap-1 ${className}`}>
            <a
                href={wiki.url}
                target="_blank"
                rel="nofollow noopener noreferrer"
                aria-label={label}
                title={label}
                className="inline-flex items-center gap-1 rounded-[var(--radius-inner)] px-1 py-0.5 text-[11px] text-[var(--ink-low)] transition-colors hover:text-[var(--accent-ink)] focus-visible:text-[var(--accent-ink)]"
            >
                <BookOpen size={12} aria-hidden />
                {!compact && <span>Wiki</span>}
            </a>
            {code && (
                <button
                    type="button"
                    onClick={() => void copy()}
                    aria-label={name ? `Copy the chat code for ${name}` : "Copy the chat code"}
                    title={`Copy ${code} — paste it in game`}
                    className="inline-flex items-center rounded-[var(--radius-inner)] px-1 py-0.5 text-[var(--ink-faint)] transition-colors hover:text-[var(--accent-ink)] focus-visible:text-[var(--accent-ink)]"
                >
                    <Copy size={11} aria-hidden />
                </button>
            )}
        </span>
    );
}
