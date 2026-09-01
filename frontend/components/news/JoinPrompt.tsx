"use client";

import Link from "next/link";
import { Library, Trophy, Gamepad2, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/**
 * The one thing an article asks of a reader who does not have an account.
 *
 * Nothing on an article page has ever asked. Eighty-four people arrived from a
 * paid ad on 1 September, thirty-three of them stayed over a minute, and not
 * one of them so much as loaded the registration page — not because they gave
 * up on the form, but because nothing on the page they were reading pointed at
 * it. That is what this fixes, and it is the only reason it exists.
 *
 * It names what you get rather than what we want. "Join TechPlay" is a request;
 * a shelf that fills itself from Steam is an offer, and the offer is the part
 * that is actually true.
 *
 * Written for a phone first. Of the requests from that ad, 1,487 came from a
 * phone and 184 from a desktop, so the narrow layout is the real one and the
 * wide one is the variant.
 *
 * `?from=article` on both links is the whole of the measurement. It costs
 * nothing, the register page ignores it, and it turns up in the nginx access
 * log — which is the same place the ad traffic was counted from, so the two
 * numbers can be compared without adding any analytics at all.
 */

/** What an account is for, in the order a stranger cares about it. */
const OFFER = [
    { icon: Library, text: "Your whole library, from Steam, Xbox, PlayStation, GOG and Epic" },
    { icon: Trophy, text: "XP, twenty ranks and achievements for what you already play" },
    { icon: Gamepad2, text: "A record of what you finished, and what you thought of it" },
];

export default function JoinPrompt({ variant = "panel" }: { variant?: "panel" | "inline" }) {
    const { isAuthenticated, isLoading } = useAuth();

    // Auth is restored from localStorage after mount, so for one frame a signed-
    // in reader looks signed out. Rendering through that frame would flash an
    // invitation to join at somebody who joined months ago.
    if (isLoading || isAuthenticated) return null;

    /* The slim one, between paragraphs.
     *
     * Half the readers who arrive from the ad leave inside ten seconds and will
     * never see the end of the piece. This is for them, and being for them is
     * exactly why it has to stay a single quiet line — an interruption that
     * earns its place by being small. */
    if (variant === "inline") {
        return (
            <Link
                href="/register?from=article"
                className="group not-prose my-8 flex items-center gap-3 rounded-[14px] border border-[color-mix(in_srgb,var(--accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--accent)_7%,var(--surface-1))] px-4 py-3.5 transition-colors duration-300 hover:border-[color-mix(in_srgb,var(--accent)_55%,transparent)]"
            >
                <span className="min-w-0 flex-1">
                    <span className="block font-display text-[9.5px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
                        Free account
                    </span>
                    <span className="mt-1 block text-[14px] font-semibold leading-snug text-white">
                        Bring your games together on one profile.
                    </span>
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white transition-transform duration-300 group-hover:translate-x-0.5">
                    <ArrowRight className="h-4 w-4" />
                </span>
            </Link>
        );
    }

    return (
        <section className="not-prose relative my-10 overflow-hidden rounded-[var(--radius-panel)] border border-[color-mix(in_srgb,var(--accent)_22%,transparent)] bg-[var(--surface-1)]">
            {/* The light pools at the top corner rather than washing the panel,
                so the crimson stays an accent on a dark surface and the text
                below it keeps its contrast. */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(90% 120% at 8% 0%, color-mix(in srgb, var(--accent) 13%, transparent) 0%, transparent 62%)" }}
            />

            <div className="relative p-5 sm:p-7">
                <p className="font-display text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
                    Free TechPlay account
                </p>

                <h2 className="mt-2.5 font-display text-[22px] sm:text-[27px] font-black leading-[1.12] tracking-[-0.5px] text-white text-balance">
                    Your gaming life, in one place.
                </h2>

                <p className="mt-2.5 max-w-[54ch] text-[14px] leading-relaxed text-[var(--ink-low)]">
                    Link a store and your shelf fills itself &mdash; every game, with the hours
                    already on them.
                </p>

                <ul className="mt-5 flex flex-col gap-3">
                    {OFFER.map(({ icon: Icon, text }) => (
                        <li key={text} className="flex items-start gap-3">
                            <span className="mt-px flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[8px] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]">
                                <Icon className="h-[13px] w-[13px] text-[var(--accent)]" />
                            </span>
                            <span className="text-[13.5px] leading-snug text-[var(--ink-mid)]">{text}</span>
                        </li>
                    ))}
                </ul>

                {/* Full width on a phone, because a thumb should not have to
                    aim. Side by side from the first breakpoint up. */}
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-2.5">
                    <Link
                        href="/register?from=article"
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[var(--accent)] px-6 font-display text-[12px] font-bold uppercase tracking-[0.08em] text-white transition-[filter] duration-300 hover:brightness-110"
                    >
                        Create your profile <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                        href="/login?from=article"
                        className="inline-flex h-11 items-center justify-center rounded-[10px] border border-white/[0.14] px-5 font-display text-[12px] font-bold uppercase tracking-[0.08em] text-white/85 transition-colors duration-300 hover:bg-white/[0.06] hover:text-white"
                    >
                        I already have one
                    </Link>
                </div>

                <p className="mt-3.5 text-[11.5px] text-[var(--ink-faint)]">
                    Free, and it takes a minute.
                </p>
            </div>
        </section>
    );
}
