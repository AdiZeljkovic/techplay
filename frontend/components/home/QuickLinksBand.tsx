"use client";

import Link from "next/link";
import { Database, CalendarDays, Bookmark, Users, ArrowRight } from "lucide-react";

const LINKS = [
    { icon: Database, title: "Game Database", sub: "Search & discover 200,000+ games", href: "/games", cta: "Browse games" },
    { icon: CalendarDays, title: "Release Calendar", sub: "Track upcoming game releases", href: "/calendar", cta: "See what's next" },
    { icon: Bookmark, title: "My Games", sub: "Build your library and watchlist", href: "/login", cta: "Start tracking" },
    { icon: Users, title: "Community", sub: "Forums, reviews & player discussions", href: "/forum", cta: "Join the talk" },
];

/**
 * Platform quick links — four destination cards with a HUD index, an icon
 * that ignites on hover, and a reveal CTA line. The band is the "what can
 * I do here" map, so every tile has to beg for the click.
 */
export default function QuickLinksBand() {
    return (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {LINKS.map((link, i) => (
                <Link
                    key={link.title}
                    href={link.href}
                    className="group relative overflow-hidden rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] p-5 hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-colors duration-300"
                >
                    {/* accent wash rising from the bottom on hover */}
                    <span
                        aria-hidden
                        className="absolute inset-x-0 bottom-0 h-2/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{ background: "radial-gradient(120% 100% at 50% 120%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 70%)" }}
                    />
                    {/* mini-crown on hover */}
                    <span
                        aria-hidden
                        className="absolute top-0 left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    />
                    {/* HUD index */}
                    <span
                        aria-hidden
                        className="absolute top-3 right-4 font-display text-[26px] font-bold tabular-nums text-[var(--ink-hi)] opacity-[0.06] group-hover:opacity-[0.14] group-hover:text-[var(--accent)] transition-all duration-300 select-none"
                    >
                        0{i + 1}
                    </span>

                    <div className="relative">
                        {/* icon ignites */}
                        <span className="inline-flex w-12 h-12 rounded-[var(--radius-card)] bg-[var(--accent-soft)] items-center justify-center transition-all duration-300 group-hover:bg-[var(--accent)] group-hover:shadow-[var(--glow-accent)]">
                            <link.icon className="w-[22px] h-[22px] text-[var(--accent)] group-hover:text-white transition-colors duration-300" />
                        </span>

                        <p className="mt-4 font-display text-[15px] font-bold text-[var(--ink-hi)] leading-tight">
                            {link.title}
                        </p>
                        <p className="mt-1 text-[12px] text-[var(--ink-low)] leading-snug">
                            {link.sub}
                        </p>

                        {/* reveal CTA line */}
                        <span className="mt-4 flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-faint)] group-hover:text-[var(--accent)] transition-colors duration-300">
                            {link.cta}
                            <ArrowRight className="w-3 h-3 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
                        </span>
                    </div>
                </Link>
            ))}
        </section>
    );
}
