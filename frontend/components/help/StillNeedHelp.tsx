import { Mail, MessagesSquare } from "lucide-react";
import { SITE_URL } from "@/lib/help";

/**
 * The end of every answer, and the reason the section is worth building.
 *
 * A help centre that dead-ends is a help centre that produces angrier emails
 * than the one it replaced. Two ways out, both of which reach a person.
 *
 * The article's slug rides along on the contact link. That is the whole point
 * of it: an inbox full of "it still doesn't work" is worth very little, and an
 * inbox where a third of the messages arrive tagged
 * `steam-library-is-not-syncing` tells the desk exactly which answer is
 * failing and needs rewriting. Which is also the honest caveat — /contact
 * currently emails and stores nothing, so that signal is only as good as the
 * inbox it lands in.
 *
 * Live chat goes here when the Rocket.Chat server is ready. It is not stubbed
 * out with a disabled button: an offer that cannot be taken is worse than no
 * offer, and a widget is a script and a container, so there will be nothing to
 * rebuild when the day comes.
 */
export default function StillNeedHelp({
    slug,
    discordUrl,
}: {
    /** Which answer failed, carried through to the contact form. */
    slug?: string;
    discordUrl: string;
}) {
    const contact = slug
        ? `${SITE_URL}/contact?from=help&article=${encodeURIComponent(slug)}`
        : `${SITE_URL}/contact?from=help`;

    return (
        <section
            className="mt-6 rounded-[var(--radius-panel)] border px-5 py-5 md:px-6"
            style={{ background: "var(--surface-1)", borderColor: "var(--line)" }}
        >
            <h2 className="font-display text-[13px] font-black uppercase tracking-[0.12em] text-[var(--ink-hi)]">
                Still stuck?
            </h2>
            <p className="mt-1.5 text-[12.5px] leading-snug" style={{ color: "var(--ink-low)" }}>
                Both of these reach a person. Tell us what you tried — it saves a round trip.
            </p>

            <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
                <a
                    href={contact}
                    className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[var(--radius-inner)] font-display text-[11.5px] font-black uppercase tracking-[0.1em] text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors"
                >
                    <Mail className="w-4 h-4" aria-hidden />
                    Email us
                </a>

                <a
                    href={discordUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[var(--radius-inner)] border font-display text-[11.5px] font-black uppercase tracking-[0.1em] text-[var(--ink-mid)] hover:text-[var(--ink-hi)] transition-colors"
                    style={{ background: "var(--surface-2)", borderColor: "var(--line-strong)" }}
                >
                    <MessagesSquare className="w-4 h-4" aria-hidden />
                    Ask on Discord
                </a>
            </div>
        </section>
    );
}
