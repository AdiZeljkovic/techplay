"use client";

import Link from "next/link";
import { PROFILE_TABS, type ProfileTab } from "@/lib/profileTabs";

/**
 * A count riding with its label. Hairline ring, no fill worth noticing —
 * it should read as a footnote to the word, never compete with it.
 */
function Count({ value, active }: { value: number; active: boolean }) {
    return (
        <span
            className={`tp-badge-in inline-flex items-center justify-center min-w-[20px] h-[17px] px-1.5 rounded-full font-display text-[9.5px] font-bold tabular-nums leading-none border transition-colors duration-300 ${
                active
                    ? "border-[color-mix(in_srgb,var(--accent)_55%,transparent)] bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] text-[var(--accent-bright)]"
                    : "border-white/[0.09] bg-white/[0.05] text-white/40 group-hover/tab:border-white/20 group-hover/tab:text-white/65"
            }`}
        >
            {value > 99 ? "99+" : value.toLocaleString("en-US")}
        </span>
    );
}

/**
 * The profile's section rail — an ember band with a machined face.
 *
 * The accent is folded into near-black rather than used raw: at this width raw
 * accent stops being a highlight and becomes a surface, and nothing on it can
 * mark position. Kept dark, the rail leaves headroom for the active tab to be
 * the brightest thing on it.
 *
 * The rail is typography-led. Labels carry wide tracking and own the weight;
 * glyphs are drawn thin and sit back at low opacity, so they identify a
 * section without competing with its name. Hairlines between items give the
 * row a rhythm instead of an even smear of words.
 *
 * PROFILE_TABS is the single source of truth, shared by your own profile and
 * everyone else's.
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
            className="relative"
            style={{
                background:
                    "linear-gradient(180deg, color-mix(in srgb, var(--accent) 15%, #0b0908) 0%, color-mix(in srgb, var(--accent) 7%, #0b0908) 100%)",
            }}
            aria-label="Profile sections"
        >
            {/* the filament: a hot line where the rail meets the hero */}
            <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-px"
                style={{
                    background:
                        "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--accent) 70%, transparent) 22%, color-mix(in srgb, var(--accent) 70%, transparent) 78%, transparent 100%)",
                }}
            />
            {/* embers pooling along the bottom edge */}
            <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-14 pointer-events-none"
                style={{
                    background:
                        "radial-gradient(120% 100% at 50% 130%, color-mix(in srgb, var(--accent) 34%, transparent) 0%, transparent 70%)",
                }}
            />

            <div className="relative flex items-center justify-start lg:justify-center overflow-x-auto scrollbar-none px-2 md:px-4">
                {tabs.map(({ id, label, icon: Icon }, i) => {
                    const active = id === activeTab;
                    const count = counts?.[id] ?? 0;

                    const inner = (
                        <>
                            {/* hairline between sections — rhythm, not decoration */}
                            {i > 0 && (
                                <span
                                    aria-hidden
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-[18px] bg-white/[0.07]"
                                />
                            )}

                            <Icon
                                strokeWidth={1.6}
                                className={`relative w-[15px] h-[15px] shrink-0 transition-colors duration-300 ${
                                    active ? "text-[var(--accent-bright)]" : "text-white/30 group-hover/tab:text-white/60"
                                }`}
                            />
                            <span
                                className={`relative font-display text-[11px] font-bold uppercase whitespace-nowrap transition-colors duration-300 ${
                                    active ? "text-white" : "text-white/50 group-hover/tab:text-white/85"
                                }`}
                                style={{ letterSpacing: "0.15em" }}
                            >
                                {label}
                            </span>
                            {count > 0 && (
                                <span className="relative">
                                    <Count value={count} active={active} />
                                </span>
                            )}
                        </>
                    );

                    if (active) {
                        return (
                            <span
                                key={id}
                                aria-current="page"
                                className="group/tab relative shrink-0 flex items-center gap-2.5 h-[54px] pl-5 pr-5"
                            >
                                {/* the section burns up from the floor */}
                                <span
                                    aria-hidden
                                    className="absolute inset-x-2 bottom-0 h-9 pointer-events-none"
                                    style={{
                                        background:
                                            "radial-gradient(75% 100% at 50% 125%, color-mix(in srgb, var(--accent) 52%, transparent) 0%, transparent 72%)",
                                    }}
                                />
                                {inner}
                                {/* tapered filament under the live section */}
                                <span
                                    aria-hidden
                                    className="absolute bottom-0 left-3 right-3 h-[2px]"
                                    style={{
                                        background:
                                            "linear-gradient(90deg, transparent 0%, var(--accent-bright) 26%, var(--accent-bright) 74%, transparent 100%)",
                                        filter: "drop-shadow(0 0 6px color-mix(in srgb, var(--accent) 90%, transparent))",
                                    }}
                                />
                            </span>
                        );
                    }

                    return (
                        <Link
                            key={id}
                            href={id === "overview" ? base : `${base}?tab=${id}`}
                            scroll={false}
                            className="group/tab relative shrink-0 flex items-center gap-2.5 h-[54px] pl-5 pr-5"
                        >
                            {inner}
                            {/* same filament, unlit — it fades up on approach */}
                            <span
                                aria-hidden
                                className="absolute bottom-0 left-3 right-3 h-[2px] opacity-0 group-hover/tab:opacity-100 transition-opacity duration-300"
                                style={{
                                    background:
                                        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.42) 26%, rgba(255,255,255,0.42) 74%, transparent 100%)",
                                }}
                            />
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
