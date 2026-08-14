"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    User as UserIcon, MapPin, CalendarDays, Pencil, ExternalLink, Check, BadgeCheck, MoreHorizontal,
    Play, Sparkles, ShieldCheck, LinkIcon, UserPlus, Clock, MessageSquare, Share2 } from "lucide-react";
import type { HeroModel } from "@/lib/hero";
import type { FriendStatus } from "@/lib/types/profile";
import { rankTier } from "@/lib/ranks";
import { useCountUp } from "@/hooks/useCountUp";
import ProfileTabStrip from "./ProfileTabStrip";
import ShareCard from "@/components/profile/ShareCard";
import StatIcon from "./StatIcon";
import { RankInsigniaMark, XpRail } from "./RankInsignia";
import { xpForLevel } from "@/lib/level";

/* ── avatar ───────────────────────────────────────────────────────────── */

/**
 * A thin lit ring, a dark gap, the portrait. The approved look is a plain
 * accent circle — the rendered HUD ring is retired. A purchased frame
 * cosmetic still wins, because the point of buying one is that it shows.
 */
function AvatarRing({
    src,
    alt,
    frame,
    online }: {
    src: string | null;
    alt: string;
    frame: string | null;
    online: boolean;
}) {
    // An equipped cosmetic frame is a colour the reader paid for, so it wins.
    // With nothing equipped the house frame is drawn instead — the armoured
    // ring with the crest, rather than a flat crimson circle.
    const cosmetic = !!frame;

    return (
        <div className="relative w-[124px] h-[124px] md:w-[150px] md:h-[150px] shrink-0">
            {cosmetic ? (
                <>
                    <span
                        aria-hidden
                        className="absolute inset-0 rounded-full"
                        style={{
                            background: frame!,
                            boxShadow: "0 0 24px -4px color-mix(in srgb, var(--accent) 55%, transparent)" }}
                    />
                    {/* the gap that keeps the ring reading as a ring, not a border */}
                    <span aria-hidden className="absolute inset-[2.5px] rounded-full bg-[var(--surface-0)]" />
                </>
            ) : (
                <span
                    aria-hidden
                    className="absolute inset-0 z-20 pointer-events-none"
                    style={{
                        // Drawn over the portrait, not behind it: the ring has a
                        // crest that oversails its own circle at top and bottom,
                        // and behind the image those would be clipped away.
                        backgroundImage: "url(/images/profile/avatar-frame.webp)",
                        backgroundSize: "contain",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                        filter: "drop-shadow(0 0 18px color-mix(in srgb, var(--accent) 45%, transparent))",
                    }}
                />
            )}

            {/* 11.3%, not a round number: the ring's opening measures 978px
                across a 1280 square, which is an inset of 11.8% exactly. Half
                a percent tighter puts the portrait's edge under the metal
                rather than flush against it, so no hairline of page shows
                between them where the art anti-aliases. */}
            <span className={`absolute rounded-full overflow-hidden bg-[var(--surface-2)] ${cosmetic ? "inset-[7px]" : "inset-[11.3%]"}`}>
                {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={src}
                        alt={alt}
                        className="w-full h-full object-cover transition-transform duration-500 ease-[var(--ease-hud)] group-hover/av:scale-[1.05]"
                    />
                ) : (
                    <span className="w-full h-full flex items-center justify-center">
                        <UserIcon className="w-10 h-10 text-[var(--ink-faint)]" />
                    </span>
                )}
            </span>

            {online && (
                // On the ring's lower-left arc, between the crest at the bottom
                // and the ornament on the left. Further out it floated in the
                // corner of the box, detached from the portrait it belongs to.
                <span className={`absolute z-30 w-[18px] h-[18px] ${cosmetic ? "bottom-[6%] left-[13%]" : "bottom-[13%] left-[13%]"}`} title="Online now">
                    <span aria-hidden className="tp-pulse-ring absolute inset-0 rounded-full bg-emerald-400" />
                    <span
                        className="relative block w-full h-full rounded-full ring-[3px] ring-[var(--surface-0)]"
                        style={{ background: "radial-gradient(circle at 35% 30%, #a7f3d0 0%, #10b981 55%, #047857 100%)" }}
                    />
                    <span className="sr-only">Online</span>
                </span>
            )}
        </div>
    );
}

