"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import { Trophy, Zap, Star, Library, CheckCircle2, Crown, Search, X, ChevronRight, TrendingUp, TrendingDown, Minus, Medal, Award, BadgeCheck, Flame, MessageSquare, BookOpen, Gamepad2, Clock3, ShieldCheck } from "lucide-react";
import Panel from "@/components/ui/Panel";
import EmptyState from "@/components/ui/EmptyState";
import Avatar from "@/components/ui/Avatar";
import { useCountUp } from "@/hooks/useCountUp";
import { useCountdown } from "@/hooks/useCountdown";
import type { LucideIcon } from "lucide-react";

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data);

type BoardType = "xp" | "reputation" | "collection" | "completions" | "reviews" | "achievements";
type Period = "all" | "month" | "week";

const BOARDS: { id: BoardType; label: string; icon: LucideIcon }[] = [
    { id: "xp", label: "XP / Level", icon: Zap },
    { id: "reputation", label: "Reputation", icon: Star },
    { id: "collection", label: "Collection", icon: Library },
    { id: "completions", label: "Completions", icon: CheckCircle2 },
    { id: "reviews", label: "Reviews", icon: MessageSquare },
    { id: "achievements", label: "Achievements", icon: Trophy },
];

const PERIODS: { id: Period; label: string }[] = [
    { id: "all", label: "All Time" },
    { id: "month", label: "This Month" },
    { id: "week", label: "This Week" },
];

interface Entry {
    position: number;
    username: string;
    name: string;
    avatar_url: string | null;
    rank_title: string | null;
    rank_color: string | null;
    verified: boolean;
    level: number;
    value: number;
    label: string;
    games: number;
    reputation: number;
    trend: number | null;
}

interface Payload {
    entries: Entry[];
    type: BoardType;
    period: Period;
    label: string;
    periodic: boolean;
    viewer:
        | null
        | { ranked: false; reason: string }
        | {
              ranked: true;
              username: string;
              name: string;
              avatar_url: string | null;
              rank_title: string | null;
              position: number | null;
              value: number;
              label: string;
              games: number;
              xp: number;
              level: number;
              level_progress: { level: number; current_xp: number; level_start: number; next_level_xp: number; percent: number };
              trend: number | null;
          };
    season: null | {
        name: string;
        description: string | null;
        ends_at: string | null;
        xp_multiplier: number;
        bounty_multiplier: number;
        your_xp: number | null;
    };
    rising: { position: number; username: string; name: string; avatar_url: string | null; gain: number; xp: number }[];
}

/** Podium metal — gold, silver, bronze, and nothing for the rest. */
const METAL: Record<number, { color: string; icon: LucideIcon }> = {
    1: { color: "#f0b429", icon: Crown },
    2: { color: "#cbd5e1", icon: Medal },
    3: { color: "#c2703f", icon: Award },
};

function Trend({ value }: { value: number | null }) {
    if (value === null) {
        return <span className="font-display text-[10px] font-bold text-white/15">—</span>;
    }
    if (value === 0) {
        return (
            <span className="inline-flex items-center gap-1 font-display text-[11px] font-bold tabular-nums text-white/25">
                <Minus className="w-3 h-3" /> 0
            </span>
        );
    }
    const up = value > 0;
    return (
        <span className={`inline-flex items-center gap-1 font-display text-[11px] font-bold tabular-nums ${up ? "text-emerald-400" : "text-red-400"}`}>
            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(value).toLocaleString("en-US")}
        </span>
    );
}

/* ── podium ───────────────────────────────────────────────────────────── */

