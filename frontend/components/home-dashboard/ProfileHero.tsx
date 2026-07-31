"use client";

import { useState } from "react";
import Link from "next/link";
import {
    User as UserIcon, MapPin, Play, Pencil, Share2, Check,
    Gamepad2, Star, Clock3, Award, Users,
} from "lucide-react";
import type { DashboardData } from "@/lib/types/dashboard";
import RingMeter from "@/components/ui/RingMeter";
import ProgressBar from "@/components/ui/ProgressBar";

/** 12480 → "12.5k" — hours read as a badge, not a spreadsheet. */
function compact(n: number): string {
    if (n >= 10_000) return `${Math.round(n / 1000)}k`;
    if (n >= 1_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    return n.toLocaleString();
}

/**
 * The identity card the whole page hangs off — banner art, avatar inside
 * its XP ring, and the five numbers that say who this gamer is.
 */
export default function ProfileHero({ data }: { data: DashboardData }) {
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

    const share = () => {
        const url = `${window.location.origin}/profile/${user.username}`;
        navigator.clipboard?.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const tiles = [
        { label: "Games", value: compact(stats.games_count), icon: Gamepad2, href: "/profile/me?tab=collection" },
        { label: "Reviews", value: compact(stats.reviews_count), icon: Star, href: "/profile/me?tab=activity" },
        { label: "Hours Played", value: `${compact(stats.hours_played)}`, icon: Clock3, href: "/profile/me?tab=collection" },
        { label: "Achievements", value: compact(stats.achievements_count), icon: Award, href: "/profile/me?tab=achievements" },
        { label: "Friends", value: compact(stats.friends_count), icon: Users, href: "/friends" },
    ];

    return (
        <section className="relative rounded-[var(--radius-panel)] overflow-hidden bg-[var(--surface-1)] border border-[var(--line)]">
            {/* banner field */}
            <div aria-hidden className="absolute inset-0">
                {backdrop ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={backdrop}
                            alt=""
                            className={`w-full h-full object-cover ${user.cover_image ? "opacity-[0.32]" : "opacity-[0.18]"}`}
                        />
                        <span className="absolute inset-0 bg-gradient-to-r from-[var(--surface-1)] via-[var(--surface-1)]/85 to-[var(--surface-1)]/35" />
                        <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[var(--surface-1)] to-transparent" />
                    </>
                ) : (
                    <span
                        className="absolute inset-0"
                        style={{ background: "radial-gradient(120% 140% at 15% 0%, color-mix(in srgb, var(--accent) 16%, transparent) 0%, transparent 60%)" }}
                    />
                )}
                <span className="absolute inset-0 bg-hud-grid opacity-50" />
            </div>
            {/* The Crown — this hero owns the page */}
            <span aria-hidden className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent" />

            <div className="relative p-6 md:p-8 pb-5">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* identity */}
                    <div className="flex items-start gap-5 flex-1 min-w-0">
                        <Link href="/profile/me" className="relative shrink-0">
                            <RingMeter value={xpPercent} size={112} strokeWidth={4} glow>
                                {user.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={user.avatar_url} alt={user.display_name} className="w-[88px] h-[88px] rounded-full object-cover" />
                                ) : (
                                    <span className="w-[88px] h-[88px] rounded-full bg-[var(--surface-2)] border border-[var(--line-strong)] flex items-center justify-center">
                                        <UserIcon className="w-9 h-9 text-[var(--ink-faint)]" />
                                    </span>
                                )}
                            </RingMeter>
                            <span className="absolute bottom-1.5 right-1.5 w-[16px] h-[16px] rounded-full bg-emerald-500 ring-[3px] ring-[var(--surface-1)]" title="Online" />
                        </Link>

                        <div className="min-w-0 flex-1 pt-1">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                <h1 className="font-display text-[26px] md:text-[30px] font-black text-[var(--ink-hi)] leading-none truncate">
                                    {user.display_name || user.username}
                                </h1>
                                <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-[var(--accent)] text-white font-display text-[10px] font-bold uppercase tracking-wider tabular-nums">
                                    Level {user.level}
                                </span>
                                {user.rank_name && (
                                    <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-[var(--fill-2)] border border-[var(--line-strong)] font-display text-[10px] font-bold uppercase tracking-wider text-[var(--ink-mid)]">
                                        {user.rank_name}
                                    </span>
                                )}
                            </div>

                            {(user.location || user.tagline || user.bio) && (
                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--ink-low)]">
                                    {user.location && (
                                        <span className="inline-flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-[var(--ink-faint)]" /> {user.location}
                                        </span>
                                    )}
                                    {(user.tagline || user.bio) && (
                                        <span className="text-[var(--ink-mid)] line-clamp-1 max-w-[420px]">
                                            {user.tagline || user.bio}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* XP toward the next rank */}
                            <div className="mt-4 max-w-[420px]">
                                <ProgressBar value={xpPercent} />
                                <p className="mt-1.5 flex items-baseline justify-between gap-2 text-[11px] text-[var(--ink-low)]">
                                    <span className="tabular-nums">
                                        {nextXp
                                            ? `${user.xp.toLocaleString()} / ${nextXp.toLocaleString()} XP`
                                            : `${user.xp.toLocaleString()} XP`}
                                    </span>
                                    {nextXp && user.next_rank ? (
                                        <span className="tabular-nums text-[var(--ink-faint)] truncate">
                                            {(nextXp - user.xp).toLocaleString()} to {user.next_rank.name}
                                        </span>
                                    ) : (
                                        <span className="text-[var(--ink-faint)]">Max rank</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* actions */}
                    <div className="flex flex-wrap items-center gap-2.5 lg:pt-1 shrink-0">
                        <Link
                            href={firstPlaying ? `/games/${firstPlaying.slug}` : "/games"}
                            prefetch={false}
                            className="inline-flex items-center gap-2 px-5 h-11 rounded-[var(--radius-card)] bg-[var(--accent)] text-white font-display text-[12px] font-bold uppercase tracking-wider hover:bg-[var(--accent-hover)] transition-colors duration-300 shadow-[var(--glow-accent)]"
                        >
                            <Play className="w-4 h-4 fill-current" />
                            {firstPlaying ? "Continue Playing" : "Find Your First Game"}
                        </Link>
                        <Link
                            href="/settings"
                            className="inline-flex items-center gap-2 px-4 h-11 rounded-[var(--radius-card)] bg-[var(--fill-2)] border border-[var(--line-strong)] text-[var(--ink-hi)] font-display text-[12px] font-bold uppercase tracking-wider hover:bg-[var(--fill-3)] transition-colors duration-300"
                        >
                            <Pencil className="w-3.5 h-3.5" /> Edit Profile
                        </Link>
                        <button
                            onClick={share}
                            title="Copy profile link"
                            className="inline-flex items-center gap-2 px-4 h-11 rounded-[var(--radius-card)] bg-[var(--fill-2)] border border-[var(--line-strong)] text-[var(--ink-hi)] font-display text-[12px] font-bold uppercase tracking-wider hover:bg-[var(--fill-3)] transition-colors duration-300"
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

            {/* stat deck — Command Numerals on the hero's bottom edge */}
            <div className="relative border-t border-[var(--line)] grid grid-cols-5 divide-x divide-[var(--line)] bg-[var(--surface-1)]/60 backdrop-blur-[2px]">
                {tiles.map((t) => (
                    <Link
                        key={t.label}
                        href={t.href}
                        title={t.label}
                        className="group min-w-0 px-2 py-3.5 text-center hover:bg-[var(--fill-1)] transition-colors duration-300"
                    >
                        <t.icon className="w-4 h-4 mx-auto text-[var(--ink-faint)] group-hover:text-[var(--accent)] transition-colors duration-300" />
                        <p className="mt-1.5 font-display text-[19px] md:text-[22px] font-bold tabular-nums text-[var(--ink-hi)] leading-none">
                            {t.value}
                        </p>
                        <p className="mt-1.5 text-[9px] uppercase tracking-wider text-[var(--ink-faint)] leading-tight truncate">
                            {t.label}
                        </p>
                    </Link>
                ))}
            </div>
        </section>
    );
}
