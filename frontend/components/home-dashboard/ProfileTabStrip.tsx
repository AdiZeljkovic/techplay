"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import { PROFILE_TABS, type ProfileTab } from "@/lib/profileTabs";

/** What fits on the bar before the rest goes under More. */
const PRIMARY: ProfileTab[] = ["overview", "collection", "achievements", "activity"];

/**
 * The profile's section bar — its own card, sitting under the identity and the
 * progression panel rather than fused to either.
 *
 * Four sections stay on the bar and the remainder move under More, so the row
 * keeps its rhythm instead of degrading into seven equal words. The active
 * section is the only lit thing on it: accent glyph in a plate, accent label,
 * and a filament seated on the card's bottom edge.
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
    const [moreOpen, setMoreOpen] = useState(false);
    const moreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!moreOpen) return;
        const close = (e: MouseEvent) => {
            if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [moreOpen]);

    const tabs = PROFILE_TABS.filter((t) => !t.ownOnly || isOwnProfile);
    const base = `/profile/${username}`;
    const href = (id: ProfileTab) => (id === "overview" ? base : `${base}?tab=${id}`);

    // A section hidden under More still has to show it's the live one, so it
    // takes a slot on the bar when it's active.
    const onBar = tabs.filter((t) => PRIMARY.includes(t.id) || t.id === activeTab);
    const overflow = tabs.filter((t) => !onBar.includes(t));

    return (
        <nav
            className="relative rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)] overflow-hidden"
            aria-label="Profile sections"
        >
            <div className="flex items-center overflow-x-auto scrollbar-none px-2 md:px-3">
                {onBar.map(({ id, label, icon: Icon }) => {
                    const active = id === activeTab;

                    if (active) {
                        return (
                            <span
                                key={id}
                                aria-current="page"
                                className="relative shrink-0 flex items-center gap-2.5 h-[62px] px-4 md:px-6"
                            >
                                {/* the live section burns up from the card's floor */}
                                <span
                                    aria-hidden
                                    className="absolute inset-x-2 bottom-0 h-10 pointer-events-none"
                                    style={{
                                        background:
                                            "radial-gradient(70% 100% at 50% 125%, color-mix(in srgb, var(--accent) 42%, transparent) 0%, transparent 72%)",
                                    }}
                                />
                                <span
                                    className="relative inline-flex items-center justify-center w-8 h-8 rounded-[9px] shrink-0"
                                    style={{
                                        background: "color-mix(in srgb, var(--accent) 16%, transparent)",
                                        boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--accent) 32%, transparent)",
                                    }}
                                >
                                    <Icon className="w-[17px] h-[17px] text-[var(--accent)]" strokeWidth={1.9} />
                                </span>
                                <span className="relative font-display text-[12.5px] font-bold uppercase tracking-[0.13em] text-[var(--accent)] whitespace-nowrap">
                                    {label}
                                </span>
                                <span
                                    aria-hidden
                                    className="absolute bottom-0 left-3 right-3 h-[2px]"
                                    style={{
                                        background:
                                            "linear-gradient(90deg, transparent 0%, var(--accent) 22%, var(--accent) 78%, transparent 100%)",
                                        filter: "drop-shadow(0 0 7px color-mix(in srgb, var(--accent) 90%, transparent))",
                                    }}
                                />
                            </span>
                        );
                    }

                    return (
                        <Link
                            key={id}
                            href={href(id)}
                            scroll={false}
                            className="group/tab relative shrink-0 flex items-center gap-2.5 h-[62px] px-4 md:px-6 text-white/45 hover:text-white transition-colors duration-300"
                        >
                            <Icon
                                className="w-[17px] h-[17px] shrink-0 text-white/35 group-hover/tab:text-white/70 transition-colors duration-300"
                                strokeWidth={1.9}
                            />
                            <span className="font-display text-[12.5px] font-bold uppercase tracking-[0.13em] whitespace-nowrap">
                                {label}
                            </span>
                        </Link>
                    );
                })}

                {overflow.length > 0 && (
                    <div ref={moreRef} className="relative ml-auto shrink-0">
                        <button
                            onClick={() => setMoreOpen((v) => !v)}
                            aria-expanded={moreOpen}
                            className="flex items-center gap-2 h-[62px] px-4 md:px-5 text-white/45 hover:text-white transition-colors duration-300"
                        >
                            <MoreHorizontal className="w-[17px] h-[17px]" />
                            <span className="font-display text-[12.5px] font-bold uppercase tracking-[0.13em]">More</span>
                            <ChevronDown
                                className={`w-4 h-4 transition-transform duration-300 ${moreOpen ? "rotate-180" : ""}`}
                            />
                        </button>

                        {moreOpen && (
                            <div
                                onClick={() => setMoreOpen(false)}
                                className="absolute right-0 bottom-full mb-2 z-50 min-w-[200px] p-1.5 rounded-[12px] border border-[var(--line-strong)] bg-[var(--surface-1)] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.85)]"
                            >
                                {overflow.map(({ id, label, icon: Icon }) => (
                                    <Link
                                        key={id}
                                        href={href(id)}
                                        scroll={false}
                                        className="w-full flex items-center gap-2.5 px-2.5 h-10 rounded-[8px] font-display text-[11.5px] font-bold uppercase tracking-[0.1em] text-[var(--ink-low)] hover:text-[var(--ink-hi)] hover:bg-[var(--fill-2)] transition-colors duration-150"
                                    >
                                        <Icon className="w-4 h-4 text-[var(--ink-faint)]" strokeWidth={1.9} />
                                        {label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}
