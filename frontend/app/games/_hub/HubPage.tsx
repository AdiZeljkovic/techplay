"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "@/lib/axios";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Gamepad2, ChevronLeft, ChevronRight, Sword, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

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
    { value: "rating",     label: "Top Rated" },
    { value: "metacritic", label: "Metacritic" },
    { value: "released",   label: "Newest" },
    { value: "name",       label: "A–Z" },
];

const SCORE_OPTIONS   = [{ value: "", label: "Any" }, { value: "60", label: "60+" }, { value: "70", label: "70+" }, { value: "80", label: "80+" }, { value: "90", label: "90+" }];
const ERA_OPTIONS     = [{ value: "", label: "All Time", from: "", to: "" }, { value: "2020s", label: "2020s", from: "2020", to: "2029" }, { value: "2010s", label: "2010s", from: "2010", to: "2019" }, { value: "2000s", label: "2000s", from: "2000", to: "2009" }, { value: "90s", label: "90s", from: "1990", to: "1999" }];
const PLATFORM_OPTIONS = [{ value: "", label: "All" }, { value: "pc", label: "PC" }, { value: "playstation", label: "PlayStation" }, { value: "xbox", label: "Xbox" }, { value: "nintendo", label: "Nintendo" }, { value: "mobile", label: "Mobile" }];

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button onClick={onClick} className={cn(
            "flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0",
            active
                ? "bg-[var(--accent)] text-white shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)] scale-105"
                : "text-white/70 hover:text-white hover:bg-white/5"
        )}>
            {label}
        </button>
    );
}

