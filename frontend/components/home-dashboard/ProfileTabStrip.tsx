"use client";

import Link from "next/link";
import { Home, Gamepad2, Activity, PenLine, Trophy, Users, Settings } from "lucide-react";

/**
 * Profile-style tab row. Overview IS this page; the rest deep-link into
 * the full profile (which owns collection/activity/achievements) and
 * /friends. No local tab state — honest navigation, not an illusion.
 */
const TABS: { label: string; href: string | null; icon: React.ComponentType<{ className?: string }> }[] = [
    { label: "Overview", href: null, icon: Home },
    { label: "Games", href: "/profile/me?tab=collection", icon: Gamepad2 },
    { label: "Activity", href: "/profile/me?tab=activity", icon: Activity },
    { label: "Reviews", href: "/profile/me?tab=activity", icon: PenLine },
    { label: "Achievements", href: "/profile/me?tab=achievements", icon: Trophy },
    { label: "Friends", href: "/friends", icon: Users },
];

export default function ProfileTabStrip() {
    return (
        <nav
            className="relative flex items-center justify-between gap-4 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--surface-0)_50%,transparent)] px-3 md:px-5"
            aria-label="Profile sections"
        >
            <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
                {TABS.map(({ label, href, icon: Icon }) =>
                    href === null ? (
                        <span
                            key={label}
                            aria-current="page"
                            className="relative shrink-0 flex items-center gap-2 px-3.5 py-3.5 font-display text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--ink-hi)]"
                        >
                            <Icon className="w-4 h-4 text-[var(--accent)]" />
                            {label}
                            <span aria-hidden className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-full bg-[var(--accent)]" />
                        </span>
                    ) : (
                        <Link
                            key={label}
                            href={href}
                            className="group/tab shrink-0 flex items-center gap-2 px-3.5 py-3.5 font-display text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--ink-low)] hover:text-[var(--ink-hi)] transition-colors duration-150"
                        >
                            <Icon className="w-4 h-4 text-[var(--ink-faint)] group-hover/tab:text-[var(--accent)] transition-colors duration-150" />
                            {label}
                        </Link>
                    )
                )}
            </div>

            <Link
                href="/settings"
                className="hidden md:inline-flex shrink-0 items-center gap-2 h-9 px-3.5 rounded-[var(--radius-card)] bg-[var(--fill-2)] border border-[var(--line-strong)] text-[11px] font-semibold text-[var(--ink-low)] hover:text-[var(--ink-hi)] hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-colors duration-300"
            >
                <Settings className="w-3.5 h-3.5" /> Customize Profile
            </Link>
        </nav>
    );
}
