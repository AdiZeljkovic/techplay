"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import { useParams } from "next/navigation";
import {
    Calendar, Monitor, Star, Globe, Clock, ShoppingCart,
    ExternalLink, Timer, Gamepad2, ArrowLeft, Tag, Info,
    Hourglass, Camera, Play, ChevronLeft, ChevronRight,
    X, Trophy, Layers, Puzzle, ThumbsUp, Zap,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { differenceInSeconds, parseISO, isFuture, format } from "date-fns";
import Image from "next/image";
import Link from "next/link";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface Store {
    id: number;
    url: string;
    store: { id: number; name: string; domain: string };
}

interface Rating {
    id: number;
    title: string;  // "exceptional" | "recommended" | "meh" | "skip"
    count: number;
    percent: number;
}

interface MetacriticPlatform {
    metascore: number;
    url: string;
    platform: { platform: number; name: string; slug: string };
}

interface GameDetail {
    id: number;
    name: string;
    description: string;
    released: string;
    background_image: string;
    background_image_additional: string;
    website: string;
    rating: number;
    rating_top: number;
    ratings: Rating[];
    ratings_count: number;
    metacritic: number;
    metacritic_url: string;
    metacritic_platforms: MetacriticPlatform[];
    playtime: number;
    esrb_rating: { name: string; slug: string };
    achievements_count: number;
    movies_count: number;
    additions_count: number;
    game_series_count: number;
    screenshots_count: number;
    reddit_url: string;
    reddit_count: number;
    platforms: { platform: { name: string } }[];
    developers: { name: string }[];
    publishers: { name: string }[];
    genres: { name: string }[];
    tags: { name: string; slug: string; language: string }[];
    stores: Store[];
}

interface Screenshot {
    id: number;
    image: string;
    width: number;
    height: number;
}

interface Movie {
    id: number;
    name: string;
    preview: string;
    data: { "480": string; max: string };
}

interface GameListItem {
    id: number;
    name: string;
    slug: string;
    background_image: string;
    released: string;
    metacritic: number;
    rating: number;
}

/* ─── Countdown ─────────────────────────────────────────────────────────────── */

function CountdownTimer({ targetDate }: { targetDate: string }) {
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

    useEffect(() => {
        const calc = () => {
            const diff = differenceInSeconds(parseISO(targetDate), new Date());
            if (diff <= 0) return null;
            return {
                days:    Math.floor(diff / (3600 * 24)),
                hours:   Math.floor((diff % (3600 * 24)) / 3600),
                minutes: Math.floor((diff % 3600) / 60),
                seconds: Math.floor(diff % 60),
            };
        };
        setTimeLeft(calc());
        const t = setInterval(() => setTimeLeft(calc()), 1000);
        return () => clearInterval(t);
    }, [targetDate]);

    if (!timeLeft) return null;

    return (
        <div className="flex flex-wrap gap-4">
            {[["Days", timeLeft.days], ["Hours", timeLeft.hours], ["Mins", timeLeft.minutes], ["Secs", timeLeft.seconds]].map(([label, val]) => (
                <div key={label} className="flex flex-col items-center bg-black/60 backdrop-blur-xl border border-[var(--accent)]/50 p-4 rounded-2xl min-w-[90px] shadow-[0_0_30px_rgba(var(--accent-rgb),0.2)]">
                    <span className="text-4xl font-black text-white font-mono">{String(val).padStart(2, "0")}</span>
                    <span className="text-[10px] uppercase text-[var(--accent)] font-bold tracking-widest mt-1">{label}</span>
                </div>
            ))}
        </div>
    );
}

/* ─── Screenshots Lightbox ──────────────────────────────────────────────────── */

function Lightbox({ images, initial, onClose }: {
    images: Screenshot[];
    initial: number;
    onClose: () => void;
}) {
    const [idx, setIdx] = useState(initial);

    const prev = useCallback(() => setIdx(i => (i - 1 + images.length) % images.length), [images.length]);
    const next = useCallback(() => setIdx(i => (i + 1) % images.length), [images.length]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose, prev, next]);

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 rounded-full z-10 transition-colors">
                <X className="w-6 h-6" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full z-10 transition-all">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="relative w-full max-w-5xl max-h-[80vh] mx-16" onClick={(e) => e.stopPropagation()}>
                <Image src={images[idx].image} alt={`Screenshot ${idx + 1}`} width={1920} height={1080}
                    className="w-full h-auto max-h-[80vh] object-contain rounded-xl" />
                <p className="text-center text-white/40 text-sm mt-3">{idx + 1} / {images.length}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full z-10 transition-all">
                <ChevronRight className="w-6 h-6" />
            </button>
        </div>
    );
}

