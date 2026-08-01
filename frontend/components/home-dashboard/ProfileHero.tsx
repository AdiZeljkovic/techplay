"use client";

import { useState } from "react";
import Link from "next/link";
import {
    User as UserIcon, MapPin, Play, Pencil, Share2, Check,
    Gamepad2, Star, Clock3, Award, Users, UserPlus, Clock, MessageSquare,
} from "lucide-react";
import type { HeroModel } from "@/lib/hero";
import type { ProfileTab } from "@/lib/profileTabs";
import type { FriendStatus } from "@/lib/types/profile";
import { useCountUp } from "@/hooks/useCountUp";
import RingMeter from "@/components/ui/RingMeter";
import ProfileTabStrip from "./ProfileTabStrip";
import { LevelCrest, RankEmblem, XpRail } from "./RankInsignia";

/** 12480 → "12.5K" — hours read as a badge, not a spreadsheet. */
function compact(n: number): string {
    if (n >= 10_000) return `${Math.round(n / 1000)}K`;
    if (n >= 1_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
    return n.toLocaleString();
}

const BTN_GHOST =
    "inline-flex items-center gap-2 px-4 h-10 rounded-[var(--radius-card)] bg-[var(--fill-2)] border border-[var(--line-strong)] text-[var(--ink-hi)] font-display text-[11px] font-bold uppercase tracking-wider hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] hover:bg-[var(--fill-3)] transition-colors duration-300";

const BTN_PRIMARY =
    "group/cta relative inline-flex items-center gap-2 px-5 h-10 rounded-[var(--radius-card)] bg-[var(--accent)] text-white font-display text-[11px] font-bold uppercase tracking-wider overflow-hidden hover:bg-[var(--accent-hover)] transition-colors duration-300 shadow-[var(--glow-accent)]";

/** The diagonal light that wipes across a primary button on hover. */
function Sheen() {
    return (
        <span
            aria-hidden
            className="absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-18deg] bg-white/25 -translate-x-full group-hover/cta:translate-x-[420%] transition-transform duration-700 ease-[var(--ease-hud)]"
        />
    );
}

/**
 * A floating stat card. These sit on the banner art rather than in a
 * strip beneath it, so the artwork stays visible and the numbers read as
 * objects instead of table cells.
 */
function StatCard({
    icon: Icon,
    value,
    label,
    href,
}: {
    icon: React.ComponentType<{ className?: string }>;
    value: number;
    label: string;
    href?: string;
}) {
    const animated = useCountUp(value, 1100);
    const cls =
        "group relative flex flex-col items-center justify-center gap-1.5 min-w-0 px-2 py-4 rounded-[var(--radius-card)] border border-[var(--line-strong)] bg-[color-mix(in_srgb,var(--surface-0)_78%,transparent)] backdrop-blur-md overflow-hidden transition-colors duration-300";

    const body = (
        <>
            {/* accent rail draws across the card on hover */}
            {href && (
                <span
                    aria-hidden
                    className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--accent)] scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-[var(--ease-hud)]"
                />
            )}
            <Icon className="w-4 h-4 text-[var(--ink-faint)] group-hover:text-[var(--accent)] transition-colors duration-300" />
            <p className="font-display text-[22px] font-bold tabular-nums text-[var(--ink-hi)] leading-none group-hover:text-[var(--accent)] transition-colors duration-300">
                {compact(animated)}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--ink-faint)] leading-tight truncate max-w-full">
                {label}
            </p>
        </>
    );

    // Not every tile leads somewhere on someone else's profile (Friends
    // doesn't) — those render as plain cards rather than dead links.
    return href ? (
        <Link
            href={href}
            title={label}
            className={`${cls} hover:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] hover:bg-[color-mix(in_srgb,var(--surface-0)_88%,transparent)]`}
        >
            {body}
        </Link>
    ) : (
        <div title={label} className={cls}>
            {body}
        </div>
    );
}

/** The visitor's relationship button — one control, five states. */
function FriendAction({
    status,
    busy,
    onAdd,
}: {
    status: FriendStatus;
    busy: boolean;
    onAdd: () => void;
}) {
    if (status === "accepted") {
        return (
            <span className={`${BTN_GHOST} cursor-default`}>
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Friends
            </span>
        );
    }

    if (status === "pending") {
        return (
            <span className={`${BTN_GHOST} cursor-default opacity-70`}>
                <Clock className="w-3.5 h-3.5" /> Request Sent
            </span>
        );
    }

    if (status === "incoming") {
        return (
            <Link href="/friends" className={BTN_PRIMARY}>
                <Sheen />
                <UserPlus className="relative w-3.5 h-3.5" />
                <span className="relative">Respond to Request</span>
            </Link>
        );
    }

    return (
        <button onClick={onAdd} disabled={busy} className={`${BTN_PRIMARY} disabled:opacity-60`}>
            <Sheen />
            <UserPlus className="relative w-3.5 h-3.5" />
            <span className="relative">{busy ? "Sending…" : "Add Friend"}</span>
        </button>
    );
}

