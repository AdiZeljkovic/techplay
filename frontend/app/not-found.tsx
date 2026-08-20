"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Home, Newspaper, Star, Gamepad2, MessagesSquare, BookOpen } from "lucide-react";

/**
 * The page for an address that leads nowhere.
 *
 * Written as a HUD readout rather than an apology, because that is the voice the
 * rest of the site already speaks in — the grid, the mono numerals, the one hot
 * crimson element. A 404 is the only page a reader reaches by accident, so it
 * earns the same care as the ones they choose.
 *
 * It also tries to be useful, which the previous one did not: almost every
 * arrival here is a mistyped or an expired address, so the path that was asked
 * for is printed back. Seeing `/nwes` is a faster fix than any wording. What
 * follows are real sections rather than a generic "go home", and the header's
 * search sits above this page already — a second search box would only be a
 * second thing to ignore.
 */

/** Where somebody who landed here most likely meant to be. */
const DESTINATIONS = [
    { href: "/news", label: "News", note: "Breaking stories", Icon: Newspaper },
    { href: "/reviews", label: "Reviews", note: "Scored, played to the end", Icon: Star },
    { href: "/games", label: "Games", note: "The database", Icon: Gamepad2 },
    { href: "/forum", label: "Forum", note: "Where the arguing happens", Icon: MessagesSquare },
    { href: "/guides", label: "Guides", note: "How to get unstuck", Icon: BookOpen },
];

export default function NotFound() {
    // On this page the pathname is the address that failed — worth showing.
    const attempted = usePathname();

    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* The site's own grid, held back so the readout stays the subject. */}
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-hud-grid opacity-[0.55]"
            />
            {/* A single crimson bloom behind the numerals, the way a hero carries one. */}
            <span
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-[22%] h-[420px] w-[720px] max-w-[110vw] -translate-x-1/2 rounded-full bg-[var(--accent)]/[0.07] blur-[120px]"
            />

            <div className="relative container-page flex min-h-screen flex-col items-center justify-center py-20">
                <div className="w-full max-w-2xl">
                    {/* ── The readout ───────────────────────────────────── */}
                    <div className="relative overflow-hidden rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)]">
                        {/* Corner tick — the anchor that makes it read as an instrument. */}
                        <span aria-hidden className="absolute left-0 top-0 h-px w-16 bg-[var(--accent)]" />
                        <span aria-hidden className="absolute left-0 top-0 h-16 w-px bg-[var(--accent)]" />

                        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3">
                            <span className="font-numeric text-[10.5px] font-medium uppercase tracking-[0.22em] text-[var(--ink-faint)]">
                                Signal lost
                            </span>
                            <span className="flex items-center gap-2 font-numeric text-[10.5px] font-medium uppercase tracking-[0.22em] text-[var(--accent)]">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                                Error 404
                            </span>
                        </div>

                        <div className="tp-404-scan px-5 pb-8 pt-6 text-center sm:px-10">
                            <p
                                aria-hidden
                                className="font-numeric text-[104px] font-bold leading-[0.9] tracking-[-0.04em] text-transparent sm:text-[168px]"
                                style={{ WebkitTextStroke: "1px var(--ink-faint)" }}
                            >
                                404
                            </p>

                            <h1 className="mt-6 font-display text-2xl font-bold text-[var(--ink-hi)] sm:text-3xl">
                                This area isn&rsquo;t in the build
                            </h1>

                            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[var(--ink-low)]">
                                Nothing lives at this address. It was probably renamed, retired,
                                or lost a character somewhere along the way.
                            </p>

                            {/* The address that failed. Usually the whole explanation. */}
                            <div className="mx-auto mt-6 flex max-w-full items-center gap-3 overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-0)] px-3.5 py-2.5">
                                <span className="shrink-0 font-numeric text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-faint)]">
                                    Requested
                                </span>
                                <code className="truncate font-numeric text-[13px] text-[var(--ink-mid)]">
                                    {attempted}
                                </code>
                            </div>

                            <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
                                <Link
                                    href="/"
                                    className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-card)] bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
                                >
                                    <Home className="h-4 w-4" />
                                    Back to base
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => window.history.back()}
                                    className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-card)] border border-[var(--line-strong)] bg-[var(--fill-1)] px-5 py-2.5 text-sm font-semibold text-[var(--ink-mid)] transition-colors hover:border-[var(--accent)] hover:text-[var(--ink-hi)]"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Retrace steps
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Fast travel ───────────────────────────────────── */}
                    <p className="mt-10 text-center font-numeric text-[10.5px] font-medium uppercase tracking-[0.22em] text-[var(--ink-faint)]">
                        Fast travel
                    </p>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {DESTINATIONS.map(({ href, label, note, Icon }, i) => (
                            <Link
                                key={href}
                                href={href}
                                // An odd count leaves the last card stranded beside a gap;
                                // running it full width ends the block square instead.
                                className={`group flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-1)] px-4 py-3 transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface-2)]${
                                    i === DESTINATIONS.length - 1 && DESTINATIONS.length % 2 === 1 ? " sm:col-span-2" : ""
                                }`}
                            >
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-inner)] bg-[var(--fill-2)] text-[var(--ink-low)] transition-colors group-hover:bg-[var(--accent)]/10 group-hover:text-[var(--accent)]">
                                    <Icon className="h-4 w-4" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-sm font-semibold text-[var(--ink-hi)]">{label}</span>
                                    <span className="block truncate text-xs text-[var(--ink-faint)]">{note}</span>
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