/* ── buttons ──────────────────────────────────────────────────────────── */

const BTN =
    "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-[8px] border font-display text-[11.5px] font-bold uppercase tracking-[0.08em] transition-colors duration-300 disabled:opacity-60";

const BTN_GHOST = `${BTN} border-white/[0.14] bg-black/30 backdrop-blur-sm text-white hover:bg-white/[0.09] hover:border-white/30`;

const BTN_PRIMARY = `${BTN} border-transparent bg-[var(--accent)] text-white hover:brightness-110`;

/** The visitor's relationship button — one control, five states. */
function FriendAction({ status, busy, onAdd }: { status: FriendStatus; busy: boolean; onAdd: () => void }) {
    if (status === "accepted") {
        return (
            <span className={`${BTN_GHOST} cursor-default`}>
                <Check className="w-4 h-4 text-emerald-400" /> Friends
            </span>
        );
    }
    if (status === "pending") {
        return (
            <span className={`${BTN_GHOST} cursor-default opacity-70`}>
                <Clock className="w-4 h-4" /> Request sent
            </span>
        );
    }
    if (status === "incoming") {
        return (
            <Link href="/social" className={BTN_PRIMARY}>
                <UserPlus className="w-4 h-4" /> Respond
            </Link>
        );
    }
    return (
        <button onClick={onAdd} disabled={busy} className={BTN_PRIMARY}>
            <UserPlus className="w-4 h-4" /> {busy ? "Sending…" : "Add friend"}
        </button>
    );
}

/** The overflow — everything that matters but doesn't deserve a button. */
function MoreMenu({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                aria-label="More profile actions"
                aria-expanded={open}
                className={`${BTN_GHOST} w-10 px-0`}
            >
                <MoreHorizontal className="w-4 h-4" />
            </button>

            {open && (
                <div
                    onClick={() => setOpen(false)}
                    className="absolute left-0 top-full mt-2 z-50 min-w-[230px] p-1.5 rounded-[12px] border border-[var(--line-strong)] bg-[var(--surface-1)] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.85)]"
                >
                    {children}
                </div>
            )}
        </div>
    );
}

const MENU_ITEM =
    "w-full flex items-center gap-2.5 px-2.5 h-9 rounded-[8px] text-[12px] font-semibold text-[var(--ink-low)] hover:text-[var(--ink-hi)] hover:bg-[var(--fill-2)] transition-colors duration-150";

/* ── the record strip ─────────────────────────────────────────────────── */

interface StripCell {
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
    href?: string;
}

/**
 * One bay of the record panel.
 *
 * The figures used to sit on the page with hairlines between them, which was
 * fine while the icons were flat. They are not flat any more, and a rendered
 * object floating on a background reads as a sticker — it needs a face to sit
 * on and a recess to sit in.
 *
 * The bay lights from its floor on hover: a seam of accent along the bottom
 * edge, the way a lit control does. Dimming the cell would fight the icon,
 * which rises and catches light on the same gesture.
 */
