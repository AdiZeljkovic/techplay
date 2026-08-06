"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Gamepad2, ChevronLeft, ChevronRight, Star, SlidersHorizontal, X, Swords, MonitorSmartphone, History, ArrowUpDown, Shuffle, ArrowRight, CalendarDays, Box, ChevronDown, RotateCcw, Loader2, type LucideIcon } from "lucide-react";
import ListingEmptyState from "@/components/ui/ListingEmptyState";
import TrackGameButton from "@/components/games/TrackGameButton";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface Game {
    id: number;
    name: string;
    slug: string;
    cover_url: string;
    released: string | null;
    rating: number;
    platforms: string[];
}

interface GamesResponse {
    results: Game[];
    count: number;
    next: string | null;
    previous: string | null;
}

const PAGE_SIZE = 24;

// Genre names match MobyGames "Basic Genres" values stored in genres[]
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

// Platform names match normalized platforms[] values stored in DB
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

const SORT_OPTIONS = [
    { value: "-rating",   label: "Top Rated" },
    { value: "-views",    label: "Trending" },
    { value: "-released", label: "Newest" },
    { value: "released",  label: "Oldest" },
    { value: "name",      label: "A–Z" },
];

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
function FacetGroup({ label, icon: Icon, isActive, children }: {
    label: string;
    icon: LucideIcon;
    isActive?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="pb-5 mb-5 border-b border-zinc-200 dark:border-white/[0.05] last:border-b-0 last:pb-0 last:mb-0">
            <span className="flex items-center gap-2.5 mb-3.5">
                <span className={`w-[26px] h-[26px] rounded-lg flex items-center justify-center border transition-colors ${
                    isActive
                        ? "bg-tp-accent/15 border-tp-accent/40"
                        : "bg-zinc-100 dark:bg-white/[0.04] border-zinc-200 dark:border-white/[0.06]"
                }`}>
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-tp-accent" : "text-zinc-500 dark:text-[#8B949E]"}`} strokeWidth={2.25} />
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-[#8B949E]">
                    {label}
                </span>
                {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-tp-accent shadow-[0_0_8px_rgba(220, 20, 60,0.9)]" />
                )}
            </span>
            {children}
        </div>
    );
}

function FacetPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-150 border ${
                active
                    ? "bg-gradient-to-b from-tp-accent to-[#D93A02] border-tp-accent text-white shadow-[0_2px_14px_rgba(220, 20, 60,0.35)]"
                    : "bg-zinc-50 dark:bg-white/[0.03] border-zinc-200 dark:border-white/[0.07] text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-white hover:border-tp-accent/50 hover:bg-tp-accent/[0.07]"
            }`}
        >
            {children}
        </button>
    );
}

/* Joined segmented control cell (Era / MobyScore) */
function SegmentButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`py-2 px-1 text-[10.5px] font-bold uppercase tracking-wider transition-all ${
                active
                    ? "bg-tp-accent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                    : "bg-white dark:bg-[#0B0E14] text-zinc-600 dark:text-[#8B949E] hover:text-zinc-900 dark:hover:text-white hover:bg-tp-accent/10"
            }`}
        >
            {children}
        </button>
    );
}

/* Styled sort <select> (sidebar + results bar) */
function SortSelect({ value, onChange, compact = false }: { value: string; onChange: (v: string) => void; compact?: boolean }) {
    return (
        <div className={`relative ${compact ? "" : "w-full"}`}>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`appearance-none bg-white dark:bg-[#070A0F] border border-zinc-200 dark:border-[#161B22] rounded-xl font-bold uppercase tracking-wider text-zinc-700 dark:text-white focus:outline-none focus:border-tp-accent/50 cursor-pointer transition-colors ${
                    compact ? "pl-3 pr-8 py-2 text-[10.5px]" : "w-full pl-4 pr-9 py-2.5 text-[11px]"
                }`}
            >
                {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-[#71717A] pointer-events-none" />
        </div>
    );
}

/* Promo shortcut card under the hero */
function PromoCard({ icon: Icon, title, desc, href, onClick }: {
    icon: LucideIcon;
    title: string;
    desc: string;
    href?: string;
    onClick?: () => void;
}) {
    const inner = (
        <>
            <span className="absolute -top-10 -right-10 w-32 h-32 bg-tp-accent/[0.07] blur-[50px] rounded-full pointer-events-none" />
            <span className="w-11 h-11 rounded-xl bg-tp-accent/10 border border-tp-accent/25 flex items-center justify-center mb-4 group-hover:bg-tp-accent/20 group-hover:shadow-[0_0_20px_rgba(220, 20, 60,0.25)] transition-all">
                <Icon className="w-5 h-5 text-tp-accent" strokeWidth={2} />
            </span>
            <h3 className="font-display text-[13px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.06em] mb-1.5">{title}</h3>
            <p className="text-[12px] text-zinc-500 dark:text-[#8B949E] leading-relaxed pr-5">{desc}</p>
            <ArrowRight className="absolute bottom-5 right-5 w-4 h-4 text-tp-accent opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </>
    );
    const cls = "group relative block text-left bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-2xl p-5 pb-6 hover:border-tp-accent/40 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden";
    return href
        ? <Link href={href} prefetch={false} className={cls}>{inner}</Link>
        : <button onClick={onClick} className={`${cls} w-full`}>{inner}</button>;
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
    const [showAllGenres, setShowAllGenres] = useState(false);
    const [randomLoading, setRandomLoading] = useState(false);

    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 450);
        return () => clearTimeout(t);
    }, [search]);

    // Reset to page 1 on any filter change — but NOT on mount, otherwise a
    // deep-linked ?page=N gets reset and the old page is fetched alongside
    // the new one (double request)
    const skipPageReset = useRef(true);
    useEffect(() => {
        if (skipPageReset.current) { skipPageReset.current = false; return; }
        setPage(1);
    }, [debouncedSearch, genre, platform, era, score, ordering]);

    // Keep URL in sync (shareable / back-button friendly).
    // history.replaceState instead of router.replace — the route is
    // force-dynamic, so router.replace would re-request the page from the
    // server (extra RSC roundtrip + counts toward the CF /games/* rate limit).
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
        window.history.replaceState(null, "", `/games${qs ? `?${qs}` : ""}`);
    }, [debouncedSearch, genre, platform, era, score, ordering, page]);

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

    const randomGame = async () => {
        if (randomLoading) return;
        setRandomLoading(true);
        try {
            const res = await axios.get("/games/random");
            if (res.data?.slug) router.push(`/games/${res.data.slug}`);
        } catch {
            // ignore — button simply does nothing on failure
        } finally {
            setRandomLoading(false);
        }
    };

    const scrollToGrid = () => {
        document.getElementById("games-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const quickChipCls = (active: boolean) =>
        `flex items-center gap-2 px-4 py-2 rounded-full border text-[12px] font-bold transition-all ${
            active
                ? "bg-tp-accent border-tp-accent text-white shadow-[0_2px_14px_rgba(220, 20, 60,0.35)]"
                : "bg-white dark:bg-white/[0.04] border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-[#C9D1D9] hover:border-tp-accent/50 hover:text-tp-accent"
        }`;

    const facets = (
        <>
            <FacetGroup label="Genre" icon={Swords} isActive={genre !== ""}>
                <div className="flex flex-wrap gap-1.5">
                    <FacetPill active={genre === ""} onClick={() => setGenre("")}>All</FacetPill>
                    {(showAllGenres ? GENRES : GENRES.slice(0, 7)).map(g => (
                        <FacetPill key={g.id} active={genre === g.id} onClick={() => setGenre(genre === g.id ? "" : g.id)}>
                            {g.name}
                        </FacetPill>
                    ))}
                    <button
                        onClick={() => setShowAllGenres(v => !v)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#71717A] hover:text-tp-accent transition-colors"
                    >
                        {showAllGenres ? "Show less" : "Show more"}
                        <ChevronDown className={`w-3 h-3 transition-transform ${showAllGenres ? "rotate-180" : ""}`} />
                    </button>
                </div>
            </FacetGroup>

            <FacetGroup label="Platform" icon={MonitorSmartphone} isActive={platform !== ""}>
                <div className="flex flex-wrap gap-1.5">
                    <FacetPill active={platform === ""} onClick={() => setPlatform("")}>All</FacetPill>
                    {PLATFORMS.map(p => (
                        <FacetPill key={p.id} active={platform === p.id} onClick={() => setPlatform(platform === p.id ? "" : p.id)}>
                            {p.name}
                        </FacetPill>
                    ))}
                </div>
            </FacetGroup>

            <FacetGroup label="Era" icon={History} isActive={era !== ""}>
                <div className="grid grid-cols-3 gap-px w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-white/[0.07] bg-zinc-200 dark:bg-white/[0.07]">
                    {ERAS.map(e => (
                        <SegmentButton key={e.id} active={era === e.id} onClick={() => setEra(e.id)}>
                            {e.name}
                        </SegmentButton>
                    ))}
                </div>
            </FacetGroup>

            <FacetGroup label="Rating (MobyScore)" icon={Star} isActive={score !== ""}>
                <div className="w-full px-0.5">
                    <input
                        type="range"
                        min={0}
                        max={9}
                        step={1}
                        value={score === "" ? 0 : Number(score)}
                        onChange={(e) => { const v = Number(e.target.value); setScore(v === 0 ? "" : String(v)); }}
                        className="w-full h-1.5 cursor-pointer accent-[#DC143C]"
                        aria-label="Minimum MobyScore"
                    />
                    <div className="flex justify-between mt-2">
                        <span className={`text-[10.5px] font-bold uppercase tracking-wider ${score !== "" ? "text-tp-accent" : "text-zinc-500 dark:text-[#8B949E]"}`}>
                            {score === "" ? "Any score" : `${score}+ / 10`}
                        </span>
                        <span className="text-[10.5px] font-bold text-zinc-400 dark:text-[#71717A]">10</span>
                    </div>
                </div>
            </FacetGroup>

            <FacetGroup label="Sort by" icon={ArrowUpDown} isActive={ordering !== "-rating"}>
                <SortSelect value={ordering} onChange={setOrdering} />
            </FacetGroup>

            <button
                onClick={clearAll}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-200 dark:border-[#161B22] text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#8B949E] hover:text-tp-accent hover:border-tp-accent/40 hover:bg-tp-accent/[0.05] transition-all"
            >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear all filters
            </button>
        </>
    );

    return (
        <div className="min-h-screen">

            {/* ── HERO with big search ── */}
            <div className="relative w-full mb-8 overflow-hidden bg-zinc-50 dark:bg-[#05070A] border-b border-zinc-200 dark:border-[#161B22] transition-colors duration-300">
                <div className="absolute inset-0 z-0 pointer-events-none">
                    {/* Cover-art collage backdrop */}
                    {data?.results && data.results.length > 5 && (
                        <div className="absolute -inset-x-8 -top-8 flex gap-3 blur-[3px] opacity-25 dark:opacity-30">
                            {data.results.slice(0, 12).map((g) => g.cover_url && (
                                <div key={g.id} className="relative w-[120px] md:w-[150px] shrink-0 aspect-[3/4] rounded-xl overflow-hidden rotate-0">
                                    <Image src={g.cover_url} alt="" fill sizes="150px" quality={60} className="object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/80 via-zinc-50/90 to-zinc-50 dark:from-[#05070A]/70 dark:via-[#05070A]/88 dark:to-[#05070A]" />
                    <div className="absolute -top-[150px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-tp-accent/5 dark:bg-tp-accent/10 blur-[120px] rounded-full" />
                    <div className="absolute top-0 left-[25%] w-[50%] h-[1px] bg-gradient-to-r from-transparent via-tp-accent/30 dark:via-tp-accent/40 to-transparent" />
                </div>

                <div className="relative z-10 container-page pt-14 pb-12 flex flex-col items-center text-center">
                    <h1 className="font-display text-[36px] md:text-[52px] font-black text-zinc-900 dark:text-white uppercase leading-[0.95] tracking-tight mb-4 drop-shadow-xl">
                        GAME <span className="text-tp-accent">DATABASE</span>
                    </h1>
                    <p className="text-[15px] md:text-[16px] text-zinc-600 dark:text-[#A1A1AA] max-w-2xl leading-relaxed mb-9">
                        Your ultimate hub to discover, explore and track {data?.count ? data.count.toLocaleString() : "thousands of"} games.
                    </p>

                    {/* Big search */}
                    <div className="w-full max-w-2xl relative">
                        <div className="absolute -inset-[2px] rounded-full bg-gradient-to-r from-tp-accent/40 via-tp-accent/10 to-tp-accent/40 blur-[6px] opacity-60 pointer-events-none" />
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-tp-accent w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search for games, genres, platforms, themes..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="relative w-full bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-tp-accent/25 rounded-full h-[60px] pl-16 pr-14 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#71717A] focus:outline-none focus:border-tp-accent/60 transition-all shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
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

                    {/* Quick filter chips */}
                    <div className="flex flex-wrap items-center justify-center gap-2.5 mt-8">
                        {PLATFORMS.slice(0, 4).map((p) => (
                            <button key={p.id} onClick={() => setPlatform(platform === p.id ? "" : p.id)} className={quickChipCls(platform === p.id)}>
                                <Gamepad2 className="w-3.5 h-3.5" /> {p.name}
                            </button>
                        ))}
                        <button onClick={() => setGenre(genre === "Role-Playing (RPG)" ? "" : "Role-Playing (RPG)")} className={quickChipCls(genre === "Role-Playing (RPG)")}>
                            <Swords className="w-3.5 h-3.5" /> RPG
                        </button>
                        <button onClick={() => setGenre(genre === "Action" ? "" : "Action")} className={quickChipCls(genre === "Action")}>
                            <Swords className="w-3.5 h-3.5" /> Action
                        </button>
                        <Link href={`/games/year/${new Date().getFullYear()}`} prefetch={false} className={quickChipCls(false)}>
                            <CalendarDays className="w-3.5 h-3.5" /> {new Date().getFullYear()} Releases
                        </Link>
                        <button
                            onClick={randomGame}
                            disabled={randomLoading}
                            className="flex items-center gap-2 px-4 py-2 rounded-full border border-tp-accent/60 bg-tp-accent/10 text-[12px] font-bold text-tp-accent hover:bg-tp-accent hover:text-white transition-all disabled:opacity-60 shadow-[0_0_18px_rgba(220, 20, 60,0.15)]"
                        >
                            {randomLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shuffle className="w-3.5 h-3.5" />}
                            Random Game
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Promo shortcut cards ── */}
            <div className="container-page mb-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <PromoCard icon={Star} title="Top Rated Games" desc="See the highest rated games verified by our community."
                    onClick={() => { clearAll(); setOrdering("-rating"); scrollToGrid(); }} />
                <PromoCard icon={Box} title="Recently Added" desc="Explore the latest games added to our database."
                    onClick={() => { clearAll(); setOrdering("-added"); scrollToGrid(); }} />
                <PromoCard icon={CalendarDays} title="Upcoming Releases" desc="Discover games coming soon to your platform."
                    href="/calendar" />
                <PromoCard icon={Gamepad2} title="Explore by Platform" desc="Browse games across all major platforms."
                    href="/games/platform/pc" />
            </div>

            <div className="container-page pb-20">
                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* ── FACET SIDEBAR (desktop) ── */}
                    <aside className="hidden lg:block w-[280px] shrink-0 sticky top-[96px]">
                        <div className="relative overflow-hidden bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-[20px] p-6 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-colors duration-300">
                            {/* Accent hairline along the top of the card */}
                            <span className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-tp-accent/70 via-tp-accent/15 to-transparent" />

                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2.5">
                                    <SlidersHorizontal className="w-4 h-4 text-tp-accent" strokeWidth={2.25} />
                                    <h2 className="font-display text-[15px] font-bold text-zinc-900 dark:text-white uppercase tracking-[0.06em]">Filters</h2>
                                </div>
                                {activeFilters.length > 0 && (
                                    <button
                                        onClick={clearAll}
                                        className="flex items-center gap-1 pl-2.5 pr-2 py-1 rounded-full bg-tp-accent/10 border border-tp-accent/25 text-[9.5px] font-bold uppercase tracking-widest text-tp-accent hover:bg-tp-accent hover:text-white transition-all"
                                    >
                                        Clear ({activeFilters.length})
                                        <X className="w-3 h-3" />
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
                        <div id="games-results" className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200 dark:border-white/5 scroll-mt-[110px]">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-1.5 h-5 bg-tp-accent rounded-sm shrink-0" />
                                <h2 className="font-display text-[20px] font-bold text-zinc-900 dark:text-white uppercase tracking-[0.04em] leading-none truncate">
                                    {debouncedSearch ? `Results for "${debouncedSearch}"` : SORT_OPTIONS.find(s => s.value === ordering)?.label ?? "Games"}
                                </h2>
                                <span className="hidden sm:block text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-[#71717A] leading-none shrink-0 mt-1">
                                    · {data?.count?.toLocaleString() ?? 0} games found
                                </span>
                            </div>
                            <div className="shrink-0 ml-3 flex items-center gap-2">
                                <span className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-[#71717A]">Sort by</span>
                                <SortSelect value={ordering} onChange={setOrdering} compact />
                            </div>
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
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
                                {[...Array(15)].map((_, i) => (
                                    <div key={i} className="aspect-[3/4] bg-zinc-100 dark:bg-[#0B0E14] rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : data?.results && data.results.length > 0 ? (
                            <>
                                <div className={`grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4 transition-opacity ${isLoading ? "opacity-60" : ""}`}>
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
    const [imgSrc, setImgSrc] = useState(game.cover_url);

    // Deduped colored platform chips
    const chips = useMemo(() => {
        const out: { label: string; cls: string }[] = [];
        for (const p of game.platforms ?? []) {
            const chip = platformChip(p);
            if (chip && !out.some(c => c.label === chip.label)) out.push(chip);
        }
        return out.slice(0, 4);
    }, [game.platforms]);

    const rating = Number(game.rating) || 0;

    return (
        <Link
            href={`/games/${game.slug}`}
            prefetch={false}
            className="group relative block aspect-[3/4] rounded-xl overflow-hidden border border-zinc-200 dark:border-[#161B22] bg-zinc-100 dark:bg-[#10141B] hover:border-tp-accent/60 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-[0_16px_40px_rgba(0,0,0,0.55)] transition-all duration-300"
        >
            {/* Cover art fills the card */}
            {imgSrc ? (
                <Image
                    src={imgSrc}
                    alt={game.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 240px"
                    quality={70}
                    className="object-cover group-hover:scale-[1.06] transition-transform duration-500"
                    onError={() => setImgSrc("")}
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Gamepad2 className="w-10 h-10 text-zinc-300 dark:text-white/10" />
                </div>
            )}

            {/* Poster gradient — dark base for the bottom text block */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/15" />

            {/* Year — top left */}
            {game.released && (
                <span className="absolute top-2.5 left-2.5 text-[10px] font-bold tracking-widest text-white/90 bg-black/55 backdrop-blur-sm px-2 py-1 rounded-md">
                    {game.released.slice(0, 4)}
                </span>
            )}

            {/* Track button — top right, visible on hover */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <TrackGameButton slug={game.slug} gameName={game.name} variant="compact" />
            </div>

            {/* Bottom content — title, platforms, rating */}
            <div className="absolute inset-x-0 bottom-0 p-3">
                <h3 className="font-display text-[13px] font-black text-white uppercase tracking-[0.05em] leading-tight line-clamp-2 text-center mb-2.5 drop-shadow-lg group-hover:text-tp-accent transition-colors">
                    {game.name}
                </h3>
                <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1 min-w-0">
                        {chips.map((chip) => (
                            <span key={chip.label} className={`${chip.cls} text-white text-[7.5px] font-bold tracking-wider px-1 py-[2px] rounded-[3px] leading-none`}>
                                {chip.label}
                            </span>
                        ))}
                    </div>
                    {rating > 0 && (
                        <span className="shrink-0 bg-tp-accent text-white text-[11px] font-black px-1.5 py-0.5 rounded-md shadow-[0_2px_10px_rgba(220, 20, 60,0.4)] leading-none">
                            {rating.toFixed(1)}
                        </span>
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
                        ? "bg-tp-accent border-tp-accent text-white shadow-[0_0_15px_rgba(220, 20, 60,0.3)]"
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