function PodiumCard({ entry, place }: { entry: Entry; place: 1 | 2 | 3 }) {
    const metal = METAL[place];
    const Icon = metal.icon;
    const first = place === 1;

    return (
        <Link
            href={`/profile/${entry.username}`}
            className={`group relative flex items-center gap-4 rounded-[14px] border overflow-hidden transition-transform duration-300 hover:-translate-y-0.5 ${
                first ? "p-5 lg:-mt-4" : "p-4"
            }`}
            style={{
                borderColor: `color-mix(in srgb, ${metal.color} ${first ? 45 : 24}%, transparent)`,
                background: `linear-gradient(135deg, color-mix(in srgb, ${metal.color} ${first ? 14 : 7}%, var(--surface-1)), var(--surface-1) 70%)`,
            }}
        >
            <span
                className="relative shrink-0 flex items-center justify-center rounded-full"
                style={{
                    width: first ? 52 : 44,
                    height: first ? 52 : 44,
                    background: `color-mix(in srgb, ${metal.color} 16%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${metal.color} 40%, transparent)`,
                }}
            >
                <span className="font-display font-black tabular-nums" style={{ color: metal.color, fontSize: first ? 22 : 18 }}>
                    {place}
                </span>
                <Icon
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2"
                    style={{ color: metal.color, width: first ? 20 : 15, height: first ? 20 : 15 }}
                />
            </span>

            <span className="relative shrink-0">
                <span
                    className="block rounded-full p-[2px]"
                    style={{ background: `linear-gradient(135deg, ${metal.color}, transparent 70%)` }}
                >
                    <Avatar src={entry.avatar_url} alt={entry.username} size={first ? "lg" : "md"} />
                </span>
            </span>

            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                    <span className={`font-display font-black text-white truncate ${first ? "text-[18px]" : "text-[15px]"}`}>
                        {entry.name}
                    </span>
                    {entry.verified && <BadgeCheck className="w-3.5 h-3.5 shrink-0 text-[var(--accent)]" />}
                </span>
                {entry.rank_title && (
                    <span className="mt-0.5 flex items-center gap-1.5 font-display text-[10.5px] font-bold uppercase tracking-[0.1em]" style={{ color: metal.color }}>
                        <ShieldCheck className="w-3 h-3" /> {entry.rank_title}
                    </span>
                )}
                <span className="mt-1.5 block font-display font-black tabular-nums" style={{ color: metal.color, fontSize: first ? 22 : 18 }}>
                    {entry.value.toLocaleString("en-US")} <span className="text-[11px] text-white/35">{entry.label}</span>
                </span>
            </span>
        </Link>
    );
}

/* ── season ───────────────────────────────────────────────────────────── */

function SeasonPanel({ season }: { season: NonNullable<Payload["season"]> }) {
    const left = useCountdown(season.ends_at);

    return (
        <Panel variant="console" title={season.name}>
            {season.ends_at && (
                <>
                    <p className="font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/40 mb-2">Season ends in</p>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                        {([["Days", left.days], ["Hrs", left.hours], ["Mins", left.minutes], ["Secs", left.seconds]] as const).map(([label, v]) => (
                            <span key={label} className="text-center">
                                <span className="block font-display text-[20px] font-black tabular-nums leading-none text-white">
                                    {String(v).padStart(2, "0")}
                                </span>
                                <span className="mt-1 block font-display text-[8px] font-bold uppercase tracking-[0.14em] text-white/35">{label}</span>
                            </span>
                        ))}
                    </div>
                </>
            )}

            {season.your_xp !== null && (
                <div className="pt-3 border-t border-white/[0.07]">
                    <p className="flex items-center justify-between gap-3">
                        <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Your season XP</span>
                        <span className="font-display text-[13px] font-black tabular-nums text-[var(--xp-bright)]">
                            {season.your_xp.toLocaleString("en-US")}
                        </span>
                    </p>
                </div>
            )}

            {season.xp_multiplier > 1 && (
                <p className="mt-3 inline-flex items-center gap-1.5 h-[24px] px-2.5 rounded-[6px] bg-[var(--accent-soft)] font-display text-[9.5px] font-black uppercase tracking-[0.1em] text-[var(--accent)]">
                    <Flame className="w-3 h-3" /> {season.xp_multiplier}× XP while it runs
                </p>
            )}

            {season.description && <p className="mt-3 text-[12px] text-white/40 leading-snug">{season.description}</p>}
        </Panel>
    );
}

