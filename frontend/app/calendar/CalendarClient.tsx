"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft, ChevronRight, Flame, Gamepad2, Clock, Calendar as CalendarIcon,
    LayoutGrid, Monitor, Gamepad, CircleDot,
} from "lucide-react";
import {
    format, addMonths, startOfMonth, endOfMonth,
    isToday, parseISO, isBefore, startOfDay, isSameMonth,
    startOfWeek, endOfWeek, eachDayOfInterval,
} from "date-fns";
import ListingEmptyState from "@/components/ui/ListingEmptyState";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface GameRelease {
    id: number;
    slug: string;
    name: string;
    released: string | null;
    tba?: boolean;
    background_image: string | null;
    metacritic?: number | null;
    rating?: number;
    ratings_count?: number;
    added?: number;
    genres?: { name: string }[];
    platforms?: { platform: { name: string; slug?: string } }[];
}

interface ReleasesResponse {
    results: GameRelease[];
    count: number;
}

const PLATFORM_FILTERS = [
    { id: "all",         label: "All",         icon: LayoutGrid },
    { id: "pc",          label: "PC",           icon: Monitor    },
    { id: "playstation", label: "PlayStation",  icon: Gamepad2   },
    { id: "xbox",        label: "Xbox",         icon: Gamepad    },
    { id: "nintendo",    label: "Nintendo",     icon: CircleDot  },
];

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function platformChip(name: string, slug?: string): { label: string; cls: string } | null {
    const s = (slug || name).toLowerCase();
    if (s.includes("pc") || s === "windows") return { label: "PC", cls: "bg-[#2F6FED]" };
    if (s.includes("playstation-5") || name === "PlayStation 5") return { label: "PS5", cls: "bg-[#1A3FA8]" };
    if (s.includes("playstation-4") || name === "PlayStation 4") return { label: "PS4", cls: "bg-[#1A3FA8]" };
    if (s.includes("playstation")) return { label: "PS", cls: "bg-[#1A3FA8]" };
    if (s.includes("xbox-series") || name.includes("Series")) return { label: "SERIES", cls: "bg-[#107C10]" };
    if (s.includes("xbox-one")) return { label: "ONE", cls: "bg-[#107C10]" };
    if (s.includes("xbox")) return { label: "XBOX", cls: "bg-[#107C10]" };
    if (s.includes("nintendo") || s.includes("switch")) return { label: "SWITCH", cls: "bg-[#E60012]" };
    if (s.includes("ios") || s.includes("macos") || s.includes("mac")) return { label: "MAC", cls: "bg-zinc-600" };
    if (s.includes("android")) return { label: "ANDROID", cls: "bg-zinc-600" };
    if (s.includes("linux")) return { label: "LINUX", cls: "bg-zinc-600" };
    return null;
}

function gameChips(game: GameRelease, max = 4) {
    const chips: { label: string; cls: string }[] = [];
    for (const p of game.platforms || []) {
        const chip = platformChip(p.platform.name, p.platform.slug);
        if (chip && !chips.some(c => c.label === chip.label)) chips.push(chip);
    }
    return { visible: chips.slice(0, max), hidden: Math.max(0, chips.length - max) };
}

function matchesPlatform(game: GameRelease, filterId: string): boolean {
    if (filterId === "all") return true;
    return (game.platforms || []).some(p =>
        (p.platform.slug || p.platform.name.toLowerCase()).includes(filterId)
    );
}

function hypeLabel(added: number): string {
    if (added >= 10000) return `${(added / 1000).toFixed(0)}K`;
    if (added >= 1000) return `${(added / 1000).toFixed(1)}K`;
    return String(added);
}

function metacriticColor(score: number): string {
    if (score >= 75) return "bg-green-500 text-white";
    if (score >= 50) return "bg-yellow-500 text-black";
    return "bg-red-500 text-white";
}

