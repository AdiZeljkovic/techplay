import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getServerApiUrl } from "@/lib/api";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import {
    ChevronLeft, Star, Flame, Globe, Shield,
    Calendar, Bell, ExternalLink,
} from "lucide-react";
import GameDetailClient, { AddToCalendarButton } from "./GameDetailClient";
import TrackGameButton from "@/components/games/TrackGameButton";
import SocialShare from "@/components/share/SocialShare";
import { Article } from "@/types";

export const revalidate = 43200; // 12h ISR

// ── Types ──────────────────────────────────────────────────────────────────────

interface RawgPlatform { platform: { id: number; name: string; slug: string }; released_at?: string }
interface RawgGenre    { id: number; name: string; slug: string }
interface RawgTag      { id: number; name: string; slug: string; language: string }
interface RawgDev      { id: number; name: string; slug: string }
interface Screenshot   { id: number; image: string; width: number; height: number }
interface Movie        { id: number; name: string; preview: string; data: { "480": string; max: string } }
interface SuggestedGame {
    id: number; slug: string; name: string;
    released: string | null; background_image: string | null;
    rating: number;
    genres: { name: string }[];
    platforms: { platform: { name: string; slug: string } }[];
}
interface SeriesGame {
    id: number; slug: string; name: string;
    released: string | null; background_image: string | null;
    rating: number;
}

interface RawgGame {
    id: number; slug: string; name: string;
    description: string; description_raw: string;
    released: string | null; tba: boolean;
    background_image: string | null; background_image_additional: string | null;
    website: string | null; metacritic: number | null;
    rating: number; rating_top: number; ratings_count: number; added: number; playtime: number;
    platforms: RawgPlatform[]; genres: RawgGenre[]; tags: RawgTag[];
    developers: RawgDev[]; publishers: RawgDev[];
    esrb_rating: { id: number; name: string; slug: string } | null;
    short_screenshots: { id: number; image: string }[];
    clip: { clip: string; preview: string; clips: Record<string, string>; video: string } | null;
    ratings: { id: number; title: string; count: number; percent: number }[];
    added_by_status: {
        yet: number; owned: number; beaten: number;
        toplay: number; dropped: number; playing: number;
    } | null;
}

type Props = { params: Promise<{ slug: string }> };

// ── Fetchers ───────────────────────────────────────────────────────────────────

async function getGame(slug: string): Promise<RawgGame | null> {
    try {
        const res = await fetch(`${getServerApiUrl()}/games/rawg/${slug}`, {
            next: { revalidate: 43200, tags: [`rawg-game-${slug}`] },
        });
        if (!res.ok) return null;
        return res.json();
    } catch { return null; }
}

