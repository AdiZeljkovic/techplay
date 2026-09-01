"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    User as UserIcon, MapPin, CalendarDays, Pencil, Link2, Check, BadgeCheck, MoreHorizontal,
    ChevronDown, ShieldCheck, LinkIcon, UserPlus, Clock, MessageSquare, Share2 } from "lucide-react";
import type { HeroModel } from "@/lib/hero";
import type { FriendStatus } from "@/lib/types/profile";
import { rankTier } from "@/lib/ranks";
import { useCountUp } from "@/hooks/useCountUp";
import ProfileTabStrip from "./ProfileTabStrip";
import AvatarRing from "@/components/profile/AvatarRing";
import ShareCard from "@/components/profile/ShareCard";
import StatIcon from "./StatIcon";
import { RankInsigniaMark, XpRail } from "./RankInsignia";
import { xpForLevel } from "@/lib/level";

/** How each platform key is spelled to a reader. */
const PLATFORM_LABEL: Record<string, string> = {
    steam: "Steam",
    epic: "Epic",
    psn: "PSN",
    xbox: "Xbox",
    discord: "Discord",
    pc: "PC",
    switch: "Switch",
};

/* ── buttons ──────────────────────────────────────────────────────────── */

/**
 * The shape without its padding, because an icon-only button has to set its own.
 *
 * `${BTN} w-9 px-0` looked like it worked and did not: Tailwind resolves two
 * padding utilities by their order in the generated stylesheet, not by their
 * order in the class attribute, so `px-4` won and a 36px-wide button had 32px
 * of padding. The icon was squeezed to a 4px sliver — which is why the caret
 * looked missing and the old "…" looked faint. Nothing overrides anything here.
 */
const BTN_BASE =
    "inline-flex items-center justify-center gap-2 h-10 rounded-[8px] border font-display text-[11.5px] font-bold uppercase tracking-[0.08em] transition-colors duration-300 disabled:opacity-60";

const SKIN_GHOST = "border-white/[0.14] bg-black/30 backdrop-blur-sm text-white hover:bg-white/[0.09] hover:border-white/30";

const SKIN_PRIMARY = "border-transparent bg-[var(--accent)] text-white hover:brightness-110";

const BTN_GHOST = `${BTN_BASE} px-4 ${SKIN_GHOST}`;

const BTN_PRIMARY = `${BTN_BASE} px-4 ${SKIN_PRIMARY}`;

/** Square, and the icon inside is never allowed to shrink. */
const BTN_ICON_GHOST = `${BTN_BASE} w-10 ${SKIN_GHOST}`;

const BTN_ICON_PRIMARY = `${BTN_BASE} w-10 ${SKIN_PRIMARY}`;

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

/**
 * The overflow — everything that matters but doesn't deserve a button.
 *
 * With `before` it stops being a lone "…" and becomes the second half of a
 * split control: the button on the left does the one obvious thing, the caret
 * beside it opens the rest. The owner's row used to be three separate controls
 * — a primary, a ghost that led back to the page it was already on, and this —
 * which is three decisions for a person who wanted to change their name.
 */
function MoreMenu({
    before,
    label = "More profile actions",
    className = "",
    children }: {
    before?: React.ReactNode;
    label?: string;
    /** Lets the caller give it a share of a flex row. */
    className?: string;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const escape = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", close);
        document.addEventListener("keydown", escape);
        return () => {
            document.removeEventListener("mousedown", close);
            document.removeEventListener("keydown", escape);
        };
    }, [open]);

    return (
        <div ref={ref} className={`relative inline-flex ${className}`}>
            {before}
            <button
                onClick={() => setOpen((v) => !v)}
                aria-label={label}
                aria-haspopup="menu"
                aria-expanded={open}
                className={before ? `${BTN_ICON_PRIMARY} rounded-l-none` : BTN_ICON_GHOST}
                /* The seam between the two halves, so the caret reads as its own
                   control rather than dead space at the end of the button.
                   Inline because the skin already sets `border-transparent`, and
                   two border-colour utilities would be back to arguing about
                   stylesheet order — the argument that hid the caret. */
                style={before ? { borderLeftColor: "rgba(0,0,0,0.28)" } : undefined}
            >
                {before ? (
                    <ChevronDown
                        className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    />
                ) : (
                    <MoreHorizontal className="w-4 h-4 shrink-0" />
                )}
            </button>

            {open && (
                <div
                    role="menu"
                    onClick={() => setOpen(false)}
                    className="absolute left-0 top-full mt-2 z-50 min-w-[236px] p-1.5 rounded-[12px] border border-[var(--line-strong)] bg-[var(--surface-1)] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.85)]"
                >
                    {children}
                </div>
            )}
        </div>
    );
}

