"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { CalendarDays, Flame, Heart, Bell, BellRing, ChevronLeft, ChevronRight, Gamepad2, Loader2, Check, ListFilter } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Panel from "@/components/ui/Panel";

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data);

const PLATFORM_FILTERS = [
    { id: "", label: "All" },
    { id: "pc", label: "PC" },
    { id: "playstation", label: "PlayStation" },
    { id: "xbox", label: "Xbox" },
    { id: "nintendo", label: "Nintendo" },
];

/** Platform families get a colour so a chip row reads without labels. */
const PLATFORM_TINTS: Record<string, string> = {
    pc: "#60a5fa",
    playstation: "#3b82f6",
    xbox: "#34d399",
    nintendo: "#ef4444",
};

const compact = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `${n}`;

interface Release {
    slug: string;
    name: string;
    released: string | null;
    tba: boolean;
    cover_url: string | null;
    rating: number;
    added: number;
    genres: string[];
    platforms: string[];
    platform_slugs: string[];
    publisher: string | null;
    wishlists: number;
    wishlisted: boolean;
    reminder: boolean;
}

interface CalendarPayload {
    month: { key: string; label: string; year: number; previous: string; next: string; is_current: boolean };
    stats: { releases: number; wishlisted: number; showing: number };
    hero: Release | null;
    most_anticipated: Release[];
    days: { date: string; day: string; weekday: string; month: string; games: Release[] }[];
    upcoming: Release[];
    platform_breakdown: { key: string; label: string; count: number; percent: number }[];
    genres: { name: string; count: number }[];
    watchlist: { slug: string; name: string; cover_url: string | null; released: string; reminder: boolean }[];
    most_followed: Release[];
}

/* ── shared bits ──────────────────────────────────────────────────────── */

function PlatformChips({ platforms }: { platforms: string[] }) {
    return (
        <span className="flex flex-wrap items-center gap-1">
            {platforms.map((p) => (
                <span key={p} className="inline-flex items-center h-[18px] px-1.5 rounded-[4px] bg-white/[0.06] border border-white/[0.07] font-display text-[8px] font-bold uppercase tracking-[0.06em] text-white/50">
                    {p}
                </span>
            ))}
        </span>
    );
}

function HypeRow({ game }: { game: Release }) {
    return (
        <span className="flex items-center gap-3 font-display text-[10px] font-bold tabular-nums">
            {/* Not a tracker count — no store publishes one. It is how much of
                a release this is: how many platforms carry it, whether critics
                scored it, how much the publisher prepared. */}
            <span className="inline-flex items-center gap-1 text-[var(--accent)]" title="How big a release this is, across every store we read">
                <Flame className="w-3 h-3" /> {compact(game.added)}
            </span>
            {game.wishlists > 0 && (
                <span className="inline-flex items-center gap-1 text-pink-400/80" title="Wishlisted on TechPlay">
                    <Heart className="w-3 h-3" /> {compact(game.wishlists)}
                </span>
            )}
        </span>
    );
}

