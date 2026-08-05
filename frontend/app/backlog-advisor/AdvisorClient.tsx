"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { Compass, Library, CheckCircle2, BarChart3, Plus, Check, Loader2, Users, Star, CalendarClock, Info, X, ChevronDown, Gamepad2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Panel from "@/components/ui/Panel";
import RingMeter from "@/components/ui/RingMeter";
import { useCountUp } from "@/hooks/useCountUp";

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data);

const MOODS = [
    { id: "any", label: "Any" },
    { id: "action", label: "Action" },
    { id: "story", label: "Story" },
    { id: "chill", label: "Chill" },
    { id: "competitive", label: "Competitive" },
];

/** Each scoring component owns a colour, so the bar reads without a legend. */
const COMPONENT_TINTS: Record<string, string> = {
    genre: "var(--accent)",
    peers: "#a855f7",
    quality: "#34d399",
    era: "#60a5fa",
};

interface Recommendation {
    slug: string;
    name: string;
    background_image: string | null;
    released: string | null;
    rating: number;
    metacritic: number | null;
    genres: string[];
    match_score: number;
    reasons: string[];
    breakdown: { key: string; label: string; value: number; max: number }[];
}

interface AdvisorPayload {
    summary: {
        backlog: number;
        library: number;
        completed: number;
        completion_rate: number;
        top_genres: string[];
        health: number;
        health_note: string;
    };
    genres: string[];
    recommendations: Recommendation[];
    weights: { key: string; label: string; note: string }[];
}

/* ── one recommendation ───────────────────────────────────────────────── */

