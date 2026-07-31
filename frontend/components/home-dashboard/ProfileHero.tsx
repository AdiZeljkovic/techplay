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

/** 12480 → "12.5k" — hours read as a badge, not a spreadsheet. */
function compact(n: number): string {
    if (n >= 10_000) return `${Math.round(n / 1000)}k`;
    if (n >= 1_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    return n.toLocaleString();
}

/** One number in the hero deck — counts up on mount, ignites on hover. */
function StatTile({
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
            className="group relative min-w-0 px-2 py-4 text-center overflow-hidden hover:bg-[var(--fill-1)] transition-colors duration-300"
        >
            {/* accent rail draws across the tile on hover */}
            <span
                aria-hidden
                className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--accent)] scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-[var(--ease-hud)]"
            />
            <Icon className="w-4 h-4 mx-auto text-[var(--ink-faint)] group-hover:text-[var(--accent)] transition-colors duration-300" />
            <p className="mt-2 font-display text-[20px] md:text-[24px] font-bold tabular-nums text-[var(--ink-hi)] leading-none group-hover:text-[var(--accent)] transition-colors duration-300">
                {compact(animated)}
            </p>
            <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--ink-faint)] leading-tight truncate">
                {label}
            </p>
        </Link>
    );
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

    // the ring draws itself and the bar fills in step with it
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

    const tags = (user.playstyle_tags ?? []).slice(0, 4);

    return (
        <section className="relative rounded-[var(--radius-panel)] overflow-hidden bg-[var(--surface-1)] border border-[var(--line)]">
            {/* ── banner field ── */}
            <div aria-hidden className="absolute inset-0 overflow-hidden">
                {backdrop ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={backdrop}
                            alt=""
                            className={`tp-drift w-full h-full object-cover ${user.cover_image ? "opacity-[0.45]" : "opacity-[0.22]"}`}
                        />
                        {/* readability: dark from the left, floor under the text */}
                        <span className="absolute inset-0 bg-gradient-to-r from-[var(--surface-1)] via-[color-mix(in_srgb,var(--surface-1)_80%,transparent)] to-transparent" />
                        <span className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-[var(--surface-1)] via-[color-mix(in_srgb,var(--surface-1)_60%,transparent)] to-transparent" />
                        {/* vignette so the crop never ends abruptly */}
                        <span
                            className="absolute inset-0"
                            style={{ background: "radial-gradient(120% 100% at 50% 40%, transparent 30%, color-mix(in srgb, var(--surface-0) 70%, transparent) 100%)" }}
                        />
                    </>
                ) : (
                    <span
                        className="absolute inset-0"
                        style={{ background: "radial-gradient(120% 140% at 15% 0%, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 60%)" }}
                    />
                )}
                <span className="absolute inset-0 bg-hud-grid opacity-40" />
                {/* accent bloom behind the avatar */}
                <span
                    className="absolute -left-20 -top-24 w-[420px] h-[420px] rounded-full opacity-[0.16]"
                    style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
                />
                {/* one-shot power-on sweep */}
                <span className="tp-sweep absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            </div>

            {/* The Crown — this hero owns the page */}
            <span aria-hidden className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_70%,transparent)] to-transparent" />

            <div className="relative p-6 md:p-8 pb-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* ── identity ── */}
                    <div className="flex items-center gap-5 flex-1 min-w-0">
                        <Link href="/profile/me" className="relative shrink-0 group/av">
                            <RingMeter value={ringValue} size={118} strokeWidth={4} glow>
                                {user.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={user.avatar_url}
                                        alt={user.display_name}
                                        className="w-[92px] h-[92px] rounded-full object-cover transition-transform duration-500 ease-[var(--ease-hud)] group-hover/av:scale-[1.04]"
                                    />
                                ) : (
                                    <span className="w-[92px] h-[92px] rounded-full bg-[var(--surface-2)] border border-[var(--line-strong)] flex items-center justify-center">
                                        <UserIcon className="w-9 h-9 text-[var(--ink-faint)]" />
                                    </span>
                                )}
                            </RingMeter>
                            {/* live presence, with a halo */}
                            <span className="absolute bottom-2 right-2 w-[16px] h-[16px]" title="Online">
                                <span aria-hidden className="tp-pulse-ring absolute inset-0 rounded-full bg-emerald-500" />
                                <span className="relative block w-full h-full rounded-full bg-emerald-500 ring-[3px] ring-[var(--surface-1)]" />
                            </span>
                        </Link>

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                <h1 className="font-display text-[26px] md:text-[32px] font-black text-[var(--ink-hi)] leading-none truncate">
                                    {user.display_name || user.username}
                                </h1>
                                <span className="inline-flex items-center h-[26px] px-3 rounded-full bg-[var(--accent)] text-white font-display text-[10px] font-bold uppercase tracking-[0.1em] tabular-nums shadow-[var(--glow-accent)]">
                                    Level {user.level}
                                </span>
                                {user.rank_name && (
                                    <span className="inline-flex items-center h-[26px] px-3 rounded-full bg-[var(--fill-2)] border border-[var(--line-strong)] font-display text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--ink-mid)]">
                                        {user.rank_name}
                                    </span>
                                )}
                            </div>

                            {(user.location || user.tagline || user.bio) && (
                                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
                                    {user.location && (
                                        <span className="inline-flex items-center gap-1 text-[var(--ink-low)]">
                                            <MapPin className="w-3 h-3 text-[var(--ink-faint)]" /> {user.location}
                                        </span>
                                    )}
                                    {(user.tagline || user.bio) && (
                                        <span className="text-[var(--ink-mid)] line-clamp-1 max-w-[440px]">
                                            {user.tagline || user.bio}
                                        </span>
                                    )}
                                </div>
                            )}

                            {tags.length > 0 && (
                                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                                    {tags.map((t) => (
                                        <span
                                            key={t}
                                            className="inline-flex items-center h-[22px] px-2.5 rounded-full bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]"
                                        >
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* XP toward the next rank — fills in step with the ring */}
                            <div className="mt-4 max-w-[440px]">
                                <div className="h-[7px] rounded-full bg-[var(--track)] overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-bright)]"
                                        style={{
                                            width: `${ringValue}%`,
                                            boxShadow: "0 0 12px color-mix(in srgb, var(--accent) 45%, transparent)",
                                        }}
                                    />
                                </div>
                                <p className="mt-2 flex items-baseline justify-between gap-2 text-[11px] text-[var(--ink-low)]">
                                    <span className="tabular-nums font-display font-bold text-[var(--ink-mid)]">
                                        {animatedXp.toLocaleString()}
                                        {nextXp && <span className="text-[var(--ink-faint)] font-normal"> / {nextXp.toLocaleString()} XP</span>}
                                        {!nextXp && <span className="text-[var(--ink-faint)] font-normal"> XP</span>}
                                    </span>
                                    {nextXp && user.next_rank ? (
                                        <span className="tabular-nums text-[var(--ink-faint)] truncate">
                                            {(nextXp - user.xp).toLocaleString()} to <span className="text-[var(--ink-low)]">{user.next_rank.name}</span>
                                        </span>
                                    ) : (
                                        <span className="text-[var(--ink-faint)]">Max rank</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── actions ── */}
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <Link
                            href={firstPlaying ? `/games/${firstPlaying.slug}` : "/games"}
                            prefetch={false}
                            className="group/cta relative inline-flex items-center gap-2 px-6 h-12 rounded-[var(--radius-card)] bg-[var(--accent)] text-white font-display text-[12px] font-bold uppercase tracking-wider overflow-hidden hover:bg-[var(--accent-hover)] transition-colors duration-300 shadow-[var(--glow-accent)]"
                        >
                            {/* shine travels across on hover */}
                            <span
                                aria-hidden
                                className="absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-18deg] bg-white/25 -translate-x-full group-hover/cta:translate-x-[420%] transition-transform duration-700 ease-[var(--ease-hud)]"
                            />
                            <Play className="relative w-4 h-4 fill-current" />
                            <span className="relative">{firstPlaying ? "Continue Playing" : "Find Your First Game"}</span>
                        </Link>
                        <Link
                            href="/settings"
                            className="inline-flex items-center gap-2 px-4 h-12 rounded-[var(--radius-card)] bg-[var(--fill-2)] border border-[var(--line-strong)] text-[var(--ink-hi)] font-display text-[12px] font-bold uppercase tracking-wider hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] hover:bg-[var(--fill-3)] transition-colors duration-300"
                        >
                            <Pencil className="w-3.5 h-3.5" /> Edit Profile
                        </Link>
                        <button
                            onClick={share}
                            title="Copy profile link"
                            className="inline-flex items-center gap-2 px-4 h-12 rounded-[var(--radius-card)] bg-[var(--fill-2)] border border-[var(--line-strong)] text-[var(--ink-hi)] font-display text-[12px] font-bold uppercase tracking-wider hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] hover:bg-[var(--fill-3)] transition-colors duration-300"
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

            {/* ── stat deck: Command Numerals on the hero's bottom edge ── */}
            <div className="relative border-t border-[var(--line)] grid grid-cols-5 divide-x divide-[var(--line)] bg-[color-mix(in_srgb,var(--surface-0)_55%,transparent)] backdrop-blur-sm">
                {tiles.map((t) => (
                    <StatTile key={t.label} icon={t.icon} value={t.value} label={t.label} href={t.href} />
                ))}
            </div>
        </section>
    );
}
