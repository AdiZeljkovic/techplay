"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "@/lib/axios";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Gamepad2, ChevronLeft, ChevronRight, Sword } from "lucide-react";
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

const SORT_OPTIONS    = [{ value: "rating", label: "Top Rated" }, { value: "metacritic", label: "Metacritic" }, { value: "released", label: "Newest" }, { value: "name", label: "A–Z" }];
const SCORE_OPTIONS   = [{ value: "", label: "Any" }, { value: "60", label: "60+" }, { value: "70", label: "70+" }, { value: "80", label: "80+" }, { value: "90", label: "90+" }];
const ERA_OPTIONS     = [{ value: "", label: "All Time", from: "", to: "" }, { value: "2020s", label: "2020s", from: "2020", to: "2029" }, { value: "2010s", label: "2010s", from: "2010", to: "2019" }, { value: "2000s", label: "2000s", from: "2000", to: "2009" }, { value: "90s", label: "90s", from: "1990", to: "1999" }];
const PLATFORM_OPTIONS = [{ value: "", label: "All" }, { value: "pc", label: "PC" }, { value: "playstation", label: "PlayStation" }, { value: "xbox", label: "Xbox" }, { value: "nintendo", label: "Nintendo" }, { value: "mobile", label: "Mobile" }];

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button onClick={onClick} className={cn(
            "flex items-center px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0",
            active
                ? "bg-[var(--accent)] text-white shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)] scale-105"
                : "text-white/70 hover:text-white hover:bg-white/5"
        )}>
            {label}
        </button>
    );
}

function PillRow({ label, options, value, onChange }: { label: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
    return (
        <div className="bg-[#0f1221]/90 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-full px-3 py-1.5 shadow-2xl flex items-center gap-1 overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 shrink-0 pr-2 pl-1">{label}</span>
            <div className="w-px h-4 bg-white/10 shrink-0" />
            {options.map((opt) => (
                <Pill key={opt.value} label={opt.label} active={value === opt.value} onClick={() => onChange(opt.value)} />
            ))}
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

            {/* Hero */}
            <div className="relative w-full mb-10 bg-[#000B25] overflow-hidden">
                {/* Background layers */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#12082e] via-[#0d0725] to-[#060414]" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(80,30,160,0.35)_0%,transparent_70%)]" />
                    <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(1px 1px at 50% 50%, rgba(255,255,255,0.5) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
                    {/* Bottom fade into page bg */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center px-4 pt-14 pb-10 gap-0">
                    {/* Icon */}
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
                        className="mb-5 relative flex items-center justify-center w-16 h-16">
                        <div className="absolute inset-0 blur-2xl bg-[var(--accent)]/40 rounded-full" />
                        <div className="relative z-10 w-14 h-14 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center">
                            <Sword className="w-7 h-7 text-[var(--accent)]" />
                        </div>
                    </motion.div>

                    {/* Title */}
                    <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
                        className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4 leading-tight">
                        {title.split(" ").map((word, i) => (
                            <span key={i} className={i === 1 ? "text-[var(--accent)] mx-1" : "mx-1"}>{word}</span>
                        ))}
                    </motion.h1>

                    {/* Description + count */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
                        className="flex flex-col items-center gap-2 mb-8">
                        <p className="text-base md:text-lg text-white/50 max-w-xl font-medium">{description}</p>
                        {data && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] text-xs font-bold tracking-widest uppercase">
                                {data.total.toLocaleString()} games
                            </span>
                        )}
                    </motion.div>

                    {/* Divider */}
                    <div className="w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

                    {/* Filter pill rows */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}
                        className="flex flex-col items-center gap-2 w-full max-w-3xl">
                        <PillRow label="Sort"     options={SORT_OPTIONS}     value={sort}          onChange={(v) => { setSort(v); setPage(1); }} />
                        <PillRow label="Score"    options={SCORE_OPTIONS}    value={metacriticMin} onChange={(v) => { setMetacriticMin(v); setPage(1); }} />
                        <PillRow label="Era"      options={ERA_OPTIONS}      value={era}           onChange={(v) => { setEra(v); setPage(1); }} />
                        {type !== "platform" && (
                            <PillRow label="Platform" options={PLATFORM_OPTIONS} value={platform}  onChange={(v) => { setPlatform(v); setPage(1); }} />
                        )}
                    </motion.div>
                </div>
            </div>

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