function GameCard({ game }: { game: GameRelease }) {
    const { visible, hidden } = gameChips(game, 4);

    return (
        <Link
            href={`/calendar/${game.slug}`}
            className="group relative block bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-xl overflow-hidden hover:border-tp-accent/40 dark:hover:border-tp-accent/40 hover:-translate-x-1 hover:shadow-[0_8px_40px_rgba(252,65,0,0.18)] transition-all duration-300"
        >
            <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-tp-accent scale-y-0 group-hover:scale-y-100 origin-center transition-transform duration-300 z-20" />
            <div className="relative aspect-video overflow-hidden bg-zinc-100 dark:bg-[#1A1F26]">
                {game.background_image ? (
                    <Image
                        src={game.background_image}
                        alt={game.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        quality={70}
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Gamepad2 className="w-8 h-8 text-zinc-400 dark:text-white/15" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {game.metacritic && (
                    <div className={`absolute top-2 right-2 w-9 h-9 rounded-lg flex items-center justify-center text-[12px] font-bold shadow-lg ${metacriticColor(game.metacritic)}`}>
                        {game.metacritic}
                    </div>
                )}
                {(game.added || 0) > 0 && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-[3px]">
                        <Flame className="w-3 h-3 text-tp-accent shrink-0" />
                        <span className="text-[10px] font-bold text-white leading-none">{hypeLabel(game.added!)}</span>
                    </div>
                )}
            </div>
            <div className="p-3">
                <h3 className="text-[13px] font-bold text-zinc-900 dark:text-white leading-snug line-clamp-2 group-hover:text-tp-accent transition-colors mb-1.5">
                    {game.name}
                </h3>
                {(game.genres?.length || 0) > 0 && (
                    <p className="text-[11px] text-zinc-500 dark:text-[#71717A] truncate mb-2">
                        {game.genres!.slice(0, 2).map(g => g.name).join(" · ")}
                    </p>
                )}
                <div className="flex flex-wrap gap-1">
                    {visible.map(chip => (
                        <span key={chip.label} className={`${chip.cls} text-white text-[8px] font-bold tracking-wider px-1.5 py-[3px] rounded-[3px] leading-none`}>
                            {chip.label}
                        </span>
                    ))}
                    {hidden > 0 && (
                        <span className="bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-white/50 text-[8px] font-bold px-1.5 py-[3px] rounded-[3px] leading-none">
                            +{hidden}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

export default function CalendarClient() {
    const [viewDate, setViewDate] = useState(() => startOfMonth(new Date()));
    const [platform, setPlatform] = useState("all");
    const [heroIndex, setHeroIndex] = useState(0);

    const startDate = format(startOfMonth(viewDate), "yyyy-MM-dd");
    const endDate = format(endOfMonth(viewDate), "yyyy-MM-dd");
    const isCurrentMonth = isSameMonth(viewDate, new Date());

    const { data, isLoading } = useSWR<ReleasesResponse>(
        `/games/calendar?start_date=${startDate}&end_date=${endDate}`,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 300000 }
    );

    const releases = useMemo(
        () => (data?.results || []).filter(g => g.released && matchesPlatform(g, platform)),
        [data, platform]
    );

    const tbaGames = useMemo(
        () => (data?.results || []).filter(g => (!g.released || g.tba) && matchesPlatform(g, platform)),
        [data, platform]
    );

    const releasesByDay = useMemo(() => {
        const map = new Map<string, GameRelease[]>();
        for (const game of releases) {
            const key = game.released!;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(game);
        }
        for (const games of map.values()) {
            games.sort((a, b) => (b.added || 0) - (a.added || 0));
        }
        return map;
    }, [releases]);

    const highlights = useMemo(
        () => [...(data?.results || [])]
            .filter(g => g.background_image && matchesPlatform(g, platform))
            .sort((a, b) => (b.added || 0) - (a.added || 0))
            .slice(0, 6),
        [data, platform]
    );

    // Calendar grid — full weeks containing the month (Mon-start)
    const calendarStart = useMemo(
        () => startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 }),
        [viewDate]
    );
    const calendarEnd = useMemo(
        () => endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 }),
        [viewDate]
    );
    const calendarDays = useMemo(
        () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
        [calendarStart, calendarEnd]
    );

    // Auto-rotate hero through top 3 most anticipated
    useEffect(() => {
        if (highlights.length < 2) return;
        const id = setInterval(
            () => setHeroIndex(i => (i + 1) % Math.min(3, highlights.length)),
            6000
        );
        return () => clearInterval(id);
    }, [highlights.length]);

    const navigate = (dir: -1 | 1) => {
        setViewDate(d => startOfMonth(addMonths(d, dir)));
        setHeroIndex(0);
    };

    const hero = highlights[heroIndex] ?? null;
    const heroChips = hero ? gameChips(hero, 3).visible : [];

    return (
        <div className="min-h-screen bg-white dark:bg-[#05070A]">

            {/* ────────────────────── CINEMATIC HERO ────────────────────── */}
            <div className="relative w-full h-[65vh] min-h-[520px] overflow-hidden bg-[#05070A]">

                {/* Corner bracket decorations */}
                <div className="absolute top-5 left-5 xl:left-[calc((100vw-1320px)/2)] w-8 h-8 border-t-2 border-l-2 border-tp-accent/50 rounded-tl-sm pointer-events-none z-10" />
                <div className="absolute top-5 right-5 xl:right-[calc((100vw-1320px)/2)] w-8 h-8 border-t-2 border-r-2 border-tp-accent/20 rounded-tr-sm pointer-events-none z-10" />
                <div className="absolute bottom-5 right-5 xl:right-[calc((100vw-1320px)/2)] w-8 h-8 border-b-2 border-r-2 border-tp-accent/50 rounded-br-sm pointer-events-none z-10" />

                {/* Ken Burns background */}
                <AnimatePresence mode="sync">
                    {hero?.background_image && (
                        <motion.div
                            key={`bg-${heroIndex}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute inset-0"
                        >
                            <motion.div
                                initial={{ scale: 1.08 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 8, ease: "linear" }}
                                className="absolute inset-0"
                            >
                                <Image
                                    src={hero.background_image}
                                    alt={hero.name}
                                    fill
                                    priority
                                    quality={90}
                                    sizes="100vw"
                                    className="object-cover"
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {isLoading && !hero && (
                    <div className="absolute inset-0 bg-gradient-to-br from-tp-accent/5 via-transparent to-transparent animate-pulse" />
                )}

                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/65 to-[#05070A]/10" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#05070A]/90 via-[#05070A]/25 to-transparent" />

                {/* Orange top accent line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-tp-accent/70 via-tp-accent/20 to-transparent" />

                {/* Content — pinned to bottom */}
                <div className="absolute inset-0 flex items-end">
                    <div className="max-w-[1320px] mx-auto px-4 xl:px-0 w-full pb-10">
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-end">

                            {/* LEFT */}
                            <div>
                                <div className="flex items-center gap-2.5 mb-4">
                                    <span className="w-5 h-[2px] bg-tp-accent shrink-0" />
                                    <span className="text-tp-accent text-[10px] font-bold uppercase tracking-[0.2em]">
                                        Release Calendar
                                    </span>
                                </div>

                                <h1
                                    className="font-display font-black text-white uppercase leading-[0.88] tracking-tight"
                                    style={{ fontSize: "clamp(48px, 9vw, 108px)" }}
                                >
                                    {format(viewDate, "MMMM")}
                                    <span className="text-white/15 ml-4" style={{ fontSize: "clamp(36px, 7vw, 80px)" }}>
                                        {format(viewDate, "yyyy")}
                                    </span>
                                </h1>

                                <div className="h-[1px] bg-white/10 my-5 max-w-[540px]" />

                                {/* Featured game info — animates per rotation */}
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`info-${heroIndex}-${startDate}`}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                        {hero ? (
                                            <>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Flame className="w-3.5 h-3.5 text-tp-accent" />
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50">
                                                        #{String(heroIndex + 1).padStart(2, "0")} Most Anticipated
                                                    </span>
                                                </div>
                                                <h2
                                                    className="font-display font-black text-white leading-tight mb-3 max-w-[500px]"
                                                    style={{ fontSize: "clamp(18px, 2.8vw, 30px)" }}
                                                >
                                                    {hero.name}
                                                </h2>
                                                <div className="flex items-center gap-2.5 flex-wrap mb-4">
                                                    {hero.released && (
                                                        <span className="bg-tp-accent text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-lg shadow-tp-accent/20">
                                                            {format(parseISO(hero.released), "MMMM d, yyyy")}
                                                        </span>
                                                    )}
                                                    {heroChips.map(chip => (
                                                        <span
                                                            key={chip.label}
                                                            className={`${chip.cls} text-white text-[9px] font-bold tracking-wider px-2 py-1.5 rounded-[4px] leading-none`}
                                                        >
                                                            {chip.label}
                                                        </span>
                                                    ))}
                                                    {(hero.added || 0) > 0 && (
                                                        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5">
                                                            <Flame className="w-3 h-3 text-tp-accent" />
                                                            <span className="text-[10px] font-bold text-white/80">
                                                                {hypeLabel(hero.added!)} tracking
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <Link
                                                    href={`/calendar/${hero.slug}`}
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-tp-accent hover:bg-tp-accent/90 text-white text-[11px] font-bold uppercase tracking-widest rounded-full transition-all shadow-lg shadow-tp-accent/30"
                                                >
                                                    View Details
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </Link>
                                            </>
                                        ) : isLoading ? (
                                            <div className="space-y-3 max-w-[420px]">
                                                <div className="h-4 bg-white/10 rounded animate-pulse w-36" />
                                                <div className="h-7 bg-white/10 rounded animate-pulse w-72" />
                                                <div className="flex gap-2 mt-1">
                                                    <div className="h-7 bg-white/10 rounded-lg animate-pulse w-36" />
                                                    <div className="h-7 bg-white/10 rounded animate-pulse w-12" />
                                                </div>
                                            </div>
                                        ) : null}
                                    </motion.div>
                                </AnimatePresence>

                                {/* Thumbnail navigation strip */}
                                {highlights.length > 1 && (
                                    <div className="flex items-stretch gap-2.5 mt-7 max-w-[520px]">
                                        {highlights.slice(0, 3).map((g, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setHeroIndex(i)}
                                                className={`group relative flex-1 flex items-center gap-2.5 rounded-xl p-2.5 border transition-all duration-300 text-left ${
                                                    i === heroIndex
                                                        ? "bg-white/12 border-tp-accent/50 backdrop-blur-md"
                                                        : "bg-white/5 border-white/10 hover:border-white/25 backdrop-blur-sm opacity-60 hover:opacity-100"
                                                }`}
                                            >
                                                {g.background_image && (
                                                    <div className="relative w-12 h-8 rounded-md overflow-hidden shrink-0">
                                                        <Image
                                                            src={g.background_image}
                                                            fill
                                                            sizes="48px"
                                                            quality={60}
                                                            className="object-cover"
                                                            alt={g.name}
                                                        />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/40 leading-none block mb-0.5">
                                                        #{String(i + 1).padStart(2, "0")}
                                                    </span>
                                                    <p className="text-[11px] font-bold text-white leading-tight line-clamp-1">
                                                        {g.name}
                                                    </p>
                                                </div>
                                                {i === heroIndex && (
                                                    <span className="absolute left-0 top-3 bottom-3 w-[2px] bg-tp-accent rounded-full" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* RIGHT: month nav + release count */}
                            <div className="flex flex-col items-start lg:items-end gap-5">
                                {!isLoading && (releases.length + tbaGames.length) > 0 && (
                                    <div className="lg:text-right">
                                        <span
                                            className="font-display font-black text-white leading-none"
                                            style={{ fontSize: "clamp(44px, 6vw, 72px)" }}
                                        >
                                            {releases.length + tbaGames.length}
                                        </span>
                                        <span className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">
                                            Releases This Month
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-2 gap-1">
                                    <button
                                        onClick={() => navigate(-1)}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                                        aria-label="Previous month"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="font-display text-[13px] font-bold text-white uppercase tracking-wider px-4 min-w-[170px] text-center select-none">
                                        {format(viewDate, "MMMM yyyy")}
                                    </span>
                                    <button
                                        onClick={() => navigate(1)}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                                        aria-label="Next month"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>

                                {!isCurrentMonth && (
                                    <button
                                        onClick={() => { setViewDate(startOfMonth(new Date())); setHeroIndex(0); }}
                                        className="text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-tp-accent transition-colors"
                                    >
                                        ← Back to today
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ────────────────────── MAIN CONTENT ────────────────────── */}
            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 pb-20">

                {/* ── MOST ANTICIPATED — equal poster grid ── */}
                {(isLoading || highlights.length > 0) && (
                    <section className="pt-10 mb-14">
                        <div className="flex items-end justify-between mb-7">
                            <div className="flex items-center gap-3">
                                <span className="w-1 h-5 bg-tp-accent rounded-full shrink-0" />
                                <h2 className="font-display text-[18px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.05em] leading-none">
                                    Most Anticipated
                                </h2>
                            </div>
                            {!isLoading && data?.results?.length ? (
                                <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-[#71717A]">
                                    {data.results.length} releases · by hype
                                </span>
                            ) : null}
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="aspect-[2/3] rounded-2xl bg-zinc-100 dark:bg-[#0B0E14] animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                                {highlights.map((game, i) => (
                                    <Link
                                        key={game.id}
                                        href={`/calendar/${game.slug}`}
                                        className="group relative aspect-[2/3] rounded-2xl overflow-hidden border border-zinc-200 dark:border-[#161B22] bg-zinc-100 dark:bg-[#0B0E14] hover:border-tp-accent/50 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(252,65,0,0.2)] transition-all duration-300"
                                    >
                                        {game.background_image && (
                                            <Image
                                                src={game.background_image}
                                                alt={game.name}
                                                fill
                                                sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 220px"
                                                quality={75}
                                                className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                                        {/* Rank number */}
                                        <span className="absolute top-2 left-3 font-display text-[56px] font-black leading-none text-white/[0.07] group-hover:text-tp-accent/15 transition-colors duration-300 select-none">
                                            {String(i + 1).padStart(2, "0")}
                                        </span>

                                        {/* Date badge */}
                                        {game.released && (
                                            <div className="absolute top-3 right-3 bg-tp-accent text-white rounded-xl px-2 py-1.5 flex flex-col items-center shadow-lg shadow-black/40 leading-none">
                                                <span className="font-display text-[14px] font-bold">
                                                    {format(parseISO(game.released), "d")}
                                                </span>
                                                <span className="text-[7px] font-bold tracking-widest mt-0.5">
                                                    {format(parseISO(game.released), "MMM").toUpperCase()}
                                                </span>
                                            </div>
                                        )}

                                        {/* Bottom info */}
                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                            <h3 className="font-display text-[13px] font-bold text-white group-hover:text-tp-accent transition-colors line-clamp-2 leading-snug mb-1">
                                                {game.name}
                                            </h3>
                                            {(game.added || 0) > 0 && (
                                                <div className="flex items-center gap-1.5">
                                                    <Flame className="w-3 h-3 text-tp-accent shrink-0" />
                                                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">
                                                        {hypeLabel(game.added!)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-tp-accent scale-y-0 group-hover:scale-y-100 origin-center transition-transform duration-300 z-20" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* ── PLATFORM FILTERS — centered ── */}
                <div className="flex justify-center items-center gap-2 mb-10 flex-wrap">
                    {PLATFORM_FILTERS.map(f => {
                        const Icon = f.icon;
                        const active = platform === f.id;
                        return (
                            <button
                                key={f.id}
                                onClick={() => setPlatform(f.id)}
                                className={`flex items-center gap-2 px-5 h-[44px] rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 border ${
                                    active
                                        ? "bg-tp-accent border-tp-accent text-white shadow-[0_0_24px_rgba(252,65,0,0.35)]"
                                        : "bg-white dark:bg-[#0B0E14] border-zinc-200 dark:border-[#161B22] text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-white hover:border-tp-accent/30"
                                }`}
                            >
                                <Icon className="w-[14px] h-[14px] shrink-0" />
                                {f.label}
                            </button>
                        );
                    })}
                </div>

                {/* ── CALENDAR GRID ── */}
                {isLoading ? (
                    <>
                        <div className="grid grid-cols-7 mb-px">
                            {DAY_HEADERS.map(d => (
                                <div key={d} className="py-3 text-center text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-[#3F3F46]">
                                    <span className="hidden sm:inline">{d}</span>
                                    <span className="sm:hidden">{d[0]}</span>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 border-l border-t border-zinc-200 dark:border-[#161B22] rounded-xl overflow-hidden">
                            {[...Array(35)].map((_, i) => (
                                <div key={i} className="border-r border-b border-zinc-200 dark:border-[#161B22] min-h-[90px] md:min-h-[120px] bg-white dark:bg-[#05070A] animate-pulse" />
                            ))}
                        </div>
                    </>
                ) : releases.length > 0 || tbaGames.length > 0 ? (
                    <>
                        {/* Day headers */}
                        <div className="grid grid-cols-7 mb-px">
                            {DAY_HEADERS.map(d => (
                                <div key={d} className="py-3 text-center text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-[#71717A]">
                                    <span className="hidden sm:inline">{d}</span>
                                    <span className="sm:hidden">{d[0]}</span>
                                </div>
                            ))}
                        </div>

                        {/* Calendar cells */}
                        <div className="grid grid-cols-7 border-l border-t border-zinc-200 dark:border-[#161B22] rounded-xl overflow-hidden">
                            {calendarDays.map(day => {
                                const dayStr = format(day, "yyyy-MM-dd");
                                const games = releasesByDay.get(dayStr) || [];
                                const isCurrentDay = isToday(day);
                                const isThisMonth = isSameMonth(day, viewDate);
                                const isPast = isBefore(day, startOfDay(new Date())) && !isCurrentDay;

                                return (
                                    <div
                                        key={dayStr}
                                        className={`border-r border-b border-zinc-200 dark:border-[#161B22] min-h-[90px] md:min-h-[120px] p-1.5 md:p-2 relative transition-colors ${
                                            !isThisMonth
                                                ? "bg-zinc-50/70 dark:bg-black/20"
                                                : "bg-white dark:bg-[#05070A]"
                                        } ${isCurrentDay ? "!bg-tp-accent/[0.04] dark:!bg-tp-accent/[0.07]" : ""} ${isPast ? "opacity-55" : ""}`}
                                    >
                                        {/* Date number */}
                                        <div className="flex items-start justify-between mb-1">
                                            <span
                                                className={`text-[11px] font-bold leading-none inline-flex items-center justify-center ${
                                                    isCurrentDay
                                                        ? "w-[22px] h-[22px] rounded-full bg-tp-accent text-white text-[10px]"
                                                        : isThisMonth
                                                            ? "text-zinc-700 dark:text-[#A1A1AA]"
                                                            : "text-zinc-400 dark:text-[#3F3F46]"
                                                }`}
                                            >
                                                {format(day, "d")}
                                            </span>

                                            {/* Mobile: dot count */}
                                            {games.length > 0 && (
                                                <div className="flex gap-[3px] md:hidden pt-0.5">
                                                    {[...Array(Math.min(games.length, 3))].map((_, j) => (
                                                        <span key={j} className="w-[5px] h-[5px] rounded-full bg-tp-accent" />
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Desktop: game mini-cards */}
                                        {games.length > 0 && (
                                            <div className="hidden md:block space-y-1">
                                                {games.slice(0, 2).map(game => (
                                                    <Link
                                                        key={game.id}
                                                        href={`/calendar/${game.slug}`}
                                                        className="group/game flex items-center gap-1.5 rounded-md p-1 hover:bg-tp-accent/10 transition-colors"
                                                    >
                                                        {game.background_image && (
                                                            <div className="relative w-9 h-5 rounded overflow-hidden shrink-0">
                                                                <Image
                                                                    src={game.background_image}
                                                                    fill
                                                                    sizes="36px"
                                                                    quality={60}
                                                                    className="object-cover"
                                                                    alt={game.name}
                                                                />
                                                            </div>
                                                        )}
                                                        <span className="text-[10px] font-medium text-zinc-600 dark:text-[#A1A1AA] truncate group-hover/game:text-tp-accent transition-colors leading-tight">
                                                            {game.name}
                                                        </span>
                                                    </Link>
                                                ))}
                                                {games.length > 2 && (
                                                    <span className="text-[9px] font-bold text-tp-accent/60 pl-1">
                                                        +{games.length - 2} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* TBA section below calendar */}
                        {tbaGames.length > 0 && (
                            <section className="mt-12">
                                <div className="flex items-center gap-4 mb-5">
                                    <div className="w-[52px] h-[52px] rounded-xl border border-zinc-200 dark:border-[#161B22] bg-zinc-50 dark:bg-[#0B0E14] flex items-center justify-center shrink-0">
                                        <Clock className="w-5 h-5 text-zinc-400 dark:text-[#71717A]" />
                                    </div>
                                    <div className="flex-1 h-[1px] bg-zinc-200 dark:bg-white/5" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-[#71717A] shrink-0">
                                        TBA · {tbaGames.length} {tbaGames.length === 1 ? "GAME" : "GAMES"}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 opacity-60">
                                    {tbaGames.map(game => <GameCard key={game.id} game={game} />)}
                                </div>
                            </section>
                        )}
                    </>
                ) : (
                    <ListingEmptyState
                        icon={CalendarIcon}
                        title="No releases found"
                        description={platform === "all"
                            ? `No game releases tracked for ${format(viewDate, "MMMM yyyy")} yet.`
                            : `No ${PLATFORM_FILTERS.find(f => f.id === platform)?.label} releases for ${format(viewDate, "MMMM yyyy")}.`}
                    />
                )}
            </div>
        </div>
    );
}
