"use client";

import Link from "next/link";
import { PROFILE_TABS, type ProfileTab } from "@/lib/profileTabs";

/**
 * The profile's section bar.
 *
 * Every section is on it. Five fit the container with room to spare, and an
 * overflow menu that never overflows is a menu you have to open to find out it
 * was pointless. Narrow screens scroll it.
 *
 * The marks are drawn the way the Community and Tools menus draw theirs: line
 * art at a light stroke, no plate under them, sized large enough to be a mark
 * rather than a decoration beside a word. A 17px glyph at a heavy stroke next
 * to a 12px label is a bullet point; at 22px and 1.5 it is the thing you aim
 * for.
 *
 * The active section lights from its floor, the same gesture the record panel
 * above uses for its bays — so the two surfaces read as one instrument stack
 * rather than a card sitting on another card.
 *
 * PROFILE_TABS is the single source of truth, shared by your own profile and
 * everyone else's.
 */
export default function ProfileTabStrip({
    username,
    activeTab = "overview",
    isOwnProfile = true,
    bounty = null,
}: {
    username: string;
    activeTab?: string;
    isOwnProfile?: boolean;
    /** The wallet, parked at the end of the bar. Owner only. */
    bounty?: number | null;
}) {
    const tabs = PROFILE_TABS.filter((t) => !t.ownOnly || isOwnProfile);
    const base = `/profile/${username}`;
    const href = (id: ProfileTab) => (id === "overview" ? base : `${base}?tab=${id}`);

    return (
        <nav
            className="relative rounded-[var(--radius-panel)] border overflow-hidden"
            style={{
                background: "var(--surface-2)",
                borderColor: "var(--line-strong)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
            aria-label="Profile sections"
        >
            <div className="flex items-stretch overflow-x-auto scrollbar-none">
                <span className="flex items-stretch divide-x divide-white/[0.04]">
                {tabs.map(({ id, label, icon: Icon }) => {
                    const active = id === activeTab;

                    const inner = (
                        <>
                            {/* the bay's own fill — off until you approach, and
                                permanently on for the section you are in */}
                            <span
                                aria-hidden
                                className={`absolute inset-0 transition-opacity duration-300 ${active ? "opacity-100" : "opacity-0 group-hover/tab:opacity-100"}`}
                                style={{
                                    background: active
                                        ? "linear-gradient(180deg, color-mix(in srgb, var(--accent) 10%, transparent) 0%, transparent 72%)"
                                        : "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, transparent 72%)",
                                }}
                            />
                            {/* the floor seam */}
                            <span
                                aria-hidden
                                className={`absolute inset-x-4 bottom-0 h-[2px] origin-center transition-transform duration-[380ms] ease-[var(--ease-hud)] ${active ? "scale-x-100" : "scale-x-0 group-hover/tab:scale-x-100"}`}
                                style={{
                                    background: active
                                        ? "var(--accent)"
                                        : "linear-gradient(90deg, transparent, var(--accent), transparent)",
                                }}
                            />

                            <span className="relative flex items-center gap-3">
                                <Icon
                                    className={`w-[22px] h-[22px] shrink-0 transition-[color,transform] duration-300 group-hover/tab:scale-110 ${
                                        active ? "text-[var(--accent-ink)]" : "text-white/35 group-hover/tab:text-[var(--accent-ink)]"
                                    }`}
                                    strokeWidth={1.5}
                                />
                                <span
                                    className={`font-display text-[12px] font-bold uppercase tracking-[0.13em] whitespace-nowrap transition-colors duration-300 ${
                                        active ? "text-[var(--accent-ink)]" : "text-white/45 group-hover/tab:text-white"
                                    }`}
                                >
                                    {label}
                                </span>
                            </span>
                        </>
                    );

                    const shell = "group/tab relative shrink-0 flex items-center h-[62px] px-4 md:px-6";

                    return active ? (
                        <span key={id} aria-current="page" className={shell}>{inner}</span>
                    ) : (
                        <Link key={id} href={href(id)} scroll={false} className={shell}>{inner}</Link>
                    );
                })}
                </span>

                {/* The wallet rides the bar's dead right-hand end, which is
                    where a game puts its currency: always in view, never in
                    the way, one press from the place it is spent. Owner only —
                    a balance is nobody else's business, and the API does not
                    send one for anybody else. */}
                {isOwnProfile && bounty !== null && (
                    <Link
                        href={`${base}?tab=progression`}
                        scroll={false}
                        className="group/wallet ml-auto shrink-0 hidden sm:flex items-center gap-2.5 pl-5 pr-5 border-l border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/images/profile/v2-bounty.webp"
                            alt=""
                            aria-hidden
                            className="w-[26px] h-[26px] shrink-0 object-contain transition-transform duration-300 group-hover/wallet:scale-110"
                        />
                        <span className="font-display text-[15px] font-black tabular-nums leading-none text-amber-400">
                            {bounty.toLocaleString("en-US")}
                        </span>
                        <span className="font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/30">
                            Bounty
                        </span>
                    </Link>
                )}
            </div>
        </nav>
    );
}