function StatBay({ cell, lit = false }: { cell: StripCell; lit?: boolean }) {
    const body = (
        <>
            {/* the recess the icon sits in */}
            <span
                aria-hidden
                className="absolute inset-0 opacity-0 group-hover/cell:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, transparent 70%)" }}
            />
            {/* the floor seam — off until you approach, then it is the only lit
                thing in the bay */}
            <span
                aria-hidden
                className="absolute inset-x-3 bottom-0 h-[2px] scale-x-0 group-hover/cell:scale-x-100 origin-center transition-transform duration-[380ms] ease-[var(--ease-hud)]"
                style={{ background: "linear-gradient(90deg, transparent, var(--accent), transparent)" }}
            />

            <span className="relative flex items-center gap-3.5 min-w-0">
                {cell.icon}
                <span className="min-w-0">
                    <span className="block font-display text-[9px] font-bold uppercase tracking-[0.18em] text-white/35 group-hover/cell:text-white/60 transition-colors duration-300 whitespace-nowrap">
                        {cell.label}
                    </span>
                    <span className="block mt-1.5 font-display text-[22px] font-black tabular-nums leading-none text-white truncate">
                        {cell.value}
                    </span>
                </span>
            </span>
        </>
    );

    // The lit bay carries a longer line — "209 XP to go" against a bare
    // count — so it gets more of the row. Equal widths truncated the one
    // sentence on the strip that is trying to pull you somewhere.
    const shell = [
        "group/cell relative flex items-center min-w-max md:min-w-0 px-4 lg:px-5 py-4 transition-colors duration-300",
        lit ? "md:flex-[1.5] bg-[color-mix(in_srgb,var(--accent)_7%,transparent)]" : "md:flex-1",
    ].join(" ");

    return cell.href
        ? <Link href={cell.href} className={shell}>{body}</Link>
        : <span className={shell}>{body}</span>;
}

/**
 * The rank, given the room it earns.
 *
 * A tier badge the size of a favicon says nothing; the emblems are the most
 * striking art on the site and the ladder is twenty rungs deep, so this is
 * built around the insignia at a size where it can actually be seen — and
 * around the one question a rank raises, which is how far the next one is.
 *
 * The tier's own colour lights the plate. The emblems are struck with their
 * own glow, so the plate stays dark and lets them carry it.
 */
function RankConsole({ hero, tier, base }: { hero: HeroModel; tier: string | null; base: string }) {
    const colour = hero.rank_color || "#9ca3af";

    const artSlug = (hero.rank_name || '').toLowerCase().replace(/[^a-z]/g, '');

    return (
        <Link
            href={`${base}?tab=stats`}
            title="View rank progress"
            className="group/rank relative shrink-0 self-stretch lg:self-end w-full lg:w-[336px] flex flex-col items-center justify-end text-center"
        >
            {/* The commissioned rank art carries its own presence — no panel,
                no pooled light, nothing behind it. Image, then the name. */}
            {artSlug ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={`/images/ranks/${artSlug}.webp`}
                    alt={hero.rank_name || 'Rank'}
                    className="w-[190px] h-auto select-none transition-transform duration-500 ease-[var(--ease-hud)] group-hover/rank:scale-[1.04]"
                    style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.6))' }}
                />
            ) : (
                <RankInsigniaMark icon={hero.rank_icon} color={hero.rank_color} name={hero.rank_name} size={148} />
            )}

            <p
                className="mt-2 font-display text-[26px] font-black uppercase tracking-[0.02em] leading-none"
                style={{ color: colour }}
                title={tier ?? undefined}
            >
                {hero.rank_name || 'Unranked'}
            </p>
        </Link>
    );
}

/* ── the hero ─────────────────────────────────────────────────────────── */

interface Props {
    hero: HeroModel;
    activeTab?: string;
    isOwnProfile?: boolean;
    friendStatus?: FriendStatus;
    friendActionBusy?: boolean;
    onAddFriend?: () => void;
    onMessage?: () => void;
    viewerSignedIn?: boolean;
    viewerUsername?: string;
}

/**
 * The approved hero: the banner IS the card, identity floats on its left,
 * the rank block on its right, and one record strip below carries every
 * figure — level, XP against the next level, rank, the library counts and
 * the streak. No separate progression console.
 */