async function getScreenshots(slug: string): Promise<{ count: number; results: Screenshot[] }> {
    try {
        const res = await fetch(`${getServerApiUrl()}/games/rawg/${slug}/screenshots`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return { count: 0, results: [] };
        return res.json();
    } catch { return { count: 0, results: [] }; }
}

async function getMovies(slug: string): Promise<{ count: number; results: Movie[] }> {
    try {
        const res = await fetch(`${getServerApiUrl()}/games/rawg/${slug}/movies`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return { count: 0, results: [] };
        return res.json();
    } catch { return { count: 0, results: [] }; }
}

async function getSuggestedGames(slug: string): Promise<{ count: number; results: SuggestedGame[] }> {
    try {
        const res = await fetch(`${getServerApiUrl()}/games/rawg/${slug}/suggested`, {
            next: { revalidate: 21600 },
        });
        if (!res.ok) return { count: 0, results: [] };
        return res.json();
    } catch { return { count: 0, results: [] }; }
}

async function getGameSeries(slug: string): Promise<{ count: number; results: SeriesGame[] }> {
    try {
        const res = await fetch(`${getServerApiUrl()}/games/rawg/${slug}/game-series`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return { count: 0, results: [] };
        return res.json();
    } catch { return { count: 0, results: [] }; }
}

async function getGameNews(gameName: string): Promise<Article[]> {
    try {
        const query = encodeURIComponent(gameName.slice(0, 40));
        const res = await fetch(`${getServerApiUrl()}/news?search=${query}&page=1`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return [];
        const json = await res.json();
        return (json.data ?? []).slice(0, 4);
    } catch { return []; }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function platformChip(name: string, slug?: string): { label: string; cls: string } | null {
    const s = (slug || name).toLowerCase();
    if (s.includes("pc") || s === "windows") return { label: "PC", cls: "bg-[#2F6FED] text-white" };
    if (s.includes("playstation-5") || name === "PlayStation 5") return { label: "PS5", cls: "bg-[#1A3FA8] text-white" };
    if (s.includes("playstation-4") || name === "PlayStation 4") return { label: "PS4", cls: "bg-[#1A3FA8] text-white" };
    if (s.includes("playstation")) return { label: "PS", cls: "bg-[#1A3FA8] text-white" };
    if (s.includes("xbox-series") || name.includes("Series")) return { label: "SERIES", cls: "bg-[#107C10] text-white" };
    if (s.includes("xbox-one")) return { label: "ONE", cls: "bg-[#107C10] text-white" };
    if (s.includes("xbox")) return { label: "XBOX", cls: "bg-[#107C10] text-white" };
    if (s.includes("nintendo") || s.includes("switch")) return { label: "SWITCH", cls: "bg-[#E60012] text-white" };
    return null;
}

function metacriticColor(score: number): string {
    if (score >= 75) return "bg-green-500 text-white";
    if (score >= 50) return "bg-yellow-400 text-black";
    return "bg-red-500 text-white";
}

function hypeLabel(added: number): string {
    if (added >= 10000) return `${(added / 1000).toFixed(0)}K`;
    if (added >= 1000)  return `${(added / 1000).toFixed(1)}K`;
    return String(added);
}

function tagline(description: string): string {
    const first = description.split(/[.!?]/)[0]?.trim() ?? "";
    return first.length > 120 ? first.slice(0, 117) + "…" : first;
}

// ── Metadata ────────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const game = await getGame(slug);
    if (!game) return { title: "Game Not Found - TechPlay" };
    const desc = game.description_raw?.slice(0, 160) || `${game.name} — release info, screenshots and details on TechPlay.`;
    return {
        title: `${game.name} - Release Calendar - TechPlay`,
        description: desc,
        openGraph: {
            title: game.name, description: desc,
            images: game.background_image ? [game.background_image] : [],
            type: "website",
        },
        twitter: { card: "summary_large_image", title: game.name, description: desc, images: game.background_image ? [game.background_image] : [] },
    };
}

// ── Countdown (server renders static, client hydrates) ─────────────────────────

function HeroCountdownServer({ released }: { released: string }) {
    const diff = parseISO(released).getTime() - Date.now();
    const isPast  = diff <= 0;
    const isToday = diff > -86400000 && isPast;

    if (isPast) {
        return (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-tp-accent/15 border border-tp-accent/30">
                <span className="text-[13px] font-black text-tp-accent uppercase tracking-widest">
                    {isToday ? "Out Today" : "Out Now"}
                </span>
            </div>
        );
    }

    const days    = Math.floor(diff / 86400000);
    const hours   = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    const units = [{ v: days, label: "Days" }, { v: hours, label: "Hrs" }, { v: minutes, label: "Min" }, { v: seconds, label: "Sec" }];

    return (
        <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-tp-accent mb-2">Launches in</p>
            <div className="flex items-end gap-2">
                {units.map(({ v, label }, i) => (
                    <div key={label} className="flex items-end gap-2">
                        <div className="flex flex-col items-center bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 min-w-[52px]">
                            <span className="font-display font-black text-white text-[26px] leading-none tabular-nums" suppressHydrationWarning>
                                {String(v).padStart(2, "0")}
                            </span>
                            <span className="text-[8px] font-bold uppercase tracking-widest text-white/35 mt-1 leading-none">{label}</span>
                        </div>
                        {i < units.length - 1 && <span className="text-white/25 font-black text-[18px] leading-none mb-3">:</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Sidebar countdown — compact ────────────────────────────────────────────────

function SidebarCountdown({ released }: { released: string }) {
    const diff = parseISO(released).getTime() - Date.now();
    if (diff <= 0) return null;
    const days = Math.floor(diff / 86400000);
    return (
        <div className="flex items-center gap-1.5 text-[11px] text-white/50">
            <Calendar className="w-3 h-3 text-tp-accent shrink-0" />
            <span><span className="font-black text-white">{days}</span> days to release</span>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function CalendarGamePage({ params }: Props) {
    const { slug } = await params;

    const [game, screenshots, movies, suggested] = await Promise.all([
        getGame(slug),
        getScreenshots(slug),
        getMovies(slug),
        getSuggestedGames(slug),
    ]);

    if (!game) notFound();

    // Fetch series + news after we know the game name
    const [gameSeries, gameNews] = await Promise.all([
        getGameSeries(slug),
        getGameNews(game.name),
    ]);

    // Build platform chips (deduplicated)
    const chips: { label: string; cls: string }[] = [];
    for (const p of game.platforms || []) {
        const chip = platformChip(p.platform.name, p.platform.slug);
        if (chip && !chips.some(c => c.label === chip.label)) chips.push(chip);
    }

    const isReleased = game.released ? isBefore(parseISO(game.released), startOfDay(new Date())) : false;
    const isFuture   = game.released ? !isReleased : false;
    const isUpcoming = isFuture || game.tba;
    const statusLabel = isUpcoming ? "Upcoming Release" : "Past Release";
    const gameTagline = game.description_raw ? tagline(game.description_raw) : "";
    const pageUrl = `https://techplay.gg/calendar/${slug}`;

    // Series: pick first game that isn't this one
    const seriesGame = gameSeries.results.find(g => g.slug !== slug) ?? null;

    return (
        <div className="min-h-screen bg-white dark:bg-[#05070A]">

            {/* ══ HERO ══════════════════════════════════════════════════════════ */}
            <div className="relative w-full min-h-[560px] overflow-hidden bg-[#05070A]">

                {/* Background image */}
                {game.background_image && (
                    <Image
                        src={game.background_image}
                        alt={game.name}
                        fill priority
                        sizes="100vw"
                        className="object-cover object-top"
                    />
                )}

                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/70 to-[#05070A]/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#05070A]/95 via-[#05070A]/50 to-transparent" />

                {/* Top orange line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-tp-accent/70 via-tp-accent/20 to-transparent" />

                {/* Content */}
                <div className="relative z-10 max-w-[1320px] mx-auto px-6 xl:px-10 pt-10 pb-12">

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 mb-8">
                        <Link
                            href="/calendar"
                            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            Release Calendar
                        </Link>
                        <span className="text-white/20 text-[10px]">/</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isUpcoming ? "text-tp-accent" : "text-white/40"}`}>
                            {statusLabel}
                        </span>
                    </div>

                    {/* Two-column hero: left content + right YouTube embed */}
                    <div className={`grid gap-8 items-center ${game.clip?.video ? "grid-cols-1 lg:grid-cols-[1fr_400px]" : "grid-cols-1"}`}>
                        {/* LEFT */}
                        <div>
                            {/* Title */}
                            <h1
                                className="font-display font-black text-white uppercase tracking-tight leading-[0.88] mb-4 max-w-[700px]"
                                style={{ fontSize: "clamp(34px, 5.5vw, 70px)" }}
                            >
                                {game.name}
                            </h1>

                            {/* Tagline */}
                            {gameTagline && (
                                <p className="text-[14px] text-white/50 max-w-[520px] leading-relaxed mb-5">
                                    {gameTagline}
                                </p>
                            )}

                            {/* Release date row */}
                            <div className="flex items-center gap-4 mb-5 flex-wrap">
                                {game.released && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-tp-accent shrink-0" />
                                        <span className="text-[14px] font-semibold text-white/70">
                                            {format(parseISO(game.released), "MMMM d, yyyy")}
                                        </span>
                                    </div>
                                )}
                                {game.tba && !game.released && (
                                    <span className="inline-block text-[11px] font-black text-tp-accent uppercase tracking-widest border border-tp-accent/40 px-3 py-1.5 rounded-full">
                                        Release Date TBA
                                    </span>
                                )}
                                {game.metacritic && (
                                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg ${metacriticColor(game.metacritic)}`}>
                                        Metacritic {game.metacritic}
                                    </span>
                                )}
                            </div>

                            {/* Countdown */}
                            {game.released && !isReleased && (
                                <div className="mb-5">
                                    <HeroCountdownServer released={game.released} />
                                </div>
                            )}

                            {/* Platform chips + genre pills */}
                            <div className="flex flex-wrap items-center gap-2 mb-5">
                                {chips.map(chip => (
                                    <span key={chip.label} className={`${chip.cls} text-[9px] font-bold tracking-wider px-2.5 py-[5px] rounded-[4px] leading-none`}>
                                        {chip.label}
                                    </span>
                                ))}
                                {game.genres.slice(0, 4).map(g => (
                                    <span key={g.id} className="text-[11px] font-medium text-white/55 bg-white/[0.07] border border-white/[0.09] px-2.5 py-1 rounded-full">
                                        #{g.name}
                                    </span>
                                ))}
                            </div>

                            {/* Stats row */}
                            {(game.added || 0) > 0 && (
                                <div className="flex items-center gap-5 mb-6 flex-wrap">
                                    <div className="flex items-center gap-1.5 text-[12px] text-white/50">
                                        <Flame className="w-3.5 h-3.5 text-tp-accent" />
                                        <span className="font-bold text-white/80">{hypeLabel(game.added)}</span>
                                        <span>players tracking</span>
                                    </div>
                                    {game.rating > 0 && (
                                        <div className="flex items-center gap-1.5 text-[12px] text-white/50">
                                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                            <span className="font-bold text-white/80">{game.rating.toFixed(1)}</span>
                                            <span>/ 5 RAWG</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* CTA buttons row */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <TrackGameButton slug={slug} gameName={game.name} variant="full" />
                                <AddToCalendarButton game={game} />
                                <button
                                    disabled
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.04] border border-white/10 text-white/30 text-[11px] font-bold uppercase tracking-widest rounded-full cursor-default"
                                >
                                    <Bell className="w-3.5 h-3.5" />
                                    Notify Me
                                </button>
                                {game.website && (
                                    <a
                                        href={game.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.04] hover:bg-white/10 border border-white/10 hover:border-white/25 text-white/60 hover:text-white text-[11px] font-bold uppercase tracking-widest rounded-full transition-all"
                                    >
                                        <Globe className="w-3.5 h-3.5" />
                                        Official Site
                                    </a>
                                )}
                                <SocialShare url={pageUrl} title={game.name} description={gameTagline} vertical={false} />
                            </div>
                        </div>

                        {/* RIGHT — YouTube embed (only if clip.video exists) */}
                        {game.clip?.video && (
                            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl">
                                <iframe
                                    src={`https://www.youtube-nocookie.com/embed/${game.clip.video}?rel=0&modestbranding=1`}
                                    title={`${game.name} — Official Trailer`}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="absolute inset-0 w-full h-full"
                                />
                                <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/50">
                                        Official Reveal Trailer · Watch on YouTube
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ══ CONTENT ═══════════════════════════════════════════════════════ */}
            <div className="max-w-[1320px] mx-auto px-6 xl:px-10 pt-12 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">

                    {/* Main column */}
                    <GameDetailClient
                        game={game}
                        screenshots={screenshots}
                        movies={movies}
                        suggested={suggested}
                        news={gameNews}
                        isUpcoming={isUpcoming}
                    />

                    {/* Sidebar */}
                    <aside className="space-y-4 lg:sticky lg:top-6 self-start">

                        {/* 1. RELEASE INFO */}
                        <div className="bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-2xl p-5">
                            <h3 className="font-display text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.12em] mb-4 pb-3 border-b border-zinc-200 dark:border-white/5">
                                Release Info
                            </h3>
                            <div className="space-y-3">
                                {/* Date */}
                                {game.released && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-500 dark:text-white/40 uppercase tracking-widest font-bold">Date</span>
                                        <span className="text-[12px] font-bold text-zinc-900 dark:text-white">{format(parseISO(game.released), "MMM d, yyyy")}</span>
                                    </div>
                                )}
                                {game.tba && !game.released && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-500 dark:text-white/40 uppercase tracking-widest font-bold">Date</span>
                                        <span className="text-[12px] font-bold text-tp-accent">TBA</span>
                                    </div>
                                )}
                                {/* Countdown */}
                                {game.released && !isReleased && (
                                    <SidebarCountdown released={game.released} />
                                )}
                                {/* Status badge */}
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-zinc-500 dark:text-white/40 uppercase tracking-widest font-bold">Status</span>
                                    {isUpcoming ? (
                                        <span className="text-[9px] font-black uppercase tracking-widest text-tp-accent bg-tp-accent/10 border border-tp-accent/25 px-2.5 py-1 rounded-full">
                                            Upcoming
                                        </span>
                                    ) : (
                                        <span className="text-[9px] font-black uppercase tracking-widest text-green-400 bg-green-500/10 border border-green-500/25 px-2.5 py-1 rounded-full">
                                            Released
                                        </span>
                                    )}
                                </div>
                                {/* Pre-orders */}
                                {isUpcoming && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-500 dark:text-white/40 uppercase tracking-widest font-bold">Pre-Orders</span>
                                        {game.website ? (
                                            <a href={game.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] font-bold text-tp-accent hover:underline">
                                                Open <ExternalLink className="w-2.5 h-2.5" />
                                            </a>
                                        ) : (
                                            <span className="text-[11px] font-bold text-zinc-400 dark:text-white/25">TBA</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. PLATFORMS */}
                        {chips.length > 0 && (
                            <div className="bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-2xl p-5">
                                <h3 className="font-display text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.12em] mb-3">
                                    Platforms
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {chips.map(chip => (
                                        <span key={chip.label} className={`${chip.cls} text-[10px] font-bold px-3 py-1.5 rounded-lg leading-none`}>
                                            {chip.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. GAME DETAILS */}
                        <div className="bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-2xl p-5">
                            <h3 className="font-display text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.12em] mb-4 pb-3 border-b border-zinc-200 dark:border-white/5">
                                Game Details
                            </h3>
                            <dl className="space-y-2.5">
                                {game.genres.length > 0 && (
                                    <div className="flex items-start gap-3">
                                        <dt className="text-[10px] text-zinc-500 dark:text-white/35 uppercase tracking-widest font-bold w-20 shrink-0 pt-px">Genre</dt>
                                        <dd className="text-[11px] font-semibold text-zinc-900 dark:text-white leading-snug">{game.genres.map(g => g.name).join(", ")}</dd>
                                    </div>
                                )}
                                {game.developers.length > 0 && (
                                    <div className="flex items-start gap-3">
                                        <dt className="text-[10px] text-zinc-500 dark:text-white/35 uppercase tracking-widest font-bold w-20 shrink-0 pt-px">Dev</dt>
                                        <dd className="text-[11px] font-semibold text-zinc-900 dark:text-white leading-snug">{game.developers.map(d => d.name).join(", ")}</dd>
                                    </div>
                                )}
                                {game.publishers.length > 0 && (
                                    <div className="flex items-start gap-3">
                                        <dt className="text-[10px] text-zinc-500 dark:text-white/35 uppercase tracking-widest font-bold w-20 shrink-0 pt-px">Publisher</dt>
                                        <dd className="text-[11px] font-semibold text-zinc-900 dark:text-white leading-snug">{game.publishers.map(p => p.name).join(", ")}</dd>
                                    </div>
                                )}
                                {gameSeries.count > 0 && (
                                    <div className="flex items-start gap-3">
                                        <dt className="text-[10px] text-zinc-500 dark:text-white/35 uppercase tracking-widest font-bold w-20 shrink-0 pt-px">Franchise</dt>
                                        <dd className="text-[11px] font-semibold text-zinc-900 dark:text-white">{gameSeries.count} titles in series</dd>
                                    </div>
                                )}
                                {game.playtime > 0 && (
                                    <div className="flex items-start gap-3">
                                        <dt className="text-[10px] text-zinc-500 dark:text-white/35 uppercase tracking-widest font-bold w-20 shrink-0 pt-px">Playtime</dt>
                                        <dd className="text-[11px] font-semibold text-zinc-900 dark:text-white">{game.playtime}h avg.</dd>
                                    </div>
                                )}
                                {game.esrb_rating && (
                                    <div className="flex items-start gap-3">
                                        <Shield className="w-3 h-3 text-tp-accent mt-0.5 shrink-0" />
                                        <div>
                                            <dt className="text-[10px] text-zinc-500 dark:text-white/35 uppercase tracking-widest font-bold">ESRB</dt>
                                            <dd className="text-[11px] font-semibold text-zinc-900 dark:text-white">{game.esrb_rating.name}</dd>
                                        </div>
                                    </div>
                                )}
                                {game.metacritic && (
                                    <div className="flex items-start gap-3">
                                        <dt className="text-[10px] text-zinc-500 dark:text-white/35 uppercase tracking-widest font-bold w-20 shrink-0 pt-px">Metacritic</dt>
                                        <dd>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${metacriticColor(game.metacritic)}`}>
                                                {game.metacritic}
                                            </span>
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* 4. ACTIONS */}
                        <div className="bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-2xl p-5 space-y-2.5">
                            <TrackGameButton slug={slug} gameName={game.name} variant="full" />
                            <AddToCalendarButton game={game} />
                            <button
                                disabled
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-100 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.07] text-zinc-400 dark:text-white/25 text-[10px] font-bold uppercase tracking-widest rounded-full cursor-default"
                            >
                                <Bell className="w-3.5 h-3.5" />
                                Notify Me on Release
                            </button>
                        </div>

                        {/* 5. LATEST IN SERIES */}
                        {seriesGame && (
                            <div className="bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-2xl overflow-hidden">
                                {seriesGame.background_image && (
                                    <div className="relative h-24">
                                        <Image
                                            src={seriesGame.background_image}
                                            alt={seriesGame.name}
                                            fill
                                            sizes="320px"
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                    </div>
                                )}
                                <div className="p-4">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-tp-accent mb-1">
                                        Also in Series
                                    </p>
                                    <p className="text-[13px] font-bold text-zinc-900 dark:text-white leading-snug mb-2">
                                        {seriesGame.name}
                                    </p>
                                    {seriesGame.released && (
                                        <p className="text-[10px] text-zinc-500 dark:text-white/35 mb-3">
                                            {format(parseISO(seriesGame.released), "MMM d, yyyy")}
                                        </p>
                                    )}
                                    <Link
                                        href={`/calendar/${seriesGame.slug}`}
                                        className="text-[10px] font-bold uppercase tracking-widest text-tp-accent hover:underline"
                                    >
                                        View Game →
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* 6. SIMILAR UPCOMING (compact list of 3) */}
                        {suggested.results.length > 0 && (
                            <div className="bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-2xl p-5">
                                <h3 className="font-display text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.12em] mb-4 pb-3 border-b border-zinc-200 dark:border-white/5">
                                    Similar Games
                                </h3>
                                <div className="space-y-3">
                                    {suggested.results.slice(0, 3).map(sg => (
                                        <Link
                                            key={sg.id}
                                            href={`/calendar/${sg.slug}`}
                                            className="flex gap-3 items-center group"
                                        >
                                            <div className="relative shrink-0 w-16 h-10 rounded-lg overflow-hidden border border-zinc-200 dark:border-white/[0.06] bg-zinc-100 dark:bg-[#0F1318]">
                                                {sg.background_image && (
                                                    <Image
                                                        src={sg.background_image}
                                                        alt={sg.name}
                                                        fill
                                                        sizes="64px"
                                                        className="object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] font-bold text-zinc-900 dark:text-white group-hover:text-tp-accent transition-colors line-clamp-1">
                                                    {sg.name}
                                                </p>
                                                {sg.released && (
                                                    <p className="text-[10px] text-zinc-500 dark:text-white/35">
                                                        {format(parseISO(sg.released), "MMM d, yyyy")}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                    </aside>
                </div>
            </div>
        </div>
    );
}
