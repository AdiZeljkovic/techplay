"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    User as UserIcon, MapPin, Play, Pencil, Share2, Check, BadgeCheck, MoreHorizontal,
    Gamepad2, Star, Clock3, Award, Users, UserPlus, Clock, MessageSquare, Sparkles, ShieldCheck, LinkIcon, GitCompare,
    ChevronRight, TrendingUp, Flame,
} from "lucide-react";
import PlatformIcon from "@/components/games/PlatformIcon";
import type { HeroModel } from "@/lib/hero";
import type { ProfileTab } from "@/lib/profileTabs";
import type { FriendStatus } from "@/lib/types/profile";
import { useCountUp } from "@/hooks/useCountUp";
import ProfileTabStrip from "./ProfileTabStrip";
import { LevelHex, RankMedal, XpRail } from "./RankInsignia";

/** 12480 → "12.5K" — hours read as a badge, not a spreadsheet. */
function compact(n: number): string {
    if (n >= 10_000) return `${Math.round(n / 1000)}K`;
    if (n >= 1_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
    return n.toLocaleString();
}

/** Gamertag key → the mark PlatformIcon draws, and the brand it lights up in. */
const PLATFORMS: Record<string, { label: string; name: string; brand: string }> = {
    steam: { label: "STEAM", name: "Steam", brand: "#c7d5e0" },
    psn: { label: "PS", name: "PlayStation", brand: "#4c8bf5" },
    xbox: { label: "XBOX", name: "Xbox", brand: "#4ade80" },
    epic: { label: "EPIC", name: "Epic Games", brand: "#ffffff" },
    discord: { label: "DISCORD", name: "Discord", brand: "#7d88f5" },
    pc: { label: "PC", name: "PC", brand: "#e5e7eb" },
    switch: { label: "SWITCH", name: "Nintendo Switch", brand: "#f87171" },
};

/**
 * The avatar frame. A single solid ring — the paint comes from the equipped
 * frame cosmetic when there is one, so a bought frame actually shows — with a
 * dark bezel separating it from the portrait and four reticle ticks sitting
 * outside it. No gradient by default: a gradient ring reads as decoration,
 * a machined one reads as equipment.
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
    const paint = frame || "var(--accent)";

    return (
        <div className="relative w-[116px] h-[116px] md:w-[136px] md:h-[136px] shrink-0">
            {/* reticle ticks, parked on the diagonals outside the ring */}
            {[45, 135, 225, 315].map((deg) => (
                <span
                    key={deg}
                    aria-hidden
                    className="absolute left-1/2 top-1/2 w-[3px] h-[9px] rounded-full"
                    style={{
                        background: "var(--accent)",
                        opacity: 0.75,
                        transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-78px)`,
                        boxShadow: "0 0 8px color-mix(in srgb, var(--accent) 70%, transparent)",
                    }}
                />
            ))}

            {/* the ring itself */}
            <span
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{ background: paint, boxShadow: "0 0 22px -2px color-mix(in srgb, var(--accent) 45%, transparent)" }}
            />
            {/* bezel — keeps the portrait from touching the paint */}
            <span aria-hidden className="absolute inset-[3px] rounded-full bg-[var(--surface-1)]" />

            <span className="absolute inset-[6px] rounded-full overflow-hidden bg-[var(--surface-2)]">
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

            {/* presence node, punched through the frame */}
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
    const cls =
        "group relative flex flex-col items-center justify-center gap-2 min-w-0 px-2 py-5 rounded-[18px] border border-white/[0.07] bg-[color-mix(in_srgb,#0b0a09_72%,transparent)] backdrop-blur-md overflow-hidden transition-colors duration-300";

    const body = (
        <>
            {href && (
                <span
                    aria-hidden
                    className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--accent)] scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-[var(--ease-hud)]"
                />
            )}
            <Icon className="w-[18px] h-[18px] shrink-0 text-white/85 group-hover:text-[var(--accent)] transition-colors duration-300" />
            <span className="font-display text-[28px] font-black tabular-nums leading-none text-white">
                {compact(animated)}
            </span>
            <span className="text-[11.5px] font-medium text-white/45 leading-none truncate max-w-full">{label}</span>
        </>
    );

    // Not every tile leads somewhere on someone else's profile (Friends
    // doesn't) — those render as plain cards rather than dead links.
    return href ? (
        <Link
            href={href}
            title={label}
            className={`${cls} hover:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] hover:bg-[color-mix(in_srgb,var(--surface-0)_90%,transparent)]`}
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
function FriendAction({ status, busy, onAdd }: { status: FriendStatus; busy: boolean; onAdd: () => void }) {
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
                className="inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius-card)] bg-[var(--fill-2)] border border-[var(--line-strong)] text-[var(--ink-low)] hover:text-[var(--ink-hi)] hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-colors duration-300"
            >
                <MoreHorizontal className="w-4 h-4" />
            </button>

            {open && (
                <div
                    onClick={() => setOpen(false)}
                    className="absolute left-0 top-full mt-2 z-50 min-w-[210px] p-1.5 rounded-[var(--radius-card)] border border-[var(--line-strong)] bg-[var(--surface-1)] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8)]"
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

    // The gauge measures the *band*, not the whole ladder. Sitting at 1,566 of
    // a 1,000–2,000 Silver band is 57% of the way to Gold, not 78% — filling by
    // total XP flatters every rank above the first.
    const bandFloor = Math.min(hero.rank_min_xp, hero.xp);
    const bandSize = nextXp ? Math.max(1, nextXp - bandFloor) : 0;
    const bandDone = nextXp ? Math.max(0, hero.xp - bandFloor) : 0;
    const xpPercent = nextXp ? Math.min(100, Math.round((bandDone / bandSize) * 100)) : 100;

    const fillPercent = useCountUp(xpPercent, 1200);
    const animatedXp = useCountUp(hero.xp, 1200);
    const bandDoneShown = useCountUp(bandDone, 1200);

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
        // your friend list is yours; a visitor just sees the number
        { label: "Friends", value: hero.stats.friends, icon: Users, href: isOwnProfile ? "/friends" : undefined },
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
                    <div className="flex items-start gap-5 md:gap-6 flex-1 min-w-0">
                        <div className="relative shrink-0">
                            <Link href={base} className="group/av block">
                                <AvatarFrame
                                    src={hero.avatar_url}
                                    alt={hero.display_name}
                                    frame={hero.frame_value}
                                    online={online}
                                />
                            </Link>

                            {isOwnProfile && (
                                <Link
                                    href="/settings"
                                    title="Change your avatar"
                                    className="absolute top-0 right-0 w-9 h-9 rounded-full bg-[var(--surface-1)] border border-[var(--line-strong)] flex items-center justify-center text-[var(--ink-low)] hover:text-[var(--accent)] hover:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] transition-colors duration-300"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </Link>
                            )}
                        </div>

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
                                                        className="group/pf inline-flex items-center justify-center w-[42px] h-[42px] rounded-[13px] border border-white/[0.08] bg-[color-mix(in_srgb,#100e0c_78%,transparent)] text-white/40 hover:text-[var(--brand)] hover:border-[color-mix(in_srgb,var(--brand)_45%,transparent)] hover:-translate-y-0.5 transition-all duration-300"
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

                    {/* ── the numbers, and the actions that belong beside them ── */}
                    <div className="shrink-0 xl:w-[620px] space-y-3">
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                            {tiles.map((t) => (
                                <StatCard key={t.label} icon={t.icon} value={t.value} label={t.label} href={t.href} />
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center xl:justify-end gap-2">
                                {isOwnProfile ? (
                                    <>
                                        <Link href="/settings" className={BTN_PRIMARY}>
                                            <Sheen />
                                            <Pencil className="relative w-3.5 h-3.5" />
                                            <span className="relative">Customize Profile</span>
                                        </Link>
                                        <button onClick={share} className={BTN_GHOST}>
                                            {copied ? (
                                                <>
                                                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Share2 className="w-3.5 h-3.5" /> Share Profile
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
                                        <button onClick={() => onMessage?.()} className={BTN_GHOST}>
                                            <MessageSquare className="w-3.5 h-3.5" /> Message
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
                                            <Sheen />
                                            <UserPlus className="relative w-3.5 h-3.5" />
                                            <span className="relative">Sign In To Connect</span>
                                        </Link>
                                        <button onClick={share} className={BTN_GHOST}>
                                            {copied ? (
                                                <>
                                                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Share2 className="w-3.5 h-3.5" /> Share Profile
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                        </div>
                    </div>
                </div>

                {/* ── the progression console: level · rank and gauge · the two
                    numbers that describe momentum ── */}
                <div
                    className="relative mt-6 rounded-[20px] border border-white/[0.07] overflow-hidden"
                    style={{
                        background: "linear-gradient(180deg, rgba(17,14,12,0.88) 0%, rgba(9,8,7,0.94) 100%)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                    }}
                >
                    {/* the tier's own metal bleeds across the panel */}
                    {hero.rank_color && (
                        <span
                            aria-hidden
                            className="absolute inset-y-0 left-1/4 right-0 pointer-events-none"
                            style={{
                                background: `linear-gradient(100deg, transparent 0%, color-mix(in srgb, ${hero.rank_color} 13%, transparent) 55%, transparent 100%)`,
                            }}
                        />
                    )}
                    {/* HUD trim: a punched dot field on the left, a bracket on the right */}
                    <span
                        aria-hidden
                        className="absolute left-4 top-3 w-24 h-8 pointer-events-none opacity-40"
                        style={{
                            backgroundImage: "radial-gradient(circle, color-mix(in srgb, var(--accent) 55%, transparent) 1px, transparent 1px)",
                            backgroundSize: "9px 9px",
                            maskImage: "linear-gradient(120deg, #000 0%, transparent 75%)",
                            WebkitMaskImage: "linear-gradient(120deg, #000 0%, transparent 75%)",
                        }}
                    />
                    <span
                        aria-hidden
                        className="absolute right-4 top-4 w-6 h-6 pointer-events-none border-t border-r rounded-tr-[4px]"
                        style={{ borderColor: "color-mix(in srgb, var(--accent) 45%, transparent)" }}
                    />

                    <div className="relative flex flex-col lg:flex-row items-stretch">
                        {/* ── level ── */}
                        <div className="relative flex items-center lg:flex-col lg:justify-center gap-4 lg:gap-2.5 shrink-0 lg:w-[196px] px-5 py-5">
                            <span
                                aria-hidden
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-11 rounded-r-full bg-[var(--accent)]"
                                style={{ boxShadow: "0 0 12px color-mix(in srgb, var(--accent) 75%, transparent)" }}
                            />
                            <LevelHex level={hero.level} size={86} />
                            <div className="lg:text-center">
                                <p className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
                                    Level
                                </p>
                                {/* one pip per tenth of the band — progress you can read at a glance */}
                                <div className="mt-2 flex items-center gap-[5px]">
                                    {Array.from({ length: 10 }).map((_, i) => (
                                        <span
                                            key={i}
                                            className="w-[5px] h-[5px] rounded-full transition-colors duration-500"
                                            style={{
                                                background:
                                                    i < Math.round(fillPercent / 10)
                                                        ? "var(--accent)"
                                                        : "rgba(255,255,255,0.13)",
                                                boxShadow:
                                                    i < Math.round(fillPercent / 10)
                                                        ? "0 0 6px color-mix(in srgb, var(--accent) 70%, transparent)"
                                                        : "none",
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <span aria-hidden className="hidden lg:block w-px my-5 bg-white/[0.07]" />
                        <span aria-hidden className="lg:hidden h-px mx-5 bg-white/[0.07]" />

                        {/* ── rank and the gauge ── */}
                        <div className="flex-1 min-w-0 px-5 py-5">
                            <div className="flex items-center gap-3.5">
                                <RankMedal color={hero.rank_color} size={46} />
                                <div className="min-w-0">
                                    <p
                                        className="font-display text-[19px] font-black uppercase tracking-[0.06em] leading-none truncate"
                                        style={{ color: hero.rank_color || "var(--ink-hi)" }}
                                    >
                                        {hero.rank_name || "Unranked"}
                                    </p>
                                    <p className="mt-1 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-faint)]">
                                        Current Rank
                                    </p>
                                </div>

                                <div className="ml-auto shrink-0">
                                    {nextXp && hero.next_rank ? (
                                        <Link
                                            href={`${base}?tab=stats`}
                                            className="group/next inline-flex items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-[0.1em] tabular-nums text-[var(--ink-faint)] hover:text-[var(--ink-mid)] transition-colors duration-300"
                                        >
                                            <span className="text-white">{(nextXp - hero.xp).toLocaleString()}</span>
                                            <span>XP to</span>
                                            <span style={{ color: hero.next_rank.color || "var(--ink-hi)" }}>
                                                {hero.next_rank.name}
                                            </span>
                                            <ChevronRight className="w-3.5 h-3.5 group-hover/next:translate-x-0.5 transition-transform duration-300" />
                                        </Link>
                                    ) : (
                                        <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                                            Top of the ladder
                                        </span>
                                    )}
                                </div>
                            </div>

                            <XpRail percent={fillPercent} className="mt-4" />

                            <div className="mt-2 flex items-center justify-between gap-3 font-display text-[12px] font-bold tabular-nums">
                                <span className="text-[var(--ink-faint)]">
                                    <span className="text-white">{bandDoneShown.toLocaleString()}</span>
                                    {nextXp ? ` / ${bandSize.toLocaleString()} XP` : " XP"}
                                </span>
                                <span className="text-[var(--accent)]">{fillPercent}%</span>
                            </div>
                        </div>

                        <span aria-hidden className="hidden lg:block w-px my-5 bg-white/[0.07]" />
                        <span aria-hidden className="lg:hidden h-px mx-5 bg-white/[0.07]" />

                        {/* ── momentum ── */}
                        <div className="shrink-0 lg:w-[210px] px-5 py-5 flex lg:flex-col gap-5 lg:gap-0">
                            <div className="flex items-center gap-3 lg:flex-1">
                                <TrendingUp className="w-[18px] h-[18px] shrink-0 text-[var(--accent)]" />
                                <div className="min-w-0">
                                    <p className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-faint)]">
                                        Total XP
                                    </p>
                                    <p className="mt-0.5 font-display text-[20px] font-black tabular-nums leading-none text-white">
                                        {animatedXp.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <span aria-hidden className="hidden lg:block h-px my-3 bg-white/[0.07]" />
                            <span aria-hidden className="lg:hidden w-px bg-white/[0.07]" />

                            <div className="flex items-center gap-3 lg:flex-1">
                                <Flame
                                    className={`w-[18px] h-[18px] shrink-0 ${hero.streak_days > 0 ? "text-orange-400" : "text-[var(--ink-faint)]"}`}
                                />
                                <div className="min-w-0">
                                    <p className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-faint)]">
                                        Streak
                                    </p>
                                    <p className="mt-0.5 font-display text-[20px] font-black tabular-nums leading-none text-white">
                                        {hero.streak_days}
                                        <span className="ml-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
                                            {hero.streak_days === 1 ? "Day" : "Days"}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ProfileTabStrip username={hero.username} activeTab={activeTab} isOwnProfile={isOwnProfile} />
        </section>
    );
}