export default function ProfileHero({
    hero,
    activeTab,
    isOwnProfile = true,
    friendStatus = "none",
    friendActionBusy = false,
    onAddFriend,
    onMessage,
    viewerSignedIn = false,
    viewerUsername }: Props) {
    const [copied, setCopied] = useState(false);
    const [sharing, setSharing] = useState(false);

    const backdrop = hero.cover_image ?? hero.backdrop_fallback;
    const base = `/profile/${hero.username}`;
    const online = hero.is_online || isOwnProfile;
    const tier = rankTier(hero.rank_name);

    // The gauge measures the level band — it's the same climb the loot cell
    // at the strip's end is counting down.
    const levelFloor = xpForLevel(hero.level);
    const levelCeil = xpForLevel(hero.level + 1);
    const levelSize = Math.max(1, levelCeil - levelFloor);
    const levelToGo = Math.max(0, levelCeil - hero.xp);
    const fillPercent = Math.min(100, Math.round((Math.max(0, hero.xp - levelFloor) / levelSize) * 100));
    const levelToGoShown = useCountUp(levelToGo, 1200);
    const fillShown = useCountUp(fillPercent, 1200);

    const share = () => {
        const url = `${window.location.origin}${base}`;
        navigator.clipboard?.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // Level, XP and rank already live in the hero above (chip, rank block) —
    // repeating them here would be the same numbers twice in one screen. The
    // strip carries the library record, and ends on the hook: how far to the
    // next level's loot crate.
    const cells: StripCell[] = [
        {
            label: "Games",
            value: hero.stats.games,
            icon: <StatIcon src="/images/profile/v2-games.webp" />,
            href: `${base}?tab=library` },
        {
            label: "Completed",
            value: hero.stats.completed,
            icon: <StatIcon src="/images/profile/v2-completed.webp" />,
            href: `${base}?tab=library` },
        {
            label: "Reviews",
            value: hero.stats.reviews,
            icon: <StatIcon src="/images/profile/v2-reviews.webp" />,
            // Reviews surface in the overview's activity feed — there is no
            // longer a tab of their own to point at.
            href: base },
        {
            label: "Achievements",
            value: (
                <>
                    {hero.stats.achievements}
                    {hero.achievements_total != null && (
                        <span className="text-[13px] text-white/35"> / {hero.achievements_total}</span>
                    )}
                </>
            ),
            icon: <StatIcon src="/images/profile/v2-achievements.webp" />,
            href: `${base}?tab=achievements` },
        {
            label: "Streak",
            value: (
                <>
                    {hero.streak_days}
                    <span className="text-[13px] text-white/35"> {hero.streak_days === 1 ? "day" : "days"}</span>
                </>
            ),
            icon: (
                <StatIcon
                    src="/images/profile/v2-streak.webp"
                    active={hero.streak_days > 0}
                    idle="flicker"
                />
            ) },
        {
            label: `Level ${hero.level + 1} loot`,
            value: (
                <span className="text-[var(--xp-bright)]">
                    {levelToGoShown.toLocaleString()} <span className="text-[13px] text-white/35">XP to go</span>
                </span>
            ),
            icon: <StatIcon src="/images/profile/v2-loot.webp" size={64} idle="pulse" />,
            href: `${base}?tab=stats` },
    ];

    return (
        <div className="space-y-4">
            {/* ── identity: no card at all — the banner dissolves into the
                page, feathered on every edge so no border is ever visible ── */}
            <section className="relative overflow-hidden">
                <div aria-hidden className="absolute inset-0">
                    {backdrop ? (
                        <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={backdrop} alt="" className="w-full h-full object-cover" />
                            {/* legible on the left, art on the right */}
                            <span className="absolute inset-0 bg-gradient-to-r from-[var(--surface-0)] from-[4%] via-[color-mix(in_srgb,var(--surface-0)_55%,transparent)] via-[45%] to-[color-mix(in_srgb,var(--surface-0)_20%,transparent)]" />
                            {/* feathered seams into the page above and below */}
                            <span className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[var(--surface-0)] to-transparent" />
                            <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[var(--surface-0)] to-transparent" />
                            <span className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--surface-0)] to-transparent" />
                        </>
                    ) : (
                        <span
                            className="absolute inset-0"
                            style={{ background: "radial-gradient(120% 140% at 15% 0%, color-mix(in srgb, var(--accent) 14%, transparent) 0%, transparent 60%)" }}
                        />
                    )}
                </div>

                <div className="relative flex flex-col lg:flex-row lg:items-end gap-6 p-5 md:p-8">
                    {/* portrait + identity */}
                    <div className="flex items-start gap-4 md:gap-7 flex-1 min-w-0">
                        <Link href={base} className="group/av block shrink-0">
                            <AvatarRing src={hero.avatar_url} alt={hero.display_name} frame={hero.frame_value} online={online} />
                        </Link>

                        <div className="min-w-0 flex-1 pt-0.5">
                            {/* the level wears a chip above the name */}
                            <span className="inline-flex items-center h-[22px] px-2.5 rounded-[6px] bg-[var(--accent)] font-display text-[10px] font-black uppercase tracking-[0.14em] text-white">
                                Level {hero.level}
                            </span>

                            <h1 className="mt-2.5 flex items-center gap-2 md:gap-2.5 font-display text-[23px] md:text-[40px] font-black text-white leading-none min-w-0">
                                <span className="truncate">{hero.display_name}</span>
                                {hero.verified && (
                                    <BadgeCheck
                                        className="w-5 h-5 md:w-7 md:h-7 shrink-0 text-[var(--accent)]"
                                        style={{ filter: "drop-shadow(0 0 8px color-mix(in srgb, var(--accent) 55%, transparent))" }}
                                        aria-label="Verified TechPlay staff"
                                    />
                                )}
                            </h1>

                            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13.5px] font-semibold text-white/50">
                                <span>@{hero.username}</span>

                                {/* What they are playing, beside the name.
                                    The picker in the Daily Hub has always
                                    written this and no surface has ever read it
                                    back, so setting it lit a green dot and lost
                                    the game. */}
                                {hero.playing_label && (
                                    hero.playing_slug ? (
                                        <Link
                                            href={`/games/${hero.playing_slug}`}
                                            className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] text-[11.5px] font-bold text-[var(--accent)] hover:brightness-125 transition-[filter] max-w-full"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse shrink-0" />
                                            <span className="truncate">Playing {hero.playing_label}</span>
                                        </Link>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] text-[11.5px] font-bold text-[var(--accent)] max-w-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse shrink-0" />
                                            <span className="truncate">Playing {hero.playing_label}</span>
                                        </span>
                                    )
                                )}
                            </p>

                            {(hero.tagline || hero.bio) && (
                                <p className="mt-3 flex items-center gap-2 text-[13.5px] text-white/75 min-w-0">
                                    <span className="truncate">{hero.tagline || hero.bio}</span>
                                    {isOwnProfile && (
                                        <Link
                                            href="/settings"
                                            title="Edit your tagline"
                                            className="shrink-0 text-white/35 hover:text-[var(--accent)] transition-colors duration-200"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </Link>
                                    )}
                                </p>
                            )}

                            {(hero.location || hero.joined) && (
                                <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-white/50">
                                    {hero.location && (
                                        <span className="inline-flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-white/35" /> {hero.location}
                                        </span>
                                    )}
                                    {hero.joined && (
                                        <span className="inline-flex items-center gap-1.5">
                                            <CalendarDays className="w-3.5 h-3.5 text-white/35" /> Member since {hero.joined}
                                        </span>
                                    )}
                                </p>
                            )}

                            {/* actions live with the identity, mockup-style */}
                            <div className="mt-4 flex flex-wrap items-center gap-2.5">
                                {isOwnProfile ? (
                                    <>
                                        <Link href="/settings" className={BTN_PRIMARY}>
                                            <Pencil className="w-3.5 h-3.5" /> Edit profile
                                        </Link>
                                        <Link href={base} className={BTN_GHOST}>
                                            View public profile <ExternalLink className="w-3.5 h-3.5" />
                                        </Link>
                                        <MoreMenu>
                                            <button onClick={() => setSharing(true)} className={MENU_ITEM}>
                                                <Share2 className="w-3.5 h-3.5" /> Share card
                                            </button>
                                            <button onClick={share} className={MENU_ITEM}>
                                                <LinkIcon className="w-3.5 h-3.5" /> {copied ? "Link copied" : "Copy profile link"}
                                            </button>
                                            <Link
                                                href={hero.continue_playing ? `/games/${hero.continue_playing.slug}` : "/games"}
                                                prefetch={false}
                                                className={MENU_ITEM}
                                            >
                                                <Play className="w-3.5 h-3.5" />
                                                {hero.continue_playing ? `Continue ${hero.continue_playing.name}` : "Find your first game"}
                                            </Link>
                                            <Link href={`/wrapped/${hero.username}`} className={MENU_ITEM}>
                                                <Sparkles className="w-3.5 h-3.5" /> Your Wrapped
                                            </Link>
                                            <Link href="/settings" className={MENU_ITEM}>
                                                <ShieldCheck className="w-3.5 h-3.5" /> Privacy settings
                                            </Link>
                                        </MoreMenu>
                                    </>
                                ) : viewerSignedIn ? (
                                    <>
                                        <FriendAction status={friendStatus} busy={friendActionBusy} onAdd={() => onAddFriend?.()} />
                                        <button onClick={() => onMessage?.()} className={BTN_GHOST}>
                                            <MessageSquare className="w-4 h-4" /> Message
                                        </button>
                                        <MoreMenu>
                                            <button onClick={() => setSharing(true)} className={MENU_ITEM}>
                                                <Share2 className="w-3.5 h-3.5" /> Share card
                                            </button>
                                            <button onClick={share} className={MENU_ITEM}>
                                                <LinkIcon className="w-3.5 h-3.5" /> {copied ? "Link copied" : "Copy profile link"}
                                            </button>
                                        </MoreMenu>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/login" className={BTN_PRIMARY}>
                                            <UserPlus className="w-4 h-4" /> Sign in to connect
                                        </Link>
                                        <button onClick={share} className={BTN_GHOST}>
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <LinkIcon className="w-4 h-4" />}
                                            {copied ? "Copied" : "Share"}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <RankConsole hero={hero} tier={tier} base={base} />
                </div>
            </section>

            {/* ── the record panel ──

                One instrument face, six bays, and the gauge running along its
                floor. The gauge used to float below the figures with a gap
                between them, which left the thing being charged and the thing
                charging it looking unrelated — inside the panel it is the
                floor the bays stand on, and it still ends under the loot cell
                it is filling toward. ── */}
            <section
                className="relative rounded-[var(--radius-panel)] border overflow-hidden"
                style={{
                    background: "var(--surface-2)",
                    borderColor: "var(--line-strong)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
                }}
            >
                <div className="flex items-stretch min-w-max md:min-w-0 overflow-x-auto scrollbar-none divide-x divide-white/[0.05]">
                    {cells.map((cell, i) => (
                        <StatBay key={cell.label} cell={cell} lit={i === cells.length - 1} />
                    ))}
                </div>

                <div className="flex items-center gap-3 px-4 lg:px-5 py-3 border-t border-white/[0.06] bg-black/25">
                    <XpRail percent={fillShown} className="flex-1" />
                    <span className="shrink-0 font-display text-[12px] font-black tabular-nums text-[var(--xp-bright)]">
                        {fillShown}%
                    </span>
                </div>
            </section>

            {/* ── sections ── */}
            <ProfileTabStrip
                username={hero.username}
                activeTab={activeTab}
                isOwnProfile={isOwnProfile}
                bounty={hero.bounty}
            />

            {/* The card the OG route has been drawing for months, finally
                somewhere a person can see it. */}
            <ShareCard
                open={sharing}
                onClose={() => setSharing(false)}
                imageUrl={`/og/profile?username=${encodeURIComponent(hero.username)}`}
                pageUrl={`${typeof window !== "undefined" ? window.location.origin : "https://techplay.gg"}/profile/${hero.username}`}
                title={`${hero.display_name} on TechPlay`}
                fileName={`${hero.username}-techplay`}
            />
        </div>
    );
}
