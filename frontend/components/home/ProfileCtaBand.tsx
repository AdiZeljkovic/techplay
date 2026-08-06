"use client";

import Link from "next/link";
import useSWR from "swr";
import { Gamepad2, ListChecks, Award, Users, Check, Trophy } from "lucide-react";
import axios from "@/lib/axios";
import RingMeter from "@/components/ui/RingMeter";
import ProgressBar from "@/components/ui/ProgressBar";
import Avatar from "@/components/ui/Avatar";
import { levelForXp } from "@/lib/level";

const FEATURES = [
    { icon: Gamepad2, title: "Track Games", sub: "Log and organize your collection" },
    { icon: ListChecks, title: "Build Backlog", sub: "Save games and plan your next play" },
    { icon: Award, title: "Earn Achievements", sub: "Unlock badges and show your progress" },
    { icon: Users, title: "Join Community", sub: "Discuss, review and connect with players" },
];

interface LeaderEntry { username: string; name: string; avatar_url: string | null; value: number }

interface ProfilePayload {
    user: { display_name?: string; username: string; avatar_url: string | null; rank?: { name: string } | null };
    stats: { level: number; xp: number; games_count: number; achievements_count: number; completed_count: number };
    next_rank: { name: string; min_xp: number } | null;
    showcase?: { slug: string; name: string; cover_url: string | null }[];
    playing_now?: { slug: string; name: string; cover_url: string | null }[];
}

const leaderFetcher = () =>
    axios.get("/leaderboard", { params: { type: "xp", period: "all" } }).then((r) => (r.data?.data ?? r.data ?? []) as LeaderEntry[]);

/** /users/{username} returns the payload unwrapped (no {success,data} envelope). */
const profileFetcher = (url: string) => axios.get(url).then((r) => (r.data?.data ?? r.data) as ProfilePayload);

/**
 * Closing conversion band. The right side is a live member card — the actual
 * product on display rather than a description of it.
 */
