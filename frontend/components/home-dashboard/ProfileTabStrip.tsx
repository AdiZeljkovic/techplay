"use client";

import Link from "next/link";

/**
 * Profile-style tab row. Overview IS this page; the rest deep-link into
 * the full profile (which owns collection/activity/achievements) and
 * /friends. No local tab state — honest navigation, not an illusion.
 */
const TABS: { label: string; href: string | null }[] = [
    { label: "Overview", href: null },
    { label: "Games", href: "/profile/me?tab=collection" },
    { label: "Activity", href: "/profile/me?tab=activity" },
    { label: "Reviews", href: "/profile/me?tab=activity" },
    { label: "Achievements", href: "/profile/me?tab=achievements" },
    { label: "Friends", href: "/friends" },
];

export default function ProfileTabStrip() {
    return (
        <nav className="flex items-center gap-1 overflow-x-auto border-b border-[var(--line)] px-1" aria-label="Profile sections">
            {TABS.map((t) =>
                t.href === null ? (
                    <span
                        key={t.label}
                        aria-current="page"
                        className="relative shrink-0 px-4 py-3 font-display text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--ink-hi)]"
                    >
                        {t.label}
                        <span aria-hidden className="absolute bottom-0 left-3 right-3 h-[2px] rounded-t-full bg-[var(--accent)]" />
                    </span>
                ) : (
                    <Link
                        key={t.label}
                        href={t.href}
                        className="shrink-0 px-4 py-3 font-display text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--ink-low)] hover:text-[var(--accent)] transition-colors duration-150"
                    >
                        {t.label}
                    </Link>
                )
            )}
        </nav>
    );
}
