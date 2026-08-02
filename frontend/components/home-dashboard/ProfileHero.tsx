"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    User as UserIcon, MapPin, Play, Pencil, Share2, Check, BadgeCheck, MoreHorizontal,
    Gamepad2, Star, Clock3, Award, Users, UserPlus, Clock, MessageSquare, Sparkles, ShieldCheck, LinkIcon, GitCompare,
} from "lucide-react";
import PlatformIcon from "@/components/games/PlatformIcon";
import type { HeroModel } from "@/lib/hero";
import type { ProfileTab } from "@/lib/profileTabs";
import type { FriendStatus } from "@/lib/types/profile";
import { useCountUp } from "@/hooks/useCountUp";
import ProfileTabStrip from "./ProfileTabStrip";
import { LevelCrest, RankEmblem, XpRail } from "./RankInsignia";

/** 12480 → "12.5K" — hours read as a badge, not a spreadsheet. */
function compact(n: number): string {
    if (n >= 10_000) return `${Math.round(n / 1000)}K`;
    if (n >= 1_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
    return n.toLocaleString();
}

/** Gamertag key → the label PlatformIcon draws a brand mark for. */
const PLATFORM_LABEL: Record<string, string> = {
    steam: "STEAM",
    psn: "PS",
    xbox: "XBOX",
    epic: "EPIC",
    discord: "DISCORD",
    pc: "PC",
    switch: "SWITCH",
};

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
        "group relative flex flex-col justify-center gap-2 min-w-0 px-3.5 py-4 rounded-[var(--radius-card)] border border-[var(--line-strong)] bg-[color-mix(in_srgb,var(--surface-0)_80%,transparent)] backdrop-blur-md overflow-hidden transition-colors duration-300";

    const body = (
        <>
            {href && (
                <span
                    aria-hidden
                    className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--accent)] scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-[var(--ease-hud)]"
                />
            )}
            <span className="flex items-center gap-1.5 min-w-0">
                <Icon className="w-3.5 h-3.5 shrink-0 text-[var(--ink-faint)] group-hover:text-[var(--accent)] transition-colors duration-300" />
                <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--ink-faint)] truncate">
                    {label}
                </span>
            </span>
            <span className="font-display text-[26px] font-black tabular-nums leading-none text-[var(--ink-hi)] group-hover:text-[var(--accent)] transition-colors duration-300">
                {compact(animated)}
            </span>
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
    counts?: Partial<Record<ProfileTab, number>>;
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
    counts,
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
    const xpPercent = nextXp ? Math.min(100, Math.round((hero.xp / nextXp) * 100)) : 100;

    const fillPercent = useCountUp(xpPercent, 1200);
    const animatedXp = useCountUp(hero.xp, 1200);

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
    const platforms = hero.platforms.filter((p) => PLATFORM_LABEL[p]).slice(0, 5);

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
                        {/* portrait: a lit ring, an edit affordance, a presence dot */}
                        <div className="relative shrink-0">
                            <Link href={base} className="group/av block">
                                <span
                                    className="block w-[112px] h-[112px] md:w-[132px] md:h-[132px] rounded-full p-[3px]"
                                    style={{
                                        background: "linear-gradient(150deg, var(--accent-bright) 0%, var(--accent) 55%, var(--accent-hover) 100%)",
                                        boxShadow: "0 0 26px color-mix(in srgb, var(--accent) 45%, transparent)",
                                    }}
                                >
                                    <span className="block w-full h-full rounded-full overflow-hidden bg-[var(--surface-2)] border-[3px] border-[var(--surface-1)]">
                                        {hero.avatar_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={hero.avatar_url}
                                                alt={hero.display_name}
                                                className="w-full h-full object-cover transition-transform duration-500 ease-[var(--ease-hud)] group-hover/av:scale-[1.05]"
                                            />
                                        ) : (
                                            <span className="w-full h-full flex items-center justify-center">
                                                <UserIcon className="w-10 h-10 text-[var(--ink-faint)]" />
                                            </span>
                                        )}
                                    </span>
                                </span>
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

                            {online && (
                                <span className="absolute bottom-1.5 right-1.5 w-[18px] h-[18px]" title="Online">
                                    <span aria-hidden className="tp-pulse-ring absolute inset-0 rounded-full bg-emerald-500" />
                                    <span className="relative block w-full h-full rounded-full bg-emerald-500 ring-[3px] ring-[var(--surface-1)]" />
                                </span>
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            {/* name + verification */}
                            <h1 className="flex items-center gap-2 font-display text-[26px] md:text-[34px] font-black text-[var(--ink-hi)] leading-none min-w-0">
                                <span className="truncate">{hero.display_name}</span>
                                {hero.verified && (
                                    <BadgeCheck
                                        className="w-5 h-5 md:w-6 md:h-6 shrink-0 text-[#3b9dff]"
                                        aria-label="Verified TechPlay staff"
                                    />
                                )}
                            </h1>

                            {/* handle · tagline */}
                            <p className="mt-1.5 flex items-center gap-2 text-[13px] text-[var(--ink-low)] min-w-0">
                                <span className="font-semibold text-[var(--ink-mid)] shrink-0">@{hero.username}</span>
                                {(hero.tagline || hero.bio) && (
                                    <>
                                        <span aria-hidden className="text-[var(--ink-faint)]">·</span>
                                        <span className="truncate">{hero.tagline || hero.bio}</span>
                                    </>
                                )}
                            </p>

                            {/* where you are, what you play on, how you play */}
                            {(hero.location || platforms.length > 0 || tags.length > 0) && (
                                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                                    {hero.location && (
                                        <span className="inline-flex items-center gap-1.5 h-[24px] px-2.5 rounded-full bg-[var(--fill-2)] border border-[var(--line)] text-[11px] font-semibold text-[var(--ink-mid)]">
                                            <MapPin className="w-3 h-3 text-[var(--ink-faint)]" /> {hero.location}
                                        </span>
                                    )}

                                    {platforms.length > 0 && (
                                        <span className="inline-flex items-center gap-2 h-[24px] px-2.5 rounded-full bg-[var(--fill-2)] border border-[var(--line)]">
                                            {platforms.map((p) => (
                                                <span key={p} title={p} className="text-[var(--ink-low)]">
                                                    <PlatformIcon label={PLATFORM_LABEL[p]} className="w-[15px] h-[15px]" />
                                                </span>
                                            ))}
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

                            {/* ── progression: crest outside, gauge and rank metal inside ── */}
                            <div className="mt-4 flex items-center gap-3.5">
                                <LevelCrest level={hero.level} size={64} />

                                <div className="flex items-center gap-4 min-w-0 flex-1 max-w-[520px] pl-4 pr-3 py-2.5 rounded-[var(--radius-card)] border border-[var(--line-strong)] bg-[color-mix(in_srgb,var(--surface-0)_72%,transparent)] backdrop-blur-md">
                                    <div className="min-w-0 flex-1">
                                        <p className="flex items-baseline gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
                                            <span>Level</span>
                                            {nextXp && hero.next_rank ? (
                                                <>
                                                    <span aria-hidden>·</span>
                                                    <span className="tabular-nums text-[var(--ink-mid)] normal-case tracking-[0.06em]">
                                                        <span className="font-display text-[12px] font-bold text-[var(--ink-hi)]">
                                                            {(nextXp - hero.xp).toLocaleString()}
                                                        </span>{" "}
                                                        XP to{" "}
                                                        <span
                                                            className="font-bold"
                                                            style={{ color: hero.next_rank.color || "var(--ink-hi)" }}
                                                        >
                                                            {hero.next_rank.name}
                                                        </span>
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <span aria-hidden>·</span>
                                                    <span className="normal-case tracking-[0.06em] text-[var(--ink-mid)]">Max rank reached</span>
                                                </>
                                            )}
                                        </p>

                                        <XpRail percent={fillPercent} className="mt-2" />

                                        <p className="mt-1.5 text-right text-[10px] font-semibold tabular-nums text-[var(--ink-faint)]">
                                            <span className="text-[var(--ink-mid)]">{animatedXp.toLocaleString()}</span>
                                            {nextXp ? ` / ${nextXp.toLocaleString()} XP` : " XP"}
                                        </p>
                                    </div>

                                    {hero.rank_name && (
                                        <span className="shrink-0 hidden sm:block">
                                            <RankEmblem name={hero.rank_name} color={hero.rank_color} />
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* ── actions ── */}
                            <div className="mt-4 flex flex-wrap items-center gap-2">
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

                    {/* ── stat cards, floating on the art ── */}
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 shrink-0 xl:w-[600px]">
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