function RecommendationCard({ pick, onAdded }: { pick: Recommendation; onAdded: () => void }) {
    const [busy, setBusy] = useState(false);
    const [added, setAdded] = useState(false);
    const [showWorking, setShowWorking] = useState(false);
    const score = useCountUp(pick.match_score, 900);

    const tone = pick.match_score >= 85 ? "#34d399" : pick.match_score >= 70 ? "var(--accent)" : "#9ca3af";

    const addToBacklog = async () => {
        setBusy(true);
        try {
            await axios.put(`/collection/games/${pick.slug}`, { status: "backlog" });
            toast.success(`${pick.name} added to your backlog.`);
            setAdded(true);
            onAdded();
        } catch (e: unknown) {
            const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "Couldn't add that game.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="group rounded-[12px] border border-white/[0.07] bg-[#0d0b0a] hover:border-[color-mix(in_srgb,var(--accent)_38%,transparent)] transition-colors duration-300">
            <div className="flex flex-col lg:flex-row gap-4 p-4">
                {/* cover */}
                <Link
                    href={`/games/${pick.slug}`}
                    className="relative w-full lg:w-[168px] h-[110px] lg:h-[104px] shrink-0 rounded-[10px] overflow-hidden bg-white/[0.04]"
                >
                    {pick.background_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={pick.background_image}
                            alt={pick.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                        />
                    ) : (
                        <span className="w-full h-full flex items-center justify-center text-white/15">
                            <Gamepad2 className="w-7 h-7" />
                        </span>
                    )}
                </Link>

                {/* identity */}
                <div className="min-w-0 flex-1">
                    <Link href={`/games/${pick.slug}`} className="font-display text-[17px] font-black text-white leading-tight hover:text-[var(--accent)] transition-colors">
                        {pick.name}
                    </Link>

                    <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {pick.genres.map((g) => (
                            <span key={g} className="inline-flex items-center h-[20px] px-2 rounded-[5px] bg-white/[0.05] border border-white/[0.07] text-[10px] font-semibold text-white/50">
                                {g}
                            </span>
                        ))}
                        {pick.released && (
                            <span className="inline-flex items-center gap-1 font-display text-[10px] font-bold tabular-nums text-white/25">
                                <CalendarClock className="w-3 h-3" /> {pick.released.slice(0, 4)}
                            </span>
                        )}
                        {pick.rating > 0 && (
                            <span className="inline-flex items-center gap-1 font-display text-[10px] font-bold tabular-nums text-amber-400/80">
                                <Star className="w-3 h-3 fill-current" /> {pick.rating.toFixed(1)}
                            </span>
                        )}
                    </p>

                    <ul className="mt-3 space-y-1">
                        {pick.reasons.map((r) => (
                            <li key={r} className="flex items-start gap-2 text-[12px] text-white/55 leading-snug">
                                <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-400/70" /> {r}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* score + action */}
                <div className="flex lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0">
                    <button
                        onClick={() => setShowWorking((v) => !v)}
                        title="How this score is made"
                        className="text-center lg:text-right"
                    >
                        <span className="block font-display text-[8.5px] font-bold uppercase tracking-[0.14em] text-white/35">Match score</span>
                        <span className="block font-display text-[28px] font-black tabular-nums leading-none" style={{ color: tone }}>
                            {score}%
                        </span>
                        <span className="mt-0.5 inline-flex items-center gap-1 font-display text-[8.5px] font-bold uppercase tracking-[0.1em] text-white/25 hover:text-white/50 transition-colors">
                            <Info className="w-2.5 h-2.5" /> {showWorking ? "Hide" : "Why"}
                        </span>
                    </button>

                    {added ? (
                        <span className="inline-flex items-center gap-2 h-9 px-4 rounded-[8px] bg-emerald-500/12 border border-emerald-500/30 font-display text-[10px] font-black uppercase tracking-[0.1em] text-emerald-400">
                            <Check className="w-3.5 h-3.5" /> In backlog
                        </span>
                    ) : (
                        <button
                            onClick={addToBacklog}
                            disabled={busy}
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-[8px] bg-[var(--accent)] hover:brightness-110 disabled:opacity-50 text-white font-display text-[10px] font-black uppercase tracking-[0.1em] transition-[filter] whitespace-nowrap"
                        >
                            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                            Add to backlog
                        </button>
                    )}
                </div>
            </div>

            {/* the working */}
            {showWorking && (
                <div className="px-4 pb-4 -mt-1">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-white/[0.07]">
                        {pick.breakdown.map((b) => (
                            <div key={b.key}>
                                <p className="flex items-baseline justify-between gap-2 mb-1">
                                    <span className="text-[10.5px] font-semibold text-white/50">{b.label}</span>
                                    <span className="font-display text-[10px] font-black tabular-nums text-white/35">
                                        {b.value}<span className="text-white/20">/{b.max}</span>
                                    </span>
                                </p>
                                <span className="block h-[4px] rounded-full bg-[var(--track)] overflow-hidden">
                                    <span
                                        className="block h-full rounded-full"
                                        style={{ width: `${(b.value / b.max) * 100}%`, background: COMPONENT_TINTS[b.key] ?? "var(--accent)" }}
                                    />
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── the page ─────────────────────────────────────────────────────────── */

export default function AdvisorClient() {
    const { user } = useAuth();
    const [mood, setMood] = useState("any");
    const [genres, setGenres] = useState<string[]>([]);
    const [excludeBacklog, setExcludeBacklog] = useState(true);
    const [excludePlayed, setExcludePlayed] = useState(true);
    const [showAllGenres, setShowAllGenres] = useState(false);

    const query = useMemo(() => {
        const q = new URLSearchParams();
        if (mood !== "any") q.set("mood", mood);
        genres.forEach((g) => q.append("genres[]", g));
        q.set("exclude_backlog", excludeBacklog ? "1" : "0");
        q.set("exclude_played", excludePlayed ? "1" : "0");
        return q.toString();
    }, [mood, genres, excludeBacklog, excludePlayed]);

    const { data, isLoading, mutate } = useSWR<AdvisorPayload>(
        user ? `/backlog/recommendations?${query}` : null,
        fetcher,
        { keepPreviousData: true, revalidateOnFocus: false }
    );

    const summary = data?.summary;
    const health = useCountUp(summary?.health ?? 0, 1100);

    const toggleGenre = (g: string) =>
        setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

    if (!user) {
        return (
            <main className="min-h-screen bg-[var(--surface-0)] flex items-center justify-center">
                <div className="text-center">
                    <Compass className="w-8 h-8 mx-auto mb-3 text-white/20" />
                    <p className="font-display text-[15px] font-bold text-white">Sign in for recommendations</p>
                    <p className="mt-1.5 text-[12.5px] text-white/40">They are built from your collection, so they need one.</p>
                    <Link href="/login" className="mt-4 inline-flex items-center h-10 px-6 rounded-[9px] bg-[var(--accent)] text-white font-display text-[10.5px] font-bold uppercase tracking-[0.1em]">
                        Sign in
                    </Link>
                </div>
            </main>
        );
    }

    const visibleGenres = showAllGenres ? (data?.genres ?? []) : (data?.genres ?? []).slice(0, 6);

    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            {/* ── header ── */}
            <div className="relative overflow-hidden border-b border-white/[0.07]">
                <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{ background: "radial-gradient(65% 150% at 80% -20%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 58%)" }}
                />
                <div className="relative z-10 container-page pt-9 pb-6">
                    <p className="inline-flex items-center gap-2 h-[24px] px-3 rounded-[6px] bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] font-display text-[9px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
                        <Compass className="w-3 h-3" /> Backlog Advisor
                    </p>
                    <h1 className="mt-3 font-display text-[32px] md:text-[42px] font-black text-white tracking-tight leading-none">
                        Your next great game is waiting
                    </h1>
                    <p className="mt-2.5 text-[13.5px] text-white/45 max-w-[520px] leading-relaxed">
                        Recommendations scored against your own collection — the genres you finish, the players who share
                        your shelf, and how good the game actually is.
                    </p>

                    {/* stat strip */}
                    <div className="mt-6 rounded-[var(--radius-panel)] border border-white/[0.07] bg-[#100e0d] px-5 py-4">
                        <div className="flex items-center gap-6 md:gap-0 md:justify-between overflow-x-auto scrollbar-none min-w-max md:min-w-0">
                            {([
                                [<Library key="b" className="w-4 h-4" />, "Your backlog", summary?.backlog ?? 0, "games to play", "var(--accent)"],
                                [<Gamepad2 key="l" className="w-4 h-4" />, "Library", summary?.library ?? 0, "games tracked", "#60a5fa"],
                                [<CheckCircle2 key="c" className="w-4 h-4" />, "Completion rate", `${summary?.completion_rate ?? 0}%`, `${summary?.completed ?? 0} finished`, "#34d399"],
                            ] as const).map(([icon, label, value, sub, tint], i) => (
                                <span key={label} className="flex items-center gap-3 shrink-0">
                                    {i > 0 && <span aria-hidden className="hidden md:block w-px h-9 bg-white/[0.08] mr-6" />}
                                    <span
                                        className="w-9 h-9 rounded-[9px] flex items-center justify-center shrink-0"
                                        style={{ background: `color-mix(in srgb, ${tint} 14%, transparent)`, color: tint }}
                                    >
                                        {icon}
                                    </span>
                                    <span>
                                        <span className="block font-display text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/35 whitespace-nowrap">{label}</span>
                                        <span className="block font-display text-[19px] font-black tabular-nums leading-none text-white mt-0.5">{value}</span>
                                        <span className="block mt-0.5 text-[10px] text-white/25 whitespace-nowrap">{sub}</span>
                                    </span>
                                </span>
                            ))}

                            <span className="flex items-center gap-3 shrink-0">
                                <span aria-hidden className="hidden md:block w-px h-9 bg-white/[0.08] mr-6" />
                                <span className="w-9 h-9 rounded-[9px] flex items-center justify-center shrink-0 bg-[#a855f7]/14 text-[#a855f7]">
                                    <BarChart3 className="w-4 h-4" />
                                </span>
                                <span>
                                    <span className="block font-display text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/35">Genre focus</span>
                                    <span className="block font-display text-[13px] font-black leading-tight text-white mt-1 whitespace-nowrap">
                                        {(summary?.top_genres?.length ?? 0) > 0 ? summary!.top_genres.join(" · ") : "—"}
                                    </span>
                                    <span className="block mt-0.5 text-[10px] text-white/25">what you play most</span>
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-page py-6 grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                {/* ── refine ── */}
                <aside className="xl:col-span-3 min-w-0">
                    <Panel title="Refine">
                        <p className="font-display text-[9px] font-black uppercase tracking-[0.14em] text-white/40 mb-2">Mood</p>
                        <div className="flex flex-wrap gap-1.5 mb-5">
                            {MOODS.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setMood(m.id)}
                                    className={`h-8 px-3 rounded-[7px] font-display text-[10px] font-bold uppercase tracking-[0.08em] transition-colors ${
                                        mood === m.id ? "bg-[var(--accent)] text-white" : "bg-white/[0.04] text-white/45 hover:text-white hover:bg-white/[0.08]"
                                    }`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        <p className="flex items-center justify-between font-display text-[9px] font-black uppercase tracking-[0.14em] text-white/40 mb-2">
                            Genres
                            {genres.length > 0 && (
                                <button onClick={() => setGenres([])} className="inline-flex items-center gap-1 normal-case tracking-normal text-[10px] font-bold text-white/30 hover:text-white">
                                    <X className="w-3 h-3" /> Clear
                                </button>
                            )}
                        </p>
                        <div className="space-y-1 mb-2">
                            {visibleGenres.map((g) => {
                                const on = genres.includes(g);
                                return (
                                    <button
                                        key={g}
                                        onClick={() => toggleGenre(g)}
                                        className="w-full flex items-center gap-2.5 h-8 px-2 rounded-[7px] hover:bg-white/[0.04] transition-colors"
                                    >
                                        <span className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${on ? "bg-[var(--accent)] border-transparent" : "border-white/20"}`}>
                                            {on && <Check className="w-3 h-3 text-white" />}
                                        </span>
                                        <span className={`text-[12px] truncate ${on ? "text-white font-semibold" : "text-white/50"}`}>{g}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {(data?.genres.length ?? 0) > 6 && (
                            <button
                                onClick={() => setShowAllGenres((v) => !v)}
                                className="inline-flex items-center gap-1 font-display text-[10px] font-bold text-white/40 hover:text-[var(--accent)] transition-colors mb-5"
                            >
                                {showAllGenres ? "Show fewer" : "See all"} <ChevronDown className={`w-3 h-3 transition-transform ${showAllGenres ? "rotate-180" : ""}`} />
                            </button>
                        )}

                        <p className="font-display text-[9px] font-black uppercase tracking-[0.14em] text-white/40 mb-2 mt-1">Exclude</p>
                        <div className="space-y-1">
                            {([
                                ["Games in my backlog", excludeBacklog, setExcludeBacklog] as const,
                                ["Games I've played", excludePlayed, setExcludePlayed] as const,
                            ]).map(([label, value, set]) => (
                                <button
                                    key={label}
                                    onClick={() => set(!value)}
                                    className="w-full flex items-center gap-2.5 h-8 px-2 rounded-[7px] hover:bg-white/[0.04] transition-colors"
                                >
                                    <span className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${value ? "bg-[var(--accent)] border-transparent" : "border-white/20"}`}>
                                        {value && <Check className="w-3 h-3 text-white" />}
                                    </span>
                                    <span className={`text-[12px] truncate ${value ? "text-white font-semibold" : "text-white/50"}`}>{label}</span>
                                </button>
                            ))}
                        </div>
                    </Panel>
                </aside>

                {/* ── recommendations ── */}
                <div className="xl:col-span-9 min-w-0 space-y-5">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="flex items-center gap-2.5 font-display text-[12px] font-bold uppercase tracking-[0.15em] text-white/55">
                            <span className="w-1 h-3.5 rounded-full bg-[var(--accent)]" /> Recommended for you
                            {(data?.recommendations.length ?? 0) > 0 && (
                                <span className="font-black tabular-nums text-white/25">{data!.recommendations.length}</span>
                            )}
                        </h2>
                        {isLoading && <Loader2 className="w-4 h-4 text-white/25 animate-spin" />}
                    </div>

                    {isLoading && !data ? (
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => <div key={i} className="h-[148px] rounded-[12px] bg-white/[0.04] animate-pulse" />)}
                        </div>
                    ) : (data?.recommendations.length ?? 0) === 0 ? (
                        <div className="rounded-[12px] border border-dashed border-white/[0.09] bg-white/[0.015] px-6 py-14 text-center">
                            <Compass className="w-7 h-7 mx-auto mb-3 text-white/15" />
                            <p className="font-display text-[14px] font-bold text-white">
                                {summary?.library === 0 ? "Add a few games first" : "Nothing matches those filters"}
                            </p>
                            <p className="mt-1.5 text-[12px] text-white/40 max-w-[380px] mx-auto leading-snug">
                                {summary?.library === 0
                                    ? "Recommendations are scored against your collection — the more it holds, the sharper they get."
                                    : "Loosen a filter, or clear the genre picks."}
                            </p>
                            <Link
                                href="/games"
                                className="mt-4 inline-flex items-center gap-2 h-9 px-5 rounded-[8px] bg-[var(--accent)] text-white font-display text-[10px] font-black uppercase tracking-[0.1em]"
                            >
                                <Gamepad2 className="w-3.5 h-3.5" /> Browse games
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data!.recommendations.map((pick, i) => (
                                <div key={pick.slug} className={i < 6 ? `tp-fade-up tp-d${Math.min(6, i + 1)}` : undefined}>
                                    <RecommendationCard pick={pick} onAdded={() => mutate()} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── how this works + health ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
                        <div className="lg:col-span-2">
                            <Panel title="How these are scored">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(data?.weights ?? []).map((w) => (
                                        <div key={w.key} className="flex items-start gap-3">
                                            <span
                                                className="w-8 h-8 shrink-0 rounded-[8px] flex items-center justify-center"
                                                style={{ background: `color-mix(in srgb, ${COMPONENT_TINTS[w.key] ?? "var(--accent)"} 14%, transparent)` }}
                                            >
                                                {w.key === "peers" ? <Users className="w-3.5 h-3.5" style={{ color: COMPONENT_TINTS[w.key] }} />
                                                    : w.key === "quality" ? <Star className="w-3.5 h-3.5" style={{ color: COMPONENT_TINTS[w.key] }} />
                                                    : w.key === "era" ? <CalendarClock className="w-3.5 h-3.5" style={{ color: COMPONENT_TINTS[w.key] }} />
                                                    : <Library className="w-3.5 h-3.5" style={{ color: COMPONENT_TINTS[w.key] }} />}
                                            </span>
                                            <span>
                                                <span className="block text-[12.5px] font-bold text-white">{w.label}</span>
                                                <span className="block mt-0.5 text-[11px] text-white/40 leading-snug">{w.note}</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-4 pt-3 border-t border-white/[0.07] text-[11px] text-white/25 leading-snug">
                                    Every match score is the sum of these four, out of 100. Open &ldquo;Why&rdquo; on any card to see
                                    exactly where its points came from.
                                </p>
                            </Panel>
                        </div>

                        <Panel variant="console" title="Backlog health">
                            <div className="flex items-center gap-4">
                                <RingMeter value={health} size={72} strokeWidth={6}>
                                    <span className="font-display text-[15px] font-black tabular-nums text-[var(--accent)]">{health}%</span>
                                </RingMeter>
                                <div className="min-w-0">
                                    <p className="text-[12.5px] font-bold text-white leading-snug">{summary?.health_note}</p>
                                    <Link
                                        href="/profile/me?tab=collection"
                                        className="mt-2.5 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[7px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.09] font-display text-[9.5px] font-black uppercase tracking-[0.1em] text-white/70 transition-colors"
                                    >
                                        View backlog
                                    </Link>
                                </div>
                            </div>
                        </Panel>
                    </div>
                </div>
            </div>
        </main>
    );
}
