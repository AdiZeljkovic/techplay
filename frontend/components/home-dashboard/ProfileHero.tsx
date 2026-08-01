"use client";

import { useState } from "react";
import Link from "next/link";
import {
    User as UserIcon, MapPin, Play, Pencil, Share2, Check,
    Gamepad2, Star, Clock3, Award, Users,
} from "lucide-react";
import type { DashboardData } from "@/lib/types/dashboard";
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
    href: string;
}) {
    const animated = useCountUp(value, 1100);

    return (
        <Link
            href={href}
            title={label}
            className="group relative flex flex-col items-center justify-center gap-1.5 min-w-0 px-2 py-4 rounded-[var(--radius-card)] border border-[var(--line-strong)] bg-[color-mix(in_srgb,var(--surface-0)_78%,transparent)] backdrop-blur-md overflow-hidden hover:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] hover:bg-[color-mix(in_srgb,var(--surface-0)_88%,transparent)] transition-colors duration-300"
        >
            {/* accent rail draws across the card on hover */}
            <span
                aria-hidden
                className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--accent)] scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-[var(--ease-hud)]"
            />
            <Icon className="w-4 h-4 text-[var(--ink-faint)] group-hover:text-[var(--accent)] transition-colors duration-300" />
            <p className="font-display text-[22px] font-bold tabular-nums text-[var(--ink-hi)] leading-none group-hover:text-[var(--accent)] transition-colors duration-300">
                {compact(animated)}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--ink-faint)] leading-tight truncate max-w-full">
                {label}
            </p>
        </Link>
    );
}

/**
 * The identity band the whole page hangs off — banner art on the right,
 * identity on the left, stat cards floating between them, tabs beneath.
 */
