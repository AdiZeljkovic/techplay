"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft, ChevronRight, Flame, Gamepad2, Clock,
    Calendar as CalendarIcon, LayoutGrid, Monitor, Gamepad,
    CircleDot, Bookmark,
} from "lucide-react";
import {
    format, addMonths, startOfMonth, endOfMonth,
    isToday, parseISO, isBefore, startOfDay, isSameMonth,
    startOfWeek, endOfWeek, eachDayOfInterval,
} from "date-fns";
import ListingEmptyState from "@/components/ui/ListingEmptyState";
import LibraryStatusBadge from "@/components/games/LibraryStatusBadge";
import { useLibraryIndex } from "@/hooks/useLibraryIndex";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);


function HeroCountdown({ releaseDate }: { releaseDate: string }) {
    const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, past: false, today: false });
    useEffect(() => {
        function tick() {
            const diff = parseISO(releaseDate).getTime() - Date.now();
            if (diff <= 0) {
                setT({ days: 0, hours: 0, minutes: 0, seconds: 0, past: true, today: diff > -86400000 });
                return;
            }
            setT({ days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), minutes: Math.floor((diff % 3600000) / 60000), seconds: Math.floor((diff % 60000) / 1000), past: false, today: false });
        }
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [releaseDate]);

    if (t.past || t.today) {
        return (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-tp-accent/15 border border-tp-accent/30 mb-5">
                <span className="text-[13px] font-black text-tp-accent uppercase tracking-widest">
                    {t.today ? "Out Today" : "Out Now"}
                </span>
            </div>
        );
    }

    const units = [
        { v: t.days, label: "Days" },
        { v: t.hours, label: "Hrs" },
        { v: t.minutes, label: "Min" },
        { v: t.seconds, label: "Sec" },
    ];

    return (
        <div className="flex items-end gap-2 mb-5">
            {units.map(({ v, label }, i) => (
                <div key={label} className="flex items-end gap-2">
                    <div className="flex flex-col items-center bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 min-w-[52px]">
                        <span className="font-display font-black text-white text-[26px] leading-none tabular-nums" suppressHydrationWarning>
                            {String(v).padStart(2, "0")}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-white/35 mt-1 leading-none">{label}</span>
                    </div>
                    {i < units.length - 1 && (
                        <span className="text-white/25 font-black text-[18px] leading-none mb-3">:</span>
                    )}
                </div>
            ))}
        </div>
    );
}

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

