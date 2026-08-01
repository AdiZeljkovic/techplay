"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { PROFILE_TABS, type ProfileTab } from "@/lib/profileTabs";

/**
 * The logged-in homepage *is* the profile's Overview, so this strip renders
 * the real profile tabs rather than an invented set — every label matches
 * the tab it lands on. PROFILE_TABS is the single source of truth, shared
 * by your own profile and everyone else's.
 */
export default function ProfileTabStrip({
    username,
    activeTab = "overview",
    isOwnProfile = true,
    counts,
}: {
    username: string;
    activeTab?: string;
    isOwnProfile?: boolean;
    counts?: Partial<Record<ProfileTab, number>>;
}) {
    const tabs = PROFILE_TABS.filter((t) => !t.ownOnly || isOwnProfile);
    const base = `/profile/${username}`;

    return (
        <nav
            className="relative flex items-center justify-between gap-4 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--surface-0)_50%,transparent)] px-3 md:px-5"
            aria-label="Profile sections"
        >
            <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
                {tabs.map(({ id, label, icon: Icon }) => {
                    const count = counts?.[id];
                    const badge =
                        typeof count === "number" && count > 0 ? (
                            <span className="font-display text-[10px] font-bold tabular-nums text-[var(--ink-faint)]">
                                {count.toLocaleString("en-US")}
                            </span>
                        ) : null;

                    return id === activeTab ? (
                        <span
                            key={id}
                            aria-current="page"
                            className="relative shrink-0 flex items-center gap-2 px-3.5 py-3.5 font-display text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--ink-hi)]"
                        >
                            <Icon className="w-4 h-4 text-[var(--accent)]" />
                            {label}
                            {badge}
                            <span aria-hidden className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-full bg-[var(--accent)]" />
                        </span>
                    ) : (
                        <Link
                            key={id}
                            href={id === "overview" ? base : `${base}?tab=${id}`}
                            scroll={false}
                            className="group/tab shrink-0 flex items-center gap-2 px-3.5 py-3.5 font-display text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--ink-low)] hover:text-[var(--ink-hi)] transition-colors duration-150"
                        >
                            <Icon className="w-4 h-4 text-[var(--ink-faint)] group-hover/tab:text-[var(--accent)] transition-colors duration-150" />
                            {label}
                            {badge}
                        </Link>
                    );
                })}
            </div>

            {isOwnProfile && (
                <Link
                    href="/settings"
                    className="hidden md:inline-flex shrink-0 items-center gap-2 h-9 px-3.5 rounded-[var(--radius-card)] bg-[var(--fill-2)] border border-[var(--line-strong)] text-[11px] font-semibold text-[var(--ink-low)] hover:text-[var(--ink-hi)] hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-colors duration-300"
                >
                    <Settings className="w-3.5 h-3.5" /> Customize Profile
                </Link>
            )}
        </nav>
    );
}
