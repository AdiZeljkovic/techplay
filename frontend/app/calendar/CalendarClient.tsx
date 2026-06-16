"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Flame, Gamepad2, Clock } from "lucide-react";
import { format, addMonths, startOfMonth, endOfMonth, isToday, parseISO, isBefore, startOfDay, isSameMonth } from "date-fns";
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
    { id: "all", label: "ALL PLATFORMS" },
    { id: "pc", label: "PC" },
    { id: "playstation", label: "PLAYSTATION" },
    { id: "xbox", label: "XBOX" },
    { id: "nintendo", label: "NINTENDO" },
];

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

            {/* Cover */}
            <div className="relative aspect-video overflow-hidden bg-zinc-100 dark:bg-[#1A1F26]">
                {game.background_image ? (
                    <Image
                        src={game.background_image}
                        alt={game.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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

            {/* Content */}
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

    const navigate = (dir: -1 | 1) => setViewDate(d => startOfMonth(addMonths(d, dir)));

    const sortedDates = [...releasesByDay.entries()].sort(([a], [b]) => a.localeCompare(b));

    return (
        <div className="min-h-screen">

            {/* ── HERO with month navigation ── */}
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
                        <CalendarIcon className="w-6 h-6 text-tp-accent" strokeWidth={1.75} />
                    </div>

                    <h1 className="font-display text-[36px] md:text-[52px] font-black text-zinc-900 dark:text-white uppercase leading-[0.95] tracking-tight mb-4">
                        RELEASE <span className="text-tp-accent">CALENDAR</span>
                    </h1>
                    <p className="text-[15px] md:text-[16px] text-zinc-600 dark:text-[#A1A1AA] max-w-2xl leading-relaxed mb-9">
                        Every game launch, in one place. Powered by community hype — never miss a release.
                    </p>

                    <div className="flex items-center gap-3 flex-wrap justify-center">
                        <div className="flex items-center bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-full p-1.5 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                            <button
                                onClick={() => navigate(-1)}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 dark:text-[#A1A1AA] hover:text-tp-accent hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                                aria-label="Previous month"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="font-display text-[16px] font-bold text-zinc-900 dark:text-white uppercase tracking-[0.08em] px-6 min-w-[210px] text-center select-none">
                                {format(viewDate, "MMMM yyyy")}
                            </span>
                            <button
                                onClick={() => navigate(1)}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 dark:text-[#A1A1AA] hover:text-tp-accent hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                                aria-label="Next month"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        {!isCurrentMonth && (
                            <button
                                onClick={() => setViewDate(startOfMonth(new Date()))}
                                className="h-[52px] px-6 rounded-full bg-tp-accent hover:bg-tp-accent-hover text-white text-[11px] font-bold uppercase tracking-widest transition-colors shadow-lg shadow-tp-accent/20"
                            >
                                Today
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 pb-20">

                {/* ── MOST ANTICIPATED ── */}
                {(isLoading || highlights.length > 0) && (
                    <section className="mb-12">
                        <div className="flex items-end justify-between mb-8 pb-4 border-b border-zinc-200 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <span className="w-1.5 h-5 bg-tp-accent rounded-sm shrink-0" />
                                <h2 className="font-display text-[20px] font-bold text-zinc-900 dark:text-white uppercase tracking-[0.04em] leading-none">
                                    Most Anticipated
                                </h2>
                            </div>
                            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-[#71717A] leading-none">
                                {data?.results?.length || 0} RELEASES THIS MONTH
                            </span>
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="aspect-[3/4] bg-zinc-100 dark:bg-[#0B0E14] rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {highlights.map((game, i) => (
                                    <Link
                                        key={game.id}
                                        href={`/calendar/${game.slug}`}
                                        className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-zinc-200 dark:border-[#161B22] hover:border-tp-accent/50 bg-zinc-100 dark:bg-[#0B0E14] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(252,65,0,0.12)] transition-all duration-300"
                                    >
                                        {game.background_image && (
                                            <Image
                                                src={game.background_image}
                                                alt={game.name}
                                                fill
                                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 220px"
                                                className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                                        <span className="absolute top-3 left-3 font-display text-[22px] font-black leading-none text-white/25 group-hover:text-tp-accent/70 transition-colors">
                                            {String(i + 1).padStart(2, "0")}
                                        </span>

                                        {game.released && (
                                            <div className="absolute top-3 right-3 bg-tp-accent text-white rounded-lg px-2 py-1.5 flex flex-col items-center leading-none shadow-lg shadow-black/30">
                                                <span className="font-display text-[16px] font-bold">{format(parseISO(game.released), "d")}</span>
                                                <span className="text-[8px] font-bold tracking-widest mt-0.5">{format(parseISO(game.released), "MMM").toUpperCase()}</span>
                                            </div>
                                        )}

                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                            <h3 className="text-[13px] font-bold text-white leading-snug line-clamp-2 mb-1.5 group-hover:text-tp-accent transition-colors">
                                                {game.name}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/60">
                                                <Flame className="w-3 h-3 text-tp-accent" />
                                                {hypeLabel(game.added || 0)} TRACKING
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* ── PLATFORM FILTERS ── */}
                <div className="flex items-center gap-2 mb-10 overflow-x-auto scrollbar-hide pb-1">
                    {PLATFORM_FILTERS.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setPlatform(f.id)}
                            className={`px-5 py-2.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all border ${
                                platform === f.id
                                    ? "bg-tp-accent border-tp-accent text-white shadow-[0_0_15px_rgba(252,65,0,0.3)]"
                                    : "bg-white dark:bg-[#0B0E14] border-zinc-200 dark:border-[#161B22] text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-white hover:border-tp-accent/40"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* ── DATE-GROUPED RELEASE LIST ── */}
                {isLoading ? (
                    <div className="space-y-10">
                        {[...Array(3)].map((_, g) => (
                            <div key={g}>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-[52px] h-[60px] rounded-xl bg-zinc-100 dark:bg-[#0B0E14] animate-pulse shrink-0" />
                                    <div className="flex-1 h-[1px] bg-zinc-200 dark:bg-white/5" />
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="rounded-xl bg-zinc-100 dark:bg-[#0B0E14] animate-pulse">
                                            <div className="aspect-video" />
                                            <div className="p-3 space-y-2">
                                                <div className="h-4 bg-zinc-200 dark:bg-[#161B22] rounded" />
                                                <div className="h-3 bg-zinc-200 dark:bg-[#161B22] rounded w-2/3" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : sortedDates.length > 0 ? (
                    <div>
                        {sortedDates.map(([dateStr, games]) => {
                            const date = parseISO(dateStr);
                            const today = isToday(date);
                            const past = isBefore(date, startOfDay(new Date())) && !today;

                            return (
                                <section key={dateStr} className={past ? "opacity-60 hover:opacity-100 transition-opacity duration-300" : ""}>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`w-[52px] h-[60px] rounded-xl border flex flex-col items-center justify-center shrink-0 ${
                                            today
                                                ? "bg-tp-accent border-tp-accent shadow-[0_0_20px_rgba(252,65,0,0.3)]"
                                                : "bg-white dark:bg-[#0B0E14] border-zinc-200 dark:border-[#161B22]"
                                        }`}>
                                            <span className={`text-[8px] font-bold uppercase tracking-widest leading-none mb-1 ${today ? "text-white/80" : "text-tp-accent"}`}>
                                                {format(date, "EEE").toUpperCase()}
                                            </span>
                                            <span className={`font-display text-[22px] font-bold leading-none ${today ? "text-white" : "text-zinc-900 dark:text-white"}`}>
                                                {format(date, "d")}
                                            </span>
                                        </div>
                                        <div className="flex-1 h-[1px] bg-zinc-200 dark:bg-white/5" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-[#71717A] shrink-0">
                                            {games.length} {games.length === 1 ? "RELEASE" : "RELEASES"}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
                                        {games.map(game => <GameCard key={game.id} game={game} />)}
                                    </div>
                                </section>
                            );
                        })}

                        {/* TBA section */}
                        {tbaGames.length > 0 && (
                            <section>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-[52px] h-[60px] rounded-xl border border-zinc-200 dark:border-[#161B22] bg-zinc-50 dark:bg-[#0B0E14] flex items-center justify-center shrink-0">
                                        <Clock className="w-5 h-5 text-zinc-400 dark:text-[#71717A]" />
                                    </div>
                                    <div className="flex-1 h-[1px] bg-zinc-200 dark:bg-white/5" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-[#71717A] shrink-0">
                                        TO BE ANNOUNCED · {tbaGames.length} {tbaGames.length === 1 ? "GAME" : "GAMES"}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10 opacity-60">
                                    {tbaGames.map(game => <GameCard key={game.id} game={game} />)}
                                </div>
                            </section>
                        )}
                    </div>
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