function GameCard({ game, library }: { game: GameRelease; library: Record<string, string> }) {
    const { visible, hidden } = gameChips(game, 4);
    const libStatus = library[game.slug] as import("@/hooks/useLibraryIndex").LibraryStatus | undefined;
    return (
        <Link
            href={`/calendar/${game.slug}`}
            className="group relative block bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-xl overflow-hidden hover:border-tp-accent/40 dark:hover:border-tp-accent/40 hover:-translate-x-1 hover:shadow-[0_8px_40px_rgba(252,65,0,0.18)] transition-all duration-300"
        >
            <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-tp-accent scale-y-0 group-hover:scale-y-100 origin-center transition-transform duration-300 z-20" />
            <div className="relative aspect-video overflow-hidden bg-zinc-100 dark:bg-[#1A1F26]">
                {game.background_image ? (
                    <Image src={game.background_image!} alt={game.name} fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
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
                {libStatus && (
                    <div className="absolute top-2 left-2 z-10">
                        <LibraryStatusBadge status={libStatus} />
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
                <h3 className="text-[13px] font-bold text-zinc-900 dark:text-white leading-snug line-clamp-2 group-hover:text-tp-accent transition-colors mb-1.5">{game.name}</h3>
                {(game.genres?.length || 0) > 0 && (
                    <p className="text-[11px] text-zinc-500 dark:text-[#71717A] truncate mb-2">{game.genres!.slice(0, 2).map(g => g.name).join(" · ")}</p>
                )}
                <div className="flex flex-wrap gap-1">
                    {visible.map(chip => (
                        <span key={chip.label} className={`${chip.cls} text-white text-[8px] font-bold tracking-wider px-1.5 py-[3px] rounded-[3px] leading-none`}>{chip.label}</span>
                    ))}
                    {hidden > 0 && (
                        <span className="bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-white/50 text-[8px] font-bold px-1.5 py-[3px] rounded-[3px] leading-none">+{hidden}</span>
                    )}
                </div>
            </div>
        </Link>
    );
}

export default function CalendarClient() {
    const { library } = useLibraryIndex();
    const [viewDate, setViewDate] = useState(() => startOfMonth(new Date()));
    const [platform, setPlatform] = useState("all");
    const [heroIndex, setHeroIndex] = useState(0);
    const calendarRef = useRef<HTMLDivElement>(null);

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
        for (const games of map.values()) games.sort((a, b) => (b.added || 0) - (a.added || 0));
        return map;
    }, [releases]);

    const highlights = useMemo(
        () => [...(data?.results || [])]
            .filter(g => g.background_image && matchesPlatform(g, platform))
            .sort((a, b) => (b.added || 0) - (a.added || 0))
            .slice(0, 6),
        [data, platform]
    );

    // Sidebar: upcoming games from today forward, sorted by date
    const upcomingList = useMemo(
        () => releases
            .filter(g => g.released && !isBefore(parseISO(g.released), startOfDay(new Date())))
            .sort((a, b) => a.released!.localeCompare(b.released!))
            .slice(0, 6),
        [releases]
    );

    // Calendar grid
    const calendarStart = useMemo(() => startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 }), [viewDate]);
    const calendarEnd = useMemo(() => endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 }), [viewDate]);
    const calendarDays = useMemo(() => eachDayOfInterval({ start: calendarStart, end: calendarEnd }), [calendarStart, calendarEnd]);

    // Auto-rotate hero background through top 3 anticipated
    useEffect(() => {
        if (highlights.length < 2) return;
        const id = setInterval(() => setHeroIndex(i => (i + 1) % Math.min(3, highlights.length)), 7000);
        return () => clearInterval(id);
    }, [highlights.length]);

    const navigate = (dir: -1 | 1) => {
        setViewDate(d => startOfMonth(addMonths(d, dir)));
        setHeroIndex(0);
    };

    const hero = highlights[heroIndex] ?? null;

    const scrollToCalendar = () => calendarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    return (
        <div className="min-h-screen bg-white dark:bg-[#05070A]">

            {/* ══════════════════ HERO ══════════════════ */}
            <div className="relative w-full min-h-[580px] h-[70vh] overflow-hidden bg-[#05070A]">

                {/* Corner brackets */}
                <div className="absolute top-5 left-5 xl:left-[calc((100vw-1320px)/2)] w-7 h-7 border-t-2 border-l-2 border-tp-accent/50 pointer-events-none z-10" />
                <div className="absolute top-5 right-5 xl:right-[calc((100vw-1320px)/2)] w-7 h-7 border-t-2 border-r-2 border-tp-accent/20 pointer-events-none z-10" />
                <div className="absolute bottom-5 left-5 xl:left-[calc((100vw-1320px)/2)] w-7 h-7 border-b-2 border-l-2 border-tp-accent/20 pointer-events-none z-10" />

                {/* Ken Burns background */}
                <AnimatePresence mode="sync">
                    {hero?.background_image && (
                        <motion.div
                            key={`bg-${heroIndex}`}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute inset-0"
                        >
                            <motion.div
                                initial={{ scale: 1.07 }} animate={{ scale: 1 }}
                                transition={{ duration: 9, ease: "linear" }}
                                className="absolute inset-0"
                            >
                                <Image src={hero.background_image!} alt={hero.name} fill priority sizes="100vw" className="object-cover" />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {isLoading && !hero && (
                    <div className="absolute inset-0 bg-gradient-to-br from-tp-accent/5 via-transparent to-transparent animate-pulse" />
                )}

                {/* Gradients — bottom fade keeps text readable, left fade is lighter so image shows through */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/55 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#05070A]/85 via-[#05070A]/35 to-transparent" />

                {/* Top orange line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-tp-accent/70 via-tp-accent/20 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 flex items-center">
                    <div className="max-w-[1320px] mx-auto px-8 xl:px-10 w-full">
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-center">

                            {/* ── LEFT ── */}
                            <div>
                                {/* Label */}
                                <div className="flex items-center gap-2 mb-3">
                                    <CalendarIcon className="w-4 h-4 text-tp-accent" strokeWidth={2} />
                                    <span className="text-tp-accent text-[10px] font-bold uppercase tracking-[0.2em]">
                                        Release Calendar
                                    </span>
                                </div>

                                {/* MONTH stacked */}
                                <div className="mb-4">
                                    <h1
                                        className="font-display font-black text-white uppercase tracking-tighter leading-[0.85]"
                                        style={{ fontSize: "clamp(68px, 13vw, 148px)" }}
                                    >
                                        {format(viewDate, "MMMM")}
                                    </h1>
                                    <p
                                        className="font-display font-black text-white/[0.1] uppercase tracking-tighter leading-[0.85] -mt-1"
                                        style={{ fontSize: "clamp(44px, 8vw, 96px)" }}
                                    >
                                        {format(viewDate, "yyyy")}
                                    </p>
                                </div>

                                {/* Tagline */}
                                <p className="text-[13px] md:text-[14px] text-white/40 mb-6 max-w-[380px] leading-relaxed">
                                    Track upcoming game releases, platforms and launch dates — all in one place.
                                </p>

                                {/* Featured game — animates on hero rotation */}
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`featured-${heroIndex}-${startDate}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                        {hero ? (
                                            <>
                                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/35 block mb-2">
                                                    Featured Release
                                                </span>
                                                <h2
                                                    className="font-display font-black text-white leading-tight mb-3"
                                                    style={{ fontSize: "clamp(22px, 3.2vw, 38px)" }}
                                                >
                                                    {hero.name}
                                                </h2>
                                                {hero.released && (
                                                    <HeroCountdown releaseDate={hero.released} />
                                                )}
                                                <div className="flex items-center gap-3">
                                                    <Link
                                                        href={`/calendar/${hero.slug}`}
                                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-tp-accent hover:bg-tp-accent/90 text-white text-[11px] font-bold uppercase tracking-widest rounded-full transition-all shadow-lg shadow-tp-accent/25"
                                                    >
                                                        View Game <ChevronRight className="w-3.5 h-3.5" />
                                                    </Link>
                                                    {/* Tracking — UI placeholder; backend feature pending */}
                                                    <button
                                                        onClick={() => window.open(`/calendar/${hero.slug}`, "_self")}
                                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 text-white text-[11px] font-bold uppercase tracking-widest rounded-full transition-all"
                                                    >
                                                        <Bookmark className="w-3.5 h-3.5" /> Add to Tracking <ChevronRight className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </>
                                        ) : isLoading ? (
                                            <div className="space-y-3 max-w-[400px]">
                                                <div className="h-3 bg-white/8 rounded animate-pulse w-28" />
                                                <div className="h-8 bg-white/8 rounded animate-pulse w-72" />
                                                <div className="h-4 bg-white/8 rounded animate-pulse w-48" />
                                                <div className="flex gap-3 mt-2">
                                                    <div className="h-10 bg-white/8 rounded-full animate-pulse w-32" />
                                                    <div className="h-10 bg-white/8 rounded-full animate-pulse w-40" />
                                                </div>
                                            </div>
                                        ) : null}
                                    </motion.div>
                                </AnimatePresence>

                            </div>

                            {/* ── RIGHT — glass sidebar ── */}
                            <div className="hidden lg:flex flex-col bg-black/55 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden" style={{ maxHeight: "min(560px, 75vh)" }}>

                                {/* Sidebar header + month nav */}
                                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
                                    <div>
                                        <h3 className="font-display text-[13px] font-black text-white uppercase tracking-[0.1em] leading-none">
                                            This Month
                                        </h3>
                                        <div className="w-7 h-[2px] bg-tp-accent mt-1.5 rounded-full" />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => navigate(-1)}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                                            aria-label="Previous month"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider px-2 select-none min-w-[88px] text-center">
                                            {format(viewDate, "MMM yyyy")}
                                        </span>
                                        <button
                                            onClick={() => navigate(1)}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                                            aria-label="Next month"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Upcoming releases list */}
                                <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
                                    {isLoading ? (
                                        <div className="space-y-2 py-2">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className="flex items-center gap-3 p-2">
                                                    <div className="w-10 h-10 bg-white/8 rounded-lg animate-pulse shrink-0" />
                                                    <div className="w-14 h-9 bg-white/8 rounded-lg animate-pulse shrink-0" />
                                                    <div className="flex-1 space-y-1.5">
                                                        <div className="h-3 bg-white/8 rounded animate-pulse" />
                                                        <div className="h-2 bg-white/8 rounded animate-pulse w-2/3" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : upcomingList.length > 0 ? (
                                        <div className="space-y-0.5 py-1">
                                            {upcomingList.map(game => {
                                                const chips = gameChips(game, 3).visible;
                                                return (
                                                    <Link
                                                        key={game.id}
                                                        href={`/calendar/${game.slug}`}
                                                        className="group flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-white/[0.05] transition-colors"
                                                    >
                                                        {/* Date */}
                                                        <div className="shrink-0 w-10 text-center">
                                                            <span className="text-[8px] font-bold uppercase tracking-widest text-tp-accent block leading-none">
                                                                {format(parseISO(game.released!), "MMM")}
                                                            </span>
                                                            <span className="font-display text-[22px] font-black text-white leading-none">
                                                                {format(parseISO(game.released!), "d")}
                                                            </span>
                                                        </div>
                                                        {/* Thumbnail */}
                                                        <div className="relative w-14 h-9 rounded-lg overflow-hidden shrink-0 bg-white/5">
                                                            {game.background_image && (
                                                                <Image src={game.background_image!} fill sizes="56px" className="object-cover" alt={game.name} />
                                                            )}
                                                        </div>
                                                        {/* Name + chips */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[12px] font-bold text-white/90 group-hover:text-tp-accent transition-colors truncate leading-snug mb-1">
                                                                {game.name}
                                                            </p>
                                                            <div className="flex gap-1 flex-wrap">
                                                                {chips.map(chip => (
                                                                    <span key={chip.label} className={`${chip.cls} text-white text-[7px] font-bold px-1.5 py-[3px] rounded-[3px] leading-none`}>
                                                                        {chip.label}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-full py-8">
                                            <p className="text-[12px] text-white/30 text-center">No upcoming releases<br />this month</p>
                                        </div>
                                    )}
                                </div>

                                {/* View full calendar */}
                                <div className="px-4 py-4 border-t border-white/[0.06] shrink-0">
                                    <button
                                        onClick={scrollToCalendar}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-colors"
                                    >
                                        View Full Calendar <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════ MAIN CONTENT ══════════════════ */}
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
                                {[...Array(6)].map((_, i) => <div key={i} className="aspect-[2/3] rounded-2xl bg-zinc-100 dark:bg-[#0B0E14] animate-pulse" />)}
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
                                            <Image src={game.background_image!} alt={game.name} fill sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 220px" className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                                        <span className="absolute top-2 left-3 font-display text-[56px] font-black leading-none text-white/[0.07] group-hover:text-tp-accent/15 transition-colors duration-300 select-none">
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                        {game.released && (
                                            <div className="absolute top-3 right-3 bg-tp-accent text-white rounded-xl px-2 py-1.5 flex flex-col items-center shadow-lg shadow-black/40 leading-none">
                                                <span className="font-display text-[14px] font-bold">{format(parseISO(game.released), "d")}</span>
                                                <span className="text-[7px] font-bold tracking-widest mt-0.5">{format(parseISO(game.released), "MMM").toUpperCase()}</span>
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                            <h3 className="font-display text-[13px] font-bold text-white group-hover:text-tp-accent transition-colors line-clamp-2 leading-snug mb-1">{game.name}</h3>
                                            {(game.added || 0) > 0 && (
                                                <div className="flex items-center gap-1.5">
                                                    <Flame className="w-3 h-3 text-tp-accent shrink-0" />
                                                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">{hypeLabel(game.added!)}</span>
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
                                className={`flex items-center gap-2 px-5 h-[44px] rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 border ${active
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
                <div ref={calendarRef}>
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
                            {/* Day header row */}
                            <div className="grid grid-cols-7 mb-1">
                                {DAY_HEADERS.map(d => (
                                    <div key={d} className="py-2.5 text-center text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-white/30">
                                        <span className="hidden sm:inline">{d}</span>
                                        <span className="sm:hidden">{d[0]}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 border-l border-t border-zinc-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
                                {calendarDays.map(day => {
                                    const dayStr = format(day, "yyyy-MM-dd");
                                    const games = releasesByDay.get(dayStr) || [];
                                    const isCurrentDay = isToday(day);
                                    const isThisMonth = isSameMonth(day, viewDate);
                                    const isPast = isBefore(day, startOfDay(new Date())) && !isCurrentDay;
                                    const hasGames = games.length > 0;
                                    return (
                                        <div
                                            key={dayStr}
                                            className={[
                                                "border-r border-b border-zinc-200 dark:border-white/[0.06]",
                                                "min-h-[90px] md:min-h-[120px] p-1.5 md:p-2 relative transition-colors",
                                                !isThisMonth
                                                    ? "bg-zinc-50 dark:bg-[#07090C]"
                                                    : hasGames
                                                        ? "bg-white dark:bg-[#0F1318]"
                                                        : "bg-white dark:bg-[#0B0D11]",
                                                isCurrentDay ? "!bg-tp-accent/[0.06] dark:!bg-tp-accent/[0.10]" : "",
                                                isPast ? "opacity-50" : "",
                                            ].join(" ")}
                                        >
                                            {/* Left accent bar on cells with games */}
                                            {hasGames && isThisMonth && !isCurrentDay && (
                                                <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-tp-accent/40" />
                                            )}
                                            {isCurrentDay && (
                                                <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-tp-accent" />
                                            )}

                                            <div className="flex items-start justify-between mb-1.5">
                                                <span className={`text-[11px] font-bold leading-none inline-flex items-center justify-center shrink-0 ${
                                                    isCurrentDay
                                                        ? "w-[22px] h-[22px] rounded-full bg-tp-accent text-white text-[10px]"
                                                        : isThisMonth
                                                            ? "text-zinc-800 dark:text-white/70"
                                                            : "text-zinc-400 dark:text-white/15"
                                                }`}>
                                                    {format(day, "d")}
                                                </span>
                                                {hasGames && (
                                                    <div className="flex gap-[3px] md:hidden pt-0.5">
                                                        {[...Array(Math.min(games.length, 3))].map((_, j) => (
                                                            <span key={j} className="w-[5px] h-[5px] rounded-full bg-tp-accent" />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {hasGames && (
                                                <div className="hidden md:block space-y-1">
                                                    {games.slice(0, 2).map(game => (
                                                        <Link key={game.id} href={`/calendar/${game.slug}`} className="group/game flex items-center gap-1.5 rounded-md p-1 hover:bg-tp-accent/10 transition-colors">
                                                            {game.background_image && (
                                                                <div className="relative w-9 h-5 rounded overflow-hidden shrink-0">
                                                                    <Image src={game.background_image!} fill sizes="36px" className="object-cover" alt={game.name} />
                                                                    {library[game.slug] && (
                                                                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-black" />
                                                                    )}
                                                                </div>
                                                            )}
                                                            <span className="text-[10px] font-semibold text-zinc-700 dark:text-white/75 truncate group-hover/game:text-tp-accent transition-colors leading-tight">
                                                                {game.name}
                                                            </span>
                                                        </Link>
                                                    ))}
                                                    {games.length > 2 && (
                                                        <span className="text-[9px] font-bold text-tp-accent/70 pl-1">+{games.length - 2} more</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

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
                                        {tbaGames.map(game => <GameCard key={game.id} game={game} library={library} />)}
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
        </div>
    );
}
