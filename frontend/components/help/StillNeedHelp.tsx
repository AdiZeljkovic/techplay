import { Mail, MessageCircle, MessagesSquare } from "lucide-react";
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
 * Live chat is the third, and it appears only when there is somebody at the
 * other end of it. Two settings decide: `help_livechat_enabled` and
 * `help_livechat_url`, both editable in the admin under Settings → Help
 * centre. Until Rocket.Chat is running they stay off and this renders exactly
 * what it rendered before.
 *
 * Not a disabled button, and not a "coming soon" — an offer that cannot be
 * taken is worse than no offer, and it is the reader in trouble who pays for
 * it. And not a deploy either: the day chat is ready should be a toggle.
 */
export default function StillNeedHelp({
    slug,
    discordUrl,
    liveChatUrl,
}: {
    /** Which answer failed, carried through to the contact form. */
    slug?: string;
    discordUrl: string;
    /** Set only when live chat is switched on and has an address. */
    liveChatUrl?: string | null;
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
                {/* First when it exists: it is the fastest of the three, and
                    the reader who is still here has already read the answer. */}
                {liveChatUrl && (
                    <a
                        href={liveChatUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                        className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[var(--radius-inner)] font-display text-[11.5px] font-black uppercase tracking-[0.1em] text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors"
                    >
                        <MessageCircle className="w-4 h-4" aria-hidden />
                        Chat with us
                    </a>
                )}

                <a
                    href={contact}
                    // Steps down when chat is on. Two filled buttons side by
                    // side is two firsts, which is none — the eye has to pick,
                    // and picking is the job this block is meant to do for a
                    // reader who is already stuck.
                    className={
                        liveChatUrl
                            ? "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[var(--radius-inner)] border font-display text-[11.5px] font-black uppercase tracking-[0.1em] text-[var(--ink-mid)] hover:text-[var(--ink-hi)] transition-colors"
                            : "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[var(--radius-inner)] font-display text-[11.5px] font-black uppercase tracking-[0.1em] text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors"
                    }
                    style={liveChatUrl ? { background: "var(--surface-2)", borderColor: "var(--line-strong)" } : undefined}
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