/** Wishlist and reminder in one control pair, both real actions. */
function ReleaseActions({
    game, compactMode, onChanged,
}: {
    game: Release;
    compactMode?: boolean;
    onChanged: () => void;
}) {
    const { user } = useAuth();
    const [busy, setBusy] = useState<"wishlist" | "reminder" | null>(null);

    const act = async (kind: "wishlist" | "reminder") => {
        if (!user) return toast.error("Sign in to track releases.");
        setBusy(kind);
        try {
            if (kind === "wishlist") {
                await axios.put(`/collection/games/${game.slug}`, { status: "wishlist" });
                toast.success(`${game.name} wishlisted.`);
            } else {
                const res = await axios.post(`/calendar/${game.slug}/reminder`);
                toast.success(res.data?.message ?? "Reminder updated.");
            }
            onChanged();
        } catch (e: unknown) {
            const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "That didn't work.");
        } finally {
            setBusy(null);
        }
    };

    return (
        <span className="flex items-center gap-1.5 shrink-0">
            <button
                onClick={() => act("wishlist")}
                disabled={busy !== null || game.wishlisted}
                title={game.wishlisted ? "Already on your wishlist" : "Add to wishlist"}
                className={`inline-flex items-center gap-1.5 h-8 rounded-[7px] font-display text-[9px] font-black uppercase tracking-[0.1em] transition-colors ${compactMode ? "w-8 justify-center" : "px-3"} ${
                    game.wishlisted
                        ? "bg-[var(--accent)]/15 border border-[var(--accent)]/40 text-[var(--accent)]"
                        : "bg-[var(--accent)] hover:brightness-110 text-white"
                }`}
            >
                {busy === "wishlist" ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : game.wishlisted ? <Check className="w-3.5 h-3.5" />
                    : <Heart className="w-3.5 h-3.5" />}
                {!compactMode && (game.wishlisted ? "Wishlisted" : "Wishlist")}
            </button>

            <button
                onClick={() => act("reminder")}
                disabled={busy !== null}
                title={game.reminder ? "We'll tell you when it lands" : "Remind me on release day"}
                className={`w-8 h-8 rounded-[7px] border flex items-center justify-center transition-colors ${
                    game.reminder
                        ? "border-[var(--accent)]/40 bg-[var(--accent)]/12 text-[var(--accent)]"
                        : "border-white/[0.09] bg-white/[0.04] text-white/35 hover:text-white"
                }`}
            >
                {busy === "reminder" ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : game.reminder ? <BellRing className="w-3.5 h-3.5" />
                    : <Bell className="w-3.5 h-3.5" />}
            </button>
        </span>
    );
}

/* ── the page ─────────────────────────────────────────────────────────── */

