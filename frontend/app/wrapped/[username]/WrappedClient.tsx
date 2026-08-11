"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Sparkles, Share2, Download, Check, Gamepad2, Trophy, Clock3, PenLine, Star, Flame, TrendingUp, TrendingDown, Users, Shield, MessageSquare, BarChart3, Link2, Award } from "lucide-react";
import Panel from "@/components/ui/Panel";
import { useCountUp } from "@/hooks/useCountUp";

const STAT_ICONS: Record<string, typeof Gamepad2> = {
    games_played: Gamepad2,
    games_completed: Trophy,
    hours: Clock3,
    reviews: PenLine,
    achievements: Star,
    streak: Flame,
};

const STAT_TINTS: Record<string, string> = {
    games_played: "#60a5fa",
    games_completed: "var(--accent)",
    hours: "#22d3ee",
    reviews: "#a855f7",
    achievements: "#f0b429",
    streak: "#ef4444",
};

/** The DNA wheel palette — wide enough that seven genres stay separable. */
const WHEEL = ["#f97316", "#ef4444", "#a78bfa", "#22d3ee", "#38bdf8", "#34d399", "#eab308"];

const MOMENT_ICONS: Record<string, typeof Trophy> = {
    most_played: Gamepad2,
    genre: BarChart3,
    achievement: Award,
    session: Clock3,
    review: Star,
};

const COMMUNITY_ICONS: Record<string, typeof Users> = {
    friends: Users,
    comments: MessageSquare,
    posts: PenLine,
};

interface StatRow {
    key: string;
    label: string;
    value: number;
    previous: number;
    delta_percent: number | null;
}

export interface WrappedPayload {
    year: number;
    username: string;
    display_name: string;
    avatar_url: string | null;
    level: number;
    has_data: boolean;
    stats: StatRow[];
    top_games: { name: string; slug: string; cover_url: string | null; status: string; hours: number }[];
    dna: { genres: { name: string; count: number; percent: number }[]; tags: string[] };
    timeline: { at: string; month: string; key: string; title: string; detail: string }[];
    moments: { key: string; label: string; value: string; note: string; image?: string | null }[];
    percentiles: { available: boolean; population: number; items: { key: string; label: string; percentile: number }[] };
    community: { key: string; label: string; value: number }[];
    archetype: { name: string; blurb: string };
}

/* ── donut ────────────────────────────────────────────────────────────── */

function Donut({ slices, size = 150, thickness = 20 }: { slices: { value: number; color: string; label: string }[]; size?: number; thickness?: number }) {
    const total = slices.reduce((s, x) => s + x.value, 0);
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--track)" strokeWidth={thickness} />
                {total > 0 && slices.map((s, i) => {
                    // A 2px gap keeps neighbouring colours from merging.
                    const length = (s.value / total) * circumference;
                    const dash = Math.max(0, length - 2);
                    const el = (
                        <circle
                            key={i}
                            cx={size / 2} cy={size / 2} r={radius}
                            fill="none" stroke={s.color} strokeWidth={thickness}
                            strokeDasharray={`${dash} ${circumference - dash}`}
                            strokeDashoffset={-offset}
                        >
                            <title>{`${s.label}: ${s.value}`}</title>
                        </circle>
                    );
                    offset += length;
                    return el;
                })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-white/20" />
            </div>
        </div>
    );
}

/* ── one stat ─────────────────────────────────────────────────────────── */

function StatCell({ stat }: { stat: StatRow }) {
    const Icon = STAT_ICONS[stat.key] ?? Gamepad2;
    const tint = STAT_TINTS[stat.key] ?? "var(--accent)";
    const value = useCountUp(stat.value, 1200);
    const up = (stat.delta_percent ?? 0) >= 0;

    return (
        <span className="flex items-center gap-3.5 shrink-0">
            <span
                className="w-11 h-11 rounded-[11px] flex items-center justify-center shrink-0"
                style={{ background: `color-mix(in srgb, ${tint} 14%, transparent)`, color: tint }}
            >
                <Icon className="w-5 h-5" />
            </span>
            <span>
                <span className="block font-display text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/35 whitespace-nowrap">
                    {stat.label}
                </span>
                <span className="block font-display text-[26px] font-black tabular-nums leading-none text-white mt-1">
                    {value.toLocaleString("en-US")}
                    {stat.key === "hours" && <span className="text-[15px] text-white/40">h</span>}
                    {stat.key === "streak" && <span className="text-[12px] text-white/40"> days</span>}
                </span>
                {stat.delta_percent !== null ? (
                    <span className={`mt-1 inline-flex items-center gap-1 font-display text-[10px] font-bold tabular-nums ${up ? "text-emerald-400" : "text-red-400"}`}>
                        {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(stat.delta_percent)}% <span className="text-white/25">vs last year</span>
                    </span>
                ) : (
                    <span className="mt-1 block font-display text-[9px] font-bold uppercase tracking-[0.1em] text-white/20 whitespace-nowrap">
                        First year counted
                    </span>
                )}
            </span>
        </span>
    );
}

