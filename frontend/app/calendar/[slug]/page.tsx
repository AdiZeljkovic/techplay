import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getServerApiUrl } from "@/lib/api";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import {
    ChevronLeft, Star, Flame, Globe, Users, Shield,
    Calendar, Bell, Play, CheckCircle2, Circle, Clock3,
} from "lucide-react";
import GameDetailClient, { AddToCalendarButton } from "./GameDetailClient";
import TrackGameButton from "@/components/games/TrackGameButton";

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

function anticipationLabel(score: number): string {
    if (score >= 9) return "Exceptional";
    if (score >= 8) return "Very Positive";
    if (score >= 7) return "Positive";
    if (score >= 5) return "Mixed";
    return "Needs Work";
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-tp-accent/15 border border-tp-accent/30 mb-5">
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
        <div className="mb-5">
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

    const anticipationScore = +(game.rating * 2).toFixed(1);
    const anticipationPct   = (game.rating / 5) * 100;

    const gameTagline = game.description_raw ? tagline(game.description_raw) : "";

    return (
        <div className="min-h-screen bg-white dark:bg-[#05070A]">

            {/* ══ HERO ══════════════════════════════════════════════════════════ */}
            <div className="relative w-full min-h-[600px] h-[72vh] overflow-hidden bg-[#05070A]">

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
                <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/60 to-[#05070A]/10" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#05070A]/90 via-[#05070A]/40 to-transparent" />

                {/* Top orange line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-tp-accent/70 via-tp-accent/20 to-transparent" />

                {/* Content — centered vertically */}
                <div className="absolute inset-0 flex flex-col justify-center">
                    <div className="max-w-[1320px] mx-auto px-8 xl:px-10 w-full">

                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 mb-6">
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

                        {/* Title */}
                        <h1
                            className="font-display font-black text-white uppercase tracking-tight leading-[0.88] mb-5 max-w-[700px]"
                            style={{ fontSize: "clamp(36px, 6vw, 76px)" }}
                        >
                            {game.name}
                        </h1>

                        {/* Release date */}
                        {game.released && (
                            <div className="flex items-center gap-2 mb-5">
                                <Calendar className="w-4 h-4 text-tp-accent shrink-0" />
                                <span className="text-[14px] font-semibold text-white/70">
                                    {format(parseISO(game.released), "MMMM d, yyyy")}
                                </span>
                            </div>
                        )}
                        {game.tba && !game.released && (
                            <span className="inline-block text-[11px] font-black text-tp-accent uppercase tracking-widest border border-tp-accent/40 px-3 py-1.5 rounded-full mb-5">
                                Release Date TBA
                            </span>
                        )}

                        {/* Countdown */}
                        {game.released && <HeroCountdownServer released={game.released} />}

                        {/* Platform chips + genre tags */}
                        <div className="flex flex-wrap items-center gap-2 mb-5">
                            {chips.map(chip => (
                                <span key={chip.label} className={`${chip.cls} text-[9px] font-bold tracking-wider px-2.5 py-[5px] rounded-[4px] leading-none`}>
                                    {chip.label}
                                </span>
                            ))}
                            {game.genres.slice(0, 4).map(g => (
                                <span key={g.id} className="text-[11px] font-medium text-white/60 bg-white/8 border border-white/10 px-2.5 py-1 rounded-full">
                                    #{g.name}
                                </span>
                            ))}
                        </div>

                        {/* Tagline */}
                        {gameTagline && (
                            <p className="text-[14px] text-white/55 max-w-[500px] leading-relaxed mb-5">
                                {gameTagline}
                            </p>
                        )}

                        {/* Stats row */}
                        <div className="flex items-center gap-5 mb-7 flex-wrap">
                            {(game.added || 0) > 0 && (
                                <div className="flex items-center gap-1.5 text-[12px] text-white/50">
                                    <Flame className="w-3.5 h-3.5 text-tp-accent" />
                                    <span className="font-bold text-white/80">{hypeLabel(game.added)}</span>
                                    <span>Players tracking</span>
                                </div>
                            )}
                            {game.metacritic && (
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${metacriticColor(game.metacritic)}`}>
                                    Metacritic {game.metacritic}
                                </div>
                            )}
                            {game.rating > 0 && (
                                <div className="flex items-center gap-1.5 text-[12px] text-white/50">
                                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                    <span className="font-bold text-white/80">{game.rating.toFixed(1)}</span>
                                    <span>/ 5 RAWG</span>
                                </div>
                            )}
                        </div>

                        {/* CTA buttons */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <TrackGameButton slug={slug} gameName={game.name} variant="full" />
                            {game.website && (
                                <a
                                    href={game.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 text-white text-[11px] font-bold uppercase tracking-widest rounded-full transition-all"
                                >
                                    <Globe className="w-4 h-4" /> Official Website
                                </a>
                            )}
                            {movies.count > 0 && (
                                <a
                                    href="#trailers"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 text-white text-[11px] font-bold uppercase tracking-widest rounded-full transition-all"
                                >
                                    <Play className="w-4 h-4" /> Watch Trailer
                                </a>
                            )}
                        </div>

                        {/* Short clip preview strip */}
                        {game.short_screenshots && game.short_screenshots.length > 0 && (
                            <div className="flex gap-2 mt-6 overflow-x-auto pb-1 scrollbar-hide">
                                {game.short_screenshots.slice(0, 6).map((s, i) => (
                                    <div key={s.id} className="relative shrink-0 w-28 h-16 rounded-lg overflow-hidden border border-white/[0.12] hover:border-tp-accent/50 transition-colors">
                                        <Image src={s.image} alt={`${game.name} screenshot ${i + 1}`} fill sizes="112px" className="object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ══ CONTENT ═══════════════════════════════════════════════════════ */}
            <div className="max-w-[1320px] mx-auto px-8 xl:px-10 pt-12 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">

                    {/* Left — tabs */}
                    <GameDetailClient
                        game={game}
                        screenshots={screenshots}
                        movies={movies}
                        suggested={suggested}
                    />

                    {/* Right — sidebar */}
                    <aside className="space-y-5 lg:sticky lg:top-6 self-start">

                        {/* Quick Facts */}
                        <div className="bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-2xl p-5">
                            <h3 className="font-display text-[12px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.12em] mb-5 pb-4 border-b border-zinc-200 dark:border-white/5">
                                Quick Facts
                            </h3>
                            <dl className="space-y-3.5">
                                {game.released && (
                                    <div className="flex items-start gap-3">
                                        <Calendar className="w-3.5 h-3.5 text-tp-accent mt-0.5 shrink-0" />
                                        <div>
                                            <dt className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-white/30 mb-0.5">Release Date</dt>
                                            <dd className="text-[12px] font-semibold text-zinc-900 dark:text-white">{format(parseISO(game.released), "MMMM d, yyyy")}</dd>
                                        </div>
                                    </div>
                                )}
                                {chips.length > 0 && (
                                    <div className="flex items-start gap-3">
                                        <Users className="w-3.5 h-3.5 text-tp-accent mt-0.5 shrink-0" />
                                        <div>
                                            <dt className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-white/30 mb-0.5">Platforms</dt>
                                            <dd className="flex flex-wrap gap-1 mt-1">
                                                {chips.map(chip => (
                                                    <span key={chip.label} className={`${chip.cls} text-[8px] font-bold px-1.5 py-[3px] rounded-[3px] leading-none`}>{chip.label}</span>
                                                ))}
                                            </dd>
                                        </div>
                                    </div>
                                )}
                                {game.genres.length > 0 && (
                                    <div className="flex items-start gap-3">
                                        <Star className="w-3.5 h-3.5 text-tp-accent mt-0.5 shrink-0" />
                                        <div>
                                            <dt className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-white/30 mb-0.5">Genres</dt>
                                            <dd className="text-[12px] text-zinc-900 dark:text-white">{game.genres.map(g => g.name).join(", ")}</dd>
                                        </div>
                                    </div>
                                )}
                                {game.developers.length > 0 && (
                                    <div className="flex items-start gap-3">
                                        <Globe className="w-3.5 h-3.5 text-tp-accent mt-0.5 shrink-0" />
                                        <div>
                                            <dt className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-white/30 mb-0.5">Developer</dt>
                                            <dd className="text-[12px] text-zinc-900 dark:text-white">{game.developers.map(d => d.name).join(", ")}</dd>
                                        </div>
                                    </div>
                                )}
                                {game.publishers.length > 0 && (
                                    <div className="flex items-start gap-3">
                                        <Globe className="w-3.5 h-3.5 text-tp-accent mt-0.5 shrink-0" />
                                        <div>
                                            <dt className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-white/30 mb-0.5">Publisher</dt>
                                            <dd className="text-[12px] text-zinc-900 dark:text-white">{game.publishers.map(p => p.name).join(", ")}</dd>
                                        </div>
                                    </div>
                                )}
                                {game.playtime > 0 && (
                                    <div className="flex items-start gap-3">
                                        <Clock3 className="w-3.5 h-3.5 text-tp-accent mt-0.5 shrink-0" />
                                        <div>
                                            <dt className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-white/30 mb-0.5">Avg. Playtime</dt>
                                            <dd className="text-[12px] text-zinc-900 dark:text-white">{game.playtime}h</dd>
                                        </div>
                                    </div>
                                )}
                                {game.esrb_rating && (
                                    <div className="flex items-start gap-3">
                                        <Shield className="w-3.5 h-3.5 text-tp-accent mt-0.5 shrink-0" />
                                        <div>
                                            <dt className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-white/30 mb-0.5">ESRB</dt>
                                            <dd className="text-[12px] text-zinc-900 dark:text-white">{game.esrb_rating.name}</dd>
                                        </div>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Release Status */}
                        <div className="bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-2xl p-5">
                            <h3 className="font-display text-[12px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.12em] mb-5 pb-4 border-b border-zinc-200 dark:border-white/5">
                                Release Status
                            </h3>
                            <div className="space-y-3 relative">
                                {/* Vertical line */}
                                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-zinc-200 dark:bg-white/[0.06]" />

                                {/* Announced — always checked since we have data */}
                                <div className="flex items-center gap-3 pl-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                    <div className="flex items-center justify-between flex-1">
                                        <span className="text-[11px] font-semibold text-zinc-900 dark:text-white">Announced</span>
                                    </div>
                                </div>

                                {/* Coming Soon / In Development */}
                                {isUpcoming && (
                                    <div className="flex items-center gap-3 pl-1">
                                        <div className="w-3.5 h-3.5 rounded-full bg-tp-accent shrink-0 ring-4 ring-tp-accent/20" />
                                        <div className="flex items-center justify-between flex-1">
                                            <span className="text-[11px] font-bold text-tp-accent">Coming Soon</span>
                                            {game.released && (
                                                <span className="text-[10px] text-zinc-500 dark:text-white/35">{format(parseISO(game.released), "MMM d, yyyy")}</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Released */}
                                <div className="flex items-center gap-3 pl-1">
                                    {isReleased ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                    ) : (
                                        <Circle className="w-3.5 h-3.5 text-zinc-300 dark:text-white/20 shrink-0" />
                                    )}
                                    <div className="flex items-center justify-between flex-1">
                                        <span className={`text-[11px] font-semibold ${isReleased ? "text-zinc-900 dark:text-white font-bold" : "text-zinc-400 dark:text-white/30"}`}>
                                            Released
                                        </span>
                                        {isReleased && game.released && (
                                            <span className="text-[10px] text-zinc-500 dark:text-white/35">{format(parseISO(game.released), "MMM d, yyyy")}</span>
                                        )}
                                        {!isReleased && (
                                            <span className="text-[10px] text-zinc-400 dark:text-white/20">TBA</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Community Anticipation */}
                        {game.rating > 0 && (
                            <div className="bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-2xl p-5">
                                <h3 className="font-display text-[12px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.12em] mb-5 pb-4 border-b border-zinc-200 dark:border-white/5">
                                    Community Anticipation
                                </h3>
                                <div className="text-center mb-4">
                                    <div className="flex items-end justify-center gap-1 mb-1">
                                        <span className="font-display text-[48px] font-black text-zinc-900 dark:text-white leading-none">{anticipationScore}</span>
                                        <span className="text-[18px] font-bold text-zinc-400 dark:text-white/30 mb-2">/10</span>
                                    </div>
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-tp-accent">{anticipationLabel(anticipationScore)}</span>
                                </div>
                                <div className="w-full h-2 bg-zinc-100 dark:bg-white/[0.06] rounded-full overflow-hidden mb-4">
                                    <div
                                        className="h-full bg-tp-accent rounded-full"
                                        style={{ width: `${anticipationPct}%` }}
                                    />
                                </div>
                                <div className="space-y-1.5 text-[11px]">
                                    {(game.added || 0) > 0 && (
                                        <div className="flex items-center justify-between text-zinc-600 dark:text-white/50">
                                            <span className="flex items-center gap-1.5"><Flame className="w-3 h-3 text-tp-accent" /> Players Tracking</span>
                                            <span className="font-bold text-zinc-900 dark:text-white">{hypeLabel(game.added)}</span>
                                        </div>
                                    )}
                                    {game.ratings_count > 0 && (
                                        <div className="flex items-center justify-between text-zinc-600 dark:text-white/50">
                                            <span className="flex items-center gap-1.5"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> RAWG Ratings</span>
                                            <span className="font-bold text-zinc-900 dark:text-white">{game.ratings_count.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Ratings breakdown */}
                        {game.ratings && game.ratings.length > 0 && (
                            <div className="bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-2xl p-5">
                                <h3 className="font-display text-[12px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.12em] mb-5 pb-4 border-b border-zinc-200 dark:border-white/5">
                                    Player Ratings
                                </h3>
                                <div className="space-y-3">
                                    {game.ratings.map(r => {
                                        const colorMap: Record<string, string> = {
                                            exceptional: "bg-green-500",
                                            recommended: "bg-blue-500",
                                            meh: "bg-yellow-400",
                                            skip: "bg-red-500",
                                        };
                                        const emojiMap: Record<string, string> = {
                                            exceptional: "🏆", recommended: "👍", meh: "😐", skip: "👎",
                                        };
                                        return (
                                            <div key={r.id}>
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-[11px] font-semibold text-zinc-600 dark:text-white/60 capitalize">
                                                        {emojiMap[r.title] ?? ""} {r.title}
                                                    </span>
                                                    <span className="text-[11px] font-black text-zinc-900 dark:text-white tabular-nums">
                                                        {r.percent.toFixed(0)}%
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-zinc-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${colorMap[r.title] ?? "bg-tp-accent"}`}
                                                        style={{ width: `${r.percent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {game.ratings_count > 0 && (
                                    <p className="text-[10px] text-zinc-400 dark:text-white/25 mt-4">
                                        Based on {game.ratings_count.toLocaleString()} ratings
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Add to Calendar */}
                        <AddToCalendarButton game={game} />

                        {/* Notify Me — placeholder */}
                        <button
                            disabled
                            className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-[#0B0E14] hover:bg-zinc-50 dark:hover:bg-[#0F1318] border border-zinc-200 dark:border-[#161B22] text-zinc-500 dark:text-white/40 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all disabled:cursor-default"
                        >
                            <Bell className="w-4 h-4" />
                            Notify Me on Release
                        </button>
                    </aside>
                </div>
            </div>
        </div>
    );
}
