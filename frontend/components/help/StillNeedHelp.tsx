import { Mail, MessageCircle, MessagesSquare } from "lucide-react";
import { SITE_URL } from "@/lib/help";

/**
 * The way out, at the end of an answer and at the end of the index.
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
 *
 * ── Two placements, one component ───────────────────────────────────────
 *
 * `inline` closes an answer: modest, left-aligned, sitting under the thing it
 * follows. `panel` closes the index, where the reader has read every topic
 * name and none of them was theirs — that is a different moment and deserves
 * the width of the page rather than a box in a column.
 *
 * One component, because the offer is identical and the day live chat arrives
 * it must arrive in both places. Two components is how one of them ends up a
 * version behind.
 */
export default function StillNeedHelp({
    slug,
    discordUrl,
    liveChatUrl,
    variant = "inline",
    heading,
    blurb,
}: {
    /** Which answer failed, carried through to the contact form. */
    slug?: string;
    discordUrl: string;
    /** Set only when live chat is switched on and has an address. */
    liveChatUrl?: string | null;
    variant?: "inline" | "panel";
    heading?: string;
    blurb?: string;
}) {
    const contact = slug
        ? `${SITE_URL}/contact?from=help&article=${encodeURIComponent(slug)}`
        : `${SITE_URL}/contact?from=help`;

    const panel = variant === "panel";

    const chat = liveChatUrl ? (
        <a
            href={liveChatUrl}
            rel="noopener noreferrer"
            target="_blank"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-inner)] bg-[var(--accent)] px-5 font-display text-[11.5px] font-black uppercase tracking-[0.1em] text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Chat with us
        </a>
    ) : null;

    return (
        <section
            className={
                panel
                    ? "rounded-[var(--radius-panel)] border px-6 py-9 text-center md:px-10 md:py-11"
                    : "mt-6 rounded-[var(--radius-panel)] border px-5 py-5 md:px-6"
            }
            style={{
                background: "var(--surface-1)",
                borderColor: panel ? "var(--line-strong)" : "var(--line)",
                boxShadow: panel ? "inset 0 1px 0 rgba(255,255,255,0.06)" : undefined,
            }}
        >
            <h2
                className={
                    panel
                        ? "font-display text-[18px] md:text-[22px] font-black uppercase tracking-[0.06em] text-[var(--ink-hi)]"
                        : "font-display text-[13px] font-black uppercase tracking-[0.12em] text-[var(--ink-hi)]"
                }
            >
                {heading ?? "Still stuck?"}
            </h2>

            <p
                className={
                    panel
                        ? "mx-auto mt-3 max-w-xl text-[14px] leading-relaxed"
                        : "mt-1.5 text-[12.5px] leading-snug"
                }
                style={{ color: "var(--ink-low)" }}
            >
                {blurb ?? "Both of these reach a person. Tell us what you tried — it saves a round trip."}
            </p>

            <div
                className={
                    panel
                        ? "mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row"
                        : "mt-4 flex flex-col gap-2.5 sm:flex-row"
                }
            >
                {/* First when it exists: it is the fastest of the three, and
                    the reader who is still here has already read the answer. */}
                {chat}

                <a
                    href={contact}
                    // Steps down when chat is on. Two filled buttons side by
                    // side is two firsts, which is none — the eye has to pick,
                    // and picking is the job this block is meant to do for a
                    // reader who is already stuck.
                    className={
                        liveChatUrl
                            ? "inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-inner)] border px-5 font-display text-[11.5px] font-black uppercase tracking-[0.1em] text-[var(--ink-mid)] transition-colors hover:text-[var(--ink-hi)]"
                            : "inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-inner)] bg-[var(--accent)] px-5 font-display text-[11.5px] font-black uppercase tracking-[0.1em] text-white transition-colors hover:bg-[var(--accent-hover)]"
                    }
                    style={liveChatUrl ? { background: "var(--surface-2)", borderColor: "var(--line-strong)" } : undefined}
                >
                    <Mail className="h-4 w-4" aria-hidden />
                    Email us
                </a>

                <a
                    href={discordUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-inner)] border px-5 font-display text-[11.5px] font-black uppercase tracking-[0.1em] text-[var(--ink-mid)] transition-colors hover:text-[var(--ink-hi)]"
                    style={{ background: "var(--surface-2)", borderColor: "var(--line-strong)" }}
                >
                    <MessagesSquare className="h-4 w-4" aria-hidden />
                    Ask on Discord
                </a>
            </div>
        </section>
    );
}
