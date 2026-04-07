import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getApiUrl } from "@/lib/api";
import {
    Calendar, Monitor, Star, Globe, ShoppingCart,
    ExternalLink, Timer, Gamepad2, ArrowLeft, Tag, Info,
    Hourglass, Camera, Play, Trophy, Layers, Puzzle, ThumbsUp, Zap, X,
} from "lucide-react";
import GameScreenshotsLightbox from "@/components/games/GameScreenshotsLightbox";
import GameTrailersPlayer from "@/components/games/GameTrailersPlayer";
import GameCountdownTimer from "@/components/games/GameCountdownTimer";

/* ─── ISR config ────────────────────────────────────────────────────────────── */

export const revalidate    = 2592000; // 30 days
export const dynamicParams = true;       // unknown slugs → dynamic fallback

/* ─── generateStaticParams ──────────────────────────────────────────────────── */

export async function generateStaticParams() {
    try {
        const res = await fetch(`${getApiUrl()}/games/crawled-slugs`, { cache: "no-store" });
        if (!res.ok) return [];
        const slugs: string[] = await res.json();
        return slugs.map((slug) => ({ slug }));
    } catch {
        return [];
    }
}

/* ─── Types ─────────────────────────────────────────────────────────────────── */

interface Store {
    id: number;
    url: string;
    store: { id: number; name: string; domain: string };
}

interface Rating {
    id: number;
    title: string;
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
    slug: string;
    description: string;
    description_raw: string;
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

/* ─── generateMetadata ───────────────────────────────────────────────────────── */

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;

    try {
        const res = await fetch(`${getApiUrl()}/games/${slug}`);
        if (!res.ok) return { title: "Game Not Found — TechPlay" };
        const game: GameDetail = await res.json();

        const description = game.description_raw
            ? game.description_raw.slice(0, 155).trimEnd() + "..."
            : `${game.name} — explore gameplay, screenshots, trailers and more on TechPlay.`;

        const genres    = (game.genres    ?? []).map((g) => g.name);
        const platforms = (game.platforms ?? []).map((p) => p.platform.name);
        const keywords  = [...genres, ...platforms, game.name, "game", "gameplay", "gaming"].join(", ");

        return {
            title:       `${game.name} — TechPlay`,
            description,
            keywords,
            alternates:  { canonical: `https://techplay.gg/games/${slug}` },
            openGraph: {
                title:       `${game.name} — TechPlay`,
                description,
                url:         `https://techplay.gg/games/${slug}`,
                type:        "website",
                images: game.background_image
                    ? [{ url: game.background_image, width: 1280, height: 720, alt: game.name }]
                    : [],
            },
            twitter: {
                card:        "summary_large_image",
                title:       `${game.name} — TechPlay`,
                description,
                images: game.background_image ? [game.background_image] : [],
            },
        };
    } catch {
        return { title: "TechPlay Games" };
    }
}

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

const RATING_STYLES: Record<string, { color: string; Icon: React.FC<{ className?: string }> }> = {
    exceptional: { color: "bg-green-500",  Icon: Zap      },
    recommended: { color: "bg-blue-500",   Icon: ThumbsUp },
    meh:         { color: "bg-yellow-500", Icon: Star     },
    skip:        { color: "bg-red-500",    Icon: X        },
};

function metacriticColor(score: number) {
    return score >= 80
        ? "bg-green-500 text-white"
        : score >= 60
        ? "bg-yellow-500 text-black"
        : "bg-red-500 text-white";
}

