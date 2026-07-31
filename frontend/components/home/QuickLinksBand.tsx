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
 * Platform quick links — four centered destination cards. The CTA is a real
 * button bar that ignites to full accent when the card is hovered.
 */
export default function QuickLinksBand() {
    return (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {LINKS.map((link, i) => (
                <Link
                    key={link.title}
                    href={link.href}
                    className="group relative overflow-hidden flex flex-col items-center text-center rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] p-5 pb-4 hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-colors duration-300"
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

                    {/* icon ignites */}
                    <span className="relative inline-flex w-12 h-12 rounded-[var(--radius-card)] bg-[var(--accent-soft)] items-center justify-center transition-all duration-300 group-hover:bg-[var(--accent)] group-hover:shadow-[var(--glow-accent)]">
                        <link.icon className="w-[22px] h-[22px] text-[var(--accent)] group-hover:text-white transition-colors duration-300" />
                    </span>

                    <p className="relative mt-4 font-display text-[15px] font-bold text-[var(--ink-hi)] leading-tight">
                        {link.title}
                    </p>
                    <p className="relative mt-1 text-[12px] text-[var(--ink-low)] leading-snug max-w-[220px]">
                        {link.sub}
                    </p>

                    {/* CTA bar — ignites to full accent with the card */}
                    <span className="relative mt-4 w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-[var(--radius-inner)] bg-[var(--fill-2)] border border-[var(--line)] font-display text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-mid)] transition-all duration-300 group-hover:bg-[var(--accent)] group-hover:border-transparent group-hover:text-white group-hover:shadow-[var(--glow-accent)]">
                        {link.cta}
                        <ArrowRight className="w-3 h-3 -translate-x-0.5 group-hover:translate-x-0 transition-transform duration-300" />
                    </span>
                </Link>
            ))}
        </section>
    );
}
