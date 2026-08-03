"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    User as UserIcon, Play, Pencil, Share2, Check, BadgeCheck, MoreHorizontal,
    Gamepad2, Star, Trophy, Medal, TrendingUp, Flame,
    UserPlus, Clock, MessageSquare, Sparkles, ShieldCheck, LinkIcon, GitCompare,
} from "lucide-react";
import PlatformIcon from "@/components/games/PlatformIcon";
import type { HeroModel } from "@/lib/hero";
import type { FriendStatus } from "@/lib/types/profile";
import { rankTier } from "@/lib/ranks";
import { useCountUp } from "@/hooks/useCountUp";
import ProfileTabStrip from "./ProfileTabStrip";
import { RankInsigniaMark, XpRail } from "./RankInsignia";
import { xpForLevel } from "@/lib/level";

/** 12480 → "12.5K" — hours read as a badge, not a spreadsheet. */
function compact(n: number): string {
    if (n >= 10_000) return `${Math.round(n / 1000)}K`;
    if (n >= 1_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
    return n.toLocaleString();
}

/**
 * Gamertag key → the mark PlatformIcon draws, its label, and the brand it
 * wears. Brands are lifted toward the light end of each palette: the official
 * values (Xbox #107C10, PlayStation #0070D1) are picked for white backgrounds
 * and go muddy on ours.
 */
const PLATFORMS: Record<string, { label: string; name: string; brand: string }> = {
    steam: { label: "STEAM", name: "Steam", brand: "#c7d5e0" },
    psn: { label: "PS", name: "PlayStation", brand: "#2b8fe6" },
    xbox: { label: "XBOX", name: "Xbox", brand: "#43b649" },
    epic: { label: "EPIC", name: "Epic Games", brand: "#f2f2f2" },
    discord: { label: "DISCORD", name: "Discord", brand: "#5865f2" },
    pc: { label: "PC", name: "PC", brand: "#e5e7eb" },
    switch: { label: "SWITCH", name: "Nintendo Switch", brand: "#f04a4a" },
};

/* ── avatar ───────────────────────────────────────────────────────────── */

/** Measured off the ring art: hole diameter, and where the status socket sits. */
const RING_HOLE_INSET = "20%";
const NODE = { left: "76.2%", top: "74.6%", size: "10.5%" };

/**
 * The default frame is the rendered HUD ring — armoured segments, lit channels
 * and a status socket cast into the metal at the lower right. A purchased frame
 * cosmetic replaces it with that frame's own paint, because the whole point of
 * buying one is that it shows.
 */
function AvatarFrame({
    src,
    alt,
    frame,
    online,
}: {
    src: string | null;
    alt: string;
    frame: string | null;
    online: boolean;
}) {
    const portrait = src ? (
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
    );

    if (frame) {
        return (
            <div className="relative w-[124px] h-[124px] md:w-[152px] md:h-[152px] shrink-0">
                <span
                    aria-hidden
                    className="absolute inset-0 rounded-full"
                    style={{ background: frame, boxShadow: "0 0 22px -2px color-mix(in srgb, var(--accent) 45%, transparent)" }}
                />
                <span aria-hidden className="absolute inset-[3px] rounded-full bg-[var(--surface-1)]" />
                <span className="absolute inset-[6px] rounded-full overflow-hidden bg-[var(--surface-2)]">{portrait}</span>
                {online && (
                    <span className="absolute bottom-[6px] right-[6px] w-[26px] h-[26px] rounded-full bg-[var(--surface-1)] flex items-center justify-center" title="Online now">
                        <span className="relative block w-[15px] h-[15px] rounded-full" style={ONLINE_LAMP} />
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className="relative w-[132px] h-[132px] md:w-[164px] md:h-[164px] shrink-0">
            {/* portrait first — the ring's inner edge overlaps it */}
            <span className="absolute rounded-full overflow-hidden bg-[var(--surface-2)]" style={{ inset: RING_HOLE_INSET }}>
                {portrait}
            </span>

            {/* The ring art carries its own lighting — the only shadow here is
                the one that seats it against the panel, never a halo behind it. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="/frames/hud-ring.png"
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full pointer-events-none select-none"
                style={{ filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.75))" }}
            />

            {/* the socket is cast into the ring; this is the lamp inside it */}
            <span
                className="absolute rounded-full"
                style={{ left: NODE.left, top: NODE.top, width: NODE.size, height: NODE.size, transform: "translate(-50%, -50%)" }}
                title={online ? "Online now" : "Offline"}
            >
                {online && <span aria-hidden className="tp-pulse-ring absolute inset-0 rounded-full bg-emerald-400" />}
                <span className="relative block w-full h-full rounded-full" style={online ? ONLINE_LAMP : OFFLINE_LAMP} />
                <span className="sr-only">{online ? "Online" : "Offline"}</span>
            </span>
        </div>
    );
}

const ONLINE_LAMP: React.CSSProperties = {
    background: "radial-gradient(circle at 35% 30%, #a7f3d0 0%, #10b981 55%, #047857 100%)",
    boxShadow: "0 0 12px rgba(16,185,129,0.95), inset 0 1px 0 rgba(255,255,255,0.55)",
};

/** Covers the socket's cast-in lamp so an offline profile shows no green light. */
const OFFLINE_LAMP: React.CSSProperties = {
    background: "radial-gradient(circle at 35% 30%, #3f3f46 0%, #27272a 60%, #18181b 100%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
};

/* ── small parts ──────────────────────────────────────────────────────── */

const BTN =
    "group/cta relative inline-flex items-center justify-center gap-2 h-10 px-4 rounded-[8px] border font-display text-[11.5px] font-bold uppercase tracking-[0.08em] transition-colors duration-300 disabled:opacity-60";

const BTN_GHOST = `${BTN} border-white/[0.12] bg-white/[0.04] text-white hover:bg-white/[0.09] hover:border-white/25`;

const BTN_PRIMARY = `${BTN} border-transparent bg-[var(--accent)] text-white hover:brightness-110`;

/** One figure from the identity row: glyph, numeral, and what it counts. */
function HeroStat({
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
    const shown = useCountUp(value, 1100);

    const body = (
        <>
            <Icon className="w-[18px] h-[18px] shrink-0 text-[var(--accent)] transition-transform duration-300 group-hover/stat:scale-110" />
            <span className="min-w-0">
                <span className="block font-display text-[22px] font-black tabular-nums leading-none text-white">
                    {compact(shown)}
                </span>
                <span className="block mt-1 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 truncate">
                    {label}
                </span>
            </span>
        </>
    );

    const cls = "group/stat flex items-center gap-2.5 min-w-0";

    return href ? (
        <Link href={href} className={cls} title={label}>
            {body}
        </Link>
    ) : (
        <span className={cls} title={label}>
            {body}
        </span>
    );
}

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
            <Link href="/friends" className={BTN_PRIMARY}>
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
                    className="absolute right-0 top-full mt-2 z-50 min-w-[230px] p-1.5 rounded-[12px] border border-[var(--line-strong)] bg-[var(--surface-1)] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.85)]"
                >
                    {children}
                </div>
            )}
        </div>
    );
}

const MENU_ITEM =
    "w-full flex items-center gap-2.5 px-2.5 h-9 rounded-[8px] text-[12px] font-semibold text-[var(--ink-low)] hover:text-[var(--ink-hi)] hover:bg-[var(--fill-2)] transition-colors duration-150";

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

export default function ProfileHero({
    hero,
    activeTab,
    isOwnProfile = true,
    friendStatus = "none",
    friendActionBusy = false,
    onAddFriend,
    onMessage,
    viewerSignedIn = false,
    viewerUsername,
}: Props) {
    const [copied, setCopied] = useState(false);

    const backdrop = hero.cover_image ?? hero.backdrop_fallback;
    const nextXp = hero.next_rank?.min_xp ?? null;

    // The gauge measures the *level* band. A level is the thing that ticks over
    // — it's what the next reward hangs off, and it moves often enough that the
    // bar visibly travels. Rank is the identity above it, not the clock.
    const levelFloor = xpForLevel(hero.level);
    const levelCeil = xpForLevel(hero.level + 1);
    const levelSize = Math.max(1, levelCeil - levelFloor);
    const levelDone = Math.max(0, Math.min(levelSize, hero.xp - levelFloor));
    const levelToGo = Math.max(0, levelCeil - hero.xp);
    const xpPercent = Math.min(100, Math.round((levelDone / levelSize) * 100));

    // Does the next level also promote you? Then the reward is real and named.
    const rankUpNext = nextXp !== null && levelCeil >= nextXp;

    const fillPercent = useCountUp(xpPercent, 1200);
    const animatedXp = useCountUp(hero.xp, 1200);
    const levelDoneShown = useCountUp(levelDone, 1200);

    const base = `/profile/${hero.username}`;
    const online = hero.is_online || isOwnProfile;
    const tier = rankTier(hero.rank_name);

    const share = () => {
        const url = `${window.location.origin}${base}`;
        navigator.clipboard?.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const stats = [
        { label: "Games", value: hero.stats.games, icon: Gamepad2, href: `${base}?tab=collection` },
        { label: "Completed", value: hero.stats.completed, icon: Trophy, href: `${base}?tab=collection` },
        { label: "Reviews", value: hero.stats.reviews, icon: Star, href: `${base}?tab=activity` },
        { label: "Achievements", value: hero.stats.achievements, icon: Medal, href: `${base}?tab=achievements` },
        { label: "Total XP", value: hero.xp, icon: TrendingUp, href: `${base}?tab=stats` },
    ];

    const platforms = hero.platforms.filter((p) => PLATFORMS[p.key]).slice(0, 5);

    return (
        <div className="space-y-4">
            {/* ── identity ── */}
            <section className="relative rounded-[var(--radius-panel)] overflow-hidden bg-[var(--surface-1)] border border-[var(--line)]">
                <div aria-hidden className="absolute inset-0 overflow-hidden">
                    {backdrop ? (
                        <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={backdrop}
                                alt=""
                                className={`tp-drift w-full h-full object-cover ${hero.cover_image ? "opacity-95" : "opacity-60"}`}
                            />
                            <span className="absolute inset-0 bg-gradient-to-r from-[var(--surface-1)] from-[28%] via-[color-mix(in_srgb,var(--surface-1)_74%,transparent)] via-[58%] to-[color-mix(in_srgb,var(--surface-1)_20%,transparent)]" />
                            <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[var(--surface-1)] to-transparent" />
                        </>
                    ) : (
                        <span
                            className="absolute inset-0"
                            style={{ background: "radial-gradient(120% 140% at 15% 0%, color-mix(in srgb, var(--accent) 16%, transparent) 0%, transparent 60%)" }}
                        />
                    )}
                    <span className="tp-sweep absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                </div>

                <div className="relative p-5 md:p-7">
                    {/* actions park in the corner, out of the identity's way */}
                    <div className="absolute top-5 right-5 md:top-6 md:right-6 flex items-center gap-2">
                        {isOwnProfile ? (
                            <>
                                <Link href="/settings" className={BTN_PRIMARY}>
                                    <Pencil className="w-3.5 h-3.5" /> Edit profile
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
                                    {viewerUsername && (
                                        <Link href={`/compare/${viewerUsername}/${hero.username}`} className={MENU_ITEM}>
                                            <GitCompare className="w-3.5 h-3.5" /> Compare with me
                                        </Link>
                                    )}
                                </MoreMenu>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className={BTN_PRIMARY}>
                                    <UserPlus className="w-4 h-4" /> Sign in to connect
                                </Link>
                                <button onClick={share} className={`${BTN_GHOST} w-10 px-0`} title="Copy profile link">
                                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                                </button>
                            </>
                        )}
                    </div>

                    <div className="flex items-start gap-5 md:gap-7">
                        <Link href={base} className="group/av block shrink-0">
                            <AvatarFrame src={hero.avatar_url} alt={hero.display_name} frame={hero.frame_value} online={online} />
                        </Link>

                        <div className="min-w-0 flex-1 pt-1">
                            <h1 className="flex items-center gap-2.5 font-display text-[28px] md:text-[38px] font-black text-white leading-none min-w-0">
                                <span className="truncate">{hero.display_name}</span>
                                {hero.verified && (
                                    <BadgeCheck
                                        className="w-6 h-6 md:w-7 md:h-7 shrink-0 text-[var(--accent)]"
                                        style={{ filter: "drop-shadow(0 0 8px color-mix(in srgb, var(--accent) 55%, transparent))" }}
                                        aria-label="Verified TechPlay staff"
                                    />
                                )}
                            </h1>

                            <p className="mt-2.5 flex items-center gap-2.5 text-[13.5px] text-white/55 min-w-0">
                                <span className="font-bold text-[var(--accent)] shrink-0">@{hero.username}</span>
                                {(hero.tagline || hero.bio) && (
                                    <>
                                        <span aria-hidden className="text-white/25">·</span>
                                        <span className="truncate">{hero.tagline || hero.bio}</span>
                                    </>
                                )}
                            </p>

                            {/* the platforms you're on, and who you are on them */}
                            {platforms.length > 0 && (
                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    {platforms.map(({ key, handle }) => {
                                        const meta = PLATFORMS[key];
                                        return (
                                            <span
                                                key={key}
                                                style={{ ["--brand" as string]: meta.brand }}
                                                className="group/pf inline-flex items-center gap-2.5 h-[46px] pl-2.5 pr-3.5 rounded-[12px] border border-white/[0.09] bg-[color-mix(in_srgb,#0e0c0b_72%,transparent)] backdrop-blur-md hover:border-[color-mix(in_srgb,var(--brand)_45%,transparent)] transition-colors duration-300"
                                            >
                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/[0.07] text-[var(--brand)] shrink-0">
                                                    <PlatformIcon label={meta.label} className="w-[15px] h-[15px]" />
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block text-[10.5px] leading-none text-white/40">{meta.name}</span>
                                                    <span className="block mt-1 text-[12px] font-bold leading-none text-white truncate max-w-[130px]">
                                                        {handle}
                                                    </span>
                                                </span>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            {/* the figures, inline and divided — a line of record,
                                not a deck of cards */}
                            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-4">
                                {stats.map((s, i) => (
                                    <span key={s.label} className="flex items-center gap-6">
                                        {i > 0 && <span aria-hidden className="w-px h-9 bg-white/[0.09]" />}
                                        <HeroStat icon={s.icon} value={s.value} label={s.label} href={s.href} />
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── progression ── */}
            <section
                className="relative rounded-[var(--radius-panel)] border border-white/[0.07] overflow-hidden bg-[#12100f]"
            >
                <div className="relative flex flex-col xl:flex-row items-stretch gap-5 p-5 md:p-6">
                    {/* rank · level · gauge */}
                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row items-center sm:items-stretch gap-5 md:gap-7">
                        {/* the insignia states the rank; the name is its caption */}
                        <div className="flex flex-col items-center gap-2.5 shrink-0 sm:w-[150px]">
                            <RankInsigniaMark icon={hero.rank_icon} color={hero.rank_color} name={hero.rank_name} size={104} />
                            <p
                                className="font-display text-[15px] font-black uppercase tracking-[0.18em] leading-none text-white truncate max-w-full"
                                title={tier ? `${hero.rank_name} · ${tier}` : undefined}
                            >
                                {hero.rank_name || "Unranked"}
                            </p>
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            {/* where you stand and what closes the gap, on one line
                                above the track they describe */}
                            <div className="flex items-baseline justify-between gap-4">
                                <p className="flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
                                    <span
                                        aria-hidden
                                        className="inline-block w-3.5 h-3.5 shrink-0"
                                        style={{
                                            clipPath: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
                                            background: "var(--xp)",
                                        }}
                                    />
                                    Level <span className="text-white text-[13px]">{hero.level}</span>
                                </p>

                                <p className="shrink-0 font-display text-[11px] font-bold uppercase tracking-[0.14em] tabular-nums text-white/40">
                                    <span className="text-[var(--xp-bright)] text-[15px] font-black">
                                        {levelToGo.toLocaleString()} XP
                                    </span>{" "}
                                    to level {hero.level + 1}
                                </p>
                            </div>

                            <XpRail percent={fillPercent} className="mt-3" />

                            <div className="mt-2.5 flex items-baseline justify-between gap-4 font-display text-[13px] font-black tabular-nums leading-none">
                                <p className="text-white/35">
                                    <span className="text-[var(--xp-bright)]">{levelDoneShown.toLocaleString()}</span>
                                    {` / ${levelSize.toLocaleString()} XP`}
                                </p>
                                <p className="text-[var(--xp-bright)]">{fillPercent}%</p>
                            </div>
                        </div>
                    </div>

                    {/* what's waiting at the top of the bar */}
                    <div
                        className="relative shrink-0 xl:w-[330px] rounded-[12px] border border-white/[0.07] bg-white/[0.02] px-4 py-4 flex items-center gap-3"
                    >
                        <div className="min-w-0 flex-1">
                            <p className="font-display text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
                                Next reward
                            </p>
                            <p className="mt-1.5 font-display text-[22px] font-black uppercase tracking-[0.02em] leading-none text-white">
                                Level {hero.level + 1}
                            </p>
                            {rankUpNext ? (
                                <p
                                    className="mt-2 text-[12px] font-semibold leading-snug"
                                    style={{ color: hero.next_rank?.color || "rgba(255,255,255,0.5)" }}
                                >
                                    {hero.next_rank?.name} promotion
                                </p>
                            ) : (
                                /* honest until the reward table exists */
                                <p className="mt-2 text-[12px] text-white/40 leading-snug">Contents to be revealed</p>
                            )}
                        </div>

                        {/* the crate is named on its own side panel, so the copy
                            beside it never has to repeat it */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/rewards/level-cache.png"
                            alt="Level cache"
                            width={104}
                            height={104}
                            className="w-[104px] h-[104px] shrink-0 object-contain"
                            style={{ filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.7))" }}
                        />
                    </div>
                </div>

                {/* the three figures that describe momentum */}
                <div className="relative mx-5 md:mx-6 border-t border-white/[0.07] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07]">
                    <span className="flex items-center gap-3 py-4 sm:pr-6">
                        <span
                            aria-hidden
                            className="inline-flex items-center justify-center w-9 h-9 shrink-0 font-display text-[10px] font-black text-white"
                            style={{
                                clipPath: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
                                background: "linear-gradient(160deg, var(--xp-bright) 0%, var(--xp) 55%, var(--xp-deep) 100%)",
                            }}
                        >
                            XP
                        </span>
                        <span>
                            <span className="block font-display text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/40">
                                Total XP
                            </span>
                            <span className="block mt-1 font-display text-[17px] font-black tabular-nums leading-none text-white">
                                {animatedXp.toLocaleString()}
                            </span>
                        </span>
                    </span>

                    <span className="flex items-center gap-3 py-4 sm:px-6">
                        <Flame className={`w-[22px] h-[22px] shrink-0 ${hero.streak_days > 0 ? "text-orange-400" : "text-white/25"}`} />
                        <span>
                            <span className="block font-display text-[17px] font-black tabular-nums leading-none text-white">
                                {hero.streak_days} {hero.streak_days === 1 ? "day" : "days"}
                            </span>
                            <span className="block mt-1 font-display text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/40">
                                Streak
                            </span>
                        </span>
                    </span>

                    <span className="flex items-center gap-3 py-4 sm:pl-6">
                        <TrendingUp className="w-[22px] h-[22px] shrink-0 text-[var(--accent)]" />
                        <span>
                            <span className="block font-display text-[17px] font-black tabular-nums leading-none text-white">
                                {fillPercent}%
                            </span>
                            <span className="block mt-1 font-display text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/40">
                                To next level
                            </span>
                        </span>
                    </span>
                </div>
            </section>

            {/* ── sections ── */}
            <ProfileTabStrip username={hero.username} activeTab={activeTab} isOwnProfile={isOwnProfile} />
        </div>
    );
}
