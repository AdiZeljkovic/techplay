"use client";

import Link from "next/link";
import { PROFILE_TABS, type ProfileTab } from "@/lib/profileTabs";

/**
 * The profile's section bar — its own card, sitting under the identity and the
 * progression panel rather than fused to either.
 *
 * Every section is on the bar. Seven fit the container with room to spare, and
 * an overflow menu that never overflows is a menu you have to open to find out
 * it was pointless. Narrow screens scroll it.
 *
 * The active section is the only lit thing on it: accent glyph in a plate,
 * accent label, and a filament seated on the card's bottom edge.
 *
 * PROFILE_TABS is the single source of truth, shared by your own profile and
 * everyone else's.
 */
export default function ProfileTabStrip({
    username,
    activeTab = "overview",
    isOwnProfile = true,
}: {
    username: string;
    activeTab?: string;
    isOwnProfile?: boolean;
}) {
    const tabs = PROFILE_TABS.filter((t) => !t.ownOnly || isOwnProfile);
    const base = `/profile/${username}`;
    const href = (id: ProfileTab) => (id === "overview" ? base : `${base}?tab=${id}`);

    return (
        <nav
            className="relative rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)] overflow-hidden"
            aria-label="Profile sections"
        >
            <div className="flex items-center overflow-x-auto scrollbar-none px-1.5 md:px-2">
                {tabs.map(({ id, label, icon: Icon }) => {
                    const active = id === activeTab;

                    if (active) {
                        // the approved treatment is quiet: accent glyph, accent
                        // label, a plain underline — no plate, no floor glow
                        return (
                            <span
                                key={id}
                                aria-current="page"
                                className="relative shrink-0 flex items-center gap-2.5 h-[58px] px-3.5 md:px-5"
                            >
                                <Icon className="w-[17px] h-[17px] shrink-0 text-[var(--accent)]" strokeWidth={1.9} />
                                <span className="font-display text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--accent)] whitespace-nowrap">
                                    {label}
                                </span>
                                <span aria-hidden className="absolute bottom-0 left-3 right-3 h-[2px] rounded-t-full bg-[var(--accent)]" />
                            </span>
                        );
                    }

                    return (
                        <Link
                            key={id}
                            href={href(id)}
                            scroll={false}
                            className="group/tab relative shrink-0 flex items-center gap-2.5 h-[58px] px-3.5 md:px-5 text-white/45 hover:text-white transition-colors duration-300"
                        >
                            <Icon
                                className="w-[17px] h-[17px] shrink-0 text-white/35 group-hover/tab:text-white/70 transition-colors duration-300"
                                strokeWidth={1.9}
                            />
                            <span className="font-display text-[12px] font-bold uppercase tracking-[0.12em] whitespace-nowrap">
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