function FilterRow({ label, options, value, onChange }: { label: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
    return (
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 w-16 shrink-0 text-right">{label}</span>
            <div className="flex items-center gap-1 flex-wrap">
                {options.map((opt) => (
                    <button key={opt.value} onClick={() => onChange(opt.value)} className={cn(
                        "px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                        value === opt.value
                            ? "bg-[var(--accent)] text-white"
                            : "text-white/50 hover:text-white hover:bg-white/5 border border-white/10"
                    )}>
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function metacriticColor(score: number) {
    if (score >= 90) return "bg-green-500 text-white";
    if (score >= 75) return "bg-green-400 text-black";
    if (score >= 60) return "bg-yellow-400 text-black";
    return "bg-red-500 text-white";
}

export default function HubPage({ type, value, title, description, initialData }: Props) {
    const [data, setData]                   = useState<HubResponse | null>(initialData ?? null);
    const [page, setPage]                   = useState(1);
    const [sort, setSort]                   = useState("rating");
    const [metacriticMin, setMetacriticMin] = useState("");
    const [era, setEra]                     = useState("");
    const [platform, setPlatform]           = useState("");
    const [loading, setLoading]             = useState(false);
    const [showFilters, setShowFilters]     = useState(false);

    const hasAdvancedFilters = !!(metacriticMin || era || platform);
    const isDefaultState = page === 1 && sort === "rating" && !metacriticMin && !era && !platform;

    const buildUrl = useCallback(() => {
        const params = new URLSearchParams({ page: String(page), sort });
        if (metacriticMin) params.set("metacritic_min", metacriticMin);
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

    const handlePage = (p: number) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">

            {/* Hero — exact PageHero style */}
            <div className="relative w-full h-[400px] mb-8 bg-[#000B25] overflow-hidden flex flex-col items-center justify-center text-center">
                {/* Background */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a103c] via-[#0d0725] to-[#000000]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(60,20,100,0.4)_0%,transparent_70%)] opacity-70" />
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(1px 1px at 50% 50%, rgba(255,255,255,0.3) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
                </div>

                {/* Title */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                    className="relative z-10 flex flex-col items-center gap-4 container mx-auto px-4">
                    <div className="mb-2 relative">
                        <div className="absolute inset-0 blur-xl bg-[var(--accent)]/50 rounded-full" />
                        <Sword className="w-12 h-12 text-[var(--accent)] relative z-10" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-xl">
                        {title.split(" ").map((word, i) => (
                            <span key={i} className={i === 1 ? "text-[var(--accent)]" : ""}>{word} </span>
                        ))}
                    </h1>
                    <p className="text-lg md:text-xl text-white/60 max-w-2xl font-medium tracking-wide">{description}</p>
                </motion.div>

                {/* Single pill bar — sort + filters button */}
                <div className="absolute bottom-6 sm:bottom-10 z-20 w-full px-2 sm:px-4 flex justify-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
                        className="bg-[#0f1221]/90 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-full p-1.5 shadow-2xl flex overflow-x-auto gap-1 items-center max-w-[95vw] sm:max-w-[90vw]"
                        style={{ WebkitOverflowScrolling: "touch" }}>

                        {/* Sort pills */}
                        {SORT_OPTIONS.map((opt) => (
                            <Pill key={opt.value} label={opt.label} active={sort === opt.value}
                                onClick={() => { setSort(opt.value); setPage(1); }} />
                        ))}

                        {/* Divider */}
                        <div className="w-px h-5 bg-white/10 mx-1 shrink-0" />

                        {/* Filters toggle */}
                        <button onClick={() => setShowFilters(v => !v)} className={cn(
                            "flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0",
                            showFilters || hasAdvancedFilters
                                ? "bg-white/10 text-white"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                        )}>
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            Filters
                            {hasAdvancedFilters && (
                                <span className="w-4 h-4 rounded-full bg-[var(--accent)] text-white text-[9px] font-black flex items-center justify-center leading-none">
                                    {[metacriticMin, era, platform].filter(Boolean).length}
                                </span>
                            )}
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Advanced filters panel — slides in below hero */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden -mt-4 mb-6">
                        <div className="container mx-auto px-4 pt-4">
                            <div className="bg-[#0f1221]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl space-y-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold uppercase tracking-widest text-white/40">Advanced Filters</span>
                                    <div className="flex items-center gap-3">
                                        {hasAdvancedFilters && (
                                            <button onClick={() => { setMetacriticMin(""); setEra(""); setPlatform(""); setPage(1); }}
                                                className="text-[11px] text-white/40 hover:text-white flex items-center gap-1 transition-colors">
                                                <X className="w-3 h-3" /> Clear all
                                            </button>
                                        )}
                                        <button onClick={() => setShowFilters(false)} className="text-white/30 hover:text-white transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <FilterRow label="Score"    options={SCORE_OPTIONS}    value={metacriticMin} onChange={(v) => { setMetacriticMin(v); setPage(1); }} />
                                <FilterRow label="Era"      options={ERA_OPTIONS}      value={era}           onChange={(v) => { setEra(v); setPage(1); }} />
                                {type !== "platform" && (
                                    <FilterRow label="Platform" options={PLATFORM_OPTIONS} value={platform}  onChange={(v) => { setPlatform(v); setPage(1); }} />
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="container mx-auto px-4">
                {/* Result count */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                    <h2 className="text-xl font-semibold text-white">{title}</h2>
                    {data && (
                        <span className="text-sm text-[var(--text-muted)] font-mono">{data.total.toLocaleString()} GAMES FOUND</span>
                    )}
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-72 bg-[var(--bg-card)] rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : data && data.results.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {data.results.map((game, idx) => (
                            <Link key={game.id} href={`/games/${game.slug}`}>
                                <motion.article
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03, duration: 0.3 }}
                                    className="group h-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--accent)] hover:shadow-lg hover:shadow-[var(--accent)]/10 transition-all duration-300"
                                >
                                    <div className="relative h-48 w-full overflow-hidden bg-[var(--bg-elevated)]">
                                        {game.background_image ? (
                                            <Image src={game.background_image} alt={game.name} fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Gamepad2 className="w-10 h-10 text-white/10" />
                                            </div>
                                        )}
                                        {game.metacritic ? (
                                            <div className={`absolute top-3 right-3 w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm backdrop-blur-md border border-white/10 ${metacriticColor(game.metacritic)}`}>
                                                {game.metacritic}
                                            </div>
                                        ) : null}
                                        {game.released && (
                                            <div className="absolute bottom-3 left-3">
                                                <span className="px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold rounded">
                                                    {game.released.slice(0, 4)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-base font-semibold text-white line-clamp-2 group-hover:text-[var(--accent)] transition-colors mb-3 leading-snug">
                                            {game.name}
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            {game.rating && Number(game.rating) > 0 && (
                                                <div className="flex items-center gap-1">
                                                    {[1,2,3,4,5].map((s) => (
                                                        <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(Number(game.rating)) ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} />
                                                    ))}
                                                    <span className="text-xs text-[var(--text-muted)] ml-1">{Number(game.rating).toFixed(1)}</span>
                                                </div>
                                            )}
                                            {game.platforms && game.platforms.length > 0 && (
                                                <span className="text-xs text-white/30 ml-auto truncate max-w-[120px]">
                                                    {game.platforms.slice(0, 2).map((p: any) => p?.platform?.name).filter(Boolean).join(" · ")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.article>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-[var(--bg-card)]/50 border border-[var(--border)] rounded-3xl">
                        <Gamepad2 className="w-16 h-16 text-white/10 mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-white mb-2">No games found</h3>
                        <p className="text-[var(--text-secondary)]">Try adjusting your filters.</p>
                    </div>
                )}

                {data && data.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 mb-12">
                        <Button variant="outline" size="sm" onClick={() => handlePage(page - 1)} disabled={page === 1 || loading}>
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </Button>
                        <div className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)]">
                            Page <span className="font-bold text-white">{page}</span> of {data.last_page.toLocaleString()}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handlePage(page + 1)} disabled={page === data.last_page || loading}>
                            Next <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
