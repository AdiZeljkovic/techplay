"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import axios from "@/lib/axios";
import PlatformIcon, { platformBrandColor } from "@/components/games/PlatformIcon";
import {
    Search, Star, Shuffle, SlidersHorizontal, Flame, Heart, Clock,
    ChevronDown, Gamepad2, Loader2, X, CalendarDays,
} from "lucide-react";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

/* ── shapes ───────────────────────────────────────────────────────────── */

interface Game {
    id: number;
    slug: string;
    name: string;
    released: string | null;
    cover_url: string | null;
    rating: number | null;
    platforms?: string[];
}

interface Hub {
    stats: {
        games: number; rated: number; upcoming: number;
        genres: number; platforms: number; community_ratings: number; tracked: number;
    };
    facets: {
        genres: { name: string; count: number }[];
        platforms: { key: string; label: string; count: number }[];
        eras: { key: string; label: string; from: number; to: number; count: number }[];
        status: { key: string; label: string; count: number }[];
    };
    most_wishlisted: { slug: string; name: string; cover_url: string | null; wishlists: number }[];
}

const SORTS = [
    { value: "-rating", label: "Top Rated" },
    { value: "-released", label: "Newest" },
    { value: "released", label: "Oldest" },
    { value: "name", label: "A–Z" },
];

const compact = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `${Math.round(n / 1_000)}K`
    : `${n}`;

/* ── the shelves at the top ───────────────────────────────────────────── */

const SHELVES = [
    { key: "-rating", art: "/images/games/shelf-top-rated.webp", title: "Top Rated", line: "The highest scored games in the catalogue." },
    { key: "-released", art: "/images/games/shelf-recently-added.webp", title: "Recently Added", line: "The newest arrivals in our database." },
    { key: "upcoming", art: "/images/games/shelf-upcoming.webp", title: "Upcoming Releases", line: "What is still to come, on every platform." },
    { key: "platforms", art: "/images/games/shelf-platforms.webp", title: "Explore by Platform", line: "Browse across every console and generation." },
];

function Shelf({ shelf, active, onPick }: { shelf: typeof SHELVES[number]; active: boolean; onPick: () => void }) {
    return (
        <button
            onClick={onPick}
            aria-pressed={active}
            className={`group relative overflow-hidden rounded-[14px] border p-4 pb-[18px] h-full flex flex-col items-center text-center transition-all duration-200 active:scale-[0.98] ${
                active
                    ? "border-[color-mix(in_srgb,var(--accent)_55%,transparent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)]"
                    : "border-white/[0.07] bg-white/[0.02] hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)]"
            }`}
        >
            {/* The neon art IS the icon — no box, no tint; the PNGs carry their own glow. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={shelf.art}
                alt=""
                aria-hidden
                className={`h-9 w-auto select-none pointer-events-none transition-transform duration-200 ${
                    active ? "scale-110" : "group-hover:scale-105"
                }`}
            />
            <p className="mt-2 font-display text-[13.5px] font-black text-white">{shelf.title}</p>
            <p className="mt-1 text-[11.5px] leading-snug text-white/40">{shelf.line}</p>

            {/* Which way in you took is not obvious from a grid that only ever
                reorders itself, so the tile says it: a rule that draws across
                the foot of the card the moment it becomes the active one. */}
            <span
                className={`absolute inset-x-0 bottom-0 h-[3px] bg-[var(--accent)] origin-left transition-transform duration-300 ${
                    active ? "scale-x-100" : "scale-x-0"
                }`}
            />
        </button>
    );
}

/* ── one filter group in the rail ─────────────────────────────────────── */

/**
 * One folded group in the rail.
 *
 * Open, the four groups run to some 60 rows — every genre, every platform,
 * every era stacked down the page whether or not you are looking for one. Shut,
 * the rail is four lines that each say what they are currently set to, and you
 * open the one you came for.
 */
