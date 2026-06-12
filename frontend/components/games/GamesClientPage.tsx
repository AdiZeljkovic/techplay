"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Search, Database, Gamepad2, ChevronLeft, ChevronRight,
    Star, SlidersHorizontal, X
} from "lucide-react";
import ListingEmptyState from "@/components/ui/ListingEmptyState";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface Game {
    id: number;
    name: string;
    slug: string;
    background_image: string;
    released: string | null;
    rating: number;
    metacritic: null;
    platforms: { platform_id: number; platform_name: string }[];
    short_screenshots: { image: string; thumbnail_image?: string }[];
}

interface GamesResponse {
    results: Game[];
    count: number;
    next: string | null;
    previous: string | null;
}

const PAGE_SIZE = 24;

// Genre names match MobyGames "Basic Genres" values stored in genre_names[]
const GENRES = [
    { id: "Action",             name: "Action" },
    { id: "Adventure",          name: "Adventure" },
    { id: "Role-Playing (RPG)", name: "RPG" },
    { id: "Strategy / tactics", name: "Strategy" },
    { id: "Simulation",         name: "Simulation" },
    { id: "Sports",             name: "Sports" },
    { id: "Racing / Driving",   name: "Racing" },
    { id: "Puzzle",             name: "Puzzle" },
    { id: "Fighting",           name: "Fighting" },
    { id: "Shooter",            name: "Shooter" },
];

// Platform names match normalized platform_names[] values stored in DB
const PLATFORMS = [
    { id: "PC",          name: "PC" },
    { id: "PlayStation", name: "PlayStation" },
    { id: "Xbox",        name: "Xbox" },
    { id: "Nintendo",    name: "Nintendo" },
    { id: "Mobile",      name: "Mobile" },
];

const ERAS = [
    { id: "",      name: "All Time", from: 0,    to: 0 },
    { id: "2020s", name: "2020s",    from: 2020, to: 0 },
    { id: "2010s", name: "2010s",    from: 2010, to: 2019 },
    { id: "2000s", name: "2000s",    from: 2000, to: 2009 },
    { id: "1990s", name: "1990s",    from: 1990, to: 1999 },
    { id: "retro", name: "Retro",    from: 0,    to: 1989 },
];

const SCORES = [
    { id: "",  name: "Any score" },
    { id: "7", name: "7+" },
    { id: "8", name: "8+" },
    { id: "9", name: "9+" },
];

const SORT_OPTIONS = [
    { value: "-rating",   label: "Top Rated" },
    { value: "-released", label: "Newest" },
    { value: "released",  label: "Oldest" },
    { value: "name",      label: "A–Z" },
];

// MobyGames rating is 0-10 scale
function ratingClasses(rating: number) {
    if (rating >= 7.5) return "bg-green-500/15 text-green-500 border-green-500/25";
    if (rating >= 5)   return "bg-yellow-500/15 text-yellow-500 border-yellow-500/25";
    return "bg-red-500/15 text-red-500 border-red-500/25";
}

/** Colored platform chip for MobyGames platform names */
function platformChip(name: string): { label: string; cls: string } | null {
    if (/windows|dos|linux|mac/i.test(name))  return { label: "PC",     cls: "bg-[#2F6FED]" };
    if (/playstation 5/i.test(name))          return { label: "PS5",    cls: "bg-[#1A3FA8]" };
    if (/playstation 4/i.test(name))          return { label: "PS4",    cls: "bg-[#1A3FA8]" };
    if (/playstation/i.test(name))            return { label: "PS",     cls: "bg-[#1A3FA8]" };
    if (/xbox series/i.test(name))            return { label: "SERIES", cls: "bg-[#107C10]" };
    if (/xbox one/i.test(name))               return { label: "ONE",    cls: "bg-[#107C10]" };
    if (/xbox/i.test(name))                   return { label: "XBOX",   cls: "bg-[#107C10]" };
    if (/nintendo|switch|wii|gamecube/i.test(name)) return { label: "NINTENDO", cls: "bg-[#E60012]" };
    if (/android/i.test(name))                return { label: "ANDROID", cls: "bg-zinc-600" };
    if (/iphone|ipad|ios/i.test(name))        return { label: "iOS",    cls: "bg-zinc-600" };
    return null;
}