interface Props {
    hero: HeroModel;
    activeTab?: string;
    /** Owner sees Continue Playing / Edit; visitors see the friend actions. */
    isOwnProfile?: boolean;
    counts?: Partial<Record<ProfileTab, number>>;
    friendStatus?: FriendStatus;
    friendActionBusy?: boolean;
    onAddFriend?: () => void;
    onMessage?: () => void;
    /** Signed-out visitors get no relationship controls at all. */
    viewerSignedIn?: boolean;
}

/**
 * The identity band the whole page hangs off — banner art on the right,
 * identity on the left, stat cards floating between them, tabs beneath.
 * The same component renders your own profile and everyone else's; only the
 * action row and the tab links differ.
 */
export default function ProfileHero({
    hero,
    activeTab,
    isOwnProfile = true,
    counts,
    friendStatus = "none",
    friendActionBusy = false,
    onAddFriend,
    onMessage,
    viewerSignedIn = false,
}: Props) {
    const [copied, setCopied] = useState(false);

    const backdrop = hero.cover_image ?? hero.backdrop_fallback;

    const nextXp = hero.next_rank?.min_xp ?? null;
    const xpPercent = nextXp ? Math.min(100, Math.round((hero.xp / nextXp) * 100)) : 100;

    // the ring draws itself and the inline bar fills in step with it
    const ringValue = useCountUp(xpPercent, 1200);
    const animatedXp = useCountUp(hero.xp, 1200);

    const base = `/profile/${hero.username}`;

    const share = () => {
        const url = `${window.location.origin}${base}`;
        navigator.clipboard?.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const tiles = [
        { label: "Games", value: hero.stats.games, icon: Gamepad2, href: `${base}?tab=collection` },
        { label: "Reviews", value: hero.stats.reviews, icon: Star, href: `${base}?tab=activity` },
        { label: "Hours Played", value: hero.stats.hours, icon: Clock3, href: `${base}?tab=collection` },
        { label: "Achievements", value: hero.stats.achievements, icon: Award, href: `${base}?tab=achievements` },
        // your friend list is yours; a visitor just sees the number
        { label: "Friends", value: hero.stats.friends, icon: Users, href: isOwnProfile ? "/friends" : undefined },
    ];

    const tags = hero.playstyle_tags.slice(0, 3);

    return (
        <section className="relative rounded-[var(--radius-panel)] overflow-hidden bg-[var(--surface-1)] border border-[var(--line)]">
            {/* ── banner field: art stays legible on the right, text side goes solid ── */}
            <div aria-hidden className="absolute inset-0 overflow-hidden">
                {backdrop ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={backdrop}
                            alt=""
                            className={`tp-drift w-full h-full object-cover ${hero.cover_image ? "opacity-95" : "opacity-60"}`}
                        />
                        {/* solid through the identity column, clearing by ~65% so the art breathes */}
                        <span className="absolute inset-0 bg-gradient-to-r from-[var(--surface-1)] from-[22%] via-[color-mix(in_srgb,var(--surface-1)_72%,transparent)] via-[52%] to-[color-mix(in_srgb,var(--surface-1)_18%,transparent)]" />
                        <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[var(--surface-1)] to-transparent" />
                        <span
                            className="absolute inset-0"
                            style={{ background: "radial-gradient(120% 110% at 50% 35%, transparent 40%, color-mix(in srgb, var(--surface-0) 62%, transparent) 100%)" }}
                        />
                    </>
                ) : (
                    <span
                        className="absolute inset-0"
                        style={{ background: "radial-gradient(120% 140% at 15% 0%, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 60%)" }}
                    />
                )}
                <span className="absolute inset-0 bg-hud-grid opacity-30" />
                <span
                    className="absolute -left-24 -top-28 w-[440px] h-[440px] rounded-full opacity-[0.18]"
                    style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
                />
                {/* one-shot power-on sweep */}
                <span className="tp-sweep absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
            </div>

            {/* The Crown — this hero owns the page */}
            <span aria-hidden className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_70%,transparent)] to-transparent" />

            <div className="relative p-5 md:p-7">
                <div className="flex flex-col xl:flex-row xl:items-center gap-6">
                    {/* ── identity ── */}
                    <div className="flex items-center gap-5 flex-1 min-w-0">
                        <Link href={base} className="relative shrink-0 group/av">
                            <RingMeter value={ringValue} size={124} strokeWidth={3} glow>
                                {hero.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={hero.avatar_url}
                                        alt={hero.display_name}
                                        className="w-[100px] h-[100px] rounded-full object-cover transition-transform duration-500 ease-[var(--ease-hud)] group-hover/av:scale-[1.04]"
                                    />
                                ) : (
                                    <span className="w-[100px] h-[100px] rounded-full bg-[var(--surface-2)] border border-[var(--line-strong)] flex items-center justify-center">
                                        <UserIcon className="w-10 h-10 text-[var(--ink-faint)]" />
                                    </span>
                                )}
                            </RingMeter>
                            {/* your own page means you're here, so you're online */}
                            {(hero.is_online || isOwnProfile) && (
                                <span className="absolute bottom-2 right-2 w-[16px] h-[16px]" title="Online">
                                    <span aria-hidden className="tp-pulse-ring absolute inset-0 rounded-full bg-emerald-500" />
                                    <span className="relative block w-full h-full rounded-full bg-emerald-500 ring-[3px] ring-[var(--surface-1)]" />
                                </span>
                            )}
                        </Link>

                        <div className="min-w-0 flex-1">
                            <h1 className="font-display text-[24px] md:text-[30px] font-black text-[var(--ink-hi)] leading-none truncate">
                                {hero.display_name}
                            </h1>

                            {/* ── the insignia block: crest · rank metal · segmented XP gauge ── */}
                            <div className="mt-3 flex items-center gap-3.5">
                                <LevelCrest level={hero.level} size={62} />

                                <div className="min-w-0 flex-1 max-w-[420px]">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        {hero.rank_name && <RankEmblem name={hero.rank_name} color={hero.rank_color} />}
                                        {nextXp && hero.next_rank && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider tabular-nums text-[var(--ink-faint)] whitespace-nowrap">
                                                {(nextXp - hero.xp).toLocaleString()} XP to{" "}
                                                <span style={{ color: hero.next_rank.color || "var(--ink-low)" }}>
                                                    {hero.next_rank.name}
                                                </span>
                                            </span>
                                        )}
                                    </div>

                                    <XpRail percent={ringValue} />

                                    <p className="mt-2 flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-[var(--ink-faint)]">
                                        <span className="tabular-nums">
                                            <span className="font-display text-[13px] font-bold text-[var(--ink-hi)] normal-case tracking-normal">
                                                {animatedXp.toLocaleString()}
                                            </span>
                                            {nextXp ? ` / ${nextXp.toLocaleString()} XP` : " XP"}
                                        </span>
                                        <span className="inline-flex items-center h-[18px] px-2 rounded-full bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] font-display text-[10px] font-bold tabular-nums text-[var(--accent)]">
                                            {ringValue}%
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* meta row */}
                            {(hero.location || tags.length > 0) && (
                                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px]">
                                    {hero.location && (
                                        <span className="inline-flex items-center gap-1 text-[var(--ink-low)]">
                                            <MapPin className="w-3 h-3 text-[var(--ink-faint)]" /> {hero.location}
                                        </span>
                                    )}
                                    {tags.map((t) => (
                                        <span
                                            key={t}
                                            className="inline-flex items-center h-[20px] px-2 rounded-full bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] text-[9px] font-bold uppercase tracking-wider text-[var(--accent)]"
                                        >
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {(hero.tagline || hero.bio) && (
                                <p className="mt-2 text-[12px] text-[var(--ink-mid)] line-clamp-1 max-w-[520px]">
                                    {hero.tagline || hero.bio}
                                </p>
                            )}

                            {/* actions live with the identity, compact like a profile page */}
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                {isOwnProfile ? (
                                    <>
                                        <Link
                                            href={hero.continue_playing ? `/games/${hero.continue_playing.slug}` : "/games"}
                                            prefetch={false}
                                            className={BTN_PRIMARY}
                                        >
                                            <Sheen />
                                            <Play className="relative w-3.5 h-3.5 fill-current" />
                                            <span className="relative">
                                                {hero.continue_playing ? "Continue Playing" : "Find Your First Game"}
                                            </span>
                                        </Link>
                                        <Link href="/settings" className={BTN_GHOST}>
                                            <Pencil className="w-3.5 h-3.5" /> Edit Profile
                                        </Link>
                                    </>
                                ) : viewerSignedIn ? (
                                    <>
                                        <FriendAction
                                            status={friendStatus}
                                            busy={friendActionBusy}
                                            onAdd={() => onAddFriend?.()}
                                        />
                                        <button onClick={() => onMessage?.()} className={BTN_GHOST}>
                                            <MessageSquare className="w-3.5 h-3.5" /> Message
                                        </button>
                                    </>
                                ) : (
                                    <Link href="/login" className={BTN_PRIMARY}>
                                        <Sheen />
                                        <UserPlus className="relative w-3.5 h-3.5" />
                                        <span className="relative">Sign In To Connect</span>
                                    </Link>
                                )}
                                <button onClick={share} title="Copy profile link" className={BTN_GHOST}>
                                    {copied ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                                        </>
                                    ) : (
                                        <>
                                            <Share2 className="w-3.5 h-3.5" /> Share
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── stat cards, floating on the art ── */}
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 shrink-0 xl:w-[540px]">
                        {tiles.map((t) => (
                            <StatCard key={t.label} icon={t.icon} value={t.value} label={t.label} href={t.href} />
                        ))}
                    </div>
                </div>
            </div>

            <ProfileTabStrip
                username={hero.username}
                activeTab={activeTab}
                isOwnProfile={isOwnProfile}
                counts={counts}
            />
        </section>
    );
}
