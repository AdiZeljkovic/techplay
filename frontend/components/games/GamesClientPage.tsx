"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Search, Calendar, Database, Gamepad2, ChevronLeft, ChevronRight, Star, Filter, SlidersHorizontal } from "lucide-react";
import PageHero from "@/components/ui/PageHero";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface ParentPlatform {
    platform: { id: number; name: string; slug: string };
}

interface Game {
    id: number;
    name: string;
    slug: string;
    background_image: string;
    released: string;
    tba: boolean;
    metacritic: number;
    rating: number;
    ratings_count: number;
    genres: { id: number; name: string }[];
    parent_platforms: ParentPlatform[];
    short_screenshots: { id: number; image: string }[];
}

interface GamesResponse {
    results: Game[];
    count: number;
    next: string | null;
    previous: string | null;
}

const GENRES = [
    { id: "",  name: "All Genres" },
    { id: "4",  name: "Action" },
    { id: "3",  name: "Adventure" },
    { id: "5",  name: "RPG" },
    { id: "10", name: "Strategy" },
    { id: "2",  name: "Shooter" },
    { id: "7",  name: "Puzzle" },
    { id: "1",  name: "Racing" },
    { id: "15", name: "Sports" },
    { id: "6",  name: "Fighting" },
    { id: "83", name: "Platformer" },
    { id: "14", name: "Simulation" },
    { id: "51", name: "Indie" },
    { id: "59", name: "MMO" },
];

const PLATFORMS = [
    { id: "",    name: "All Platforms" },
    { id: "4",   name: "PC" },
    { id: "187", name: "PlayStation 5" },
    { id: "18",  name: "PlayStation 4" },
    { id: "186", name: "Xbox Series X" },
    { id: "1",   name: "Xbox One" },
    { id: "7",   name: "Nintendo Switch" },
    { id: "3",   name: "iOS" },
    { id: "21",  name: "Android" },
];

const SORT_OPTIONS = [
    { value: "-metacritic", label: "Metacritic Score" },
    { value: "-rating",     label: "RAWG Rating" },
    { value: "-added",      label: "Most Popular" },
    { value: "-released",   label: "Newest First" },
    { value: "released",    label: "Oldest First" },
    { value: "name",        label: "A–Z" },
    { value: "-name",       label: "Z–A" },
];

const PLATFORM_ICONS: Record<string, string> = {
    pc:          "PC",
    playstation: "PS",
    xbox:        "XB",
    nintendo:    "NS",
    mac:         "Mac",
    linux:       "Linux",
    ios:         "iOS",
    android:     "And",
};

const getMetacriticColor = (score: number) => {
    if (score >= 75) return "bg-green-600 text-white";
    if (score >= 50) return "bg-yellow-500 text-black";
    return "bg-red-600 text-white";
};

const getRatingColor = (rating: number) => {
    if (rating >= 4)   return "text-green-400";
    if (rating >= 3)   return "text-yellow-400";
    if (rating >= 2)   return "text-orange-400";
    return "text-red-400";
};

