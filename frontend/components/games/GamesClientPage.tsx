"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Search, Calendar, Database, Gamepad2 } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import LimitModal from "@/components/ui/LimitModal";
import { useSearchLimit } from "@/hooks/useSearchLimit";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface Game {
    id: number;
    name: string;
    slug: string;
    background_image: string;
    released: string;
    metacritic: number;
    genres: { name: string }[];
}

interface GamesResponse {
    results: Game[];
    count: number;
}

// Helper function for Metacritic color
const getMetacriticColor = (score: number) => {
    if (score >= 75) return "bg-green-600";
    if (score >= 50) return "bg-yellow-600";
    return "bg-red-600";
};

export default function GamesClientPage() {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [showLimitModal, setShowLimitModal] = useState(false);

    // Use limit of 2 searches for guests
    const { isLimitReached, incrementSearch } = useSearchLimit(2);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search === debouncedSearch) return;

            // If clearing search, just clear it without counting
            if (!search) {
                setDebouncedSearch("");
                return;
            }

            // If limit reached, show modal and reset search input to previous valid state (optional) or just don't fetch
            if (isLimitReached) {
                setShowLimitModal(true);
                // Ideally we shouldn't update debouncedSearch so fetch doesn't happen
                return;
            }

            // Valid search - increment count
            incrementSearch();
            setDebouncedSearch(search);
        }, 500);

        return () => clearTimeout(timer);
    }, [search, debouncedSearch, isLimitReached, incrementSearch]);

    const { data, error, isLoading } = useSWR<GamesResponse>(
        debouncedSearch
            ? `/games?search=${debouncedSearch}`
            : "/games?ordering=-metacritic", // Default to trending if no search
        fetcher
    );

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <LimitModal
                isOpen={showLimitModal}
                onClose={() => setShowLimitModal(false)}
            />

            {/* Hero Section */}
            <PageHero
                title="Game Database"
                description="Explore thousands of games powered by RAWG.io. Find your next adventure."
                icon={Database}
            />

            {/* Search Bar - Floating inside/below Hero */}
            <div className="container mx-auto px-4 -mt-16 md:-mt-20 relative z-30 mb-8">
                <div className="max-w-2xl mx-auto relative group">
                    <div className="absolute inset-x-0 top-0 h-full bg-[var(--accent)]/10 blur-3xl rounded-full opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="relative shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] rounded-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--accent)] w-6 h-6" />
                        <input
                            type="text"
                            placeholder="Search thousands of games..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#0f1221] border-2 border-[var(--border)] rounded-full py-5 pl-16 pr-6 text-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[var(--accent)] focus:ring-0 transition-all placeholder:font-light font-medium"
                        />
                        {search && (
                            <button
                                onClick={() => { setSearch(""); setDebouncedSearch(""); }}
                                className="absolute right-6 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Games Grid */}
            <div className="container mx-auto px-4 pb-20">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                    <h2 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5 text-[var(--accent)]" />
                        {debouncedSearch ? `Results for "${debouncedSearch}"` : "Trending Games"}
                    </h2>
                    <span className="text-sm text-[var(--text-muted)] font-mono bg-[var(--bg-card)] px-3 py-1 rounded-full border border-white/5">
                        {data?.count || 0} GAMES FOUND
                    </span>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-80 bg-[var(--bg-card)] rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : data?.results && data.results.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {data.results.map((game) => (
                            <Link
                                key={game.id}
                                href={`/games/${game.slug}`}
                                className="group bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-[var(--accent)] transition-all flex flex-col hover:shadow-2xl hover:shadow-[var(--accent)]/10"
                            >
                                <div className="relative h-48 overflow-hidden bg-[var(--bg-elevated)]">
                                    {game.background_image ? (
                                        <Image
                                            src={game.background_image}
                                            alt={game.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Database className="w-12 h-12 text-[var(--text-muted)]" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                                    {game.metacritic && (
                                        <div className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-bold shadow-lg ${getMetacriticColor(game.metacritic)}`}>
                                            {game.metacritic}
                                        </div>
                                    )}
                                </div>

                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent)] transition-colors line-clamp-1 leading-tight">
                                        {game.name}
                                    </h3>

                                    <div className="text-xs text-[var(--text-muted)] flex flex-wrap gap-1.5 mb-4">
                                        {game.genres?.slice(0, 3).map(g => (
                                            <span key={g.name} className="bg-[var(--bg-elevated)] px-2.5 py-1 rounded-md border border-white/5">
                                                {g.name}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{game.released || 'TBA'}</span>
                                        </div>
                                        <div className="w-6 h-6 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center group-hover:bg-[var(--accent)] transition-colors">
                                            <Gamepad2 className="w-3 h-3 text-white" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-[var(--bg-card)]/50 border border-[var(--border)] rounded-3xl">
                        <Database className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-6 opacity-30" />
                        <h3 className="text-2xl font-bold text-white mb-2">No games found</h3>
                        <p className="text-[var(--text-secondary)] mb-6">We couldn't find any games matching "{search}".</p>
                        <button
                            onClick={() => { setSearch(""); setDebouncedSearch(""); }}
                            className="text-[var(--accent)] hover:underline font-medium"
                        >
                            Clear search
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
