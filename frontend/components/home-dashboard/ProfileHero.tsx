"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    User as UserIcon, MapPin, Play, Pencil, Share2, Check, BadgeCheck, MoreHorizontal,
    Gamepad2, Star, Clock3, Award, UserPlus, Clock, MessageSquare, Sparkles, ShieldCheck, LinkIcon, GitCompare,
    TrendingUp, Flame,
} from "lucide-react";
import PlatformIcon from "@/components/games/PlatformIcon";
import type { HeroModel } from "@/lib/hero";
import type { ProfileTab } from "@/lib/profileTabs";
import type { FriendStatus } from "@/lib/types/profile";
import { useCountUp } from "@/hooks/useCountUp";
import ProfileTabStrip from "./ProfileTabStrip";
import { LevelHex, RankInsigniaMark, XpRail } from "./RankInsignia";
import { xpForLevel } from "@/lib/level";

/** 12480 → "12.5K" — hours read as a badge, not a spreadsheet. */
function compact(n: number): string {
    if (n >= 10_000) return `${Math.round(n / 1000)}K`;
    if (n >= 1_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
    return n.toLocaleString();
}

/**
 * Gamertag key → the mark PlatformIcon draws, and the brand it wears.
 * Brands are lifted toward the light end of each palette: the official values
 * (Xbox #107C10, PlayStation #0070D1) are picked for white backgrounds and go
 * muddy on ours.
 */
const PLATFORMS: Record<string, { label: string; name: string; brand: string }> = {
    steam: { label: "STEAM", name: "Steam", brand: "#66c0f4" },
    psn: { label: "PS", name: "PlayStation", brand: "#2b8fe6" },
    xbox: { label: "XBOX", name: "Xbox", brand: "#43b649" },
    epic: { label: "EPIC", name: "Epic Games", brand: "#f2f2f2" },
    discord: { label: "DISCORD", name: "Discord", brand: "#5865f2" },
    pc: { label: "PC", name: "PC", brand: "#e5e7eb" },
    switch: { label: "SWITCH", name: "Nintendo Switch", brand: "#f04a4a" },
};

/**
 * The avatar frame.
 *
 * The default is a rendered HUD ring — armoured segments, lit channels and a
 * status socket cast into the metal at the lower right. The portrait sits in
 * the ring's hole, tucked a hair under its inner edge so no seam shows.
 *
 * A purchased frame cosmetic replaces it with that frame's own paint, because
 * the whole point of buying one is that it shows.
 */

/** Measured off the ring art: hole diameter, and where the status socket sits. */
const RING_HOLE_INSET = "20%";
const NODE = { left: "76.2%", top: "74.6%", size: "10.5%" };

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

    // A bought frame is a flat painted band — no socket cast into it, so the
    // presence node gets drawn on top the way it always was.
    if (frame) {
        return (
            <div className="relative w-[116px] h-[116px] md:w-[136px] md:h-[136px] shrink-0">
                <span
                    aria-hidden
                    className="absolute inset-0 rounded-full"
                    style={{ background: frame, boxShadow: "0 0 22px -2px color-mix(in srgb, var(--accent) 45%, transparent)" }}
                />
                <span aria-hidden className="absolute inset-[3px] rounded-full bg-[var(--surface-1)]" />
                <span className="absolute inset-[6px] rounded-full overflow-hidden bg-[var(--surface-2)]">{portrait}</span>

                {online && (
                    <span
                        className="absolute bottom-[2px] right-[2px] flex items-center justify-center w-[28px] h-[28px] rounded-full bg-[var(--surface-1)]"
                        title="Online now"
                    >
                        <span className="relative flex items-center justify-center w-[15px] h-[15px]">
                            <span aria-hidden className="tp-pulse-ring absolute inset-0 rounded-full bg-emerald-400" />
                            <span
                                className="relative block w-full h-full rounded-full"
                                style={{
                                    background: "radial-gradient(circle at 35% 30%, #6ee7b7 0%, #10b981 55%, #047857 100%)",
                                    boxShadow: "0 0 10px rgba(16,185,129,0.95), inset 0 1px 0 rgba(255,255,255,0.5)",
                                }}
                            />
                        </span>
                        <span className="sr-only">Online</span>
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className="relative w-[124px] h-[124px] md:w-[148px] md:h-[148px] shrink-0">
            {/* portrait first — the ring's inner edge overlaps it */}
            <span
                className="absolute rounded-full overflow-hidden bg-[var(--surface-2)]"
                style={{ inset: RING_HOLE_INSET }}
            >
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
                style={{
                    left: NODE.left,
                    top: NODE.top,
                    width: NODE.size,
                    height: NODE.size,
                    transform: "translate(-50%, -50%)",
                }}
                title={online ? "Online now" : "Offline"}
            >
                {online && (
                    <span aria-hidden className="tp-pulse-ring absolute inset-0 rounded-full bg-emerald-400" />
                )}
                <span
                    className="relative block w-full h-full rounded-full"
                    style={
                        online
                            ? {
                                  background: "radial-gradient(circle at 35% 30%, #a7f3d0 0%, #10b981 55%, #047857 100%)",
                                  boxShadow: "0 0 12px rgba(16,185,129,0.95), inset 0 1px 0 rgba(255,255,255,0.55)",
                              }
                            : {
                                  // covers the socket's cast-in lamp so an offline
                                  // profile never shows a green light
                                  background: "radial-gradient(circle at 35% 30%, #3f3f46 0%, #27272a 60%, #18181b 100%)",
                                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
                              }
                    }
                />
                <span className="sr-only">{online ? "Online" : "Offline"}</span>
            </span>
        </div>
    );
}

/**
 * Chamfered corners — top-left and bottom-right cut away. Every HUD in the
 * genre uses the same trick to say "this is hardware, not a web form", and it
 * costs one clip-path.
 */
const CUT = "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)";

const HUD_BTN =
    "group/cta relative inline-flex items-center justify-center gap-2 h-11 px-4 font-display text-[11px] font-bold uppercase tracking-[0.11em] overflow-hidden transition-colors duration-300 disabled:opacity-60";

const BTN_PRIMARY = `${HUD_BTN} text-white hover:brightness-110`;
const BTN_GHOST = `${HUD_BTN} text-[var(--ink-hi)]`;

/** Flat accent — one colour, no gradient. The shape carries the interest. */
const primaryStyle: React.CSSProperties = {
    clipPath: CUT,
    background: "var(--accent)",
};

/** The outer element paints the edge; an inset layer paints the face. */
const ghostStyle: React.CSSProperties = {
    clipPath: CUT,
    background: "rgba(255,255,255,0.13)",
};

function GhostFace() {
    return (
        <span
            aria-hidden
            className="absolute inset-[1px] bg-[#141210] group-hover/cta:bg-[#1c1815] transition-colors duration-300"
            style={{ clipPath: CUT }}
        />
    );
}

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
 * A stat card: the label sits beside its glyph on the top line, the number
 * owns the bottom. Reading order is "what, then how much" — the opposite of
 * a table cell.
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
    // Same chamfer as the buttons beneath: outer paints the edge, the inset
    // layer paints the face, since clip-path would eat a real border.
    const cls = "group relative flex flex-col items-center justify-center gap-2 min-w-0 px-2 py-5 overflow-hidden";

    const body = (
        <>
            <span
                aria-hidden
                className="absolute inset-[1px] bg-[#0d0b0a] group-hover:bg-[#151210] transition-colors duration-300"
                style={{ clipPath: CUT }}
            />
            {href && (
                <span
                    aria-hidden
                    className="absolute top-0 left-3 right-0 h-[2px] bg-[var(--accent)] scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-[var(--ease-hud)]"
                />
            )}
            <Icon className="relative w-[18px] h-[18px] shrink-0 text-white/85 group-hover:text-[var(--accent)] transition-colors duration-300" />
            <span className="relative font-display text-[28px] font-black tabular-nums leading-none text-white">
                {compact(animated)}
            </span>
            <span className="relative text-[11.5px] font-medium text-white/45 leading-none truncate max-w-full">
                {label}
            </span>
        </>
    );

    const edge: React.CSSProperties = { clipPath: CUT, background: "rgba(255,255,255,0.08)" };

    // Not every tile leads somewhere on someone else's profile — those render
    // as plain cards rather than dead links.
    return href ? (
        <Link href={href} title={label} className={cls} style={edge}>
            {body}
        </Link>
    ) : (
        <div title={label} className={cls} style={edge}>
            {body}
        </div>
    );
}

/** The visitor's relationship button — one control, five states. */
function FriendAction({ status, busy, onAdd }: { status: FriendStatus; busy: boolean; onAdd: () => void }) {
    if (status === "accepted") {
        return (
            <span className={`${BTN_GHOST} col-span-2 cursor-default`} style={ghostStyle}>
                <GhostFace />
                <Check className="relative w-3.5 h-3.5 text-emerald-400" />
                <span className="relative">Friends</span>
            </span>
        );
    }

    if (status === "pending") {
        return (
            <span className={`${BTN_GHOST} col-span-2 cursor-default opacity-70`} style={ghostStyle}>
                <GhostFace />
                <Clock className="relative w-3.5 h-3.5" />
                <span className="relative">Request Sent</span>
            </span>
        );
    }

    if (status === "incoming") {
        return (
            <Link href="/friends" className={`${BTN_PRIMARY} col-span-2`} style={primaryStyle}>
                <Sheen />
                <UserPlus className="relative w-3.5 h-3.5" />
                <span className="relative">Respond</span>
            </Link>
        );
    }

    return (
        <button onClick={onAdd} disabled={busy} className={`${BTN_PRIMARY} col-span-2`} style={primaryStyle}>
            <Sheen />
            <UserPlus className="relative w-3.5 h-3.5" />
            <span className="relative">{busy ? "Sending…" : "Add Friend"}</span>
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
                className={`${BTN_GHOST} w-full text-[var(--ink-low)] hover:text-[var(--ink-hi)]`}
                style={ghostStyle}
            >
                <GhostFace />
                <MoreHorizontal className="relative w-4 h-4" />
            </button>

            {open && (
                <div
                    onClick={() => setOpen(false)}
                    className="absolute right-0 top-full mt-2 z-50 min-w-[230px] p-1.5 rounded-[var(--radius-card)] border border-[var(--line-strong)] bg-[var(--surface-1)] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8)]"
                >
                    {children}
                </div>
            )}
        </div>
    );
}

const MENU_ITEM =
    "w-full flex items-center gap-2.5 px-2.5 h-9 rounded-[var(--radius-inner)] text-[12px] font-semibold text-[var(--ink-low)] hover:text-[var(--ink-hi)] hover:bg-[var(--fill-2)] transition-colors duration-150";

interface Props {
    hero: HeroModel;
    activeTab?: string;
    /** Owner sees Customize / Continue Playing; visitors see friend actions. */
    isOwnProfile?: boolean;
    friendStatus?: FriendStatus;
    friendActionBusy?: boolean;
    onAddFriend?: () => void;
    onMessage?: () => void;
    /** Signed-out visitors get no relationship controls at all. */
    viewerSignedIn?: boolean;
    /** Used only to build the compare link in the overflow menu. */
    viewerUsername?: string;
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
    const levelToGoShown = useCountUp(levelToGo, 1200);
    const levelDoneShown = useCountUp(levelDone, 1200);

    const base = `/profile/${hero.username}`;
    const online = hero.is_online || isOwnProfile;

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
        { label: "Hours", value: hero.stats.hours, icon: Clock3, href: `${base}?tab=collection` },
        { label: "Achievements", value: hero.stats.achievements, icon: Award, href: `${base}?tab=achievements` },
    ];

    const tags = hero.playstyle_tags.slice(0, 3);
    const platforms = hero.platforms.filter((p) => PLATFORMS[p]).slice(0, 5);

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
                        <span className="absolute inset-0 bg-gradient-to-r from-[var(--surface-1)] from-[24%] via-[color-mix(in_srgb,var(--surface-1)_74%,transparent)] via-[54%] to-[color-mix(in_srgb,var(--surface-1)_18%,transparent)]" />
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
                {/* one-shot power-on sweep */}
                <span className="tp-sweep absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
            </div>

            {/* The Crown — this hero owns the page */}
            <span aria-hidden className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_70%,transparent)] to-transparent" />

            <div className="relative p-5 md:p-7">
                <div className="flex flex-col xl:flex-row xl:items-center gap-6">
                    {/* ── identity ── */}
                    <div className="flex items-start gap-5 md:gap-6 flex-1 min-w-0">
                        {/* No edit affordance stuck on the portrait — changing it
                            lives in Customize Profile, one button away. */}
                        <Link href={base} className="group/av block shrink-0">
                            <AvatarFrame
                                src={hero.avatar_url}
                                alt={hero.display_name}
                                frame={hero.frame_value}
                                online={online}
                            />
                        </Link>

                        <div className="min-w-0 flex-1">
                            {/* name + verification */}
                            <h1 className="flex items-center gap-2 font-display text-[26px] md:text-[34px] font-black text-[var(--ink-hi)] leading-none min-w-0">
                                <span className="truncate">{hero.display_name}</span>
                                {hero.verified && (
                                    <BadgeCheck
                                        className="w-6 h-6 md:w-7 md:h-7 shrink-0 text-[var(--accent)]"
                                        style={{ filter: "drop-shadow(0 0 8px color-mix(in srgb, var(--accent) 55%, transparent))" }}
                                        aria-label="Verified TechPlay staff"
                                    />
                                )}
                            </h1>

                            {/* handle · tagline */}
                            <p className="mt-2 flex items-center gap-2.5 text-[13.5px] text-[var(--ink-low)] min-w-0">
                                <span className="font-bold text-[var(--accent)] shrink-0">@{hero.username}</span>
                                {(hero.tagline || hero.bio) && (
                                    <>
                                        <span aria-hidden className="text-[var(--ink-faint)]">·</span>
                                        <span className="truncate">{hero.tagline || hero.bio}</span>
                                    </>
                                )}
                            </p>

                            {/* where you are, what you play on, how you play */}
                            {(hero.location || platforms.length > 0 || tags.length > 0) && (
                                <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                                    {hero.location && (
                                        <span className="inline-flex items-center gap-1.5 h-[24px] px-2.5 rounded-full bg-[var(--fill-2)] border border-[var(--line)] text-[11px] font-semibold text-[var(--ink-mid)]">
                                            <MapPin className="w-3 h-3 text-[var(--ink-faint)]" /> {hero.location}
                                        </span>
                                    )}

                                    {/* the platforms you're actually on — greyed metal that
                                        lights up in its own brand when you reach for it */}
                                    {platforms.length > 0 && (
                                        <span className="inline-flex items-center gap-1.5">
                                            {platforms.map((p) => {
                                                const meta = PLATFORMS[p];
                                                return (
                                                    <span
                                                        key={p}
                                                        title={meta.name}
                                                        style={{ ["--brand" as string]: meta.brand }}
                                                        className="group/pf inline-flex items-center justify-center w-[42px] h-[42px] rounded-[13px] border border-white/[0.08] bg-[color-mix(in_srgb,#100e0c_78%,transparent)] text-[var(--brand)] hover:border-[color-mix(in_srgb,var(--brand)_55%,transparent)] hover:bg-[color-mix(in_srgb,var(--brand)_12%,#100e0c)] hover:-translate-y-0.5 transition-all duration-300"
                                                    >
                                                        <PlatformIcon label={meta.label} className="w-[19px] h-[19px]" />
                                                    </span>
                                                );
                                            })}
                                        </span>
                                    )}

                                    {tags.map((t) => (
                                        <span
                                            key={t}
                                            className="inline-flex items-center h-[24px] px-2.5 rounded-full bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]"
                                        >
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            )}

                        </div>
                    </div>

                    {/* ── the numbers, and the actions that belong beside them ──
                        Both rows run the same four-column grid, so every button
                        edge lands on a card edge. ── */}
                    <div className="shrink-0 xl:w-[560px] space-y-2.5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {tiles.map((t) => (
                                <StatCard key={t.label} icon={t.icon} value={t.value} label={t.label} href={t.href} />
                            ))}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                {isOwnProfile ? (
                                    <>
                                        <Link href="/settings" className={`${BTN_PRIMARY} col-span-2`} style={primaryStyle}>
                                            <Sheen />
                                            <Pencil className="relative w-3.5 h-3.5" />
                                            <span className="relative">Customize</span>
                                        </Link>
                                        <button onClick={share} className={BTN_GHOST} style={ghostStyle}>
                                            <GhostFace />
                                            {copied ? (
                                                <>
                                                    <Check className="relative w-3.5 h-3.5 text-emerald-400" />
                                                    <span className="relative">Copied</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Share2 className="relative w-3.5 h-3.5" />
                                                    <span className="relative">Share</span>
                                                </>
                                            )}
                                        </button>
                                        <MoreMenu>
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
                                        <button onClick={() => onMessage?.()} className={BTN_GHOST} style={ghostStyle}>
                                            <GhostFace />
                                            <MessageSquare className="relative w-3.5 h-3.5" />
                                            <span className="relative">Message</span>
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
                                        <Link href="/login" className={`${BTN_PRIMARY} col-span-2`} style={primaryStyle}>
                                            <Sheen />
                                            <UserPlus className="relative w-3.5 h-3.5" />
                                            <span className="relative">Sign In</span>
                                        </Link>
                                        <button onClick={share} className={`${BTN_GHOST} col-span-2`} style={ghostStyle}>
                                            <GhostFace />
                                            {copied ? (
                                                <>
                                                    <Check className="relative w-3.5 h-3.5 text-emerald-400" />
                                                    <span className="relative">Copied</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Share2 className="relative w-3.5 h-3.5" />
                                                    <span className="relative">Share</span>
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── the console band ──
                Progression and navigation share one lit surface at the foot of
                the hero: rank, the level gauge and the next crate on the upper
                deck, the sections beneath them. Two panels stacked here read as
                two components; one band reads as the machine's front plate. ── */}
            <div
                className="relative"
                style={{
                    background:
                        "linear-gradient(180deg, color-mix(in srgb, var(--accent) 15%, #0b0908) 0%, color-mix(in srgb, var(--accent) 7%, #0b0908) 100%)",
                }}
            >
                {/* the filament where the band meets the hero */}
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
                            "radial-gradient(120% 100% at 50% 130%, color-mix(in srgb, var(--accent) 30%, transparent) 0%, transparent 70%)",
                    }}
                />

                {/* ── upper deck: where you stand, how far to the next rung ── */}
                <div className="relative flex flex-col lg:flex-row items-stretch">
                    {/* rank */}
                    <div className="flex items-center gap-3.5 shrink-0 lg:w-[228px] px-5 py-4">
                        <RankInsigniaMark
                            icon={hero.rank_icon}
                            color={hero.rank_color}
                            name={hero.rank_name}
                            size={66}
                        />
                        <div className="min-w-0">
                            <p
                                className="font-display text-[15px] font-black uppercase tracking-[0.16em] leading-none truncate"
                                style={{ color: hero.rank_color || "var(--ink-hi)" }}
                            >
                                {hero.rank_name || "Unranked"}
                            </p>
                            <p className="mt-1.5 font-display text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">
                                Rank
                            </p>
                        </div>
                    </div>

                    <span aria-hidden className="hidden lg:block w-px my-4 bg-white/[0.09]" />
                    <span aria-hidden className="lg:hidden h-px mx-5 bg-white/[0.09]" />

                    {/* the climb */}
                    {/* The rung you're on and the one you're climbing to bookend
                        the track, so the gauge reads as travel between two
                        levels rather than a bar with a number beside it. The
                        next hex sits in unlit metal until you reach it. */}
                    <div className="flex-1 min-w-0 px-5 py-4 flex items-center gap-3.5">
                        <span className="flex flex-col items-center gap-1.5 shrink-0">
                            <LevelHex level={hero.level} size={46} />
                            <span className="font-display text-[8px] font-bold uppercase tracking-[0.2em] text-white/35">
                                Level
                            </span>
                        </span>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-3 mb-2">
                                <span className="flex items-center gap-3 font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">
                                    <span className="inline-flex items-center gap-1.5">
                                        <TrendingUp className="w-3.5 h-3.5 text-[var(--accent)]" />
                                        Total XP
                                        <span className="text-white tabular-nums tracking-normal text-[11px]">
                                            {animatedXp.toLocaleString()}
                                        </span>
                                    </span>
                                    <span aria-hidden className="w-px h-3 bg-white/15" />
                                    <span className="inline-flex items-center gap-1.5">
                                        <Flame className={`w-3.5 h-3.5 ${hero.streak_days > 0 ? "text-orange-400" : "text-white/35"}`} />
                                        Streak
                                        <span className="text-white tabular-nums tracking-normal text-[11px]">
                                            {hero.streak_days}d
                                        </span>
                                    </span>
                                </span>

                                <span className="shrink-0 font-display text-[11px] font-bold uppercase tracking-[0.1em] tabular-nums text-white/40">
                                    <span className="text-white">{levelToGoShown.toLocaleString()}</span> XP to go
                                </span>
                            </div>

                            <XpRail percent={fillPercent} />

                            <div className="mt-1.5 flex items-baseline justify-between gap-3 font-display text-[10px] font-bold uppercase tracking-[0.1em] tabular-nums">
                                <span className="text-white/30">
                                    <span className="text-white/60">{levelDoneShown.toLocaleString()}</span>
                                    {` / ${levelSize.toLocaleString()} XP`}
                                </span>
                                <span className="text-[var(--accent-bright)]">{fillPercent}%</span>
                            </div>
                        </div>

                        <span className="flex flex-col items-center gap-1.5 shrink-0">
                            <LevelHex level={hero.level + 1} size={40} dim />
                            <span className="font-display text-[8px] font-bold uppercase tracking-[0.2em] text-white/25">
                                Next
                            </span>
                        </span>
                    </div>

                    <span aria-hidden className="hidden lg:block w-px my-4 bg-white/[0.09]" />
                    <span aria-hidden className="lg:hidden h-px mx-5 bg-white/[0.09]" />

                    {/* what is waiting at the top of the bar */}
                    <div className="shrink-0 lg:w-[238px] px-5 py-4 flex items-center gap-3.5">
                        {/* the crate is named on its own side panel, so the
                            caption beside it never has to repeat it */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/rewards/level-cache.png"
                            alt="Level cache"
                            width={68}
                            height={68}
                            className="w-[68px] h-[68px] shrink-0 object-contain"
                            style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.7))" }}
                        />
                        <div className="min-w-0">
                            <p className="font-display text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">
                                Reward at
                            </p>
                            <p className="mt-1 font-display text-[16px] font-black uppercase tracking-[0.05em] leading-none text-white">
                                Level {hero.level + 1}
                            </p>
                            {rankUpNext ? (
                                <p
                                    className="mt-1.5 text-[10.5px] font-semibold truncate"
                                    style={{ color: hero.next_rank?.color || "rgba(255,255,255,0.5)" }}
                                >
                                    {hero.next_rank?.name} promotion
                                </p>
                            ) : (
                                /* honest until the reward table exists */
                                <p className="mt-1.5 text-[10.5px] text-white/35">Contents to be revealed</p>
                            )}
                        </div>
                    </div>
                </div>

                <span aria-hidden className="block h-px mx-5 bg-white/[0.09]" />

                {/* ── lower deck: the sections ── */}
                <ProfileTabStrip username={hero.username} activeTab={activeTab} isOwnProfile={isOwnProfile} bare />
            </div>
        </section>
    );
}