export default function GamesClientPage() {
    const [search, setSearch]               = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [genre, setGenre]                 = useState("");
    const [platform, setPlatform]           = useState("");
    const [ordering, setOrdering]           = useState("-metacritic");
    const [page, setPage]                   = useState(1);
    const [filtersOpen, setFiltersOpen]     = useState(false);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(t);
    }, [search]);

    // Reset to page 1 on filter change
    useEffect(() => { setPage(1); }, [debouncedSearch, genre, platform, ordering]);

    const buildUrl = () => {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (genre)           params.set("genres", genre);
        if (platform)        params.set("platforms", platform);
        params.set("ordering", ordering);
        params.set("page", String(page));
        return `/games?${params.toString()}`;
    };

    const { data, isLoading } = useSWR<GamesResponse>(buildUrl(), fetcher);

    const totalPages = data ? Math.ceil(data.count / 24) : 0;
    const hasFilters = genre || platform || ordering !== "-metacritic" || debouncedSearch;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <PageHero
                title="Game Database"
                description="Explore thousands of games powered by RAWG.io. Find your next adventure."
                icon={Database}
            />

            {/* Search */}
            <div className="container mx-auto px-4 -mt-16 md:-mt-20 relative z-30 mb-6">
                <div className="max-w-2xl mx-auto relative group">
                    <div className="absolute inset-x-0 top-0 h-full bg-[var(--accent)]/10 blur-3xl rounded-full opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="relative shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] rounded-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--accent)] w-6 h-6" />
                        <input
                            type="text"
                            placeholder="Search thousands of games..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#0f1221] border-2 border-[var(--border)] rounded-full py-5 pl-16 pr-14 text-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-[var(--accent)] transition-all font-medium"
                        />
                        {search && (
                            <button onClick={() => { setSearch(""); setDebouncedSearch(""); }}
                                className="absolute right-6 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="container mx-auto px-4 mb-8">
                <div className="flex flex-col gap-4">
                    {/* Filter toggle (mobile) + desktop inline */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setFiltersOpen(!filtersOpen)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all md:hidden ${filtersOpen ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] text-[var(--text-muted)] bg-[var(--bg-card)]'}`}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            Filters {hasFilters && <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />}
                        </button>

                        {/* Desktop filters always visible */}
                        <div className="hidden md:flex items-center gap-3 flex-wrap">
                            <Filter className="w-4 h-4 text-[var(--text-muted)]" />
                            <select value={genre} onChange={(e) => setGenre(e.target.value)}
                                className="bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)] px-3 py-2 rounded-xl focus:outline-none focus:border-[var(--accent)] transition-all cursor-pointer">
                                {GENRES.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                            <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                                className="bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)] px-3 py-2 rounded-xl focus:outline-none focus:border-[var(--accent)] transition-all cursor-pointer">
                                {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <select value={ordering} onChange={(e) => setOrdering(e.target.value)}
                                className="bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)] px-3 py-2 rounded-xl focus:outline-none focus:border-[var(--accent)] transition-all cursor-pointer">
                                {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                            {hasFilters && (
                                <button onClick={() => { setGenre(""); setPlatform(""); setOrdering("-metacritic"); setSearch(""); setDebouncedSearch(""); }}
                                    className="text-xs text-[var(--accent)] hover:underline font-medium px-2">
                                    Clear filters
                                </button>
                            )}
                        </div>

                        <span className="text-sm text-[var(--text-muted)] font-mono bg-[var(--bg-card)] px-3 py-1.5 rounded-full border border-white/5">
                            {data?.count?.toLocaleString() ?? 0} games
                        </span>
                    </div>

                    {/* Mobile filters dropdown */}
                    {filtersOpen && (
                        <div className="md:hidden flex flex-col gap-3 p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
                            <select value={genre} onChange={(e) => setGenre(e.target.value)}
                                className="bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-secondary)] px-3 py-2.5 rounded-xl focus:outline-none focus:border-[var(--accent)] w-full">
                                {GENRES.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                            <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                                className="bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-secondary)] px-3 py-2.5 rounded-xl focus:outline-none focus:border-[var(--accent)] w-full">
                                {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <select value={ordering} onChange={(e) => setOrdering(e.target.value)}
                                className="bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-secondary)] px-3 py-2.5 rounded-xl focus:outline-none focus:border-[var(--accent)] w-full">
                                {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                            {hasFilters && (
                                <button onClick={() => { setGenre(""); setPlatform(""); setOrdering("-metacritic"); setSearch(""); setDebouncedSearch(""); setFiltersOpen(false); }}
                                    className="text-sm text-[var(--accent)] font-medium text-center py-1">
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Grid */}
            <div className="container mx-auto px-4 pb-20">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5 text-[var(--accent)]" />
                        {debouncedSearch ? `Results for "${debouncedSearch}"` : SORT_OPTIONS.find(s => s.value === ordering)?.label ?? "Games"}
                    </h2>
                    {totalPages > 1 && (
                        <span className="text-xs text-[var(--text-muted)]">
                            Page {page} of {totalPages.toLocaleString()}
                        </span>
                    )}
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(24)].map((_, i) => (
                            <div key={i} className="h-80 bg-[var(--bg-card)] rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : data?.results && data.results.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {data.results.map((game) => (
                                <GameCard key={game.id} game={game} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                        )}
                    </>
                ) : (
                    <div className="text-center py-24 bg-[var(--bg-card)]/50 border border-[var(--border)] rounded-3xl">
                        <Database className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-6 opacity-30" />
                        <h3 className="text-2xl font-bold text-white mb-2">No games found</h3>
                        <p className="text-[var(--text-secondary)] mb-6">
                            {search ? `No results for "${search}".` : "Try different filters."}
                        </p>
                        <button onClick={() => { setSearch(""); setDebouncedSearch(""); setGenre(""); setPlatform(""); setOrdering("-metacritic"); }}
                            className="text-[var(--accent)] hover:underline font-medium">
                            Clear all filters
                        </button>
                    </div>
                )}
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

    return (
        <Link
            href={`/games/${game.slug}`}
            className="group bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-[var(--accent)] transition-all flex flex-col hover:shadow-2xl hover:shadow-[var(--accent)]/10"
        >
            {/* Image */}
            <div className="relative h-44 overflow-hidden bg-[var(--bg-elevated)]"
                onMouseLeave={() => setHoverIdx(null)}>
                {displayImg ? (
                    <Image
                        src={displayImg}
                        alt={game.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={() => setImgSrc("")}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Database className="w-10 h-10 text-[var(--text-muted)]" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                {/* TBA or Metacritic badge */}
                <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                    {game.tba && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--accent)] text-white shadow-lg">TBA</span>
                    )}
                    {game.metacritic ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-bold shadow-lg ${getMetacriticColor(game.metacritic)}`}>
                            {game.metacritic}
                        </span>
                    ) : null}
                </div>

                {/* Platform icons */}
                {game.parent_platforms && game.parent_platforms.length > 0 && (
                    <div className="absolute bottom-2 left-2.5 flex gap-1 flex-wrap">
                        {game.parent_platforms.slice(0, 4).map(({ platform }) => (
                            <span key={platform.slug}
                                className="px-1.5 py-0.5 bg-black/70 backdrop-blur-sm text-[9px] font-bold text-white/80 rounded border border-white/10">
                                {PLATFORM_ICONS[platform.slug] ?? platform.name.slice(0, 3).toUpperCase()}
                            </span>
                        ))}
                    </div>
                )}

                {/* Screenshot hover dots */}
                {screenshots.length > 0 && (
                    <div className="absolute bottom-2 right-2 hidden group-hover:flex gap-1">
                        {screenshots.slice(0, 4).map((_, i) => (
                            <span key={i}
                                onMouseEnter={() => setHoverIdx(i)}
                                className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${hoverIdx === i ? 'bg-[var(--accent)] scale-125' : 'bg-white/50'}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent)] transition-colors line-clamp-2 leading-snug">
                    {game.name}
                </h3>

                <div className="flex flex-wrap gap-1 mb-3">
                    {game.genres?.slice(0, 2).map(g => (
                        <span key={g.id} className="bg-[var(--bg-elevated)] px-2 py-0.5 rounded text-[10px] text-[var(--text-muted)] border border-white/5">
                            {g.name}
                        </span>
                    ))}
                </div>

                <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                        <Calendar className="w-3 h-3" />
                        <span>{game.tba ? "TBA" : (game.released?.slice(0, 4) ?? "—")}</span>
                    </div>

                    {Number(game.rating) > 0 && (
                        <div className={`flex items-center gap-1 text-xs font-bold ${getRatingColor(Number(game.rating))}`}>
                            <Star className="w-3 h-3 fill-current" />
                            {Number(game.rating).toFixed(1)}
                        </div>
                    )}
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

    const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    const go = (p: number) => { onChange(p); scrollTop(); };

    return (
        <div className="flex items-center justify-center gap-2 mt-12">
            <button
                onClick={() => go(page - 1)} disabled={page === 1}
                className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronLeft className="w-4 h-4" />
            </button>

            {page > 3 && totalPages > MAX_SHOWN && (
                <>
                    <PageBtn n={1} current={page} onClick={go} />
                    <span className="text-[var(--text-muted)] px-1">…</span>
                </>
            )}

            {getPages().map(n => <PageBtn key={n} n={n} current={page} onClick={go} />)}

            {page < totalPages - 2 && totalPages > MAX_SHOWN && (
                <>
                    <span className="text-[var(--text-muted)] px-1">…</span>
                    <PageBtn n={totalPages} current={page} onClick={go} />
                </>
            )}

            <button
                onClick={() => go(page + 1)} disabled={page >= totalPages}
                className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}

function PageBtn({ n, current, onClick }: { n: number; current: number; onClick: (n: number) => void }) {
    const active = n === current;
    return (
        <button onClick={() => onClick(n)}
            className={`w-9 h-9 rounded-xl text-sm font-medium transition-all border ${active
                ? "bg-[var(--accent)] border-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20"
                : "bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
            }`}>
            {n}
        </button>
    );
}