/* ── the page ─────────────────────────────────────────────────────────── */

export default function LeaderboardClient() {
    const [board, setBoard] = useState<BoardType>("xp");
    const [period, setPeriod] = useState<Period>("all");
    const [query, setQuery] = useState("");

    const { data, isLoading, error } = useSWR<Payload>(
        `/leaderboard?type=${board}&period=${period}`,
        fetcher,
        { revalidateOnFocus: false }
    );

    const entries = useMemo(() => data?.entries ?? [], [data]);

    // A board with no baseline is served as all-time whatever the buttons
    // say, so the highlight follows what came back rather than what was
    // asked for — otherwise switching to Collection while on This Week left
    // every button unlit over all-time data.
    const shownPeriod = data?.period ?? period;

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return entries;
        return entries.filter((e) => e.name.toLowerCase().includes(q) || e.username.toLowerCase().includes(q));
    }, [entries, query]);

    const podium = query ? [] : entries.slice(0, 3);
    const rows = query ? visible : entries;

    const viewer = data?.viewer && "ranked" in data.viewer && data.viewer.ranked ? data.viewer : null;
    const viewerPosition = useCountUp(viewer?.position ?? 0, 900);

    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            {/* ── hero ── */}
            <div className="relative overflow-hidden border-b border-white/[0.07]">
                {/* The house backdrop, like every other hero on the site. The
                    bespoke arena art was the only thing making this page look
                    like it belonged to a different product. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/page-hero.webp"
                    alt=""
                    aria-hidden
                    className="absolute inset-0 w-full h-full object-cover object-center"
                />
                <span aria-hidden className="absolute inset-0 bg-[radial-gradient(58%_120%_at_50%_45%,rgba(5,7,10,0.82),rgba(5,7,10,0.55)_72%)]" />
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--surface-0)] to-transparent" />
                <div className="relative z-10 container-page py-12 md:py-16 text-center">
                    <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] mb-4">
                        <Trophy className="w-7 h-7 text-[var(--accent)]" />
                    </span>
                    <h1 className="font-display text-3xl md:text-5xl font-black text-white tracking-tight">Leaderboard</h1>
                    <p className="mt-2 text-[14px] text-white/45">Compete. Climb. Be the legend.</p>
                    <p className="mt-3 inline-flex items-center gap-2 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Rankings refresh every 5 minutes
                    </p>
                </div>
            </div>

            <div className="container-page py-6 grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                <div className="xl:col-span-9 min-w-0 space-y-4">
                    {/* ── board switcher ── */}
                    <div className="flex flex-wrap gap-1.5 p-1.5 rounded-[12px] border border-white/[0.07] bg-[var(--surface-1)]">
                        {BOARDS.map((b) => {
                            const Icon = b.icon;
                            const active = board === b.id;
                            return (
                                <button
                                    key={b.id}
                                    onClick={() => setBoard(b.id)}
                                    className={`flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 h-10 px-3 rounded-[8px] font-display text-[11px] font-bold uppercase tracking-[0.06em] transition-colors duration-200 ${
                                        active ? "bg-[var(--accent)] text-white" : "text-white/45 hover:text-white hover:bg-white/[0.05]"
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" /> {b.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* ── period + search ── */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex gap-1 p-1 rounded-[10px] border border-white/[0.07] bg-[var(--surface-1)]">
                            {PERIODS.map((p) => {
                                const disabled = !data?.periodic && p.id !== "all";
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => setPeriod(p.id)}
                                        disabled={disabled}
                                        title={disabled ? "This board has no weekly baseline to measure against" : undefined}
                                        className={`h-8 px-5 rounded-[7px] font-display text-[10.5px] font-bold uppercase tracking-[0.08em] transition-colors ${
                                            shownPeriod === p.id && !disabled
                                                ? "bg-[var(--accent)] text-white"
                                                : disabled
                                                    ? "text-white/15 cursor-not-allowed"
                                                    : "text-white/45 hover:text-white"
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search players…"
                                className="w-full h-10 pl-9 pr-8 rounded-[10px] bg-[var(--surface-1)] border border-white/[0.07] text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
                            />
                            {query && (
                                <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── your position ── */}
                    {viewer && (
                        <div className="relative overflow-hidden rounded-[14px] border border-[color-mix(in_srgb,var(--accent)_38%,transparent)] bg-[var(--surface-2)]">
                            <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-[var(--accent)]" />
                            <div className="relative flex flex-wrap items-center gap-5 p-5">
                                <div className="shrink-0">
                                    <p className="font-display text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Your position</p>
                                    <p className="mt-1 font-display text-[32px] font-black tabular-nums leading-none text-white">
                                        {viewer.position ? `#${viewerPosition}` : "—"}
                                    </p>
                                    {viewer.trend !== null && viewer.trend !== 0 && (
                                        <p className="mt-1.5"><Trend value={viewer.trend} /> <span className="font-display text-[9.5px] font-bold uppercase tracking-[0.1em] text-white/25">XP this week</span></p>
                                    )}
                                </div>

                                <span aria-hidden className="hidden md:block w-px h-14 bg-white/[0.08]" />

                                <Link href={`/profile/${viewer.username}`} className="flex items-center gap-3.5 min-w-0">
                                    <span className="relative shrink-0">
                                        <Avatar src={viewer.avatar_url} alt={viewer.username} size="md" />
                                        <span className="absolute -bottom-1 -right-1 w-[22px] h-[22px] rounded-full bg-[var(--accent)] border-2 border-[var(--surface-2)] flex items-center justify-center font-display text-[9px] font-black text-white tabular-nums">
                                            {viewer.level}
                                        </span>
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block font-display text-[17px] font-black text-white truncate">{viewer.name}</span>
                                        {viewer.rank_title && (
                                            <span className="mt-0.5 flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-[0.1em] text-white/40">
                                                <ShieldCheck className="w-3 h-3" /> {viewer.rank_title}
                                            </span>
                                        )}
                                    </span>
                                </Link>

                                <div className="flex-1 min-w-[180px]">
                                    <p className="flex items-center justify-between gap-2 mb-1.5">
                                        <span className="font-display text-[10px] font-bold tabular-nums text-white/40">
                                            {viewer.level_progress.current_xp.toLocaleString("en-US")} / {viewer.level_progress.next_level_xp.toLocaleString("en-US")} XP
                                        </span>
                                        <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-white/30">
                                            to level {viewer.level + 1}
                                        </span>
                                    </p>
                                    <span className="block h-[6px] rounded-full bg-[var(--track)] overflow-hidden">
                                        <span
                                            className="block h-full rounded-full transition-[width] duration-700 ease-[var(--ease-hud)]"
                                            style={{ width: `${viewer.level_progress.percent}%`, background: "linear-gradient(90deg, var(--xp-deep), var(--xp-bright))" }}
                                        />
                                    </span>
                                </div>

                                <div className="shrink-0 text-right">
                                    <p className="font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">Total {viewer.label}</p>
                                    <p className="mt-1 font-display text-[22px] font-black tabular-nums leading-none text-[var(--accent)]">
                                        {viewer.value.toLocaleString("en-US")}
                                    </p>
                                    <p className="mt-1.5 inline-flex items-center gap-1.5 font-display text-[10px] font-bold tabular-nums text-white/35">
                                        <Gamepad2 className="w-3 h-3" /> {viewer.games} games
                                    </p>
                                </div>

                                <Link
                                    href={`/profile/${viewer.username}`}
                                    className="shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-[8px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.09] font-display text-[10px] font-bold uppercase tracking-[0.1em] text-white transition-colors"
                                >
                                    View profile <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    )}

                    {data?.viewer && "ranked" in data.viewer && !data.viewer.ranked && (
                        <div className="flex items-center gap-3 p-4 rounded-[12px] border border-white/[0.07] bg-white/[0.02]">
                            <ShieldCheck className="w-4 h-4 shrink-0 text-white/30" />
                            <p className="text-[12.5px] text-white/45">
                                Your profile is set to friends only, so you don&apos;t appear on the leaderboard.{" "}
                                <Link href="/settings" className="text-[var(--accent)] font-semibold">Change it in settings</Link> to compete.
                            </p>
                        </div>
                    )}

                    {/* ── podium ── */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                            {[...Array(3)].map((_, i) => <div key={i} className="h-[112px] rounded-[14px] bg-white/[0.04] animate-pulse" />)}
                        </div>
                    ) : podium.length === 3 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-center">
                            <PodiumCard entry={podium[1]} place={2} />
                            <PodiumCard entry={podium[0]} place={1} />
                            <PodiumCard entry={podium[2]} place={3} />
                        </div>
                    ) : null}

                    {/* ── table ── */}
                    <Panel padding="none">
                        {isLoading ? (
                            <div className="p-4 space-y-2">
                                {[...Array(6)].map((_, i) => <div key={i} className="h-[52px] rounded-[10px] bg-white/[0.04] animate-pulse" />)}
                            </div>
                        ) : error ? (
                            /* Without this an unanswered request read as an empty
                               board — "Nobody on this board yet" is a very
                               different claim from "we could not ask". */
                            <div className="p-6">
                                <EmptyState
                                    icon={<Trophy className="w-[18px] h-[18px]" />}
                                    title="The board is not answering"
                                    body="We could not load the standings just now. Try again in a moment."
                                />
                            </div>
                        ) : rows.length === 0 ? (
                            <div className="p-6">
                                <EmptyState
                                    icon={<Trophy className="w-[18px] h-[18px]" />}
                                    title={query ? "No player by that name" : "Nobody on this board yet"}
                                    body={query ? "Try a different search." : "Be the first to put a number on it."}
                                />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] text-left">
                                    <thead>
                                        <tr className="border-b border-white/[0.07]">
                                            {/* "Trend" is always XP movement since Monday, whatever
                                                the board ranks by — so it says so, rather than
                                                reading as reputation movement on the reputation
                                                board and collection movement on the collection one. */}
                                            {["#", "Player", "Rank / Title", data?.label ?? "Score", "XP this week", "Games", "Reputation"].map((h, i) => (
                                                <th
                                                    key={h}
                                                    className={`px-4 py-3 font-display text-[9px] font-bold uppercase tracking-[0.14em] text-white/35 ${i >= 3 ? "text-right" : ""}`}
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((e) => {
                                            const metal = METAL[e.position];
                                            const Icon = metal?.icon;

                                            return (
                                                <tr
                                                    key={e.username}
                                                    className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                                                    style={metal ? { background: `color-mix(in srgb, ${metal.color} 5%, transparent)` } : undefined}
                                                >
                                                    <td className="px-4 py-2.5">
                                                        <span className="inline-flex items-center gap-1.5">
                                                            {Icon && <Icon className="w-3.5 h-3.5" style={{ color: metal.color }} />}
                                                            <span
                                                                className="font-display text-[13px] font-black tabular-nums"
                                                                style={{ color: metal?.color ?? "rgba(255,255,255,0.3)" }}
                                                            >
                                                                {e.position}
                                                            </span>
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-2.5">
                                                        <Link href={`/profile/${e.username}`} className="group flex items-center gap-3 min-w-0">
                                                            <Avatar src={e.avatar_url} alt={e.username} size="sm" />
                                                            <span className="flex items-center gap-1.5 min-w-0">
                                                                <span className="text-[13px] font-bold text-white truncate group-hover:text-[var(--accent)] transition-colors">
                                                                    {e.name}
                                                                </span>
                                                                {e.verified && <BadgeCheck className="w-3.5 h-3.5 shrink-0 text-[var(--accent)]" />}
                                                            </span>
                                                        </Link>
                                                    </td>

                                                    <td className="px-4 py-2.5">
                                                        {e.rank_title ? (
                                                            <span
                                                                className="inline-flex items-center gap-1.5 font-display text-[11px] font-bold"
                                                                style={{ color: e.rank_color ?? "rgba(255,255,255,0.55)" }}
                                                            >
                                                                <ShieldCheck className="w-3 h-3" /> {e.rank_title}
                                                            </span>
                                                        ) : (
                                                            <span className="font-display text-[11px] font-bold text-white/20">—</span>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-2.5 text-right">
                                                        <span className="font-display text-[13px] font-black tabular-nums text-[var(--accent)]">
                                                            {e.value.toLocaleString("en-US")}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-2.5 text-right"><Trend value={e.trend} /></td>

                                                    <td className="px-4 py-2.5 text-right font-display text-[12px] font-bold tabular-nums text-white/50">
                                                        {e.games}
                                                    </td>

                                                    <td className="px-4 py-2.5 text-right font-display text-[12px] font-bold tabular-nums text-white/50">
                                                        {e.reputation.toLocaleString("en-US")}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Panel>
                </div>

                {/* ── sidebar ── */}
                <aside className="xl:col-span-3 min-w-0 space-y-4">
                    {data?.season && <SeasonPanel season={data.season} />}

                    <Panel title="Rising Players">
                        {(data?.rising ?? []).length === 0 ? (
                            <EmptyState variant="compact" title="Nobody has moved yet this week" />
                        ) : (
                            <div className="space-y-3">
                                {data!.rising.map((r) => (
                                    <Link key={r.username} href={`/profile/${r.username}`} className="group flex items-center gap-3">
                                        <span className="w-5 shrink-0 font-display text-[11px] font-black tabular-nums text-white/25">{r.position}</span>
                                        <Avatar src={r.avatar_url} alt={r.username} size="sm" />
                                        <span className="min-w-0 flex-1 text-[12.5px] font-semibold text-white truncate group-hover:text-[var(--accent)] transition-colors">
                                            {r.name}
                                        </span>
                                        <span className="shrink-0 inline-flex items-center gap-1 font-display text-[11px] font-bold tabular-nums text-emerald-400">
                                            <TrendingUp className="w-3 h-3" /> {r.gain.toLocaleString("en-US")}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </Panel>

                    <Panel title="How to earn more XP">
                        <div className="space-y-2.5">
                            {[
                                [<BookOpen key="a" className="w-3.5 h-3.5" />, "Read articles and leave comments", "/news"],
                                [<Gamepad2 key="b" className="w-3.5 h-3.5" />, "Add games and log play sessions", "/games"],
                                [<MessageSquare key="c" className="w-3.5 h-3.5" />, "Write reviews and forum posts", "/forum"],
                                [<Clock3 key="d" className="w-3.5 h-3.5" />, "Log in daily and finish quests", "/profile/me"],
                            ].map(([icon, text, href], i) => (
                                <Link key={i} href={href as string} className="group flex items-center gap-2.5 text-[12.5px] text-white/50 hover:text-white transition-colors">
                                    <span className="text-[var(--accent)]">{icon}</span>
                                    {text as string}
                                </Link>
                            ))}
                        </div>
                        <p className="mt-4 pt-3 border-t border-white/[0.07] text-[11px] text-white/25 leading-snug">
                            Friends-only profiles are left off every board — the setting would be worthless if the ranking
                            published your name anyway.
                        </p>
                    </Panel>
                </aside>
            </div>
        </main>
    );
}
