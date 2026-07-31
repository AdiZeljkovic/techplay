"use client";

import Link from "next/link";
import { Database, CalendarDays, Bookmark, Users, ChevronRight } from "lucide-react";

const LINKS = [
    { icon: Database, title: "Game Database", sub: "Search & discover 200,000+ games", href: "/games" },
    { icon: CalendarDays, title: "Release Calendar", sub: "Track upcoming game releases", href: "/calendar" },
    { icon: Bookmark, title: "My Games", sub: "Build your library and watchlist", href: "/login" },
    { icon: Users, title: "Community", sub: "Forums, reviews & player discussions", href: "/forum" },
];

export default function QuickLinksBand() {
    return (
        <section className="rounded-[var(--radius-panel)] bg-[var(--surface-1)] border border-[var(--line)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 divide-[var(--line)] lg:divide-x">
            {LINKS.map((link) => (
                <Link
                    key={link.title}
                    href={link.href}
                    className="group flex items-center gap-3.5 p-5 hover:bg-[var(--fill-1)] transition-colors"
                >
                    <span className="w-11 h-11 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center shrink-0 group-hover:bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] transition-colors">
                        <link.icon className="w-5 h-5 text-[var(--accent)]" />
                    </span>
                    <span className="flex-1 min-w-0">
                        <span className="block font-display text-[14px] font-bold text-[var(--ink-hi)] group-hover:text-[var(--accent)] transition-colors">{link.title}</span>
                        <span className="block text-[11px] text-[var(--ink-low)] leading-tight mt-0.5">{link.sub}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-[var(--ink-faint)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
            ))}
        </section>
    );
}