export default function CalendarClient() {
    const { user } = useAuth();
    const [month, setMonth] = useState<string | null>(null);
    const [platform, setPlatform] = useState("");
    const [genre, setGenre] = useState("");
    const [sort, setSort] = useState<"date" | "anticipated">("date");

    const query = useMemo(() => {
        const q = new URLSearchParams();
        if (month) q.set("month", month);
        if (platform) q.set("platform", platform);
        if (genre) q.set("genre", genre);
        if (sort !== "date") q.set("sort", sort);
        return q.toString();
    }, [month, platform, genre, sort]);

    const { data, isLoading, error, mutate } = useSWR<CalendarPayload>(
        `/calendar${query ? `?${query}` : ""}`,
        fetcher,
        { keepPreviousData: true, revalidateOnFocus: false }
    );

    if (error) {
        return (
            <main className="min-h-screen bg-[var(--surface-0)] flex items-center justify-center">
                <div className="text-center max-w-[380px]">
                    <CalendarDays className="w-8 h-8 mx-auto mb-3 text-white/20" />
                    <p className="font-display text-[15px] font-bold text-white">The calendar is unavailable</p>
                    <p className="mt-1.5 text-[12.5px] text-white/40 leading-snug">
                        The release feed isn&apos;t answering right now. We keep the last good copy of every month,
                        so this only shows when we have never managed to load this one.
                    </p>
                    <button
                        onClick={() => mutate()}
                        className="mt-4 font-display text-[10px] font-black uppercase tracking-[0.14em] px-4 py-2 rounded-[8px] border border-white/[0.12] text-white/70 hover:text-white hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors"
                    >
                        Try again
                    </button>
                </div>
            </main>
        );
    }

    const m = data?.month;

    // When the visitor steps to a month we know its name before the payload
    // lands — deriving the heading from the request keeps it from flashing
    // "undefined undefined" through the whole load.
    const stepped = month ? new Date(`${month}-01T00:00:00Z`) : null;
    const label = m?.label ?? stepped?.toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" }) ?? "";
    const year = m?.year ?? stepped?.getUTCFullYear() ?? "";

    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            {/* ── hero ── */}
            <div className="relative overflow-hidden border-b border-white/[0.07]">
                {data?.hero?.cover_url && (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={data.hero.cover_url} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-[0.28]" />
                        <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-[var(--surface-0)] via-[var(--surface-0)]/80 to-transparent" />
                        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[var(--surface-0)] to-transparent" />
                    </>
                )}

                <div className="relative z-10 container-page py-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
                    <div>
                        <p className="inline-flex items-center gap-2 font-display text-[9.5px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
                            <CalendarDays className="w-3.5 h-3.5" /> Release calendar
                        </p>
                        <h1 className="mt-3 font-display font-black text-white tracking-tight leading-[0.88] text-[46px] md:text-[64px] uppercase">
                            {label || "—"}
                            <span className="block text-[var(--accent)]">{year}</span>
                        </h1>
                        <p className="mt-3.5 text-[13px] text-white/45 max-w-[420px] leading-relaxed">
                            Track upcoming game releases, launch dates and platforms, and wishlist the games you care
                            about. Never miss a launch.
                        </p>

                        <div className="mt-6 flex items-center gap-7">
                            <span className="flex items-center gap-2.5">
                                <Flame className="w-5 h-5 text-[var(--accent)]" />
                                <span>
                                    <span className="block font-display text-[24px] font-black tabular-nums leading-none text-white">
                                        {data?.stats.releases ?? 0}
                                    </span>
                                    <span className="block mt-0.5 font-display text-[8.5px] font-bold uppercase tracking-[0.14em] text-white/35">
                                        This month
                                    </span>
                                </span>
                            </span>
                            <span aria-hidden className="w-px h-9 bg-white/[0.1]" />
                            <span className="flex items-center gap-2.5">
                                <Heart className="w-5 h-5 text-pink-400" />
                                <span>
                                    <span className="block font-display text-[24px] font-black tabular-nums leading-none text-white">
                                        {data?.stats.wishlisted ?? 0}
                                    </span>
                                    <span className="block mt-0.5 font-display text-[8.5px] font-bold uppercase tracking-[0.14em] text-white/35">
                                        {user ? "On your wishlist" : "Sign in to track"}
                                    </span>
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* ── this month rail ── */}
                    <Panel
                        title="This month"
                        meta={
                            <span className="flex items-center gap-1">
                                <button
                                    onClick={() => setMonth(m?.previous ?? null)}
                                    title="Previous month"
                                    className="w-6 h-6 rounded-[5px] flex items-center justify-center text-white/35 hover:text-white hover:bg-white/[0.06] transition-colors"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-display text-[9.5px] font-black uppercase tracking-[0.1em] text-white/60 tabular-nums whitespace-nowrap">
                                    {m ? `${m.label.slice(0, 3)} ${m.year}` : "—"}
                                </span>
                                <button
                                    onClick={() => setMonth(m?.next ?? null)}
                                    title="Next month"
                                    className="w-6 h-6 rounded-[5px] flex items-center justify-center text-white/35 hover:text-white hover:bg-white/[0.06] transition-colors"
                                >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        }
                    >
                        {isLoading && !data ? (
                            <div className="space-y-2">
                                {[...Array(5)].map((_, i) => <div key={i} className="h-[46px] rounded-[8px] bg-white/[0.04] animate-pulse" />)}
                            </div>
                        ) : (data?.upcoming.length ?? 0) === 0 ? (
                            <p className="py-2 text-[11.5px] text-white/30 leading-snug">
                                Nothing left to come this month. Step forward with the arrows.
                            </p>
                        ) : (
                            <div className="space-y-2.5">
                                {data!.upcoming.map((game) => (
                                    <Link key={game.slug} href={`/calendar/${game.slug}`} className="group flex items-center gap-3">
                                        <span className="shrink-0 w-[38px] text-center">
                                            <span className="block font-display text-[8px] font-bold uppercase tracking-[0.1em] text-white/30">
                                                {game.released ? new Date(game.released).toLocaleDateString("en-GB", { month: "short" }) : "TBA"}
                                            </span>
                                            <span className="block font-display text-[17px] font-black tabular-nums leading-none text-white">
                                                {game.released ? new Date(game.released).getDate() : "—"}
                                            </span>
                                        </span>
                                        <span className="w-[52px] h-[34px] shrink-0 rounded-[6px] overflow-hidden bg-white/[0.05]">
                                            {game.cover_url && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={game.cover_url} alt="" aria-hidden loading="lazy" className="w-full h-full object-cover" />
                                            )}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[12px] font-bold text-white truncate group-hover:text-[var(--accent)] transition-colors">
                                                {game.name}
                                            </span>
                                            <span className="flex items-center gap-1 mt-0.5">
                                                <PlatformChips platforms={game.platforms.slice(0, 3)} />
                                                {game.genres[0] && (
                                                    <span className="font-display text-[8px] font-bold uppercase tracking-[0.06em] text-white/25 truncate">
                                                        {game.genres[0]}
                                                    </span>
                                                )}
                                            </span>
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </Panel>
                </div>
            </div>

            {/* ── filter bar ── */}
            <div className="sticky top-0 z-20 border-b border-white/[0.07] bg-[var(--surface-0)]/92 backdrop-blur-md">
                <div className="container-page py-3 flex flex-wrap items-center gap-2">
                    {PLATFORM_FILTERS.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setPlatform(p.id)}
                            className={`h-8 px-3.5 rounded-[7px] font-display text-[10px] font-black uppercase tracking-[0.08em] transition-colors ${
                                platform === p.id ? "bg-[var(--accent)] text-white" : "bg-white/[0.04] text-white/45 hover:text-white hover:bg-white/[0.08]"
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}

                    <span aria-hidden className="w-px h-6 bg-white/[0.09] mx-1" />

                    {(data?.genres ?? []).slice(0, 4).map((g) => (
                        <button
                            key={g.name}
                            onClick={() => setGenre(genre === g.name ? "" : g.name)}
                            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[7px] font-display text-[10px] font-black uppercase tracking-[0.08em] transition-colors ${
                                genre === g.name ? "bg-[var(--accent)] text-white" : "bg-white/[0.04] text-white/45 hover:text-white hover:bg-white/[0.08]"
                            }`}
                        >
                            {g.name} <span className={genre === g.name ? "text-white/70" : "text-white/25"}>{g.count}</span>
                        </button>
                    ))}

                    <span className="flex-1" />

                    <button
                        onClick={() => setSort(sort === "date" ? "anticipated" : "date")}
                        className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[7px] font-display text-[10px] font-black uppercase tracking-[0.08em] transition-colors ${
                            sort === "anticipated" ? "bg-[var(--accent)] text-white" : "bg-white/[0.04] text-white/45 hover:text-white"
                        }`}
                    >
                        <ListFilter className="w-3.5 h-3.5" /> Biggest first
                    </button>
                    {!m?.is_current && (
                        <button
                            onClick={() => setMonth(null)}
                            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[7px] bg-white/[0.04] hover:bg-white/[0.08] font-display text-[10px] font-black uppercase tracking-[0.08em] text-white/45 hover:text-white transition-colors"
                        >
                            <CalendarDays className="w-3.5 h-3.5" /> This month
                        </button>
                    )}
                </div>
            </div>

            <div className="container-page py-6 grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                <div className="xl:col-span-8 min-w-0 space-y-5">
                    {/* ── most anticipated ── */}
                    {(data?.most_anticipated.length ?? 0) > 0 && (
                        <Panel title={`Biggest in ${label}`}>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                {data!.most_anticipated.map((game) => (
                                    <div key={game.slug} className="group">
                                        <Link href={`/calendar/${game.slug}`} className="relative block h-[190px] rounded-[10px] overflow-hidden border border-white/[0.07] group-hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors">
                                            {game.cover_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={game.cover_url} alt={game.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500" />
                                            ) : (
                                                <span className="w-full h-full flex items-center justify-center bg-white/[0.03] text-white/15"><Gamepad2 className="w-7 h-7" /></span>
                                            )}
                                            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent" />
                                            <span className="absolute inset-x-0 bottom-0 p-2.5">
                                                <span className="block font-display text-[11px] font-black text-white leading-tight line-clamp-2 mb-1.5">
                                                    {game.name}
                                                </span>
                                                <span className="block font-display text-[8.5px] font-bold uppercase tracking-[0.1em] text-[var(--accent)] mb-1.5">
                                                    {game.released ? new Date(game.released).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "TBA"}
                                                </span>
                                                <PlatformChips platforms={game.platforms.slice(0, 3)} />
                                            </span>
                                        </Link>
                                        <div className="mt-2 flex items-center justify-between gap-2">
                                            <HypeRow game={game} />
                                            <ReleaseActions game={game} compactMode onChanged={() => mutate()} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Panel>
                    )}

                    {/* ── the month, day by day ── */}
                    <Panel
                        title={label ? `${label} ${year} releases` : "Releases"}
                        meta={
                            <span className="font-display text-[10px] font-black tabular-nums text-white/35">
                                {data?.stats.showing ?? 0}
                                {(data?.stats.showing ?? 0) !== (data?.stats.releases ?? 0) && (
                                    <span className="text-white/20"> / {data?.stats.releases}</span>
                                )}
                            </span>
                        }
                        padding="none"
                    >
                        {isLoading && !data ? (
                            <div className="p-4 space-y-2">
                                {[...Array(6)].map((_, i) => <div key={i} className="h-[62px] rounded-[10px] bg-white/[0.04] animate-pulse" />)}
                            </div>
                        ) : (data?.days.length ?? 0) === 0 ? (
                            <div className="px-6 py-14 text-center">
                                <CalendarDays className="w-7 h-7 mx-auto mb-3 text-white/15" />
                                <p className="font-display text-[14px] font-bold text-white">Nothing matches</p>
                                <p className="mt-1.5 text-[12px] text-white/40">
                                    {platform || genre ? "Loosen a filter, or step to another month." : "No releases recorded for this month."}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/[0.05]">
                                {data!.days.map((day) => (
                                    <div key={day.date} className="flex gap-4 p-4">
                                        <span className="shrink-0 w-[52px] text-center pt-1">
                                            <span className="block font-display text-[8.5px] font-bold uppercase tracking-[0.12em] text-white/30">{day.month}</span>
                                            <span className="block font-display text-[26px] font-black tabular-nums leading-none text-white">{day.day}</span>
                                            <span className="block mt-0.5 font-display text-[8.5px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">{day.weekday}</span>
                                        </span>

                                        <div className="min-w-0 flex-1 space-y-2.5">
                                            {day.games.map((game) => (
                                                <div key={game.slug} className="group flex items-center gap-3 rounded-[10px] border border-white/[0.06] bg-white/[0.015] hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)] transition-colors p-2.5">
                                                    <Link href={`/calendar/${game.slug}`} className="w-[64px] h-[40px] shrink-0 rounded-[7px] overflow-hidden bg-white/[0.05]">
                                                        {game.cover_url ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={game.cover_url} alt="" aria-hidden loading="lazy" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="w-full h-full flex items-center justify-center text-white/15"><Gamepad2 className="w-4 h-4" /></span>
                                                        )}
                                                    </Link>

                                                    <span className="min-w-0 flex-1">
                                                        <Link href={`/calendar/${game.slug}`} className="block text-[13px] font-bold text-white truncate group-hover:text-[var(--accent)] transition-colors">
                                                            {game.name}
                                                        </Link>
                                                        <span className="flex items-center gap-2 mt-0.5 font-display text-[9px] font-bold uppercase tracking-[0.08em] text-white/30 truncate">
                                                            {game.genres[0] && <span>{game.genres[0]}</span>}
                                                            {game.publisher && <span className="text-white/20">· {game.publisher}</span>}
                                                        </span>
                                                    </span>

                                                    <span className="hidden md:block shrink-0">
                                                        <PlatformChips platforms={game.platforms} />
                                                    </span>

                                                    <span className="hidden sm:block shrink-0">
                                                        <HypeRow game={game} />
                                                    </span>

                                                    <ReleaseActions game={game} onChanged={() => mutate()} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>
                </div>

                {/* ── right rail ── */}
                <aside className="xl:col-span-4 min-w-0 space-y-4">
                    <Panel title="Your watchlist releases">
                        {!user ? (
                            <p className="py-1 text-[11.5px] text-white/30 leading-snug">
                                <Link href="/login" className="text-[var(--accent)] font-semibold">Sign in</Link> to wishlist
                                games and get told the day they land.
                            </p>
                        ) : (data?.watchlist.length ?? 0) === 0 ? (
                            <p className="py-1 text-[11.5px] text-white/30 leading-snug">
                                Nothing upcoming on your list. Wishlist a game below and it appears here.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {data!.watchlist.map((game) => (
                                    <div key={game.slug} className="group flex items-center gap-3">
                                        <Link href={`/games/${game.slug}`} className="w-[48px] h-[32px] shrink-0 rounded-[6px] overflow-hidden bg-white/[0.05]">
                                            {game.cover_url && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={game.cover_url} alt="" aria-hidden loading="lazy" className="w-full h-full object-cover" />
                                            )}
                                        </Link>
                                        <span className="min-w-0 flex-1">
                                            <Link href={`/games/${game.slug}`} className="block text-[12.5px] font-bold text-white truncate hover:text-[var(--accent)] transition-colors">
                                                {game.name}
                                            </Link>
                                            <span className="block font-display text-[9px] font-bold uppercase tracking-[0.1em] text-white/30">
                                                {new Date(game.released).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                            </span>
                                        </span>
                                        {game.reminder && (
                                            <BellRing className="w-3.5 h-3.5 shrink-0 text-[var(--accent)]" aria-label="Reminder on" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>

                    <Panel title="Biggest still to come">
                        {(data?.most_followed.length ?? 0) === 0 ? (
                            <p className="py-1 text-[11.5px] text-white/30">Nothing further out yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {data!.most_followed.map((game) => (
                                    <Link key={game.slug} href={`/calendar/${game.slug}`} className="group flex items-center gap-3">
                                        <span className="w-[52px] h-[34px] shrink-0 rounded-[6px] overflow-hidden bg-white/[0.05]">
                                            {game.cover_url && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={game.cover_url} alt="" aria-hidden loading="lazy" className="w-full h-full object-cover" />
                                            )}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[12.5px] font-bold text-white truncate group-hover:text-[var(--accent)] transition-colors">
                                                {game.name}
                                            </span>
                                            <span className="block font-display text-[9px] font-bold uppercase tracking-[0.1em] text-white/30">
                                                {game.released ? new Date(game.released).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "TBA"}
                                            </span>
                                        </span>
                                        <span className="shrink-0 inline-flex items-center gap-1 font-display text-[11px] font-black tabular-nums text-[var(--accent)]">
                                            <Flame className="w-3 h-3" /> {compact(game.added)}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </Panel>

                    <Panel title="Platform breakdown">
                        {(data?.platform_breakdown.length ?? 0) === 0 ? (
                            <p className="py-1 text-[11.5px] text-white/30">No platform data this month.</p>
                        ) : (
                            <>
                                <div className="flex h-[8px] rounded-full overflow-hidden bg-[var(--track)] mb-3.5">
                                    {data!.platform_breakdown.map((p) => (
                                        <span key={p.key} style={{ width: `${p.percent}%`, background: PLATFORM_TINTS[p.key] }} title={`${p.label}: ${p.percent}%`} />
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    {data!.platform_breakdown.map((p) => (
                                        <div key={p.key} className="flex items-center gap-2.5">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PLATFORM_TINTS[p.key] }} />
                                            <span className="flex-1 min-w-0 text-[12px] text-white/60 truncate">{p.label}</span>
                                            <span className="font-display text-[10px] font-bold tabular-nums text-white/30">{p.count}</span>
                                            <span className="w-[34px] text-right font-display text-[11px] font-black tabular-nums text-white/55">{p.percent}%</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-3.5 pt-3 border-t border-white/[0.07] text-[10.5px] text-white/25 leading-snug">
                                    A game shipping on several platforms counts once for each — the shares add past 100%
                                    on purpose.
                                </p>
                            </>
                        )}
                    </Panel>
                </aside>
            </div>
        </main>
    );
}
