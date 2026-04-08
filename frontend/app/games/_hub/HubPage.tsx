"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "@/lib/axios";
import Image from "next/image";
import Link from "next/link";
import { Star, Gamepad2, ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";

interface Game {
    id: number;
    slug: string;
    name: string;
    released: string | null;
    background_image: string | null;
    rating: number | null;
    metacritic: number | null;
    platforms: { platform: { name: string } }[];
}

interface HubResponse {
    total: number;
    page: number;
    per_page: number;
    last_page: number;
    results: Game[];
}

interface Props {
    type: "genre" | "platform" | "year" | "tag";
    value: string;
    title: string;
    description: string;
    initialData?: HubResponse | null;
}

const SORT_OPTIONS = [
    { value: "rating",     label: "Rating" },
    { value: "metacritic", label: "Metacritic" },
    { value: "released",   label: "Release Date" },
    { value: "name",       label: "Name" },
];

const METACRITIC_OPTIONS = [
    { value: "",   label: "Any" },
    { value: "60", label: "60+" },
    { value: "70", label: "70+" },
    { value: "80", label: "80+" },
    { value: "90", label: "90+" },
];

const ERA_OPTIONS = [
    { value: "",         label: "All Time",  from: "",     to: "" },
    { value: "2020s",    label: "2020s",     from: "2020", to: "2029" },
    { value: "2010s",    label: "2010s",     from: "2010", to: "2019" },
    { value: "2000s",    label: "2000s",     from: "2000", to: "2009" },
    { value: "90s",      label: "90s",       from: "1990", to: "1999" },
];

const PLATFORM_OPTIONS = [
    { value: "",          label: "All" },
    { value: "pc",        label: "PC" },
    { value: "playstation", label: "PlayStation" },
    { value: "xbox",      label: "Xbox" },
    { value: "nintendo",  label: "Nintendo" },
    { value: "mobile",    label: "Mobile" },
];

function metacriticColor(score: number) {
    return score >= 80 ? "bg-green-500 text-white" : score >= 60 ? "bg-yellow-500 text-black" : "bg-red-500 text-white";
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button onClick={onClick} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            active ? "bg-[var(--accent)] text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
        }`}>
            {label}
        </button>
    );
}

export default function HubPage({ type, value, title, description, initialData }: Props) {
    const [data, setData]             = useState<HubResponse | null>(initialData ?? null);
    const [page, setPage]             = useState(1);
    const [sort, setSort]             = useState("rating");
    const [metacriticMin, setMetacriticMin] = useState("");
    const [era, setEra]               = useState("");
    const [platform, setPlatform]     = useState("");
    const [loading, setLoading]       = useState(false);

    const isDefaultState = page === 1 && sort === "rating" && !metacriticMin && !era && !platform;

    const buildUrl = useCallback(() => {
        const params = new URLSearchParams({ page: String(page), sort });
        if (metacriticMin)  params.set("metacritic_min", metacriticMin);
        if (era) {
            const found = ERA_OPTIONS.find(e => e.value === era);
            if (found?.from) params.set("year_from", found.from);
            if (found?.to)   params.set("year_to",   found.to);
        }
        if (platform && type !== "platform") params.set("platform", platform);
        return `/games/hub/${type}/${value}?${params.toString()}`;
    }, [type, value, page, sort, metacriticMin, era, platform]);

    useEffect(() => {
        if (isDefaultState && initialData) return;
        setLoading(true);
        axios.get(buildUrl())
            .then((res) => setData(res.data))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [buildUrl]);

    const handleSort = (s: string) => { setSort(s); setPage(1); };
    const handlePage = (p: number) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); };
    const resetFilters = () => { setMetacriticMin(""); setEra(""); setPlatform(""); setPage(1); };

    const hasActiveFilters = !!(metacriticMin || era || platform);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pb-20">
            {/* Hero */}
            <div className="bg-gradient-to-b from-[var(--bg-elevated)] to-[var(--bg-primary)] border-b border-white/5 py-16">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                        <Link href="/games" className="hover:text-white transition-colors">Games</Link>
                        <span>/</span>
                        <span className="capitalize">{type}</span>
                        <span>/</span>
                        <span className="text-white capitalize">{value.replace(/-/g, " ")}</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-3">{title}</h1>
                    <p className="text-gray-400 max-w-2xl">{description}</p>
                    {data && (
                        <p className="text-[var(--accent)] font-semibold mt-3">
                            {data.total.toLocaleString()} games
                        </p>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-4 mt-8">
                {/* Filter bar */}
                <div className="bg-white/3 border border-white/5 rounded-2xl p-4 mb-6 space-y-3">

                    {/* Sort */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <SlidersHorizontal className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-xs text-gray-500 uppercase tracking-wider w-16 shrink-0">Sort</span>
                        <div className="flex gap-2 flex-wrap">
                            {SORT_OPTIONS.map((opt) => (
                                <FilterChip key={opt.value} label={opt.label} active={sort === opt.value} onClick={() => handleSort(opt.value)} />
                            ))}
                        </div>
                    </div>

                    {/* Metacritic */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-gray-500 uppercase tracking-wider w-16 ml-7 shrink-0">Score</span>
                        <div className="flex gap-2 flex-wrap">
                            {METACRITIC_OPTIONS.map((opt) => (
                                <FilterChip key={opt.value} label={opt.label} active={metacriticMin === opt.value} onClick={() => { setMetacriticMin(opt.value); setPage(1); }} />
                            ))}
                        </div>
                    </div>

                    {/* Era */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-gray-500 uppercase tracking-wider w-16 ml-7 shrink-0">Era</span>
                        <div className="flex gap-2 flex-wrap">
                            {ERA_OPTIONS.map((opt) => (
                                <FilterChip key={opt.value} label={opt.label} active={era === opt.value} onClick={() => { setEra(opt.value); setPage(1); }} />
                            ))}
                        </div>
                    </div>

                    {/* Platform (only for non-platform hubs) */}
                    {type !== "platform" && (
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs text-gray-500 uppercase tracking-wider w-16 ml-7 shrink-0">Platform</span>
                            <div className="flex gap-2 flex-wrap">
                                {PLATFORM_OPTIONS.map((opt) => (
                                    <FilterChip key={opt.value} label={opt.label} active={platform === opt.value} onClick={() => { setPlatform(opt.value); setPage(1); }} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reset */}
                    {hasActiveFilters && (
                        <div className="flex justify-end pt-1">
                            <button onClick={resetFilters} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                                <X className="w-3.5 h-3.5" />
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {Array.from({ length: 24 }).map((_, i) => (
                            <div key={i} className="bg-white/5 rounded-xl h-48 animate-pulse" />
                        ))}
                    </div>
                ) : data && data.results.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {data.results.map((game) => (
                            <Link key={game.id} href={`/games/${game.slug}`}
                                className="group flex flex-col bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--accent)] transition-all hover:shadow-xl hover:shadow-[var(--accent)]/10">
                                <div className="relative h-32 bg-[var(--bg-elevated)] overflow-hidden">
                                    {game.background_image ? (
                                        <Image src={game.background_image} alt={game.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Gamepad2 className="w-8 h-8 text-[var(--text-muted)]" />
                                        </div>
                                    )}
                                    {game.metacritic ? (
                                        <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${metacriticColor(game.metacritic)}`}>
                                            {game.metacritic}
                                        </span>
                                    ) : null}
                                </div>
                                <div className="p-3 flex-1">
                                    <p className="text-sm font-bold text-white group-hover:text-[var(--accent)] transition-colors line-clamp-2 leading-snug">{game.name}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        {game.released && <span className="text-xs text-[var(--text-muted)]">{game.released.slice(0, 4)}</span>}
                                        {game.rating && Number(game.rating) > 0 && (
                                            <span className="flex items-center gap-1 text-xs text-yellow-400 ml-auto">
                                                <Star className="w-3 h-3 fill-yellow-400" />
                                                {Number(game.rating).toFixed(1)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-400 py-20">No games found for selected filters.</p>
                )}

                {/* Pagination */}
                {data && data.last_page > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-10">
                        <button onClick={() => handlePage(page - 1)} disabled={page === 1}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30 transition-all">
                            <ChevronLeft className="w-5 h-5 text-white" />
                        </button>
                        <span className="text-sm text-gray-400">
                            Page <span className="text-white font-semibold">{page}</span> of {data.last_page.toLocaleString()}
                        </span>
                        <button onClick={() => handlePage(page + 1)} disabled={page === data.last_page}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30 transition-all">
                            <ChevronRight className="w-5 h-5 text-white" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