/* ─── Rating bar colours ─────────────────────────────────────────────────────── */

const RATING_STYLES: Record<string, { color: string; icon: typeof Star }> = {
    exceptional: { color: "bg-green-500",  icon: Zap },
    recommended: { color: "bg-blue-500",   icon: ThumbsUp },
    meh:         { color: "bg-yellow-500", icon: Star },
    skip:        { color: "bg-red-500",    icon: X },
};

const getMetacriticColor = (score: number) =>
    score >= 80 ? "bg-green-500 text-white" : score >= 60 ? "bg-yellow-500 text-black" : "bg-red-500 text-white";

/* ─── Mini game card ─────────────────────────────────────────────────────────── */

function MiniGameCard({ game }: { game: GameListItem }) {
    return (
        <Link href={`/games/${game.slug}`}
            className="group flex flex-col bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--accent)] transition-all hover:shadow-xl hover:shadow-[var(--accent)]/10">
            <div className="relative h-32 bg-[var(--bg-elevated)] overflow-hidden">
                {game.background_image ? (
                    <Image src={game.background_image} alt={game.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center"><Gamepad2 className="w-8 h-8 text-[var(--text-muted)]" /></div>
                )}
                {game.metacritic ? (
                    <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${getMetacriticColor(game.metacritic)}`}>{game.metacritic}</span>
                ) : null}
            </div>
            <div className="p-3">
                <p className="text-sm font-bold text-white group-hover:text-[var(--accent)] transition-colors line-clamp-2 leading-snug">{game.name}</p>
                {game.released && <p className="text-xs text-[var(--text-muted)] mt-1">{game.released.slice(0, 4)}</p>}
            </div>
        </Link>
    );
}

/* ─── Main page ──────────────────────────────────────────────────────────────── */

export default function GameDetailPage() {
    const params = useParams();
    const slug = params.slug as string;

    const { data: game, isLoading } = useSWR<GameDetail>(slug ? `/games/${slug}` : null, fetcher);
    const { data: screenshotsData }  = useSWR<{ results: Screenshot[] }>(slug ? `/games/${slug}/screenshots` : null, fetcher);
    const { data: moviesData }        = useSWR<{ results: Movie[] }>(slug ? `/games/${slug}/movies` : null, fetcher);
    const { data: seriesData }        = useSWR<{ results: GameListItem[] }>(slug ? `/games/${slug}/series` : null, fetcher);
    const { data: suggestedData }     = useSWR<{ results: GameListItem[] }>(slug ? `/games/${slug}/suggested` : null, fetcher);
    const { data: additionsData }     = useSWR<{ results: GameListItem[] }>(slug ? `/games/${slug}/additions` : null, fetcher);

    const [lightboxIdx, setLightboxIdx]   = useState<number | null>(null);
    const [activeTrailer, setActiveTrailer] = useState(0);

    const screenshots = screenshotsData?.results ?? [];
    const movies      = moviesData?.results ?? [];
    const series      = seriesData?.results?.filter(g => g.slug !== slug) ?? [];
    const suggested   = suggestedData?.results ?? [];
    const additions   = additionsData?.results ?? [];

    if (isLoading) return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!game) return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-3xl font-bold text-white mb-4">Game Not Found</h1>
            <p className="text-[var(--text-secondary)] mb-8">This game doesn't exist or couldn't be loaded.</p>
            <Link href="/games" className="text-[var(--accent)] hover:underline font-medium">← Back to Games</Link>
        </div>
    );

    const isUpcoming = game.released && isFuture(parseISO(game.released));

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">

            {/* ── Hero ──────────────────────────────────────────────────────── */}
            <div className="relative h-[85vh] w-full overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <Image
                        src={game.background_image}
                        alt={game.name}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/40 to-black/60" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-primary)]/90 via-transparent to-transparent" />
                </div>

                <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-end pb-24">
                    <Link href="/games"
                        className="absolute top-8 left-4 md:left-8 flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/30 px-4 py-2 rounded-full backdrop-blur-md hover:bg-black/50">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Games
                    </Link>

                    <div className="max-w-4xl animate-in slide-in-from-bottom-10 fade-in duration-700">
                        <div className="flex flex-wrap gap-2 mb-5">
                            {game.genres?.map(g => (
                                <span key={g.name} className="px-3 py-1 bg-[var(--accent)]/90 text-white border border-[var(--accent)] rounded-full text-xs font-bold uppercase tracking-widest">
                                    {g.name}
                                </span>
                            ))}
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-[0.9] tracking-tight drop-shadow-2xl">
                            {game.name}
                        </h1>

                        {isUpcoming ? (
                            <div className="mt-6 mb-8">
                                <p className="text-white/70 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-[var(--accent)]" />
                                    Releasing {format(parseISO(game.released), "MMMM d, yyyy")}
                                </p>
                                <CountdownTimer targetDate={game.released} />
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center gap-3 mt-6">
                                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
                                    <Calendar className="w-4 h-4 text-white/70" />
                                    <span className="text-sm text-white font-medium">{game.released}</span>
                                </div>
                                {game.metacritic ? (
                                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
                                        <div className={`w-7 h-7 rounded flex items-center justify-center text-xs font-black ${getMetacriticColor(game.metacritic)}`}>
                                            {game.metacritic}
                                        </div>
                                        <span className="text-sm text-gray-300">Metascore</span>
                                    </div>
                                ) : null}
                                {game.rating > 0 && (
                                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        <span className="text-sm text-white font-medium">{game.rating.toFixed(1)}</span>
                                        <span className="text-xs text-gray-400">/ {game.rating_top} ({game.ratings_count?.toLocaleString()})</span>
                                    </div>
                                )}
                                {game.esrb_rating && (
                                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
                                        <Info className="w-4 h-4 text-white/70" />
                                        <span className="text-sm font-bold text-white">{game.esrb_rating.name}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Screenshots strip ─────────────────────────────────────────── */}
            {screenshots.length > 0 && (
                <div className="container mx-auto px-4 -mt-12 relative z-20 mb-10">
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {screenshots.map((s, i) => (
                            <button key={s.id} onClick={() => setLightboxIdx(i)}
                                className="relative shrink-0 w-48 h-28 rounded-xl overflow-hidden border border-white/10 hover:border-[var(--accent)] transition-all group">
                                <Image src={s.image} alt={`Screenshot ${i + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                                    <Camera className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {lightboxIdx !== null && (
                <Lightbox images={screenshots} initial={lightboxIdx} onClose={() => setLightboxIdx(null)} />
            )}

            {/* ── Main content ─────────────────────────────────────────────── */}
            <div className="container mx-auto px-4 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left/main */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Description */}
                        <div className="bg-[#0f1221]/80 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-[20%] bg-[var(--accent)]/5 blur-[100px] rounded-full pointer-events-none" />
                            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-3">
                                <Monitor className="w-5 h-5 text-[var(--accent)]" />
                                About
                            </h2>
                            <div className="prose prose-invert prose-base max-w-none text-gray-300 leading-relaxed font-light"
                                dangerouslySetInnerHTML={{ __html: game.description }} />
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { icon: Hourglass, label: "Avg. Playtime",   value: game.playtime ? `${game.playtime}h` : "N/A" },
                                { icon: Trophy,    label: "Achievements",    value: game.achievements_count?.toLocaleString() ?? "N/A" },
                                { icon: Play,      label: "Trailers",        value: game.movies_count ?? movies.length ?? 0 },
                                { icon: Camera,    label: "Screenshots",     value: game.screenshots_count ?? screenshots.length ?? 0 },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="bg-[#0f1221]/60 border border-white/5 rounded-2xl p-5 hover:bg-[#0f1221]/80 transition-colors">
                                    <Icon className="w-4 h-4 text-[var(--accent)] mb-2" />
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                                    <p className="text-xl font-bold text-white">{value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Community ratings */}
                        {game.ratings && game.ratings.length > 0 && (
                            <div className="bg-[#0f1221]/60 border border-white/5 rounded-2xl p-6">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-5 flex items-center gap-2">
                                    <Star className="w-4 h-4 text-[var(--accent)]" />
                                    Community Ratings
                                    <span className="text-[var(--text-muted)] font-normal normal-case ml-1 text-xs">({game.ratings_count?.toLocaleString()} votes)</span>
                                </h3>
                                <div className="space-y-3">
                                    {game.ratings.map(r => {
                                        const style = RATING_STYLES[r.title] ?? { color: "bg-gray-500", icon: Star };
                                        const Icon = style.icon;
                                        return (
                                            <div key={r.id} className="flex items-center gap-3">
                                                <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                                                <span className="text-sm text-gray-300 capitalize w-28 shrink-0">{r.title}</span>
                                                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-700 ${style.color}`}
                                                        style={{ width: `${r.percent}%` }} />
                                                </div>
                                                <span className="text-xs text-gray-400 w-12 text-right shrink-0">{r.percent.toFixed(0)}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Metacritic per platform */}
                        {game.metacritic_platforms && game.metacritic_platforms.length > 1 && (
                            <div className="bg-[#0f1221]/60 border border-white/5 rounded-2xl p-6">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Info className="w-4 h-4 text-[var(--accent)]" />
                                    Metacritic by Platform
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {game.metacritic_platforms.map(mp => (
                                        <a key={mp.platform.slug} href={mp.url} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors">
                                            <span className={`px-2 py-0.5 rounded text-xs font-black ${getMetacriticColor(mp.metascore)}`}>{mp.metascore}</span>
                                            <span className="text-sm text-gray-300">{mp.platform.name}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Trailers */}
                        {movies.length > 0 && (
                            <div className="bg-[#0f1221]/80 border border-white/5 rounded-3xl p-6 shadow-2xl">
                                <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-3">
                                    <Play className="w-5 h-5 text-[var(--accent)]" />
                                    Trailers & Videos
                                </h2>

                                {/* Main video */}
                                <div className="rounded-2xl overflow-hidden border border-white/10 mb-4">
                                    <video
                                        key={movies[activeTrailer]?.data?.max}
                                        controls
                                        poster={movies[activeTrailer]?.preview}
                                        className="w-full max-h-[400px] bg-black"
                                    >
                                        <source src={movies[activeTrailer]?.data?.max} type="video/mp4" />
                                        <source src={movies[activeTrailer]?.data?.["480"]} type="video/mp4" />
                                    </video>
                                </div>

                                {/* Thumbnails */}
                                {movies.length > 1 && (
                                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                                        {movies.map((m, i) => (
                                            <button key={m.id} onClick={() => setActiveTrailer(i)}
                                                className={`relative shrink-0 w-36 h-20 rounded-xl overflow-hidden border-2 transition-all ${activeTrailer === i ? "border-[var(--accent)]" : "border-transparent hover:border-white/30"}`}>
                                                <Image src={m.preview} alt={m.name} fill className="object-cover" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <Play className="w-5 h-5 text-white" fill="white" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {movies[activeTrailer] && (
                                    <p className="text-xs text-gray-400 mt-3">{movies[activeTrailer].name}</p>
                                )}
                            </div>
                        )}

                        {/* Dev / Publisher / Tags */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-[#0f1221]/60 border border-white/5 rounded-2xl p-5">
                                <h3 className="text-xs uppercase text-gray-400 font-bold mb-3 tracking-widest">Developers</h3>
                                <div className="flex flex-wrap gap-2">
                                    {game.developers?.map(d => (
                                        <span key={d.name} className="text-white font-semibold text-sm">{d.name}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-[#0f1221]/60 border border-white/5 rounded-2xl p-5">
                                <h3 className="text-xs uppercase text-gray-400 font-bold mb-3 tracking-widest">Publishers</h3>
                                <div className="flex flex-wrap gap-2">
                                    {game.publishers?.map(p => (
                                        <span key={p.name} className="text-white font-semibold text-sm">{p.name}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        {game.tags && game.tags.filter(t => t.language === "eng").length > 0 && (
                            <div className="bg-[#0f1221]/60 border border-white/5 rounded-2xl p-5">
                                <h3 className="text-xs uppercase text-gray-400 font-bold mb-3 tracking-widest flex items-center gap-2">
                                    <Tag className="w-3.5 h-3.5" /> Tags
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {game.tags.filter(t => t.language === "eng").slice(0, 20).map(t => (
                                        <span key={t.slug} className="px-2.5 py-1 bg-white/5 rounded-lg text-xs text-gray-400 border border-white/5 hover:border-white/20 transition-colors">
                                            {t.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-b from-[#0f1221]/90 to-[#0f1221]/70 border border-[var(--accent)]/20 rounded-3xl p-7 backdrop-blur-xl shadow-2xl sticky top-24">

                            {/* Stores */}
                            <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-3">
                                <ShoppingCart className="w-5 h-5 text-[var(--accent)]" />
                                {isUpcoming ? "Pre-Order / Wishlist" : "Buy Now"}
                            </h3>

                            {game.stores && game.stores.length > 0 ? (
                                <div className="space-y-2">
                                    {game.stores.map((store) => {
                                        const getUrl = () => {
                                            if (store.url?.startsWith("http")) return store.url;
                                            const n = store.store.name.toLowerCase();
                                            const q = encodeURIComponent(game.name);
                                            if (n.includes("steam"))       return `https://store.steampowered.com/search/?term=${q}`;
                                            if (n.includes("gog"))         return `https://www.gog.com/en/games?query=${q}`;
                                            if (n.includes("epic"))        return `https://store.epicgames.com/en-US/browse?q=${q}`;
                                            if (n.includes("playstation")) return `https://store.playstation.com/search/${q}`;
                                            if (n.includes("xbox"))        return `https://www.xbox.com/en-US/games/all-games?q=${q}`;
                                            if (n.includes("nintendo"))    return `https://www.nintendo.com/search/?q=${q}`;
                                            if (store.store.domain)        return `https://${store.store.domain}`;
                                            return null;
                                        };
                                        const url = getUrl();
                                        if (!url) return null;
                                        return (
                                            <a key={store.id} href={url} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-[var(--accent)] hover:text-white border border-white/5 hover:border-[var(--accent)] transition-all group">
                                                <span className="font-semibold text-sm text-gray-300 group-hover:text-white">{store.store.name}</span>
                                                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-white" />
                                            </a>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm">No store links available.</p>
                            )}

                            {/* Website */}
                            {game.website && (
                                <a href={game.website} target="_blank" rel="noopener noreferrer"
                                    className="mt-5 flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-medium transition-all">
                                    <Globe className="w-4 h-4" />
                                    Official Website
                                </a>
                            )}

                            {/* Reddit */}
                            {game.reddit_url && (
                                <a href={game.reddit_url} target="_blank" rel="noopener noreferrer"
                                    className="mt-2 flex items-center justify-between w-full py-3 px-4 bg-white/5 hover:bg-[#FF4500]/20 border border-white/10 hover:border-[#FF4500]/40 rounded-xl text-white text-sm font-medium transition-all">
                                    <span>Reddit Community</span>
                                    <span className="text-xs text-gray-400">{game.reddit_count?.toLocaleString()} posts</span>
                                </a>
                            )}

                            {/* Platforms */}
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <h3 className="text-xs uppercase text-gray-400 font-bold mb-3 tracking-widest">Available On</h3>
                                <div className="flex flex-wrap gap-2">
                                    {game.platforms?.map(p => (
                                        <span key={p.platform.name} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-gray-300">
                                            {p.platform.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Quick counts */}
                            {(game.additions_count > 0 || game.game_series_count > 0) && (
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    {game.game_series_count > 0 && (
                                        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                                            <p className="text-lg font-bold text-white">{game.game_series_count}</p>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">In Series</p>
                                        </div>
                                    )}
                                    {game.additions_count > 0 && (
                                        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                                            <p className="text-lg font-bold text-white">{game.additions_count}</p>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">DLC</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── More in series ────────────────────────────────────────── */}
                {series.length > 0 && (
                    <section className="mt-16">
                        <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                            <Layers className="w-6 h-6 text-[var(--accent)]" />
                            More in the Series
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {series.slice(0, 6).map(g => <MiniGameCard key={g.id} game={g} />)}
                        </div>
                    </section>
                )}

                {/* ── DLC / Additions ──────────────────────────────────────── */}
                {additions.length > 0 && (
                    <section className="mt-16">
                        <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                            <Puzzle className="w-6 h-6 text-[var(--accent)]" />
                            DLC & Editions
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {additions.slice(0, 6).map(g => <MiniGameCard key={g.id} game={g} />)}
                        </div>
                    </section>
                )}

                {/* ── Similar games ─────────────────────────────────────────── */}
                {suggested.length > 0 && (
                    <section className="mt-16">
                        <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                            <Gamepad2 className="w-6 h-6 text-[var(--accent)]" />
                            You Might Also Like
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {suggested.slice(0, 6).map(g => <MiniGameCard key={g.id} game={g} />)}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
