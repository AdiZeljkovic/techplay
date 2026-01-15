"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import { Calendar as CalendarIcon, Gamepad2, Clock, Star, X } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, parseISO } from "date-fns";
import PageHero from "@/components/ui/PageHero";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import LimitModal from "@/components/ui/LimitModal";
import { useSearchLimit } from "@/hooks/useSearchLimit";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface GameRelease {
    id: number;
    name: string;
    slug: string;
    background_image: string;
    released: string;
    metacritic?: number;
    genres?: { name: string }[];
    platforms?: { platform: { name: string } }[];
}

interface ReleasesResponse {
    results: GameRelease[];
    count: number;
}

export default function CalendarPage() {
    // Always use current month - auto-updates when month changes
    const currentDate = new Date();
    const currentMonthName = format(currentDate, 'MMMM yyyy');

    const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');

    const [selectedDateReleases, setSelectedDateReleases] = useState<{ date: Date; games: GameRelease[] } | null>(null);
    const [showLimitModal, setShowLimitModal] = useState(false);

    // Shared limit with Games page
    const { isLimitReached, incrementSearch } = useSearchLimit(2);

    const { data, isLoading } = useSWR<ReleasesResponse>(
        `/games/calendar?start_date=${startDate}&end_date=${endDate}`,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000 // Cache for 1 minute on client
        }
    );

    const days = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
    });

    const releases = data?.results || [];

    const getReleasesForDay = (day: Date) => {
        return releases.filter(game =>
            game.released && isSameDay(parseISO(game.released), day)
        );
    };

    // Get featured releases (games with images, sorted by metacritic)
    const featuredReleases = releases
        .filter(g => g.background_image)
        .sort((a, b) => (b.metacritic || 0) - (a.metacritic || 0))
        .slice(0, 6);

    const handleShowMore = (e: React.MouseEvent, day: Date, dayReleases: GameRelease[]) => {
        e.preventDefault();

        if (isLimitReached) {
            setShowLimitModal(true);
            return;
        }

        incrementSearch();
        setSelectedDateReleases({ date: day, games: dayReleases });
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <LimitModal
                isOpen={showLimitModal}
                onClose={() => setShowLimitModal(false)}
            />

            {/* Hero Section */}
            <PageHero
                title="Release Calendar"
                description={`Upcoming game releases for ${currentMonthName}. Never miss a launch!`}
                icon={CalendarIcon}
            />

            {/* Featured Releases Section */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Star className="w-6 h-6 text-[var(--accent)]" />
                        Top Releases This Month
                    </h2>
                    <span className="text-sm text-[var(--text-muted)] font-mono bg-[var(--bg-card)] px-3 py-1.5 rounded-full border border-white/10">
                        {data?.count || 0} GAMES
                    </span>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="aspect-[3/4] bg-[var(--bg-card)] rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : featuredReleases.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
                        {featuredReleases.map((game) => (
                            <Link
                                key={game.id}
                                href={`/games/${game.slug}`}
                                className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 hover:border-[var(--accent)] transition-all"
                            >
                                <Image
                                    src={game.background_image}
                                    alt={game.name}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                                {game.metacritic && (
                                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                                        {game.metacritic}
                                    </div>
                                )}

                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <h3 className="text-sm font-bold text-white line-clamp-2 mb-1">
                                        {game.name}
                                    </h3>
                                    <div className="flex items-center gap-1 text-xs text-white/60">
                                        <Clock className="w-3 h-3" />
                                        {format(parseISO(game.released), 'MMM d')}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : null}
            </div>

            {/* Calendar Grid */}
            <div className="container mx-auto px-4 pb-12">
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl">
                    {/* Month Header */}
                    <div className="flex items-center justify-center p-6 border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent)]/10 to-purple-900/10">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <CalendarIcon className="w-7 h-7 text-[var(--accent)]" />
                            {currentMonthName}
                        </h2>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--bg-elevated)]/50">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="p-3 text-center text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-7 min-h-[500px]">
                            {[...Array(35)].map((_, i) => (
                                <div key={i} className="border-b border-r border-[var(--border)] p-2 min-h-[100px] animate-pulse bg-[var(--bg-elevated)]/30" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-7">
                            {/* Empty cells for days before start of month */}
                            {[...Array(startOfMonth(currentDate).getDay())].map((_, i) => (
                                <div key={`empty-${i}`} className="border-b border-r border-[var(--border)] p-2 min-h-[100px] bg-[var(--bg-elevated)]/20" />
                            ))}

                            {days.map(day => {
                                const dayReleases = getReleasesForDay(day);
                                const hasReleases = dayReleases.length > 0;

                                return (
                                    <div
                                        key={day.toString()}
                                        className={`border-b border-r border-[var(--border)] p-2 min-h-[100px] transition-colors ${isToday(day)
                                            ? 'bg-[var(--accent)]/10 ring-2 ring-inset ring-[var(--accent)]'
                                            : hasReleases
                                                ? 'bg-[var(--bg-elevated)]/30 hover:bg-[var(--bg-elevated)]/50'
                                                : ''
                                            }`}
                                    >
                                        <div className={`text-sm font-bold mb-2 ${isToday(day)
                                            ? 'text-[var(--accent)]'
                                            : 'text-[var(--text-secondary)]'
                                            }`}>
                                            {format(day, 'd')}
                                            {isToday(day) && (
                                                <span className="ml-2 text-xs font-normal bg-[var(--accent)] text-white px-2 py-0.5 rounded-full">
                                                    TODAY
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            {dayReleases.slice(0, 3).map(game => (
                                                <Link
                                                    key={game.id}
                                                    href={`/games/${game.slug}`}
                                                    className="block text-xs p-1.5 bg-[var(--accent)]/80 hover:bg-[var(--accent)] text-white rounded truncate transition-colors font-medium"
                                                    title={game.name}
                                                >
                                                    <Gamepad2 className="w-3 h-3 inline mr-1" />
                                                    {game.name}
                                                </Link>
                                            ))}
                                            {dayReleases.length > 3 && (
                                                <button
                                                    onClick={(e) => handleShowMore(e, day, dayReleases)}
                                                    className="text-xs text-[var(--accent)] font-semibold pl-1 hover:underline text-left w-full block transition-colors mt-2"
                                                >
                                                    +{dayReleases.length - 3} more
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="mt-6 flex items-center justify-center gap-6 text-sm text-[var(--text-muted)]">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-[var(--accent)] rounded" />
                        <span>Game Release</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-[var(--accent)]/20 border-2 border-[var(--accent)] rounded" />
                        <span>Today</span>
                    </div>
                </div>
            </div>

            {/* Releases Modal */}
            {selectedDateReleases && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setSelectedDateReleases(null)}
                >
                    <div
                        className="bg-[var(--bg-secondary)] w-full max-w-lg rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-card)] flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-[var(--accent)]" />
                                {format(selectedDateReleases.date, 'MMMM d, yyyy')} Releases
                            </h3>
                            <button
                                onClick={() => setSelectedDateReleases(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400 hover:text-white" />
                            </button>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-2">
                            {selectedDateReleases.games.map(game => (
                                <Link
                                    key={game.id}
                                    href={`/games/${game.slug}`}
                                    className="flex items-center gap-4 p-3 rounded-xl bg-[var(--bg-elevated)]/50 hover:bg-[var(--accent)] hover:text-white border border-white/5 hover:border-[var(--accent)] transition-all group"
                                >
                                    {game.background_image ? (
                                        <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border border-white/10 group-hover:border-white/30">
                                            <Image
                                                src={game.background_image}
                                                alt={game.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-12 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                            <Gamepad2 className="w-6 h-6 text-white/30 group-hover:text-white/80" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-sm truncate group-hover:text-white text-[var(--text-primary)]">
                                            {game.name}
                                        </div>
                                        <div className="text-xs text-[var(--text-muted)] group-hover:text-white/80 flex items-center gap-2 mt-0.5">
                                            {game.metacritic && (
                                                <span className="bg-black/30 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                    {game.metacritic}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
