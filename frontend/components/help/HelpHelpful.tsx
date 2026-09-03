"use client";

import { useEffect, useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { getApiUrl } from "@/lib/api";

/**
 * Was this answer any use.
 *
 * The one interactive thing in the help centre, and the only JavaScript these
 * pages ship. It asks for no account, because the reader it is asking very
 * often does not have one — the two loudest questions here are asked by people
 * who cannot sign in.
 *
 * ── What it does not do ─────────────────────────────────────────────────
 *
 * It does not show the counts. A page reading "3 of 11 people found this
 * helpful" tells a reader in trouble that the answer probably will not work,
 * before they have read it. The numbers are for the desk, in the admin panel,
 * where they decide what gets rewritten next — which is the only decision they
 * are any use for.
 *
 * It does not let the answer be changed either. The server counts one vote per
 * address per day and quietly ignores the rest, so a second press would move
 * nothing; showing a button that appears to work and does not is worse than
 * showing the thank-you.
 *
 * The remembered vote is in localStorage, per browser. It exists so returning
 * to a page you have already answered does not ask again — not as a control:
 * the server's own count is what decides, and it is not reading this.
 */
export default function HelpHelpful({ slug }: { slug: string }) {
    const [voted, setVoted] = useState<"yes" | "no" | null>(null);
    const [busy, setBusy] = useState(false);
    const key = `help-vote:${slug}`;

    useEffect(() => {
        try {
            const saved = window.localStorage.getItem(key);
            if (saved === "yes" || saved === "no") setVoted(saved);
        } catch {
            // A private window, or storage switched off. Asking again is the
            // right failure: the server still refuses to count it twice.
        }
    }, [key]);

    const cast = async (helpful: boolean) => {
        if (busy || voted) return;

        setBusy(true);
        // Optimistic, and deliberately not rolled back on failure. The reader
        // has answered the question; making the buttons spring back because a
        // request failed asks them to do it again for our benefit.
        setVoted(helpful ? "yes" : "no");

        try {
            window.localStorage.setItem(key, helpful ? "yes" : "no");
        } catch {
            // As above.
        }

        try {
            await fetch(`${getApiUrl()}/help/answers/${encodeURIComponent(slug)}/helpful`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ helpful }),
            });
        } catch {
            // Nothing to say. A feedback button is not worth an error toast on
            // a page somebody opened because something else already broke.
        } finally {
            setBusy(false);
        }
    };

    return (
        <section
            className="mt-10 rounded-[var(--radius-panel)] border px-5 py-5 md:px-6"
            style={{
                background: "var(--surface-1)",
                borderColor: "var(--line-strong)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="font-display text-[13px] font-black uppercase tracking-[0.12em] text-[var(--ink-hi)]">
                        {voted === null ? "Did this answer your question?" : voted === "yes" ? "Good — thank you" : "Thanks for saying so"}
                    </h2>
                    <p className="mt-1.5 text-[12.5px] leading-snug" style={{ color: "var(--ink-low)" }}>
                        {voted === null
                            ? "One tap. It decides which answers we rewrite first."
                            : voted === "yes"
                              ? "Nothing else to do here."
                              : "It is on the list to be rewritten. If you need an answer now, the box below reaches a person."}
                    </p>
                </div>

                {voted === null && (
                    <div className="flex items-center gap-2 shrink-0">
                        {(
                            [
                                [true, "Yes", ThumbsUp],
                                [false, "No", ThumbsDown],
                            ] as const
                        ).map(([value, label, Icon]) => (
                            <button
                                key={label}
                                type="button"
                                onClick={() => cast(value)}
                                disabled={busy}
                                className="inline-flex items-center gap-2 h-10 px-4 rounded-[var(--radius-inner)] border font-display text-[11px] font-black uppercase tracking-[0.1em] transition-colors disabled:opacity-50 text-[var(--ink-mid)] hover:text-[var(--ink-hi)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
                                style={{ background: "var(--surface-2)", borderColor: "var(--line-strong)" }}
                            >
                                <Icon className="w-4 h-4" aria-hidden />
                                {label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