/* ── the page ─────────────────────────────────────────────────────────── */

export default function WrappedClient({ data, username }: { data: WrappedPayload; username: string }) {
    const [copied, setCopied] = useState(false);

    const shareUrl = useMemo(
        () => (typeof window === "undefined" ? "" : `${window.location.origin}/wrapped/${username}?year=${data.year}`),
        [username, data.year]
    );

    const copy = () =>
        navigator.clipboard?.writeText(shareUrl).then(() => {
            setCopied(true);
            toast.success("Link copied.");
            setTimeout(() => setCopied(false), 2000);
        });

    const share = async () => {
        try {
            if (navigator.share) {
                await navigator.share({ title: `My ${data.year} in gaming on TechPlay`, url: shareUrl });
                return;
            }
        } catch {
            // Sheet dismissed — fall through to copying, which always works.
        }
        copy();
    };

    const genreSlices = data.dna.genres.map((g, i) => ({ value: g.count, color: WHEEL[i % WHEEL.length], label: g.name }));
    const topGame = data.top_games[0];
    const stat = (key: string) => data.stats.find((s) => s.key === key)?.value ?? 0;

    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            {/* ── hero ── */}
            <div className="relative overflow-hidden border-b border-white/[0.07]">
                {topGame?.cover_url && (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={topGame.cover_url} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-[0.14]" />
                        <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--surface-0)]/70 to-[var(--surface-0)]" />
                    </>
                )}
                <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{ background: "radial-gradient(70% 150% at 15% -20%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 58%)" }}
                />

                <div className="relative z-10 container-page py-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div>
                        <p className="inline-flex items-center gap-2 h-[24px] px-3 rounded-[6px] bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] font-display text-[9px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
                            <Sparkles className="w-3 h-3" /> Year in review
                        </p>
                        <h1 className="mt-3.5 font-display text-[38px] md:text-[52px] font-black text-white tracking-tight leading-[0.95]">
                            Gaming Wrapper {data.year}
                            <span className="block text-[var(--accent)]">Your Year in Gaming</span>
                        </h1>
                        <p className="mt-3 text-[13.5px] text-white/45 max-w-[460px] leading-relaxed">
                            Relive {data.year} through your stats, favourite games, genres, achievements and community
                            highlights.
                        </p>

                        <div className="mt-6 flex flex-wrap items-center gap-2.5">
                            <button
                                onClick={share}
                                className="inline-flex items-center gap-2 h-11 px-6 rounded-[9px] bg-[var(--accent)] hover:brightness-110 text-white font-display text-[11px] font-bold uppercase tracking-[0.1em] transition-[filter]"
                            >
                                <Share2 className="w-4 h-4" /> Share wrapper
                            </button>
                            <a
                                href={`/og/wrapped?username=${encodeURIComponent(username)}&year=${data.year}`}
                                download={`techplay-wrapper-${data.year}-${username}.png`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 h-11 px-5 rounded-[9px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white font-display text-[11px] font-bold uppercase tracking-[0.1em] transition-colors"
                            >
                                <Download className="w-4 h-4" /> Download card
                            </a>
                            <button
                                onClick={copy}
                                className="inline-flex items-center gap-2 h-11 px-5 rounded-[9px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white font-display text-[11px] font-bold uppercase tracking-[0.1em] transition-colors"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4" />}
                                {copied ? "Copied" : "Copy link"}
                            </button>
                        </div>
                    </div>

                    {/* ── the shareable card ── */}
                    <div
                        className="relative overflow-hidden rounded-[14px] border p-5"
                        style={{
                            borderColor: "color-mix(in srgb, var(--accent) 45%, transparent)",
                            background: "linear-gradient(140deg, color-mix(in srgb, var(--accent) 10%, var(--surface-1)), var(--surface-0) 60%)",
                        }}
                    >
                        <span aria-hidden className="absolute top-4 right-5 flex gap-1">
                            {[0, 1, 2, 3].map((i) => (
                                <span key={i} className="block w-[14px] h-[3px] rounded-full bg-[var(--accent)]" style={{ opacity: 1 - i * 0.22 }} />
                            ))}
                        </span>

                        <p className="flex items-center gap-2 font-display text-[10px] font-black uppercase tracking-[0.18em] text-white">
                            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" /> TechPlay
                        </p>
                        <p className="mt-1 font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">
                            Gaming Wrapper <span className="text-[var(--accent)]">{data.year}</span>
                        </p>

                        <div className="mt-4 flex items-start gap-4">
                            <span className="relative shrink-0">
                                <span className="block w-[68px] h-[68px] rounded-full border-2 border-[var(--accent)] overflow-hidden bg-white/[0.05]">
                                    {data.avatar_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={data.avatar_url} alt={data.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="w-full h-full flex items-center justify-center text-[var(--accent)] font-display text-[22px] font-black">
                                            {data.display_name.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </span>
                                <span className="absolute -bottom-1 -right-1 w-[24px] h-[24px] rounded-full bg-[var(--accent)] border-2 border-[var(--surface-0)] flex items-center justify-center font-display text-[10px] font-black text-white tabular-nums">
                                    {data.level}
                                </span>
                            </span>

                            <div className="min-w-0 flex-1">
                                <p className="font-display text-[16px] font-black text-white truncate">{data.display_name}</p>
                                <p className="font-display text-[11px] font-bold text-white/35 truncate">@{data.username}</p>
                            </div>

                            {topGame && (
                                <div className="hidden sm:block text-right shrink-0 max-w-[150px]">
                                    <p className="font-display text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">Favourite game</p>
                                    <p className="mt-0.5 font-display text-[13px] font-black text-white truncate">{topGame.name}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2">
                            {([
                                ["Top genre", data.dna.genres[0]?.name ?? "—"],
                                ["Total hours", `${stat("hours")}`],
                                ["Completed", `${stat("games_completed")}`],
                            ] as const).map(([label, value]) => (
                                <span key={label} className="rounded-[8px] border border-white/[0.08] bg-white/[0.03] px-2.5 py-2 text-center">
                                    <span className="block font-display text-[7.5px] font-bold uppercase tracking-[0.12em] text-white/35 truncate">{label}</span>
                                    <span className="block mt-1 font-display text-[13px] font-black text-white truncate">{value}</span>
                                </span>
                            ))}
                        </div>

                        <div className="mt-4 pt-3.5 border-t border-white/[0.08]">
                            <p className="font-display text-[8px] font-bold uppercase tracking-[0.16em] text-white/35">Your archetype</p>
                            <p className="mt-1 font-display text-[21px] font-black text-[var(--accent)] leading-tight">{data.archetype.name}</p>
                            <p className="mt-1.5 text-[11.5px] text-white/45 leading-snug">{data.archetype.blurb}</p>
                        </div>

                        <p className="mt-4 flex items-center justify-between font-display text-[8.5px] font-bold text-white/25">
                            <span>techplay.gg/wrapped</span>
                            <span className="text-[var(--accent)]">#TechPlayWrapper{data.year}</span>
                        </p>
                    </div>
                </div>
            </div>

            {!data.has_data ? (
                <div className="container-page py-16 text-center">
                    <Sparkles className="w-8 h-8 mx-auto mb-3 text-white/15" />
                    <p className="font-display text-[16px] font-bold text-white">{data.year} is still empty</p>
                    <p className="mt-2 text-[12.5px] text-white/40 max-w-[400px] mx-auto leading-snug">
                        Add games, log a session or unlock something — this page fills itself in as the year goes.
                    </p>
                    <Link href="/games" className="mt-5 inline-flex items-center gap-2 h-10 px-6 rounded-[9px] bg-[var(--accent)] text-white font-display text-[10.5px] font-black uppercase tracking-[0.1em]">
                        <Gamepad2 className="w-4 h-4" /> Browse games
                    </Link>
                </div>
            ) : (
                <div className="container-page py-6 space-y-4">
                    {/* ── stat strip ── */}
                    <div className="rounded-[var(--radius-panel)] border border-white/[0.07] bg-[var(--surface-2)] px-5 py-4 overflow-x-auto scrollbar-none">
                        <div className="flex items-center gap-8 md:gap-0 md:justify-between min-w-max md:min-w-0">
                            {data.stats.map((s, i) => (
                                <span key={s.key} className="flex items-center shrink-0">
                                    {i > 0 && <span aria-hidden className="hidden md:block w-px h-11 bg-white/[0.08] mx-6" />}
                                    <StatCell stat={s} />
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* ── top games · dna · timeline ── */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                        <div className="xl:col-span-5 min-w-0">
                            <Panel title={`Top games of ${data.year}`}>
                                {data.top_games.length === 0 ? (
                                    <p className="py-2 text-[12px] text-white/30">Nothing played this year yet.</p>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                                        {data.top_games.map((game) => (
                                            <Link key={game.slug} href={`/games/${game.slug}`} className="group">
                                                <span className="relative block h-[132px] rounded-[9px] overflow-hidden bg-white/[0.04] border border-white/[0.07] group-hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors">
                                                    {game.cover_url ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={game.cover_url} alt={game.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500" />
                                                    ) : (
                                                        <span className="w-full h-full flex items-center justify-center text-white/15"><Gamepad2 className="w-6 h-6" /></span>
                                                    )}
                                                    <span aria-hidden className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/90 to-transparent" />
                                                    <span className="absolute inset-x-0 bottom-0 p-2">
                                                        <span className="block font-display text-[10px] font-black text-white leading-tight line-clamp-2">{game.name}</span>
                                                    </span>
                                                </span>
                                                <span className="mt-1.5 flex items-center justify-between gap-1">
                                                    <span className="inline-flex items-center gap-1 font-display text-[9.5px] font-bold tabular-nums text-white/45">
                                                        <Clock3 className="w-2.5 h-2.5" /> {game.hours}h
                                                    </span>
                                                    <span className={`font-display text-[8px] font-black uppercase tracking-[0.08em] ${game.status === "completed" ? "text-emerald-400" : "text-white/25"}`}>
                                                        {game.status === "completed" ? "Done" : game.status}
                                                    </span>
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </Panel>
                        </div>

                        <div className="xl:col-span-4 min-w-0">
                            <Panel title={`Your gamer DNA in ${data.year}`}>
                                {data.dna.genres.length === 0 ? (
                                    <p className="py-2 text-[12px] text-white/30">No genres recorded this year.</p>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-5">
                                            <Donut slices={genreSlices} />
                                            <div className="min-w-0 flex-1 space-y-1.5">
                                                {data.dna.genres.map((g, i) => (
                                                    <div key={g.name} className="flex items-center gap-2.5">
                                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: WHEEL[i % WHEEL.length] }} />
                                                        <span className="flex-1 min-w-0 text-[11.5px] text-white/60 truncate">{g.name}</span>
                                                        <span className="font-display text-[10.5px] font-bold tabular-nums text-white/40">{g.percent}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {data.dna.tags.length > 0 && (
                                            <div className="mt-4 pt-3.5 border-t border-white/[0.07]">
                                                <p className="font-display text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/35 mb-2">Your taste tags</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {data.dna.tags.map((t, i) => (
                                                        <span
                                                            key={t}
                                                            className="inline-flex items-center h-[22px] px-2.5 rounded-[6px] text-[10px] font-bold"
                                                            style={{
                                                                color: WHEEL[i % WHEEL.length],
                                                                background: `color-mix(in srgb, ${WHEEL[i % WHEEL.length]} 13%, transparent)`,
                                                            }}
                                                        >
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </Panel>
                        </div>

                        <div className="xl:col-span-3 min-w-0">
                            <Panel title={`${data.year} timeline`}>
                                {data.timeline.length === 0 ? (
                                    <p className="py-2 text-[12px] text-white/30 leading-snug">
                                        Nothing marked yet — completions, sessions and achievements land here as they happen.
                                    </p>
                                ) : (
                                    <div className="relative pl-5">
                                        <span aria-hidden className="absolute left-[5px] top-2 bottom-2 w-px bg-white/[0.09]" />
                                        <div className="space-y-3.5">
                                            {data.timeline.map((e) => (
                                                <div key={e.key} className="relative">
                                                    <span aria-hidden className="absolute -left-5 top-1 w-[11px] h-[11px] rounded-full bg-[var(--accent)] border-2 border-[var(--surface-2)]" />
                                                    <p className="font-display text-[9px] font-black uppercase tracking-[0.12em] text-[var(--accent)]">{e.month}</p>
                                                    <p className="text-[12px] font-bold text-white leading-snug">{e.title}</p>
                                                    <p className="text-[11px] text-white/40 leading-snug">{e.detail}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Panel>
                        </div>
                    </div>

                    {/* ── moments · percentiles · community ── */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                        <div className="xl:col-span-5 min-w-0">
                            <Panel title="Your biggest moments">
                                {data.moments.length === 0 ? (
                                    <p className="py-2 text-[12px] text-white/30">Nothing to crown yet.</p>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                        {data.moments.map((m) => {
                                            const Icon = MOMENT_ICONS[m.key] ?? Trophy;
                                            return (
                                                <div key={m.key} className="relative overflow-hidden rounded-[10px] border border-white/[0.07] bg-white/[0.02] p-3">
                                                    {m.image && (
                                                        <>
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={m.image} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-20" />
                                                            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[var(--surface-1)] via-[var(--surface-1)]/85 to-transparent" />
                                                        </>
                                                    )}
                                                    <span className="relative block">
                                                        <Icon className="w-4 h-4 text-[var(--accent)] mb-2" />
                                                        <span className="block font-display text-[8px] font-bold uppercase tracking-[0.14em] text-white/35">{m.label}</span>
                                                        <span className="block mt-1 font-display text-[13px] font-black text-white leading-tight line-clamp-2">{m.value}</span>
                                                        <span className="block mt-1 text-[10px] text-white/35 line-clamp-1">{m.note}</span>
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </Panel>
                        </div>

                        <div className="xl:col-span-3 min-w-0">
                            <Panel title="Compared to TechPlay">
                                {!data.percentiles.available ? (
                                    <p className="py-2 text-[11.5px] text-white/30 leading-snug">
                                        Comparisons unlock once enough players have a year on record — a percentile among a
                                        handful of people would not mean anything.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {data.percentiles.items.map((p) => (
                                            <div key={p.key} className="rounded-[10px] border border-white/[0.07] bg-white/[0.02] p-3 text-center">
                                                <span className="block font-display text-[20px] font-black tabular-nums leading-none text-[var(--accent)]">
                                                    Top {p.percentile}%
                                                </span>
                                                <span className="block mt-1.5 font-display text-[8.5px] font-bold uppercase tracking-[0.12em] text-white/35">
                                                    {p.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Panel>
                        </div>

                        <div className="xl:col-span-4 min-w-0">
                            <Panel title="Friends & community">
                                <div className="grid grid-cols-2 gap-2.5">
                                    {data.community.map((c) => {
                                        const Icon = COMMUNITY_ICONS[c.key] ?? Users;
                                        return (
                                            <div key={c.key} className="rounded-[10px] border border-white/[0.07] bg-white/[0.02] p-3">
                                                <Icon className="w-4 h-4 text-white/30 mb-2" />
                                                <span className="block font-display text-[19px] font-black tabular-nums leading-none text-white">
                                                    {c.value.toLocaleString("en-US")}
                                                </span>
                                                <span className="block mt-1 font-display text-[8.5px] font-bold uppercase tracking-[0.12em] text-white/35">
                                                    {c.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Panel>
                        </div>
                    </div>

                    {/* ── share footer ── */}
                    <div
                        className="relative overflow-hidden rounded-[var(--radius-panel)] border p-6"
                        style={{
                            borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)",
                            background: "linear-gradient(100deg, color-mix(in srgb, var(--accent) 12%, var(--surface-1)), var(--surface-0) 65%)",
                        }}
                    >
                        <div className="relative flex flex-wrap items-center justify-between gap-5">
                            <div className="flex items-center gap-4">
                                <span className="w-12 h-12 rounded-[12px] bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] flex items-center justify-center shrink-0">
                                    <Trophy className="w-6 h-6 text-[var(--accent)]" />
                                </span>
                                <div>
                                    <p className="font-display text-[19px] font-black uppercase tracking-[0.02em] text-white leading-none">
                                        Show your wrapper to your squad
                                    </p>
                                    <p className="mt-1.5 text-[12.5px] text-white/45">
                                        Celebrate your year, flex your stats, and challenge your friends to beat you in {data.year + 1}.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <button
                                    onClick={share}
                                    className="inline-flex items-center gap-2 h-11 px-6 rounded-[9px] bg-[var(--accent)] hover:brightness-110 text-white font-display text-[11px] font-bold uppercase tracking-[0.1em] transition-[filter]"
                                >
                                    <Share2 className="w-4 h-4" /> Share wrapper
                                </button>
                                <Link
                                    href="/social"
                                    className="inline-flex items-center gap-2 h-11 px-5 rounded-[9px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white font-display text-[11px] font-bold uppercase tracking-[0.1em] transition-colors"
                                >
                                    <Users className="w-4 h-4" /> Send to friends
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
