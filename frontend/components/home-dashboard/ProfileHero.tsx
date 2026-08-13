"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    User as UserIcon, MapPin, CalendarDays, Pencil, ExternalLink, Check, BadgeCheck, MoreHorizontal,
    Play, Sparkles, ShieldCheck, LinkIcon, UserPlus, Clock, MessageSquare } from "lucide-react";
import type { HeroModel } from "@/lib/hero";
import type { FriendStatus } from "@/lib/types/profile";
import { rankTier } from "@/lib/ranks";
import { useCountUp } from "@/hooks/useCountUp";
import ProfileTabStrip from "./ProfileTabStrip";
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
    return (
        <div className="relative w-[124px] h-[124px] md:w-[150px] md:h-[150px] shrink-0">
            <span
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{
                    background: frame || "var(--accent)",
                    boxShadow: "0 0 24px -4px color-mix(in srgb, var(--accent) 55%, transparent)" }}
            />
            {/* the gap that keeps the ring reading as a ring, not a border */}
            <span aria-hidden className="absolute inset-[2.5px] rounded-full bg-[var(--surface-0)]" />

            <span className="absolute inset-[7px] rounded-full overflow-hidden bg-[var(--surface-2)]">
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
                <span className="absolute bottom-[6%] left-[13%] w-[18px] h-[18px]" title="Online now">
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

/** Label above, figure below — one cell of the strip under the banner. */
function StatCell({ cell }: { cell: StripCell }) {
    const body = (
        <span className="flex items-center gap-3 min-w-0">
            {cell.icon}
            <span className="min-w-0">
                <span className="block font-display text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/40 whitespace-nowrap">
                    {cell.label}
                </span>
                <span className="block mt-1.5 font-display text-[19px] font-black tabular-nums leading-none text-white truncate">
                    {cell.value}
                </span>
            </span>
        </span>
    );

    return cell.href ? (
        <Link href={cell.href} className="flex items-center min-w-0 hover:opacity-80 transition-opacity duration-200">
            {body}
        </Link>
    ) : (
        <span className="flex items-center min-w-0">{body}</span>
    );
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
            icon: (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/images/profile/stat-games.webp" alt="" aria-hidden className="w-[60px] h-[60px] shrink-0 object-contain select-none" style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.65))" }} />
            ),
            href: `${base}?tab=library` },
        {
            label: "Completed",
            value: hero.stats.completed,
            icon: (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/images/profile/stat-completed.webp" alt="" aria-hidden className="w-[60px] h-[60px] shrink-0 object-contain select-none" style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.65))" }} />
            ),
            href: `${base}?tab=library` },
        {
            label: "Reviews",
            value: hero.stats.reviews,
            icon: (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/images/profile/stat-reviews.webp" alt="" aria-hidden className="w-[60px] h-[60px] shrink-0 object-contain select-none" style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.65))" }} />
            ),
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
            icon: (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/images/profile/stat-achievements.webp" alt="" aria-hidden className="w-[60px] h-[60px] shrink-0 object-contain select-none" style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.65))" }} />
            ),
            href: `${base}?tab=progression` },
        {
            label: "Streak",
            value: (
                <>
                    {hero.streak_days}
                    <span className="text-[13px] text-white/35"> {hero.streak_days === 1 ? "day" : "days"}</span>
                </>
            ),
            icon: (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/images/profile/stat-streak.webp" alt="" aria-hidden
                    className={`w-[60px] h-[60px] shrink-0 object-contain select-none ${hero.streak_days > 0 ? "" : "opacity-40 grayscale"}`} style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.65))" }} />
            ) },
        {
            label: `Level ${hero.level + 1} loot`,
            value: (
                <span className="text-[var(--xp-bright)]">
                    {levelToGoShown.toLocaleString()} <span className="text-[13px] text-white/35">XP to go</span>
                </span>
            ),
            icon: (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src="/images/profile/stat-loot.webp"
                    alt=""
                    aria-hidden
                    width={44}
                    height={44}
                    className="w-[64px] h-[64px] shrink-0 object-contain"
                    style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.6))" }}
                />
            ),
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
                    <div className="flex items-start gap-5 md:gap-7 flex-1 min-w-0">
                        <Link href={base} className="group/av block shrink-0">
                            <AvatarRing src={hero.avatar_url} alt={hero.display_name} frame={hero.frame_value} online={online} />
                        </Link>

                        <div className="min-w-0 flex-1 pt-0.5">
                            {/* the level wears a chip above the name */}
                            <span className="inline-flex items-center h-[22px] px-2.5 rounded-[6px] bg-[var(--accent)] font-display text-[10px] font-black uppercase tracking-[0.14em] text-white">
                                Level {hero.level}
                            </span>

                            <h1 className="mt-2.5 flex items-center gap-2.5 font-display text-[30px] md:text-[40px] font-black text-white leading-none min-w-0">
                                <span className="truncate">{hero.display_name}</span>
                                {hero.verified && (
                                    <BadgeCheck
                                        className="w-6 h-6 md:w-7 md:h-7 shrink-0 text-[var(--accent)]"
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

            {/* ── the record strip: no card of its own — the figures sit on the
                page, and the live XP gauge runs the strip's full width beneath
                them, ending exactly under the loot cell it's charging toward ── */}
            <section className="px-1">
                <div className="flex items-center gap-5 md:gap-0 md:justify-between min-w-max md:min-w-0 overflow-x-auto scrollbar-none">
                    {cells.map((cell, i) => (
                        <span key={cell.label} className="flex items-center gap-5 md:gap-6 min-w-0">
                            {i > 0 && <span aria-hidden className="hidden md:block w-px h-9 bg-white/[0.08]" />}
                            <StatCell cell={cell} />
                        </span>
                    ))}
                </div>

                <div className="mt-4 flex items-center gap-3">
                    <XpRail percent={fillShown} className="flex-1" />
                    <span className="shrink-0 font-display text-[12px] font-black tabular-nums text-[var(--xp-bright)]">
                        {fillShown}%
                    </span>
                </div>
            </section>

            {/* ── sections ── */}
            <ProfileTabStrip username={hero.username} activeTab={activeTab} isOwnProfile={isOwnProfile} />
        </div>
    );
}