function MiniGameCard({ game }: { game: GameListItem }) {
    return (
        <Link href={`/games/${game.slug}`}
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
            <div className="p-3">
                <p className="text-sm font-bold text-white group-hover:text-[var(--accent)] transition-colors line-clamp-2 leading-snug">{game.name}</p>
                {game.released && <p className="text-xs text-[var(--text-muted)] mt-1">{game.released.slice(0, 4)}</p>}
            </div>
        </Link>
    );
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */

export default async function GameDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const base     = getApiUrl();

    const [game, screenshotsRes, moviesRes, seriesRes, suggestedRes, additionsRes] = await Promise.all([
        fetch(`${base}/games/${slug}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${base}/games/${slug}/screenshots`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${base}/games/${slug}/movies`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${base}/games/${slug}/series`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${base}/games/${slug}/suggested`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${base}/games/${slug}/additions`).then((r) => (r.ok ? r.json() : null)),
    ]) as [GameDetail | null, { results: Screenshot[] } | null, { results: Movie[] } | null, { results: GameListItem[] } | null, { results: GameListItem[] } | null, { results: GameListItem[] } | null];

    if (!game) notFound();

    const screenshots = screenshotsRes?.results ?? [];
    const movies      = moviesRes?.results ?? [];
    const series      = (seriesRes?.results ?? []).filter((g) => g.slug !== slug);
    const suggested   = suggestedRes?.results ?? [];
    const additions   = additionsRes?.results ?? [];

    const isUpcoming = game.released && new Date(game.released) > new Date();

    /* ── JSON-LD ─────────────────────────────────────────────────────────────── */
    const structuredData = {
        "@context": "https://schema.org",
        "@type":    "VideoGame",
        name:        game.name,
        description: game.description_raw?.slice(0, 500) ?? "",
        image:       game.background_image ?? "",
        url:         `https://techplay.gg/games/${game.slug}`,
        ...(game.released ? { datePublished: game.released } : {}),
        ...(game.ratings_count > 0 && game.rating > 0 ? {
            aggregateRating: {
                "@type":      "AggregateRating",
                ratingValue:  game.rating.toFixed(1),
                ratingCount:  game.ratings_count,
                bestRating:   "5",
                worstRating:  "1",
            },
        } : {}),
        genre:           (game.genres    ?? []).map((g) => g.name),
        gamePlatform:    (game.platforms ?? []).map((p) => p.platform.name),
        publisher:       (game.publishers ?? []).map((p) => ({ "@type": "Organization", name: p.name })),
        developer:       (game.developers ?? []).map((d) => ({ "@type": "Organization", name: d.name })),
        applicationCategory: "Game",
    };

    const breadcrumb = {
        "@context": "https://schema.org",
        "@type":    "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home",  item: "https://techplay.gg" },
            { "@type": "ListItem", position: 2, name: "Games", item: "https://techplay.gg/games" },
            { "@type": "ListItem", position: 3, name: game.name, item: `https://techplay.gg/games/${game.slug}` },
        ],
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

            {/* ── Hero ──────────────────────────────────────────────────────── */}
            <div className="relative h-[85vh] w-full overflow-hidden">
                <div className="absolute inset-0 z-0">
                    {game.background_image && (
                        <Image
                            src={game.background_image}
                            alt={game.name}
                            fill
                            className="object-cover"
                            priority
                        />
                    )}
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
                            {game.genres?.map((g) => (
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
                                    <Timer className="w-4 h-4 text-[var(--accent)]" />
                                    Releasing {new Date(game.released).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                </p>
                                <GameCountdownTimer targetDate={game.released} />
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center gap-3 mt-6">
                                {game.released && (
                                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
                                        <Calendar className="w-4 h-4 text-white/70" />
                                        <span className="text-sm text-white font-medium">{game.released}</span>
                                    </div>
                                )}
                                {game.metacritic ? (
                                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
                                        <div className={`w-7 h-7 rounded flex items-center justify-center text-xs font-black ${metacriticColor(game.metacritic)}`}>
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

            {/* ── Screenshots strip (Client Component) ──────────────────────── */}
            <GameScreenshotsLightbox screenshots={screenshots} />

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
                                    {game.ratings.map((r) => {
                                        const style = RATING_STYLES[r.title] ?? { color: "bg-gray-500", Icon: Star };
                                        const { Icon } = style;
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
                                    {game.metacritic_platforms.map((mp) => (
                                        <a key={mp.platform.slug} href={mp.url} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors">
                                            <span className={`px-2 py-0.5 rounded text-xs font-black ${metacriticColor(mp.metascore)}`}>{mp.metascore}</span>
                                            <span className="text-sm text-gray-300">{mp.platform.name}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Trailers (Client Component) */}
                        <GameTrailersPlayer movies={movies} />

                        {/* Dev / Publisher */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-[#0f1221]/60 border border-white/5 rounded-2xl p-5">
                                <h3 className="text-xs uppercase text-gray-400 font-bold mb-3 tracking-widest">Developers</h3>
                                <div className="flex flex-wrap gap-2">
                                    {game.developers?.map((d) => (
                                        <span key={d.name} className="text-white font-semibold text-sm">{d.name}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-[#0f1221]/60 border border-white/5 rounded-2xl p-5">
                                <h3 className="text-xs uppercase text-gray-400 font-bold mb-3 tracking-widest">Publishers</h3>
                                <div className="flex flex-wrap gap-2">
                                    {game.publishers?.map((p) => (
                                        <span key={p.name} className="text-white font-semibold text-sm">{p.name}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        {game.tags && game.tags.filter((t) => t.language === "eng").length > 0 && (
                            <div className="bg-[#0f1221]/60 border border-white/5 rounded-2xl p-5">
                                <h3 className="text-xs uppercase text-gray-400 font-bold mb-3 tracking-widest flex items-center gap-2">
                                    <Tag className="w-3.5 h-3.5" /> Tags
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {game.tags.filter((t) => t.language === "eng").slice(0, 20).map((t) => (
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
                                        const n = store.store.name.toLowerCase();
                                        const q = encodeURIComponent(game.name);
                                        const url = store.url?.startsWith("http") ? store.url
                                            : n.includes("steam")       ? `https://store.steampowered.com/search/?term=${q}`
                                            : n.includes("gog")         ? `https://www.gog.com/en/games?query=${q}`
                                            : n.includes("epic")        ? `https://store.epicgames.com/en-US/browse?q=${q}`
                                            : n.includes("playstation") ? `https://store.playstation.com/search/${q}`
                                            : n.includes("xbox")        ? `https://www.xbox.com/en-US/games/all-games?q=${q}`
                                            : n.includes("nintendo")    ? `https://www.nintendo.com/search/?q=${q}`
                                            : store.store.domain        ? `https://${store.store.domain}`
                                            : null;
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
                                    {game.platforms?.map((p) => (
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
                            {series.slice(0, 6).map((g) => <MiniGameCard key={g.id} game={g} />)}
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
                            {additions.slice(0, 6).map((g) => <MiniGameCard key={g.id} game={g} />)}
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
                            {suggested.slice(0, 6).map((g) => <MiniGameCard key={g.id} game={g} />)}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
