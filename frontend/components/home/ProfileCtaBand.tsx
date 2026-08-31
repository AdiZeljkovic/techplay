import Link from "next/link";
import Image from "next/image";
import { Gamepad2, ListChecks, Award, Users, Check } from "lucide-react";

/**
 * What the account is for, stated as what it does rather than what it offers.
 *
 * These were "Track Games / Build Backlog / Earn Achievements / Join
 * Community" — the feature list of any site with a login, and the last one
 * pointed at an empty forum. Each line now names a mechanism that exists and
 * that nowhere else has: playtime read from Steam, sessions proposed rather
 * than invented, taste derived from a collection, weights published.
 */
const FEATURES = [
    { icon: Gamepad2, title: "One library, every platform", sub: "Steam, PlayStation and Xbox in one place — plus anything you add by hand" },
    { icon: ListChecks, title: "Hours counted without you", sub: "Playtime is read on a schedule and offered as a session — nothing is logged until you say so" },
    { icon: Award, title: "Your taste, in numbers", sub: "Genres, medians and a completion rate derived from what you own, not guessed" },
    { icon: Users, title: "How close your taste is to anyone else's", sub: "One percentage, with the weights behind it published" },
];

/**
 * Closing conversion band. The render IS the box — Buffy and the four panels
 * are drawn into a scene whose left half is empty on purpose, so the pitch
 * sits directly on it and the product glows behind the words rather than in
 * a second box beside them.
 */
export default function ProfileCtaBand() {
    return (
        <section className="relative rounded-[var(--radius-panel)] border border-[var(--line)] overflow-hidden">
            {/*
             * The scene, full bleed.
             *
             * The render is 2135x736 — 2.90:1 — and the band is up to 1452 wide
             * by roughly 492 tall, which is 2.95:1. At desktop width the two
             * agree, so nothing meaningful is cropped: the art was drawn to
             * these proportions, with its left half left empty for this copy.
             *
             * Below lg the band collapses to one column and the words span all
             * of it, so the frame moves to that empty left region and the scene
             * sits the breakpoint out rather than landing behind the text. From
             * lg it anchors right, which is what keeps the four panels whole;
             * between 1024 and 1280 the leftmost of them slides under the
             * scrim, and that is the trade that keeps the right-hand ones and
             * the owl intact.
             *
             * Still aria-hidden: every word in the render is said again in the
             * list beside it, so there is nothing here a screen reader misses.
             */}
            <Image
                src="/images/profile-cta-buffy.webp"
                alt=""
                aria-hidden
                fill
                // Asks for the 1920 variant. The shot this replaced was pure
                // backdrop and was deliberately capped at 1200; this one carries
                // panels meant to be read — 1,284h, the genre split — and
                // stretching a 1200 source across 1452 smears exactly those.
                sizes="(min-width: 1280px) 1452px, 100vw"
                className="object-cover object-[15%_center] lg:object-[92%_center]"
                priority={false}
            />
            {/* Legibility scrim: solid under the words, gone over the product */}
            <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-[var(--surface-0)]/95 via-[var(--surface-0)]/60 to-transparent" />
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--surface-0)]/70 to-transparent" />
            {/* Crown */}
            <span aria-hidden className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent" />

            <div className="relative grid grid-cols-1 lg:grid-cols-2 p-6 md:p-10 lg:py-14">
                {/* ── Pitch, on the dark side of the scene ── */}
                <div className="flex flex-col justify-center">
                    <p className="flex items-center gap-2.5 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-3">
                        <span className="w-1 h-4 rounded-full bg-[var(--accent)]" />
                        What an account is for
                    </p>

                    <h2 className="font-display text-[28px] md:text-[34px] font-black text-[var(--ink-hi)] leading-[1.08]">
                        The record builds
                        <br />
                        <span className="text-[var(--accent)]">itself.</span>
                    </h2>

                    <p className="mt-4 text-[14px] text-[var(--ink-mid)] max-w-[440px] leading-relaxed">
                        Your games arrive from wherever you actually play them, and most of what
                        this profile knows comes without you typing it. The longer you play, the
                        more there is to read back.
                    </p>

                    <ul className="mt-7 space-y-3">
                        {FEATURES.map((f) => (
                            <li key={f.title} className="flex items-center gap-3">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center justify-center">
                                    <Check className="w-3 h-3 text-[var(--accent)]" strokeWidth={3} />
                                </span>
                                <span className="min-w-0">
                                    <span className="font-display text-[13px] font-bold text-[var(--ink-hi)]">{f.title}</span>
                                    <span className="text-[13px] text-[var(--ink-low)]"> — {f.sub}</span>
                                </span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 px-7 h-12 rounded-[var(--radius-card)] bg-[var(--accent)] text-white font-display text-[13px] font-bold uppercase tracking-wider hover:bg-[var(--accent-hover)] transition-colors duration-300 shadow-[var(--glow-accent)]"
                        >
                            Start your library
                        </Link>
                        <span className="text-[12px] text-[var(--ink-faint)]">
                            Free, and no card ·{" "}
                            <Link href="/login" className="text-[var(--ink-mid)] hover:text-[var(--accent)] font-semibold transition-colors">
                                Already have an account?
                            </Link>
                        </span>
                    </div>
                </div>

                {/* Right half belongs to the render itself; it only needs the room. */}
                <div aria-hidden className="hidden lg:block min-h-[380px]" />
            </div>
        </section>
    );
}