function FilterGroup({
    title, icon, value, open, onToggle, children,
}: {
    title: string; icon: React.ReactNode; value?: string;
    open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
    return (
        <div className="border-b border-white/[0.06] last:border-0">
            <button
                onClick={onToggle}
                aria-expanded={open}
                className="flex items-center gap-2 w-full py-3 text-left group"
            >
                <span className="shrink-0 text-[var(--accent)]">{icon}</span>
                <span className="font-display text-[9.5px] font-black uppercase tracking-[0.16em] text-white/45 group-hover:text-white/70 transition-colors">
                    {title}
                </span>
                <span className="ml-auto flex items-center gap-1.5 min-w-0">
                    {value && (
                        <span className="text-[11px] font-medium text-white/55 truncate max-w-[96px]">{value}</span>
                    )}
                    <ChevronDown
                        className={`w-3.5 h-3.5 shrink-0 text-white/30 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    />
                </span>
            </button>

            {open && <div className="pb-3 max-h-[276px] overflow-y-auto">{children}</div>}
        </div>
    );
}

/** A filter that does not say how many games sit behind it is asking you to guess. */
function Choice({
    label, count, active, onClick,
}: { label: string; count?: number; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center justify-between gap-2 w-full h-[30px] px-2.5 rounded-[7px] text-left transition-colors ${
                active
                    ? "bg-[var(--accent)] text-white"
                    : "text-white/60 hover:text-white hover:bg-white/[0.05]"
            }`}
        >
            <span className="text-[12px] font-medium truncate">{label}</span>
            {count !== undefined && (
                <span className={`font-display text-[10px] font-bold tabular-nums shrink-0 ${active ? "text-white/80" : "text-white/25"}`}>
                    {compact(count)}
                </span>
            )}
        </button>
    );
}

/* ── the page ─────────────────────────────────────────────────────────── */

/**
 * @param preset  a facet the page opens with — /games/genre/action and friends
 *                are real, indexed pages, and they render this same hub rather
 *                than a second design that has to be kept in step with it.
 * @param heading the h1 those pages need. Passed from the server so it is in
 *                the HTML a crawler reads, not filled in after hydration.
 */
export default function GameDatabaseHub({
    preset,
    heading,
    intro,
}: {
    preset?: { genre?: string; platform?: string; tag?: string; yearFrom?: number; yearTo?: number };
    heading?: string;
    intro?: string;
} = {}) {
    const router = useRouter();
    const params = useSearchParams();

    const [search, setSearch] = useState(params.get("search") ?? "");
    const [typed, setTyped] = useState(params.get("search") ?? "");
    const [genre, setGenre] = useState(preset?.genre ?? params.get("genres") ?? "");
    const [platform, setPlatform] = useState(preset?.platform ?? params.get("platforms") ?? "");
    const [era, setEra] = useState(params.get("era") ?? "");
    const [status, setStatus] = useState(params.get("status") ?? "all");
    const [sort, setSort] = useState(params.get("ordering") ?? "-rating");
    const [page, setPage] = useState(1);
    const [rows, setRows] = useState<Game[]>([]);
    const [railOpen, setRailOpen] = useState(false);
    // One group open at a time — the rail is a list of settings, not a wall.
    const [openGroup, setOpenGroup] = useState<string | null>(null);
    const toggleGroup = (name: string) => setOpenGroup((g) => (g === name ? null : name));

    const { data: hub } = useSWR<{ data: Hub }>("/games/hub", fetcher, { revalidateOnFocus: false });
    const facets = hub?.data.facets;
    const stats = hub?.data.stats;

    // Typing should not fire a query per keystroke against 200,000 rows.
    useEffect(() => {
        const t = setTimeout(() => setSearch(typed.trim()), 350);
        return () => clearTimeout(t);
    }, [typed]);

    const query = useMemo(() => {
        const q = new URLSearchParams();
        if (search) q.set("search", search);
        if (genre) q.set("genres", genre);
        if (platform) q.set("platforms", platform);
        if (preset?.tag) q.set("tags", preset.tag);
        if (sort) q.set("ordering", sort);
        if (status && status !== "all") q.set("status", status);

        const band = preset?.yearFrom
            ? { from: preset.yearFrom, to: preset.yearTo ?? preset.yearFrom }
            : facets?.eras.find((e) => e.key === era);
        if (band) {
            q.set("year_from", String(band.from));
            q.set("year_to", String(band.to));
        }

        q.set("page", String(page));
        q.set("page_size", "30");
        return q.toString();
    }, [search, genre, platform, era, status, sort, page, facets]);

    // The list endpoint answers with count, next, previous, results — not
    // Laravel's paginator. Assuming otherwise crashed the page on
    // `total.toLocaleString()`.
    const { data, isLoading } = useSWR<{ results: Game[]; count: number; next: string | null }>(
        `/games?${query}`,
        fetcher,
        { keepPreviousData: true },
    );

    // Page 1 replaces; later pages append, so "load more" reads as one list.
    // keepPreviousData means `data` still holds the previous page when `page`
    // changes, so keying the effect on both appended page one to itself — and
    // a tab revalidation did it again. Track what has already been folded in.
    const foldedPage = useRef(0);
    useEffect(() => {
        if (!data?.results) return;
        if (page === 1) {
            foldedPage.current = 1;
            setRows(data.results);
            return;
        }
        if (foldedPage.current === page) return;
        foldedPage.current = page;
        setRows((prev) => {
            const seen = new Set(prev.map((g) => g.id));
            return [...prev, ...data.results.filter((g) => !seen.has(g.id))];
        });
    }, [data, page]);

    const reset = useCallback(() => {
        setTyped(""); setSearch(""); setGenre(""); setPlatform("");
        setEra(""); setStatus("all"); setSort("-rating"); setPage(1);
    }, []);

    const change = (fn: () => void) => { fn(); setPage(1); };

    const [rolling, setRolling] = useState(false);
    const roll = async () => {
        setRolling(true);
        try {
            const res = await axios.get("/games/random");
            const slug = res.data?.slug ?? res.data?.data?.slug;
            if (slug) router.push(`/games/${slug}`);
        } finally {
            setRolling(false);
        }
    };

    const active = Boolean(search || genre || platform || era || status !== "all");

    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            {/* ── hero ── */}
            <section className="relative overflow-hidden border-b border-white/[0.07]">
                {/* The worlds-collide panorama: knight on the left, race pit on
                    the right, the dark valley in the middle carrying the title. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/games/games-hero.webp"
                    alt=""
                    aria-hidden
                    className="absolute inset-0 w-full h-full object-cover object-center"
                />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-[var(--surface-0)]/55 via-transparent to-[var(--surface-0)]" />
                <span aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_90%_at_50%_45%,rgba(0,0,0,0.45),transparent_75%)]" />

                <div className="relative z-10 container-page py-12 text-center">
                    <h1 className="font-display font-black tracking-tight text-[42px] md:text-[58px] leading-none">
                        {heading ? (
                            <span className="text-white">{heading}</span>
                        ) : (
                            <>
                                <span className="text-white">GAME </span>
                                <span className="text-[var(--accent)]">DATABASE</span>
                            </>
                        )}
                    </h1>
                    <p className="mt-3 max-w-[720px] mx-auto text-[13px] text-white/45">
                        {intro ??
                            (typeof stats?.games === "number"
                                ? `Discover, explore and track ${stats.games.toLocaleString()} games across every generation.`
                                : "Discover, explore and track games across every generation.")}
                    </p>

                    <div className="mt-6 max-w-[640px] mx-auto relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[var(--ink-faint)] group-focus-within:text-[var(--accent)] transition-colors" />
                        <input
                            value={typed}
                            onChange={(e) => change(() => setTyped(e.target.value))}
                            placeholder="Search for games, genres, platforms, themes…"
                            className="w-full h-12 pl-11 pr-10 rounded-[var(--radius-card)] bg-[var(--surface-2)] border border-[var(--line-strong)] text-[13.5px] text-white placeholder:text-[var(--ink-faint)] outline-none focus:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] focus:ring-1 focus:ring-[var(--accent-soft)] transition-all"
                        />
                        {typed && (
                            <button
                                onClick={() => change(() => setTyped(""))}
                                aria-label="Clear search"
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--ink-faint)] hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* quick ways in, for the 86% of the catalogue that has no rating */}
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                        {facets?.platforms.slice(0, 4).map((p) => {
                            const on = platform === p.label;
                            // The mark wears its brand colour at rest. On the
                            // selected chip the ground is already accent, and a
                            // blue PlayStation logo on orange fights it — there
                            // the mark goes white with the label.
                            const brand = on ? null : platformBrandColor(p.label);

                            return (
                                <button
                                    key={p.key}
                                    onClick={() => change(() => setPlatform(on ? "" : p.label))}
                                    className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full border font-display text-[10.5px] font-bold uppercase tracking-[0.06em] transition-colors ${
                                        on
                                            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                                            : "border-white/[0.09] bg-white/[0.03] text-white/55 hover:text-white"
                                    }`}
                                >
                                    <span style={brand ? { color: brand } : undefined}>
                                        <PlatformIcon label={p.label} className="w-3.5 h-3.5" />
                                    </span>
                                    {p.label}
                                </button>
                            );
                        })}

                        <button
                            onClick={roll}
                            disabled={rolling}
                            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-[var(--accent)] hover:brightness-110 font-display text-[10.5px] font-bold uppercase tracking-[0.06em] text-white transition-all"
                        >
                            {rolling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shuffle className="w-3.5 h-3.5" />}
                            Random game
                        </button>
                    </div>
                </div>
            </section>

            {/* ── four ways in ── */}
            <section className="container-page py-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
                {SHELVES.map((shelf) => (
                    <Shelf
                        key={shelf.key}
                        shelf={shelf}
                        active={
                            shelf.key === "upcoming" ? status === "upcoming"
                                : shelf.key === "platforms" ? Boolean(platform)
                                    : status !== "upcoming" && sort === shelf.key
                        }
                        onPick={() => change(() => {
                            if (shelf.key === "upcoming") { setStatus("upcoming"); setSort("released"); }
                            else if (shelf.key === "platforms") { setRailOpen(true); setOpenGroup("Platform"); }
                            else { setStatus("all"); setSort(shelf.key); }
                        })}
                    />
                ))}
            </section>

            <div className="container-page pb-12 grid grid-cols-1 xl:grid-cols-[248px_1fr_296px] gap-5 items-start">
                {/* ── filters ── */}
                <aside className={`${railOpen ? "block" : "hidden"} xl:block rounded-[14px] border border-white/[0.07] bg-white/[0.02] p-4 xl:sticky xl:top-4`}>
                    <div className="flex items-center justify-between mb-3">
                        <p className="flex items-center gap-2 font-display text-[11px] font-black uppercase tracking-[0.14em] text-white">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--accent)]" /> Filters
                        </p>
                        {active && (
                            <button onClick={reset} className="text-[10.5px] font-bold text-[var(--accent)] hover:brightness-110">
                                Reset all
                            </button>
                        )}
                    </div>

                    <FilterGroup title="Genre" open={openGroup === "Genre"} onToggle={() => toggleGroup("Genre")} icon={<Flame className="w-3 h-3" />} value={genre || "All"}>
                        <div className="space-y-0.5">
                            <Choice label="All" count={stats?.games} active={!genre} onClick={() => change(() => setGenre(""))} />
                            {facets?.genres.map((g) => (
                                <Choice
                                    key={g.name}
                                    label={g.name}
                                    count={g.count}
                                    active={genre === g.name}
                                    onClick={() => change(() => setGenre(genre === g.name ? "" : g.name))}
                                />
                            ))}
                        </div>
                    </FilterGroup>

                    <FilterGroup title="Platform" open={openGroup === "Platform"} onToggle={() => toggleGroup("Platform")} icon={<Gamepad2 className="w-3 h-3" />} value={platform || "All"}>
                        <div className="space-y-0.5">
                            <Choice label="All" count={stats?.games} active={!platform} onClick={() => change(() => setPlatform(""))} />
                            {facets?.platforms.map((p) => (
                                <Choice
                                    key={p.key}
                                    label={p.label}
                                    count={p.count}
                                    active={platform === p.label}
                                    onClick={() => change(() => setPlatform(platform === p.label ? "" : p.label))}
                                />
                            ))}
                        </div>
                    </FilterGroup>

                    <FilterGroup
                        title="Era"
                        open={openGroup === "Era"}
                        onToggle={() => toggleGroup("Era")}
                        icon={<Clock className="w-3 h-3" />}
                        value={facets?.eras.find((e) => e.key === era)?.label ?? "All time"}
                    >
                        <div className="space-y-0.5">
                            <Choice label="All time" count={stats?.games} active={!era} onClick={() => change(() => setEra(""))} />
                            {facets?.eras.map((e) => (
                                <Choice
                                    key={e.key}
                                    label={e.label}
                                    count={e.count}
                                    active={era === e.key}
                                    onClick={() => change(() => setEra(era === e.key ? "" : e.key))}
                                />
                            ))}
                        </div>
                    </FilterGroup>

                    <FilterGroup
                        title="Release status"
                        open={openGroup === "Release status"}
                        onToggle={() => toggleGroup("Release status")}
                        icon={<CalendarDays className="w-3 h-3" />}
                        value={facets?.status.find((s) => s.key === status)?.label ?? "All"}
                    >
                        <div className="space-y-0.5">
                            {facets?.status.map((s) => (
                                <Choice
                                    key={s.key}
                                    label={s.label}
                                    count={s.count}
                                    active={status === s.key}
                                    onClick={() => change(() => setStatus(s.key))}
                                />
                            ))}
                        </div>
                    </FilterGroup>
                </aside>

                {/* ── the grid ── */}
                <section className="min-w-0 xl:self-stretch flex flex-col">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <p className="flex items-baseline gap-2.5 min-w-0">
                            <span className="font-display text-[13px] font-black uppercase tracking-[0.14em] text-white truncate">
                                {search ? `“${search}”` : SORTS.find((s) => s.value === sort)?.label ?? "All games"}
                            </span>
                            {typeof data?.count === "number" && (
                                <span className="font-display text-[10.5px] font-bold tabular-nums text-white/30 whitespace-nowrap">
                                    {data.count.toLocaleString()} found
                                </span>
                            )}
                        </p>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => setRailOpen((v) => !v)}
                                className="xl:hidden inline-flex items-center gap-1.5 h-8 px-3 rounded-[7px] bg-white/[0.05] font-display text-[10px] font-black uppercase tracking-[0.08em] text-white/60"
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
                            </button>
                            <select
                                value={sort}
                                onChange={(e) => change(() => setSort(e.target.value))}
                                className="h-8 px-2.5 rounded-[7px] bg-white/[0.05] border border-white/[0.08] text-[11.5px] text-white/70 outline-none"
                            >
                                {SORTS.map((s) => (
                                    <option key={s.value} value={s.value} className="bg-[var(--surface-0)]">{s.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {isLoading && rows.length === 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <span key={i} className="block h-[210px] rounded-[10px] bg-white/[0.03] animate-pulse" />
                            ))}
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="py-16 text-center">
                            <Gamepad2 className="w-7 h-7 mx-auto mb-3 text-white/15" />
                            <p className="font-display text-[13px] font-bold text-white">Nothing matches that</p>
                            <p className="mt-1 text-[12px] text-white/35">Try fewer filters, or a different spelling.</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                {rows.map((game) => (
                                    <GameCard key={`${game.id}-${game.slug}`} game={game} />
                                ))}
                            </div>

                            {/* Pushed to the floor of the column, so it lands
                                level with the bottom of the filter rail at any
                                width — a fixed number of cards could not, since
                                the grid is 2, 3 or 5 across depending on room. */}
                            {data?.next && (
                                <div className="mt-auto pt-8 flex justify-center">
                                    <button
                                        onClick={() => setPage((p) => p + 1)}
                                        disabled={isLoading}
                                        className="inline-flex items-center gap-2 h-10 px-6 rounded-[9px] border border-white/[0.09] bg-white/[0.03] hover:bg-white/[0.06] font-display text-[11px] font-black uppercase tracking-[0.1em] text-white/70 transition-colors"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                        Load more games
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* ── right rail ── */}
                <aside className="hidden xl:block space-y-4 sticky top-4">
                    <RailPanel title="Most wishlisted" icon={<Heart className="w-3.5 h-3.5 text-[var(--accent)]" />}>
                        {hub?.data.most_wishlisted.length ? (
                            <div className="space-y-2.5">
                                {hub.data.most_wishlisted.map((g) => (
                                    <Link key={g.slug} href={`/games/${g.slug}`} className="flex items-center gap-2.5 group">
                                        <span className="w-[44px] h-[29px] shrink-0 rounded-[5px] overflow-hidden bg-white/[0.05]">
                                            {g.cover_url && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={g.cover_url} alt="" aria-hidden loading="lazy" className="w-full h-full object-cover" />
                                            )}
                                        </span>
                                        <span className="flex-1 min-w-0 text-[12px] font-medium text-white/70 group-hover:text-white truncate">
                                            {g.name}
                                        </span>
                                        <span className="font-display text-[10px] font-bold tabular-nums text-white/25">
                                            {g.wishlists}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[11.5px] text-white/30">
                                No wishlists yet — the first one lands here.
                            </p>
                        )}
                    </RailPanel>

                    <RecentlyViewed />
                </aside>
            </div>

            {/* ── what the catalogue actually is ── */}
            {stats && (
                <section className="border-t border-white/[0.07]">
                    <div className="container-page py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                        <Figure value={stats.games.toLocaleString()} label="Games in the database" />
                        <Figure value={stats.platforms.toLocaleString()} label="Platforms represented" />
                        <Figure value={stats.genres.toLocaleString()} label="Genres" />
                        <Figure value={stats.rated.toLocaleString()} label="Games with a score" />
                    </div>
                </section>
            )}
        </main>
    );
}

function Figure({ value, label }: { value: string; label: string }) {
    return (
        <div className="flex flex-col">
            <span className="font-display text-[20px] font-black tabular-nums text-[var(--accent)] leading-none">{value}</span>
            <span className="mt-1 text-[11px] text-white/35">{label}</span>
        </div>
    );
}

function RailPanel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="rounded-[14px] border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="flex items-center gap-2 mb-3 font-display text-[10px] font-black uppercase tracking-[0.14em] text-white">
                {icon} {title}
            </p>
            {children}
        </div>
    );
}

function GameCard({ game }: { game: Game }) {
    const year = game.released ? new Date(game.released).getFullYear() : null;

    return (
        <Link href={`/games/${game.slug}`} className="group block" onClick={() => remember(game)}>
            <span className="relative block h-[190px] rounded-[10px] overflow-hidden border border-white/[0.07] group-hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors">
                {game.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={game.cover_url}
                        alt={game.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
                    />
                ) : (
                    <span className="w-full h-full flex items-center justify-center bg-white/[0.03] text-white/15">
                        <Gamepad2 className="w-7 h-7" />
                    </span>
                )}

                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />

                {year && (
                    <span className="absolute top-2 left-2 inline-flex items-center h-[20px] px-2 rounded-[5px] bg-black/65 backdrop-blur-sm font-display text-[9.5px] font-black tabular-nums text-white/80">
                        {year}
                    </span>
                )}

                <span className="absolute inset-x-0 bottom-0 p-2.5">
                    <span className="block font-display text-[11.5px] font-black text-white leading-tight line-clamp-2">
                        {game.name}
                    </span>
                </span>
            </span>

            {/* Only what we actually hold. Most of the catalogue has no score,
                and an empty row reads better than an invented one. */}
            <span className="mt-1.5 flex items-center gap-3 h-[14px]">
                {game.rating ? (
                    <span className="inline-flex items-center gap-1 font-display text-[10px] font-black tabular-nums text-amber-400">
                        <Star className="w-3 h-3 fill-current" /> {game.rating.toFixed(1)}
                    </span>
                ) : null}
            </span>
        </Link>
    );
}

/* ── recently viewed: the browser's business, not the database's ──────── */

const RECENT_KEY = "techplay.recent-games";

function remember(game: Game) {
    if (typeof window === "undefined") return;

    try {
        const prev: Game[] = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
        const next = [game, ...prev.filter((g) => g.slug !== game.slug)].slice(0, 6);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
        // A full or blocked localStorage is not worth a broken page.
    }
}

function RecentlyViewed() {
    const [recent, setRecent] = useState<Game[]>([]);

    useEffect(() => {
        try {
            setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"));
        } catch {
            setRecent([]);
        }
    }, []);

    return (
        <RailPanel title="Recently viewed" icon={<Clock className="w-3.5 h-3.5 text-[var(--accent)]" />}>
            {recent.length ? (
                <div className="space-y-2.5">
                    {recent.map((g) => (
                        <Link key={g.slug} href={`/games/${g.slug}`} className="flex items-center gap-2.5 group">
                            <span className="w-[44px] h-[29px] shrink-0 rounded-[5px] overflow-hidden bg-white/[0.05]">
                                {g.cover_url && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={g.cover_url} alt="" aria-hidden loading="lazy" className="w-full h-full object-cover" />
                                )}
                            </span>
                            <span className="flex-1 min-w-0 text-[12px] font-medium text-white/70 group-hover:text-white truncate">
                                {g.name}
                            </span>
                        </Link>
                    ))}
                </div>
            ) : (
                <p className="text-[11.5px] text-white/30">Games you open will show up here.</p>
            )}
        </RailPanel>
    );
}