/* ── Facet group in the sidebar ── */
function FacetGroup({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="pb-5 mb-5 border-b border-zinc-200 dark:border-white/[0.05] last:border-b-0 last:pb-0 last:mb-0">
            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-[#71717A] mb-3">
                <span className="w-1 h-3 bg-tp-accent rounded-sm" />
                {label}
            </span>
            <div className="flex flex-wrap gap-1.5">{children}</div>
        </div>
    );
}

function FacetPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border ${
                active
                    ? "bg-tp-accent border-tp-accent text-white shadow-[0_0_12px_rgba(252,65,0,0.25)]"
                    : "bg-zinc-50 dark:bg-[#070A0F] border-zinc-200 dark:border-[#161B22] text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-white hover:border-tp-accent/40"
            }`}
        >
            {children}
        </button>
    );
}

export default function GamesClientPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize state from URL (shareable links)
    const [search, setSearch]   = useState(() => searchParams.get("search") || "");
    const [genre, setGenre]     = useState(() => searchParams.get("genre") || "");
    const [platform, setPlatform] = useState(() => searchParams.get("platform") || "");
    const [era, setEra]         = useState(() => searchParams.get("era") || "");
    const [score, setScore]     = useState(() => searchParams.get("score") || "");
    const [ordering, setOrdering] = useState(() => searchParams.get("sort") || "-rating");
    const [page, setPage]       = useState(() => Math.max(1, parseInt(searchParams.get("page") || "1", 10)));
    const [filtersOpen, setFiltersOpen] = useState(false);

    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 450);
        return () => clearTimeout(t);
    }, [search]);

    // Reset to page 1 on any filter change
    useEffect(() => { setPage(1); }, [debouncedSearch, genre, platform, era, score, ordering]);

    // Keep URL in sync (shareable / back-button friendly)
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (genre)    params.set("genre", genre);
        if (platform) params.set("platform", platform);
        if (era)      params.set("era", era);
        if (score)    params.set("score", score);
        if (ordering !== "-rating") params.set("sort", ordering);
        if (page > 1) params.set("page", String(page));
        const qs = params.toString();
        router.replace(`/games${qs ? `?${qs}` : ""}`, { scroll: false });
    }, [debouncedSearch, genre, platform, era, score, ordering, page, router]);

    const apiUrl = useMemo(() => {
        const eraDef = ERAS.find(e => e.id === era);
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (genre)           params.set("genres", genre);
        if (platform)        params.set("platforms", platform);
        if (eraDef?.from)    params.set("year_from", String(eraDef.from));
        if (eraDef?.to)      params.set("year_to", String(eraDef.to));
        if (score)           params.set("min_rating", score);
        params.set("ordering", ordering);
        params.set("page", String(page));
        params.set("page_size", String(PAGE_SIZE));
        return `/games?${params.toString()}`;
    }, [debouncedSearch, genre, platform, era, score, ordering, page]);

    const { data, isLoading } = useSWR<GamesResponse>(apiUrl, fetcher, { keepPreviousData: true });

    const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

    const activeFilters: { label: string; clear: () => void }[] = [];
    if (genre)    activeFilters.push({ label: GENRES.find(g => g.id === genre)?.name || genre, clear: () => setGenre("") });
    if (platform) activeFilters.push({ label: platform, clear: () => setPlatform("") });
    if (era)      activeFilters.push({ label: ERAS.find(e => e.id === era)?.name || era, clear: () => setEra("") });
    if (score)    activeFilters.push({ label: `MobyScore ${score}+`, clear: () => setScore("") });
    if (debouncedSearch) activeFilters.push({ label: `"${debouncedSearch}"`, clear: () => setSearch("") });

    const clearAll = () => { setSearch(""); setGenre(""); setPlatform(""); setEra(""); setScore(""); setOrdering("-rating"); };

    const facets = (
        <>
            <FacetGroup label="Genre">
                <FacetPill active={genre === ""} onClick={() => setGenre("")}>All</FacetPill>
                {GENRES.map(g => (
                    <FacetPill key={g.id} active={genre === g.id} onClick={() => setGenre(genre === g.id ? "" : g.id)}>
                        {g.name}
                    </FacetPill>
                ))}
            </FacetGroup>

            <FacetGroup label="Platform">
                <FacetPill active={platform === ""} onClick={() => setPlatform("")}>All</FacetPill>
                {PLATFORMS.map(p => (
                    <FacetPill key={p.id} active={platform === p.id} onClick={() => setPlatform(platform === p.id ? "" : p.id)}>
                        {p.name}
                    </FacetPill>
                ))}
            </FacetGroup>

            <FacetGroup label="Era">
                {ERAS.map(e => (
                    <FacetPill key={e.id} active={era === e.id} onClick={() => setEra(e.id)}>
                        {e.name}
                    </FacetPill>
                ))}
            </FacetGroup>

            <FacetGroup label="MobyScore">
                {SCORES.map(s => (
                    <FacetPill key={s.id} active={score === s.id} onClick={() => setScore(s.id)}>
                        {s.name}
                    </FacetPill>
                ))}
            </FacetGroup>

            <FacetGroup label="Sort by">
                {SORT_OPTIONS.map(s => (
                    <FacetPill key={s.value} active={ordering === s.value} onClick={() => setOrdering(s.value)}>
                        {s.label}
                    </FacetPill>
                ))}
            </FacetGroup>
        </>
    );

    return (
        <div className="min-h-screen">

            {/* ── HERO with big search ── */}
            <div className="relative w-full mb-10 overflow-hidden bg-zinc-50 dark:bg-[#05070A] border-b border-zinc-200 dark:border-[#161B22] transition-colors duration-300">
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute -top-[150px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-tp-accent/5 dark:bg-tp-accent/10 blur-[120px] rounded-full" />
                    <div
                        className="absolute inset-0 opacity-[0.15] dark:opacity-[0.04]"
                        style={{ backgroundImage: 'radial-gradient(1px 1px at 50% 50%, rgba(120,120,130,0.8) 1px, transparent 0)', backgroundSize: '32px 32px' }}
                    />
                    <div className="absolute top-0 left-[25%] w-[50%] h-[1px] bg-gradient-to-r from-transparent via-tp-accent/30 dark:via-tp-accent/40 to-transparent" />
                </div>

                <div className="relative z-10 max-w-[1320px] mx-auto px-4 xl:px-0 pt-14 pb-12 flex flex-col items-center text-center">
                    <div className="w-[52px] h-[52px] rounded-xl bg-tp-accent/10 border border-tp-accent/20 flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(252,65,0,0.15)]">
                        <Database className="w-6 h-6 text-tp-accent" strokeWidth={1.75} />
                    </div>

                    <h1 className="font-display text-[36px] md:text-[52px] font-black text-zinc-900 dark:text-white uppercase leading-[0.95] tracking-tight mb-4">
                        GAME <span className="text-tp-accent">DATABASE</span>
                    </h1>
                    <p className="text-[15px] md:text-[16px] text-zinc-600 dark:text-[#A1A1AA] max-w-2xl leading-relaxed mb-9">
                        {data?.count ? `${data.count.toLocaleString()} games at your fingertips.` : "Thousands of games at your fingertips."} Search, filter and discover your next adventure.
                    </p>

                    {/* Big search */}
                    <div className="w-full max-w-2xl relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-tp-accent w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search the database..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-full h-[60px] pl-16 pr-14 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#71717A] focus:outline-none focus:border-tp-accent/50 transition-all shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 dark:text-[#71717A] hover:text-tp-accent hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                                aria-label="Clear search"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 pb-20">
                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* ── FACET SIDEBAR (desktop) ── */}
                    <aside className="hidden lg:block w-[280px] shrink-0 sticky top-[130px]">
                        <div className="bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-[20px] p-6 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-colors duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-display text-[15px] font-bold text-zinc-900 dark:text-white uppercase tracking-[0.06em]">Filters</h2>
                                {activeFilters.length > 0 && (
                                    <button onClick={clearAll} className="text-[10px] font-bold uppercase tracking-widest text-tp-accent hover:text-tp-accent-hover transition-colors">
                                        Clear all
                                    </button>
                                )}
                            </div>
                            {facets}
                        </div>
                    </aside>

                    {/* ── RESULTS ── */}
                    <div className="flex-1 min-w-0 w-full">

                        {/* Mobile filter toggle */}
                        <div className="lg:hidden mb-5">
                            <button
                                onClick={() => setFiltersOpen(!filtersOpen)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all w-full justify-center ${
                                    filtersOpen || activeFilters.length > 0
                                        ? "border-tp-accent/40 text-tp-accent bg-tp-accent/5"
                                        : "border-zinc-200 dark:border-[#161B22] text-zinc-600 dark:text-[#A1A1AA] bg-white dark:bg-[#0B0E14]"
                                }`}
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                                Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
                            </button>
                            {filtersOpen && (
                                <div className="mt-3 bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-[20px] p-5">
                                    {facets}
                                </div>
                            )}
                        </div>

                        {/* Header row */}
                        <div className="flex items-end justify-between mb-6 pb-4 border-b border-zinc-200 dark:border-white/5">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-1.5 h-5 bg-tp-accent rounded-sm shrink-0" />
                                <h2 className="font-display text-[20px] font-bold text-zinc-900 dark:text-white uppercase tracking-[0.04em] leading-none truncate">
                                    {debouncedSearch ? `Results for "${debouncedSearch}"` : SORT_OPTIONS.find(s => s.value === ordering)?.label ?? "Games"}
                                </h2>
                            </div>
                            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-[#71717A] leading-none shrink-0 ml-3">
                                {data?.count?.toLocaleString() ?? 0} GAMES
                            </span>
                        </div>

                        {/* Active filter chips */}
                        {activeFilters.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap mb-6">
                                {activeFilters.map((f) => (
                                    <button
                                        key={f.label}
                                        onClick={f.clear}
                                        className="group flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-tp-accent/10 border border-tp-accent/25 text-tp-accent text-[11px] font-bold uppercase tracking-wider hover:bg-tp-accent hover:text-white transition-all"
                                    >
                                        {f.label}
                                        <X className="w-3 h-3" />
                                    </button>
                                ))}
                                <button onClick={clearAll} className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-[#71717A] hover:text-tp-accent transition-colors px-2">
                                    Clear all
                                </button>
                            </div>
                        )}

                        {/* Grid */}
                        {isLoading && !data ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="h-[260px] bg-zinc-100 dark:bg-[#0B0E14] rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : data?.results && data.results.length > 0 ? (
                            <>
                                <div className={`grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 transition-opacity ${isLoading ? "opacity-60" : ""}`}>
                                    {data.results.map((game) => (
                                        <GameCard key={game.id} game={game} />
                                    ))}
                                </div>

                                {totalPages > 1 && (
                                    <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                                )}
                            </>
                        ) : (
                            <ListingEmptyState
                                icon={Gamepad2}
                                title="No games found"
                                description={debouncedSearch ? `No results for "${debouncedSearch}". Try a different search.` : "Try adjusting your filters."}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function GameCard({ game }: { game: Game }) {
    const [imgSrc, setImgSrc] = useState(game.background_image);
    const screenshots = game.short_screenshots?.slice(1) ?? []; // skip first (same as bg)
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);

    const displayImg = hoverIdx !== null && screenshots[hoverIdx]
        ? screenshots[hoverIdx].image
        : imgSrc;

    // Deduped colored platform chips
    const chips = useMemo(() => {
        const out: { label: string; cls: string }[] = [];
        for (const p of game.platforms ?? []) {
            const chip = platformChip(p.platform_name);
            if (chip && !out.some(c => c.label === chip.label)) out.push(chip);
        }
        return out.slice(0, 4);
    }, [game.platforms]);

    const rating = Number(game.rating) || 0;

    return (
        <Link
            href={`/games/${game.slug}`}
            className="group bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-xl overflow-hidden hover:border-tp-accent/50 dark:hover:border-tp-accent/50 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] transition-all duration-300 flex flex-col"
        >
            {/* Image */}
            <div className="relative h-[150px] overflow-hidden bg-zinc-100 dark:bg-[#10141B]" onMouseLeave={() => setHoverIdx(null)}>
                {displayImg ? (
                    <Image
                        src={displayImg}
                        alt={game.name}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 250px"
                        quality={70}
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={() => setImgSrc("")}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Gamepad2 className="w-8 h-8 text-zinc-300 dark:text-white/10" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70" />

                {/* Rating badge */}
                {rating > 0 && (
                    <div className={`absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-lg border backdrop-blur-md text-[12px] font-bold ${ratingClasses(rating)}`}>
                        <Star className="w-3 h-3 fill-current" />
                        {rating.toFixed(1)}
                    </div>
                )}

                {/* Year */}
                {game.released && (
                    <span className="absolute bottom-2.5 left-2.5 text-[10px] font-bold tracking-widest text-white/85 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
                        {game.released.slice(0, 4)}
                    </span>
                )}

                {/* Screenshot hover dots */}
                {screenshots.length > 0 && (
                    <div className="absolute bottom-2.5 right-2.5 hidden group-hover:flex gap-1">
                        {screenshots.slice(0, 4).map((_, i) => (
                            <span
                                key={i}
                                onMouseEnter={() => setHoverIdx(i)}
                                className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${hoverIdx === i ? "bg-tp-accent scale-125" : "bg-white/50"}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="p-3.5 flex-1 flex flex-col">
                <h3 className="text-[13px] font-bold text-zinc-900 dark:text-white leading-snug mb-2.5 group-hover:text-tp-accent transition-colors line-clamp-2">
                    {game.name}
                </h3>

                <div className="mt-auto flex flex-wrap gap-1">
                    {chips.map((chip) => (
                        <span key={chip.label} className={`${chip.cls} text-white text-[7.5px] font-bold tracking-wider px-1 py-[2px] rounded-[3px] leading-none`}>
                            {chip.label}
                        </span>
                    ))}
                </div>
            </div>
        </Link>
    );
}

function Pagination({ page, totalPages, onChange }: {
    page: number;
    totalPages: number;
    onChange: (p: number) => void;
}) {
    const MAX_SHOWN = 5;

    const getPages = () => {
        if (totalPages <= MAX_SHOWN) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const half = Math.floor(MAX_SHOWN / 2);
        let start = Math.max(1, page - half);
        let end = start + MAX_SHOWN - 1;
        if (end > totalPages) { end = totalPages; start = Math.max(1, end - MAX_SHOWN + 1); }
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };

    const go = (p: number) => {
        onChange(p);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const btnBase = "w-10 h-10 rounded-lg flex items-center justify-center text-[12px] font-bold transition-all border";
    const btnIdle = "bg-white dark:bg-[#0B0E14] border-zinc-200 dark:border-[#161B22] text-zinc-600 dark:text-[#A1A1AA] hover:border-tp-accent/40 hover:text-tp-accent";

    return (
        <div className="flex items-center justify-center gap-1.5 mt-12 flex-wrap">
            <button
                onClick={() => go(page - 1)} disabled={page === 1}
                className={`${btnBase} ${btnIdle} disabled:opacity-30 disabled:cursor-not-allowed`}
                aria-label="Previous page"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>

            {page > 3 && totalPages > MAX_SHOWN && (
                <>
                    <button onClick={() => go(1)} className={`${btnBase} ${btnIdle}`}>1</button>
                    <span className="text-zinc-400 dark:text-[#3F3F46] px-1">…</span>
                </>
            )}

            {getPages().map(n => (
                <button
                    key={n}
                    onClick={() => go(n)}
                    className={`${btnBase} ${n === page
                        ? "bg-tp-accent border-tp-accent text-white shadow-[0_0_15px_rgba(252,65,0,0.3)]"
                        : btnIdle
                    }`}
                >
                    {n}
                </button>
            ))}

            {page < totalPages - 2 && totalPages > MAX_SHOWN && (
                <>
                    <span className="text-zinc-400 dark:text-[#3F3F46] px-1">…</span>
                    <button onClick={() => go(totalPages)} className={`${btnBase} ${btnIdle}`}>{totalPages.toLocaleString()}</button>
                </>
            )}

            <button
                onClick={() => go(page + 1)} disabled={page >= totalPages}
                className={`${btnBase} ${btnIdle} disabled:opacity-30 disabled:cursor-not-allowed`}
                aria-label="Next page"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}
