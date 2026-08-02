"use client";

import Link from "next/link";
import { PROFILE_TABS, type ProfileTab } from "@/lib/profileTabs";

/**
 * The logged-in homepage *is* the profile's Overview, so this strip renders
 * the real profile tabs rather than an invented set — every label matches
 * the tab it lands on. PROFILE_TABS is the single source of truth, shared
 * by your own profile and everyone else's.
 *
 * The accent is spent only on the active tab. Painting the whole strip would
 * cost the one thing the colour is doing here — saying where you are.
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
            className="relative border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--surface-0)_78%,transparent)]"
            style={{ boxShadow: "inset 0 6px 12px -8px rgba(0,0,0,0.7)" }}
            aria-label="Profile sections"
        >
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none px-2 md:px-4 py-2.5">
                {tabs.map(({ id, label, icon: Icon }) => {
                    const active = id === activeTab;
                    const count = counts?.[id];
                    const hasCount = typeof count === "number" && count > 0;

                    const badge = hasCount ? (
                        <span
                            className={`inline-flex items-center justify-center min-w-[20px] h-[19px] px-1.5 rounded-full font-display text-[10px] font-bold tabular-nums leading-none transition-colors duration-300 ${
                                active
                                    ? "bg-[var(--accent)] text-white"
                                    : "bg-[var(--fill-3)] text-[var(--ink-faint)] group-hover/tab:text-[var(--ink-mid)]"
                            }`}
                        >
                            {count.toLocaleString("en-US")}
                        </span>
                    ) : null;

                    const inner = (
                        <>
                            <Icon
                                className={`w-4 h-4 shrink-0 transition-colors duration-300 ${
                                    active ? "text-[var(--accent)]" : "text-[var(--ink-faint)] group-hover/tab:text-[var(--ink-mid)]"
                                }`}
                            />
                            <span className="font-display text-[12px] font-bold uppercase tracking-[0.08em]">{label}</span>
                            {badge}
                        </>
                    );

                    // The active tab is a lit key on a console: raised fill,
                    // accent hairline, and a bar seated on the strip's edge.
                    if (active) {
                        return (
                            <span
                                key={id}
                                aria-current="page"
                                className="relative shrink-0 flex items-center gap-2 h-10 px-3.5 rounded-[var(--radius-card)] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                                style={{ boxShadow: "0 0 22px -6px color-mix(in srgb, var(--accent) 60%, transparent), inset 0 1px 0 color-mix(in srgb, var(--accent) 22%, transparent)" }}
                            >
                                {inner}
                                <span
                                    aria-hidden
                                    className="absolute -bottom-[8px] left-3 right-3 h-[2px] rounded-full bg-[var(--accent)]"
                                    style={{ boxShadow: "0 0 10px color-mix(in srgb, var(--accent) 80%, transparent)" }}
                                />
                            </span>
                        );
                    }

                    return (
                        <Link
                            key={id}
                            href={id === "overview" ? base : `${base}?tab=${id}`}
                            scroll={false}
                            className="group/tab shrink-0 flex items-center gap-2 h-10 px-3.5 rounded-[var(--radius-card)] border border-transparent text-[var(--ink-low)] hover:text-[var(--ink-hi)] hover:bg-[var(--fill-2)] hover:border-[var(--line)] transition-colors duration-300"
                        >
                            {inner}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