const MENU_ITEM =
    "w-full flex items-center gap-2.5 px-2.5 h-9 rounded-[8px] text-[12px] font-semibold text-[var(--ink-low)] hover:text-[var(--ink-hi)] hover:bg-[var(--fill-2)] transition-colors duration-150";

/** Two items under a word beat four items under nothing. */
const MENU_LABEL =
    "px-2.5 pt-2 pb-1 font-display text-[9px] font-black uppercase tracking-[0.16em] text-white/45";

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
function StatBay({ cell, lit = false, wide = false }: { cell: StripCell; lit?: boolean; wide?: boolean }) {
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

            <span className="relative flex items-center gap-2.5 lg:gap-3.5 min-w-0">
                {cell.icon}
                <span className="min-w-0">
                    <span className="block font-display text-[8.5px] lg:text-[9px] font-bold uppercase tracking-[0.16em] lg:tracking-[0.18em] text-white/50 group-hover/cell:text-white/60 transition-colors duration-300 truncate lg:whitespace-nowrap">
                        {cell.label}
                    </span>
                    <span className="block mt-1 lg:mt-1.5 font-display text-[17px] lg:text-[22px] font-black tabular-nums leading-none text-white truncate">
                        {cell.value}
                    </span>
                </span>
            </span>
        </>
    );

    // The lit bay carries a longer line — "209 XP to go" against a bare
    // count — so it gets more of the row. Equal widths truncated the one
    // sentence on the strip that is trying to pull you somewhere. On the grid
    // there are no widths to give, so it keeps only its tint.
    const shell = [
        "group/cell relative flex items-center min-w-0 px-3 py-3 lg:px-5 lg:py-4 transition-colors duration-300",
        lit ? "lg:flex-[1.5]" : "lg:flex-1",
        wide ? "col-span-2 lg:col-span-1" : "",
    ].join(" ");

    /* The cell paints its own floor so the grid's 1px gaps read as hairlines
       between bays — `divide-x` has no equivalent across grid rows. On the
       desktop flex row the panel behind it is the same colour, so this is
       invisible there and `divide-x` still draws the seams.
       Both the base and the lit tint go through `style`: two background
       utilities would be decided by their order in the generated stylesheet
       rather than here, which is the argument that once hid the caret in
       MoreMenu. */
    const skin = {
        background: lit
            ? "color-mix(in srgb, var(--accent) 7%, var(--surface-2))"
            : "var(--surface-2)",
    };

    return cell.href
        ? <Link href={cell.href} className={shell} style={skin}>{body}</Link>
        : <span className={shell} style={skin}>{body}</span>;
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
function RankConsole({
    hero,
    tier,
    base,
    percent,
    toGo }: {
    hero: HeroModel;
    tier: string | null;
    base: string;
    /** How far through the current level band, 0–100. */
    percent: number;
    /** XP still owed to the next level. */
    toGo: number;
}) {
    const colour = hero.rank_color || "#9ca3af";

    const artSlug = (hero.rank_name || '').toLowerCase().replace(/[^a-z]/g, '');

    return (
        <Link
            href={`${base}?tab=stats`}
            title="View rank progress"
            /* Two shapes, one element.
             *
             * On a desktop the emblem is a monument at the end of the row and
             * it has the space to be one. On a phone the same block was 230px
             * of centred column — a quarter of the screen — sitting between
             * the identity and every number about it, so you scrolled past
             * your own profile to reach your own profile. Here it lies down:
             * emblem on the left at a third of the size, and the room that
             * frees goes to the question a rank actually raises, which is how
             * far the next one is. */
            className="group/rank relative shrink-0 self-stretch lg:self-end w-full lg:w-[336px] flex flex-row lg:flex-col items-center lg:justify-end gap-3.5 lg:gap-0 text-left lg:text-center p-3 lg:p-0 rounded-[14px] lg:rounded-none border border-white/[0.08] lg:border-0 bg-black/30 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none"
        >
            {/* The commissioned rank art carries its own presence — no panel,
                no pooled light, nothing behind it. Image, then the name. */}
            {artSlug ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={`/images/ranks/${artSlug}.webp`}
                    alt={hero.rank_name || 'Rank'}
                    className="w-[68px] lg:w-[190px] h-auto shrink-0 select-none transition-transform duration-500 ease-[var(--ease-hud)] group-hover/rank:scale-[1.04]"
                    style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.6))' }}
                />
            ) : (
                <RankInsigniaMark icon={hero.rank_icon} color={hero.rank_color} name={hero.rank_name} size={148} />
            )}

            <span className="min-w-0 flex-1 lg:flex-none">
                <span className="flex items-baseline gap-2 lg:block">
                    <span
                        className="font-display text-[19px] lg:text-[26px] lg:mt-2 lg:block font-black uppercase tracking-[0.02em] leading-none truncate"
                        style={{ color: colour }}
                        title={tier ?? undefined}
                    >
                        {hero.rank_name || 'Unranked'}
                    </span>
                    <span className="lg:hidden shrink-0 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                        Level {hero.level}
                    </span>
                </span>

                {/* The gauge, on the phone only. On a desktop it runs along
                    the floor of the record panel, where there is a row to
                    spare; here that row is the one being saved. */}
                <span className="lg:hidden block mt-2.5">
                    <XpRail percent={percent} segments={10} className="w-full" />
                    <span className="block mt-1.5 text-[11px] font-semibold text-white/45">
                        <span className="text-[var(--xp-bright)] tabular-nums">{toGo.toLocaleString()} XP</span> to Level {hero.level + 1}
                    </span>
                </span>
            </span>
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
    //
    // The last two cells are hooks, and a hook only works on the person who
    // can act on it. A visitor was being shown a stranger's daily streak and
    // how much XP that stranger needs for their next crate — two numbers you
    // cannot do anything with, in the two most prominent positions on the
    // strip. They are replaced by the one fact about a player that a shelf
    // count cannot give: how long they have been at it.
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
                        <span className="text-[13px] text-white/50"> / {hero.achievements_total}</span>
                    )}
                </>
            ),
            icon: <StatIcon src="/images/profile/v2-achievements.webp" />,
            href: `${base}?tab=achievements` },
        ...(isOwnProfile
            ? [
                {
                    label: "Streak",
                    value: (
                        <>
                            {hero.streak_days}
                            <span className="text-[13px] text-white/50"> {hero.streak_days === 1 ? "day" : "days"}</span>
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
                            {levelToGoShown.toLocaleString()} <span className="text-[13px] text-white/50">XP to go</span>
                        </span>
                    ),
                    icon: <StatIcon src="/images/profile/v2-loot.webp" size={64} idle="pulse" />,
                    href: `${base}?tab=stats` },
            ]
            : hero.playing_since
                ? [
                    {
                        label: "Playing since",
                        value: hero.playing_since,
                        icon: <StatIcon src="/images/profile/v2-season.webp" />,
                        href: `${base}?tab=library` },
                ]
                : []),
    ];

    return (
        <div className="space-y-4">
            {/* ── identity: no card at all — the banner dissolves into the
                page, feathered on every edge so no border is ever visible ── */}
            {/* `overflow-hidden` belongs to the backdrop, not the section: it is
                there to crop the cover image, but on the section it also cropped
                the overflow menu, which opens downward past the bottom edge. The
                menu was rendering the whole time — you just could not see it. */}
            <section className="relative z-20">
                <div aria-hidden className="absolute inset-0 overflow-hidden">
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

                <div className="relative flex flex-col lg:flex-row lg:items-end gap-5 lg:gap-6 p-4 sm:p-5 md:p-8">
                    {/* Portrait and identity.
                     *
                     * A grid rather than a row, because the two want different
                     * shapes. On a desktop the portrait stands beside a column
                     * holding everything else. On a phone that column is about
                     * 190px wide, and a bio, a join date, two platform tags and
                     * two buttons were all being squeezed into it beside a
                     * 124px portrait -- which is why the bio read "He liv...".
                     * Here the name sits beside the portrait and everything
                     * below it spans the full width. Same DOM, no duplication,
                     * two layouts. */}
                    <div className="grid grid-cols-[auto_1fr] items-start gap-x-4 md:gap-x-7 flex-1 min-w-0">
                        <Link href={base} aria-label={`${hero.display_name} profile picture`} className="group/av block shrink-0 row-start-1 col-start-1 lg:row-span-2">
                            <AvatarRing
                                src={hero.avatar_url}
                                alt={hero.display_name}
                                frame={hero.frame_value}
                                online={online}
                                className="w-[104px] h-[104px] sm:w-[124px] sm:h-[124px] md:w-[150px] md:h-[150px]"
                            />
                        </Link>

                        <div className="min-w-0 row-start-1 col-start-2 self-center lg:self-start lg:pt-0.5">
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
                        </div>

                        {/* Everything below the name: full width on a phone,
                            back in the right-hand column from lg up. */}
                        <div className="min-w-0 row-start-2 col-span-2 lg:col-span-1 lg:col-start-2 mt-3 lg:mt-0">
                            {(hero.tagline || hero.bio) && (
                                <p className="mt-0 lg:mt-3 flex items-start lg:items-center gap-2 text-[13.5px] text-white/75 min-w-0">
                                    <span className="line-clamp-2 lg:truncate">{hero.tagline || hero.bio}</span>
                                    {isOwnProfile && (
                                        <Link
                                            href="/settings"
                                            title="Edit your tagline"
                                            className="shrink-0 mt-0.5 lg:mt-0 text-white/35 hover:text-[var(--accent)] transition-colors duration-200"
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

                            {/* Where they play, under who they are.
                                `toPlatforms` in lib/hero.ts has been building
                                this list since the hero was written and nothing
                                drew it — and neither profile endpoint sent
                                `gamertags` either, so it was empty on both
                                sides of the wire. */}
                            {hero.platforms.length > 0 && (
                                <p className="mt-2.5 flex flex-wrap items-center gap-1.5">
                                    {hero.platforms.map(({ key, handle }) => (
                                        <span
                                            key={key}
                                            className="inline-flex items-center gap-1.5 h-[22px] max-w-full px-2.5 rounded-[6px] bg-black/30 border border-white/[0.12]"
                                        >
                                            <span className="font-display text-[8.5px] font-black uppercase tracking-[0.14em] text-white/50 shrink-0">
                                                {PLATFORM_LABEL[key] ?? key}
                                            </span>
                                            <span className="text-[11.5px] font-semibold text-white/70 truncate">{handle}</span>
                                        </span>
                                    ))}
                                </p>
                            )}

                            {/* actions live with the identity, mockup-style */}
                            {/* `flex-1` on each control with wrapping does the
                                right thing at both ends: on a wide phone the two
                                sit side by side, and on a narrow one they wrap and
                                each becomes a full-width tap target rather than a
                                small button marooned on its own line. */}
                            <div className="mt-4 flex flex-wrap items-center gap-2 lg:gap-2.5">
                                {isOwnProfile ? (
                                    /* One control for the owner.
                                     *
                                     * There were three: Edit profile, a ghost that led to
                                     * `/profile/{you}` — this very page, since your own
                                     * Overview *is* the dashboard — and an overflow. Two of
                                     * the three only ever ended in settings, so the button
                                     * goes there and the caret opens the specific sections.
                                     * "Continue playing" left the menu because the dashboard
                                     * gives it a whole panel of its own, six inches below. */
                                    <>
                                    <MoreMenu
                                        className="flex-1 lg:flex-none"
                                        before={
                                            <Link href="/settings" className={`${BTN_PRIMARY} rounded-r-none flex-1 lg:flex-none whitespace-nowrap`}>
                                                <Pencil className="w-3.5 h-3.5" /> Edit profile
                                            </Link>
                                        }
                                    >
                                        <p className={MENU_LABEL}>Manage</p>
                                        <Link href="/settings?section=privacy" className={MENU_ITEM}>
                                            <ShieldCheck className="w-3.5 h-3.5" /> Privacy &amp; visibility
                                        </Link>

                                        <p className={MENU_LABEL}>Share</p>
                                        <button onClick={() => setSharing(true)} className={MENU_ITEM}>
                                            <Share2 className="w-3.5 h-3.5" /> Share card
                                        </button>
                                        <button onClick={share} className={MENU_ITEM}>
                                            <LinkIcon className="w-3.5 h-3.5" /> {copied ? "Link copied" : "Copy profile link"}
                                        </button>
                                    </MoreMenu>

                                    {/*
                                     * Out of the caret and onto the surface.
                                     *
                                     * Linking a store is the one action that turns an empty
                                     * profile into a full one — a click on Steam and the shelf
                                     * has two hundred games with hours already on them. Two
                                     * members out of fifty-five have found it, which is what a
                                     * hidden menu item gets you.
                                     *
                                     * Ghost rather than primary: Edit profile keeps the accent,
                                     * and two filled buttons side by side would make the reader
                                     * choose between them rather than notice the second one.
                                     */}
                                    <Link href="/settings?section=connections" className={`${BTN_GHOST} flex-1 lg:flex-none whitespace-nowrap`}>
                                        <Link2 className="w-4 h-4" /> Connect platforms
                                    </Link>
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

                    <RankConsole hero={hero} tier={tier} base={base} percent={fillShown} toGo={levelToGoShown} />
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
                {/* A grid on a phone, the row it has always been from lg up.
                    It used to be one horizontally scrolling row at every width,
                    which on a phone showed two and a half of six bays with no
                    sign there were more — the half-cut third bay read as a
                    layout fault rather than an invitation to swipe. Nothing is
                    hidden now.

                    The 1px gaps are the hairlines: `divide-x` cannot draw seams
                    between grid rows, so the container's colour shows through
                    the gaps and each bay paints its own floor over it. */}
                <div className="grid grid-cols-2 gap-px bg-white/[0.06] lg:flex lg:items-stretch lg:gap-0 lg:bg-transparent lg:divide-x lg:divide-white/[0.05] [--stat-icon-size:38px] sm:[--stat-icon-size:46px] lg:[--stat-icon-size:initial]">
                    {cells.map((cell, i) => (
                        <StatBay
                            key={cell.label}
                            cell={cell}
                            lit={i === cells.length - 1}
                            /* An odd count would leave a hole in the last row,
                               so the last bay takes the whole width instead. */
                            wide={cells.length % 2 === 1 && i === cells.length - 1}
                        />
                    ))}
                </div>

                {/* The gauge lives in the rank band on a phone, where it is
                    beside the emblem it is filling toward. Drawing it twice
                    would be the same bar in two places on one screen. */}
                <div className="hidden lg:flex items-center gap-3 px-4 lg:px-5 py-3 border-t border-white/[0.06] bg-black/25">
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