export default function ProfileCtaBand() {
    const { data: leaders } = useSWR("cta-leader", leaderFetcher, { dedupingInterval: 600_000, revalidateOnFocus: false });
    const champion = leaders?.[0];

    const { data: profile } = useSWR(
        champion ? `/users/${champion.username}` : null,
        profileFetcher,
        { dedupingInterval: 600_000, revalidateOnFocus: false }
    );

    const covers = (profile?.showcase?.length ? profile.showcase : profile?.playing_now ?? [])
        .filter((g) => g.cover_url)
        .slice(0, 4);

    const xp = profile?.stats.xp ?? champion?.value ?? 0;
    const nextXp = profile?.next_rank?.min_xp ?? null;
    const xpPercent = nextXp ? Math.min(100, Math.round((xp / nextXp) * 100)) : 100;
    const level = profile?.stats.level ?? levelForXp(xp);

    return (
        <section className="relative rounded-[var(--radius-panel)] bg-[var(--surface-1)] border border-[var(--line)] overflow-hidden">
            {/* Crown + ambient depth */}
            <span aria-hidden className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent" />
            <span aria-hidden className="absolute inset-0 bg-hud-grid opacity-60 pointer-events-none" />
            <span
                aria-hidden
                className="pointer-events-none absolute -right-24 -top-32 w-[560px] h-[560px] rounded-full opacity-[0.10]"
                style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
            />

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 p-6 md:p-10">
                {/* ── Pitch ── */}
                <div className="flex flex-col justify-center">
                    <p className="flex items-center gap-2.5 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-3">
                        <span className="w-1 h-4 rounded-full bg-[var(--accent)]" />
                        Build your gaming identity
                    </p>

                    <h2 className="font-display text-[28px] md:text-[34px] font-black text-[var(--ink-hi)] leading-[1.08]">
                        Your games. Your profile.
                        <br />
                        <span className="text-[var(--accent)]">Your community.</span>
                    </h2>

                    <p className="mt-4 text-[14px] text-[var(--ink-mid)] max-w-[440px] leading-relaxed">
                        Create a free TechPlay profile to track everything you play, earn your rank, and join a community that actually cares about games.
                    </p>

                    <ul className="mt-7 space-y-3">
                        {FEATURES.map((f) => (
                            <li key={f.title} className="flex items-center gap-3">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center justify-center">
                                    <Check className="w-3 h-3 text-[var(--accent)]" strokeWidth={3} />
                                </span>
                                <span className="min-w-0">
                                    <span className="font-display text-[13px] font-bold text-[var(--ink-hi)]">{f.title}</span>
                                    <span className="text-[13px] text-[var(--ink-low)]"> — {f.sub}</span>
                                </span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 px-7 h-12 rounded-[var(--radius-card)] bg-[var(--accent)] text-white font-display text-[13px] font-bold uppercase tracking-wider hover:bg-[var(--accent-hover)] transition-colors duration-300 shadow-[var(--glow-accent)]"
                        >
                            Create Your Profile
                        </Link>
                        <span className="text-[12px] text-[var(--ink-faint)]">
                            Free forever ·{" "}
                            <Link href="/login" className="text-[var(--ink-mid)] hover:text-[var(--accent)] font-semibold transition-colors">
                                Already a member?
                            </Link>
                        </span>
                    </div>
                </div>

                {/* ── Live member card: the product on display ── */}
                <div className="relative">
                    <div className="relative rounded-[var(--radius-panel)] bg-[var(--surface-2)] border border-[var(--line-strong)] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
                        {/* banner: the champion's own game art, or a HUD field */}
                        <div className="relative h-[92px] overflow-hidden">
                            {covers[0]?.cover_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={covers[0].cover_url} alt="" aria-hidden className="w-full h-full object-cover opacity-40" />
                            ) : (
                                <span aria-hidden className="block w-full h-full bg-hud-grid" style={{ background: "radial-gradient(120% 140% at 20% 0%, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 65%)" }} />
                            )}
                            <span className="absolute inset-0 bg-gradient-to-t from-[var(--surface-2)] via-[var(--surface-2)]/70 to-transparent" />
                            <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-[var(--surface-0)]/80 backdrop-blur-md border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] text-[9px] font-bold uppercase tracking-widest text-[var(--accent)]">
                                <Trophy className="w-3 h-3" /> #1 Gamer
                            </span>
                        </div>

                        <div className="px-5 pb-5 -mt-9">
                            {/* avatar inside its XP ring */}
                            <div className="flex items-end gap-3.5">
                                <RingMeter value={xpPercent} size={76} strokeWidth={3} glow className="shrink-0">
                                    <Avatar src={profile?.user.avatar_url ?? champion?.avatar_url ?? null} alt={champion?.name ?? "Top gamer"} size="lg" />
                                </RingMeter>
                                <div className="min-w-0 pb-1">
                                    <p className="font-display text-[17px] font-bold text-[var(--ink-hi)] truncate">
                                        {profile?.user.display_name || champion?.name || champion?.username || "TechPlay member"}
                                    </p>
                                    <p className="text-[11px] text-[var(--ink-low)]">
                                        Level {level}
                                        {profile?.user.rank?.name && <> <span className="text-[var(--ink-faint)]">·</span> {profile.user.rank.name}</>}
                                    </p>
                                </div>
                            </div>

                            {/* XP progress */}
                            <div className="mt-4">
                                <ProgressBar value={xpPercent} />
                                <p className="mt-1.5 text-right text-[10px] tabular-nums text-[var(--ink-faint)]">
                                    {nextXp ? `${xp.toLocaleString()} / ${nextXp.toLocaleString()} XP` : `${xp.toLocaleString()} XP`}
                                </p>
                            </div>

                            {/* stat trio */}
                            <div className="mt-4 grid grid-cols-3 rounded-[var(--radius-card)] bg-[var(--fill-1)] border border-[var(--line)] divide-x divide-[var(--line)]">
                                {[
                                    { value: (profile?.stats.games_count ?? 0).toLocaleString(), label: "Games" },
                                    { value: (profile?.stats.achievements_count ?? 0).toLocaleString(), label: "Achievements" },
                                    { value: xp.toLocaleString(), label: "XP earned" },
                                ].map((s) => (
                                    <div key={s.label} className="px-3 py-3 text-center">
                                        <p className="font-display text-[18px] font-bold tabular-nums text-[var(--ink-hi)] leading-none">{s.value}</p>
                                        <p className="mt-1.5 text-[9px] uppercase tracking-wider text-[var(--ink-faint)]">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* their shelf */}
                            {covers.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--ink-faint)] mb-2">On the shelf</p>
                                    <div className="grid grid-cols-4 gap-2">
                                        {covers.map((c) => (
                                            <span key={c.slug} title={c.name} className="relative aspect-[4/3] rounded-[var(--radius-inner)] overflow-hidden bg-[var(--fill-1)] border border-[var(--line)]">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={c.cover_url!} alt={c.name} loading="lazy" className="w-full h-full object-cover" />
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Link
                                href={champion ? `/profile/${champion.username}` : "/leaderboard"}
                                className="mt-4 flex items-center justify-center h-10 rounded-[var(--radius-card)] bg-[var(--fill-2)] border border-[var(--line-strong)] font-display text-[11px] font-bold uppercase tracking-wider text-[var(--ink-hi)] hover:bg-[var(--fill-3)] transition-colors duration-300"
                            >
                                View this profile
                            </Link>
                        </div>
                    </div>

                    <p className="mt-3 text-center text-[11px] text-[var(--ink-faint)]">
                        This is a real TechPlay profile. Yours starts empty — and fills up fast.
                    </p>
                </div>
            </div>
        </section>
    );
}