export default function ProfileHero({ data, activeTab }: { data: DashboardData; activeTab?: string }) {
    const { user, stats, playing_now } = data;
    const [copied, setCopied] = useState(false);

    const firstPlaying = playing_now[0];
    const backdrop =
        user.cover_image ??
        firstPlaying?.background_image ??
        data.favorites[0]?.background_image ??
        null;

    const nextXp = user.next_rank?.min_xp ?? null;
    const xpPercent = nextXp ? Math.min(100, Math.round((user.xp / nextXp) * 100)) : 100;

    // the ring draws itself and the inline bar fills in step with it
    const ringValue = useCountUp(xpPercent, 1200);
    const animatedXp = useCountUp(user.xp, 1200);

    const share = () => {
        const url = `${window.location.origin}/profile/${user.username}`;
        navigator.clipboard?.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const tiles = [
        { label: "Games", value: stats.games_count, icon: Gamepad2, href: "/profile/me?tab=collection" },
        { label: "Reviews", value: stats.reviews_count, icon: Star, href: "/profile/me?tab=activity" },
        { label: "Hours Played", value: stats.hours_played, icon: Clock3, href: "/profile/me?tab=collection" },
        { label: "Achievements", value: stats.achievements_count, icon: Award, href: "/profile/me?tab=achievements" },
        { label: "Friends", value: stats.friends_count, icon: Users, href: "/friends" },
    ];

    const tags = (user.playstyle_tags ?? []).slice(0, 3);

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
                            className={`tp-drift w-full h-full object-cover ${user.cover_image ? "opacity-95" : "opacity-60"}`}
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
                        <Link href="/profile/me" className="relative shrink-0 group/av">
                            <RingMeter value={ringValue} size={124} strokeWidth={3} glow>
                                {user.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={user.avatar_url}
                                        alt={user.display_name}
                                        className="w-[100px] h-[100px] rounded-full object-cover transition-transform duration-500 ease-[var(--ease-hud)] group-hover/av:scale-[1.04]"
                                    />
                                ) : (
                                    <span className="w-[100px] h-[100px] rounded-full bg-[var(--surface-2)] border border-[var(--line-strong)] flex items-center justify-center">
                                        <UserIcon className="w-10 h-10 text-[var(--ink-faint)]" />
                                    </span>
                                )}
                            </RingMeter>
                            <span className="absolute bottom-2 right-2 w-[16px] h-[16px]" title="Online">
                                <span aria-hidden className="tp-pulse-ring absolute inset-0 rounded-full bg-emerald-500" />
                                <span className="relative block w-full h-full rounded-full bg-emerald-500 ring-[3px] ring-[var(--surface-1)]" />
                            </span>
                        </Link>

                        <div className="min-w-0 flex-1">
                            <h1 className="font-display text-[24px] md:text-[30px] font-black text-[var(--ink-hi)] leading-none truncate">
                                {user.display_name || user.username}
                            </h1>

                            {/* ── the insignia block: crest · rank metal · segmented XP gauge ── */}
                            <div className="mt-3 flex items-center gap-3.5">
                                <LevelCrest level={user.level} size={62} />

                                <div className="min-w-0 flex-1 max-w-[420px]">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        {user.rank_name && <RankEmblem name={user.rank_name} color={user.rank_color} />}
                                        {nextXp && user.next_rank && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider tabular-nums text-[var(--ink-faint)] whitespace-nowrap">
                                                {(nextXp - user.xp).toLocaleString()} XP to{" "}
                                                <span style={{ color: user.next_rank.color || "var(--ink-low)" }}>
                                                    {user.next_rank.name}
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
                            {(user.location || tags.length > 0) && (
                                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px]">
                                    {user.location && (
                                        <span className="inline-flex items-center gap-1 text-[var(--ink-low)]">
                                            <MapPin className="w-3 h-3 text-[var(--ink-faint)]" /> {user.location}
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

                            {(user.tagline || user.bio) && (
                                <p className="mt-2 text-[12px] text-[var(--ink-mid)] line-clamp-1 max-w-[520px]">
                                    {user.tagline || user.bio}
                                </p>
                            )}

                            {/* actions live with the identity, compact like a profile page */}
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <Link
                                    href={firstPlaying ? `/games/${firstPlaying.slug}` : "/games"}
                                    prefetch={false}
                                    className="group/cta relative inline-flex items-center gap-2 px-5 h-10 rounded-[var(--radius-card)] bg-[var(--accent)] text-white font-display text-[11px] font-bold uppercase tracking-wider overflow-hidden hover:bg-[var(--accent-hover)] transition-colors duration-300 shadow-[var(--glow-accent)]"
                                >
                                    <span
                                        aria-hidden
                                        className="absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-18deg] bg-white/25 -translate-x-full group-hover/cta:translate-x-[420%] transition-transform duration-700 ease-[var(--ease-hud)]"
                                    />
                                    <Play className="relative w-3.5 h-3.5 fill-current" />
                                    <span className="relative">{firstPlaying ? "Continue Playing" : "Find Your First Game"}</span>
                                </Link>
                                <Link
                                    href="/settings"
                                    className="inline-flex items-center gap-2 px-4 h-10 rounded-[var(--radius-card)] bg-[var(--fill-2)] border border-[var(--line-strong)] text-[var(--ink-hi)] font-display text-[11px] font-bold uppercase tracking-wider hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] hover:bg-[var(--fill-3)] transition-colors duration-300"
                                >
                                    <Pencil className="w-3.5 h-3.5" /> Edit Profile
                                </Link>
                                <button
                                    onClick={share}
                                    title="Copy profile link"
                                    className="inline-flex items-center gap-2 px-4 h-10 rounded-[var(--radius-card)] bg-[var(--fill-2)] border border-[var(--line-strong)] text-[var(--ink-hi)] font-display text-[11px] font-bold uppercase tracking-wider hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] hover:bg-[var(--fill-3)] transition-colors duration-300"
                                >
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

            <ProfileTabStrip activeTab={activeTab} />
        </section>
    );
}
