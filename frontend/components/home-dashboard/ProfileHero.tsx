"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    User as UserIcon, MapPin, CalendarDays, Pencil, ExternalLink, Check, BadgeCheck, MoreHorizontal,
    Flame, Play, Sparkles, ShieldCheck, LinkIcon, GitCompare, UserPlus, Clock, MessageSquare, ChevronRight,
} from "lucide-react";
import type { HeroModel } from "@/lib/hero";
import type { FriendStatus } from "@/lib/types/profile";
import { rankTier } from "@/lib/ranks";
import { useCountUp } from "@/hooks/useCountUp";
import ProfileTabStrip from "./ProfileTabStrip";
import { RankInsigniaMark } from "./RankInsignia";
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
    online,
}: {
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
                    boxShadow: "0 0 24px -4px color-mix(in srgb, var(--accent) 55%, transparent)",
                }}
            />
            {/* the gap that keeps the ring reading as a ring, not a border */}
            <span aria-hidden className="absolute inset-[2.5px] rounded-full bg-[#0c0a09]" />

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
                        className="relative block w-full h-full rounded-full ring-[3px] ring-[#0c0a09]"
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
    viewerUsername,
}: Props) {
    const [copied, setCopied] = useState(false);

    const backdrop = hero.cover_image ?? hero.backdrop_fallback;
    const base = `/profile/${hero.username}`;
    const online = hero.is_online || isOwnProfile;
    const tier = rankTier(hero.rank_name);

    const levelCeil = xpForLevel(hero.level + 1);
    const animatedXp = useCountUp(hero.xp, 1200);

    const share = () => {
        const url = `${window.location.origin}${base}`;
        navigator.clipboard?.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const cells: StripCell[] = [
        { label: "Level", value: hero.level },
        {
            label: "XP",
            value: (
                <>
                    {animatedXp.toLocaleString()}{" "}
                    <span className="text-[13px] text-white/35">/ {levelCeil.toLocaleString()}</span>
                </>
            ),
            href: `${base}?tab=stats`,
        },
        {
            label: "Rank",
            value: (
                <span className="text-[15px] uppercase tracking-[0.04em]" style={{ color: hero.rank_color || "#fff" }}>
                    {hero.rank_name || "Unranked"}
                </span>
            ),
            icon: <RankInsigniaMark icon={hero.rank_icon} color={hero.rank_color} name={hero.rank_name} size={34} />,
            href: `${base}?tab=stats`,
        },
        { label: "Games", value: hero.stats.games, href: `${base}?tab=collection` },
        { label: "Completed", value: hero.stats.completed, href: `${base}?tab=collection` },
        { label: "Reviews", value: hero.stats.reviews, href: `${base}?tab=activity` },
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
            href: `${base}?tab=achievements`,
        },
        {
            label: "Streak",
            value: hero.streak_days,
            icon: (
                <Flame
                    className={`w-[22px] h-[22px] shrink-0 ${hero.streak_days > 0 ? "text-orange-400" : "text-white/25"}`}
                />
            ),
        },
    ];

    return (
        <div className="space-y-4">
            {/* ── identity: the banner is the card ── */}
            <section className="relative rounded-[var(--radius-panel)] overflow-hidden border border-white/[0.07] bg-[#0c0a09]">
                <div aria-hidden className="absolute inset-0">
                    {backdrop ? (
                        <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={backdrop} alt="" className="tp-drift w-full h-full object-cover" />
                            {/* legible on the left, art on the right, seated at the bottom */}
                            <span className="absolute inset-0 bg-gradient-to-r from-[#0c0a09]/95 from-[8%] via-[#0c0a09]/55 via-[45%] to-[#0c0a09]/25" />
                            <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0c0a09]/95 to-transparent" />
                        </>
                    ) : (
                        <span
                            className="absolute inset-0"
                            style={{ background: "radial-gradient(120% 140% at 15% 0%, color-mix(in srgb, var(--accent) 14%, transparent) 0%, transparent 60%)" }}
                        />
                    )}
                </div>

                <div className="relative flex flex-col lg:flex-row lg:items-center gap-6 p-5 md:p-8">
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

                            <p className="mt-1.5 text-[13.5px] font-semibold text-white/50">@{hero.username}</p>

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
                                        <button onClick={share} className={BTN_GHOST}>
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <LinkIcon className="w-4 h-4" />}
                                            {copied ? "Copied" : "Share"}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* rank block, floating on the art's right */}
                    <div className="shrink-0 lg:w-[300px] flex lg:flex-col items-center lg:items-end gap-4 lg:gap-3">
                        <div className="flex items-center gap-4">
                            <RankInsigniaMark icon={hero.rank_icon} color={hero.rank_color} name={hero.rank_name} size={92} />
                            <div>
                                <p className="font-display text-[9.5px] font-bold uppercase tracking-[0.18em] text-white/45">
                                    Current rank
                                </p>
                                <p
                                    className="mt-1 font-display text-[19px] font-black uppercase tracking-[0.03em] leading-none whitespace-nowrap"
                                    style={{ color: hero.rank_color || "#fff" }}
                                    title={tier ?? undefined}
                                >
                                    {hero.rank_name || "Unranked"}
                                </p>
                                <p className="mt-1.5 font-display text-[13px] font-black tabular-nums text-[var(--xp-bright)]">
                                    {hero.xp.toLocaleString()} XP
                                </p>
                            </div>
                        </div>

                        <Link
                            href={`${base}?tab=stats`}
                            className="hidden lg:inline-flex items-center justify-center gap-1.5 h-10 w-full rounded-[8px] border border-white/[0.14] bg-black/30 backdrop-blur-sm font-display text-[11px] font-bold uppercase tracking-[0.1em] text-white hover:bg-white/[0.09] hover:border-white/30 transition-colors duration-300"
                        >
                            View rank progress <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── the record strip ── */}
            <section className="rounded-[var(--radius-panel)] border border-white/[0.07] bg-[#100e0d] px-5 md:px-6 py-4 overflow-x-auto scrollbar-none">
                <div className="flex items-center gap-5 md:gap-0 md:justify-between min-w-max md:min-w-0">
                    {cells.map((cell, i) => (
                        <span key={cell.label} className="flex items-center gap-5 md:gap-6 min-w-0">
                            {i > 0 && <span aria-hidden className="hidden md:block w-px h-9 bg-white/[0.08]" />}
                            <StatCell cell={cell} />
                        </span>
                    ))}
                </div>
            </section>

            {/* ── sections ── */}
            <ProfileTabStrip username={hero.username} activeTab={activeTab} isOwnProfile={isOwnProfile} />
        </div>
    );
}
