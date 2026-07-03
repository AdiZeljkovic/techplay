import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getApiUrl } from "@/lib/api";
import {
    Calendar, Monitor, Star, Globe,
    ExternalLink, Gamepad2, ArrowLeft, Tag, Info,
    Camera, Layers, ThumbsUp, Shield, Newspaper,
} from "lucide-react";
import GameScreenshotsLightbox from "@/components/games/GameScreenshotsLightbox";
import GameCountdownTimer from "@/components/games/GameCountdownTimer";
import GameRating from "@/components/games/GameRating";
import TrackGameButton from "@/components/games/TrackGameButton";
import GameForumThreads from "@/components/games/GameForumThreads";

/* ─── Rendering: SSR on every request, Cloudflare caches at edge ─────────────
   ISR disabled — game slugs create millions of files and exhaust disk/inodes.
   Cloudflare CDN caches page responses; Next.js writes nothing to disk.
─────────────────────────────────────────────────────────────────────────────── */

export const dynamic = 'force-dynamic';

/* ─── Types ─────────────────────────────────────────────────────────────────── */

interface AgeRating {
    rating_name: string;
    rating_system_name: string;
}

interface SystemRequirement {
    attribute_category_name: string;
    attribute_name: string;
}

interface AlternateTitle {
    title: string;
    description: string;
}

interface GamePlatform {
    platform_id: number;
    platform_name: string;
    first_release_date?: string;
}

interface GameCompany {
    company_id: number;
    company_name: string;
    moby_url?: string;
}

interface GameDetail {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    description_raw: string | null;
    released: string | null;
    background_image: string | null;
    background_image_additional: string | null;
    website: string | null;
    moby_url: string | null;
    rating: number;
    rating_top: number;
    ratings_count: number;
    metacritic: null;
    playtime: null;
    esrb_rating: { name: string } | null;
    age_ratings: AgeRating[];
    system_requirements: SystemRequirement[];
    alternate_titles: AlternateTitle[];
    platforms: GamePlatform[];
    genres: { name: string }[];
    tags: { name: string; slug: string; language: string }[];
    developers: GameCompany[];
    publishers: GameCompany[];
    moby_group_id: number | null;
    moby_group_name: string | null;
    short_screenshots: { image: string; thumbnail_image: string; caption: string }[];
    movies_count: number;
    additions_count: number;
    game_series_count: number;
    screenshots_count: number;
    stores: [];
}

interface MobyScreenshot {
    image: string;
    thumbnail_image?: string;
    caption?: string;
    width?: number;
    height?: number;
}

interface GameListItem {
    id: number;
    name: string;
    slug: string;
    background_image: string;
    released: string;
    rating: number;
}

interface RelatedArticle {
    slug: string;
    title: string;
    excerpt: string | null;
    image: string | null;
    published_at: string | null;
    review_score: number | null;
    category: string | null;
    path: string;
}

/* ─── generateMetadata ───────────────────────────────────────────────────────── */

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;

    try {
        const res = await fetch(`${getApiUrl()}/games/${slug}`);
        if (!res.ok) return { title: "Game Not Found — TechPlay" };
        const game: GameDetail = await res.json();

        const year      = game.released ? new Date(game.released).getFullYear() : null;
        const platforms = (game.platforms ?? []).slice(0, 3).map((p) => p.platform_name).join(", ");
        const developer = game.developers?.[0]?.company_name;
        const esrb      = game.esrb_rating?.name;

        // Trim description to last complete sentence within 155 chars
        let description = "";
        if (game.description_raw && game.description_raw.trim().length > 50) {
            const raw        = game.description_raw.slice(0, 200);
            const lastPeriod = Math.max(raw.lastIndexOf(". "), raw.lastIndexOf("! "), raw.lastIndexOf("? "));
            description      = lastPeriod > 80
                ? raw.slice(0, lastPeriod + 1)
                : raw.slice(0, 155).trimEnd() + "…";
        } else {
            description = [
                game.name,
                year ? `(${year})` : null,
                developer ? `developed by ${developer}` : null,
                platforms ? `— available on ${platforms}.` : null,
                esrb ? `Rated ${esrb}.` : null,
                "Explore details, screenshots and more on TechPlay.",
            ].filter(Boolean).join(" ");
        }

        const keywords = [
            ...(game.genres ?? []).map((g) => g.name),
            ...(game.platforms ?? []).slice(0, 4).map((p) => p.platform_name),
            ...(game.tags ?? []).slice(0, 5).map((t) => t.name),
            game.name,
            year?.toString(),
            developer,
            "game", "review", "rating",
        ].filter(Boolean).join(", ");

        const title      = year ? `${game.name} (${year}) — TechPlay` : `${game.name} — TechPlay`;
        const hasContent = !!(game.description_raw && game.description_raw.trim().length > 50);

        return {
            title,
            description,
            keywords,
            ...(!hasContent ? { robots: { index: false, follow: false } } : {}),
            alternates: { canonical: `https://techplay.gg/games/${slug}` },
            openGraph: {
                title,
                description,
                url:   `https://techplay.gg/games/${slug}`,
                type:  "website",
                siteName: "TechPlay",
                images: game.background_image
                    ? [{ url: game.background_image, width: 1280, height: 720, alt: `${game.name} cover` }]
                    : [],
            },
            twitter: {
                card:        "summary_large_image",
                title,
                description,
                images: game.background_image ? [game.background_image] : [],
            },
        };
    } catch {
        return { title: "TechPlay Games" };
    }
}

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

// ESRB rating label → background color for badge
const ESRB_COLORS: Record<string, string> = {
    "Everyone":          "bg-green-600",
    "Everyone 10+":      "bg-green-500",
    "Teen":              "bg-yellow-500",
    "Mature":            "bg-orange-600",
    "Adults Only":       "bg-red-700",
    "Rating Pending":    "bg-gray-500",
};

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

    const [game, screenshotsRes, seriesRes, suggestedRes, articlesRes] = await Promise.all([
        fetch(`${base}/games/${slug}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${base}/games/${slug}/screenshots`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${base}/games/${slug}/series`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${base}/games/${slug}/suggested`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${base}/games/${slug}/articles`).then((r) => (r.ok ? r.json() : null)),
    ]) as [GameDetail | null, { results: MobyScreenshot[] } | null, { results: GameListItem[] } | null, { results: GameListItem[] } | null, { data: RelatedArticle[] } | null];

    if (!game) notFound();

    const relatedArticles = articlesRes?.data ?? [];

    // Ensure rating is always a number
    if (game.rating) game.rating = Number(game.rating);

    // Transform MobyGames screenshots into the format GameScreenshotsLightbox expects
    const screenshots = (screenshotsRes?.results ?? []).map((s, i) => ({
        id:     i,
        image:  s.image,
        width:  s.width  ?? 640,
        height: s.height ?? 480,
    }));

    const series    = (seriesRes?.results ?? []).filter((g) => g.slug !== slug);
    const suggested = suggestedRes?.results ?? [];

    const isUpcoming = game.released && new Date(game.released) > new Date();

    // Group system_requirements by category for display
    const sysReqGroups = (game.system_requirements ?? []).reduce<Record<string, string[]>>(
        (acc, attr) => {
            const cat = attr.attribute_category_name;
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(attr.attribute_name);
            return acc;
        },
        {}
    );

    /* ── JSON-LD ─────────────────────────────────────────────────────────────── */
    const structuredData: Record<string, unknown> = {
        "@context":          "https://schema.org",
        "@type":             "VideoGame",
        name:                game.name,
        description:         (game.description_raw ?? "").slice(0, 500),
        image:               game.background_image ?? "",
        url:                 `https://techplay.gg/games/${game.slug}`,
        ...(game.moby_url   ? { sameAs: game.moby_url } : {}),
        ...(game.released   ? { datePublished: game.released } : {}),
        ...(game.esrb_rating ? { contentRating: game.esrb_rating.name } : {}),
        // timeRequired intentionally omitted — MobyGames doesn't provide playtime
        ...(Number(game.ratings_count) > 0 && Number(game.rating) > 0 ? {
            aggregateRating: {
                "@type":      "AggregateRating",
                ratingValue:  Number(game.rating).toFixed(1),
                ratingCount:  game.ratings_count,
                bestRating:   "10",
                worstRating:  "1",
            },
        } : {}),
        ...(screenshots.length > 0 ? { screenshot: screenshots.slice(0, 5).map((s) => s.image) } : {}),
        ...((game.alternate_titles ?? []).length > 0 ? { alternateName: game.alternate_titles.map((t) => t.title) } : {}),
        genre:               (game.genres    ?? []).map((g) => g.name),
        gamePlatform:        (game.platforms ?? []).map((p) => p.platform_name),
        publisher:           (game.publishers ?? []).map((p) => ({ "@type": "Organization", name: p.company_name })),
        developer:           (game.developers ?? []).map((d) => ({ "@type": "Organization", name: d.company_name })),
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
        <div className="min-h-screen">
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
                    {game.background_image_additional && (
                        <div className="absolute inset-0 hidden md:block">
                            <Image
                                src={game.background_image_additional}
                                alt=""
                                fill
                                className="object-cover opacity-30 [mask-image:linear-gradient(to_left,rgba(0,0,0,0.8)_0%,transparent_60%)]"
                            />
                        </div>
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
                                    <Calendar className="w-4 h-4 text-[var(--accent)]" />
                                    Releasing {new Date(game.released!).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                </p>
                                <GameCountdownTimer targetDate={game.released!} />
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center gap-3 mt-6">
                                {game.released && (
                                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
                                        <Calendar className="w-4 h-4 text-white/70" />
                                        <span className="text-sm text-white font-medium">{game.released}</span>
                                    </div>
                                )}
                                {game.rating > 0 && (
                                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        <span className="text-sm text-white font-medium">{Number(game.rating).toFixed(1)}</span>
                                        <span className="text-xs text-gray-400">/ {game.rating_top ?? 10}
                                            {game.ratings_count > 0 && ` (${game.ratings_count.toLocaleString()})`}
                                        </span>
                                    </div>
                                )}
                                {game.esrb_rating && (
                                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 backdrop-blur-md ${ESRB_COLORS[game.esrb_rating.name] ?? "bg-gray-600"}`}>
                                        <Shield className="w-4 h-4 text-white/80" />
                                        <span className="text-sm font-bold text-white">{game.esrb_rating.name}</span>
                                    </div>
                                )}
                                {/* Non-ESRB age ratings */}
                                {(game.age_ratings ?? [])
                                    .filter((r) => r.rating_system_name !== "ESRB Rating")
                                    .map((r) => (
                                        <div key={r.rating_system_name} className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
                                            <span className="text-xs text-gray-400">{r.rating_system_name.replace(" Rating", "")}</span>
                                            <span className="text-sm font-bold text-white">{r.rating_name}</span>
                                        </div>
                                    ))
                                }
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
                            {game.description ? (
                                <div className="prose prose-invert prose-base max-w-none text-gray-300 leading-relaxed font-light"
                                    dangerouslySetInnerHTML={{ __html: game.description }} />
                            ) : (
                                <p className="text-gray-500 italic">No description available yet.</p>
                            )}
                        </div>

                        {/* Related News & Reviews */}
                        {relatedArticles.length > 0 && (
                            <div className="bg-[#0f1221]/60 border border-white/5 rounded-2xl p-6">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Newspaper className="w-4 h-4 text-[var(--accent)]" />
                                    News &amp; Reviews
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {relatedArticles.map((a) => (
                                        <Link key={a.slug} href={`/${a.path}/${a.slug}`}
                                            className="group flex gap-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[var(--accent)]/40 rounded-xl p-3 transition-all">
                                            {a.image && (
                                                <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--bg-elevated)]">
                                                    <Image src={a.image} alt={a.title} fill sizes="96px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {a.category && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">{a.category}</span>
                                                    )}
                                                    {a.review_score != null && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-yellow-400">
                                                            <Star className="w-3 h-3 fill-yellow-400" />
                                                            {Number(a.review_score).toFixed(1)}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-semibold text-white group-hover:text-[var(--accent)] transition-colors line-clamp-2 leading-snug">
                                                    {a.title}
                                                </p>
                                                {a.published_at && (
                                                    <p className="text-xs text-[var(--text-muted)] mt-1">
                                                        {new Date(a.published_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Alternate Titles */}
                        {game.alternate_titles && game.alternate_titles.length > 0 && (
                            <div className="bg-[#0f1221]/60 border border-white/5 rounded-2xl p-6">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Info className="w-4 h-4 text-[var(--accent)]" />
                                    Also Known As
                                </h3>
                                <div className="space-y-2">
                                    {game.alternate_titles.map((alt) => (
                                        <div key={alt.title} className="flex items-start gap-3">
                                            <span className="text-white font-medium text-sm">{alt.title}</span>
                                            {alt.description && (
                                                <span className="text-gray-500 text-xs mt-0.5">({alt.description})</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { icon: ThumbsUp, label: "MobyScore", value: game.rating > 0 ? `${Number(game.rating).toFixed(1)} / 10` : "No score" },
                                { icon: Camera,   label: "Screenshots", value: game.screenshots_count || screenshots.length || 0 },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="bg-[#0f1221]/60 border border-white/5 rounded-2xl p-5 hover:bg-[#0f1221]/80 transition-colors">
                                    <Icon className="w-4 h-4 text-[var(--accent)] mb-2" />
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                                    <p className="text-xl font-bold text-white">{value}</p>
                                </div>
                            ))}
                        </div>

                        {/* System Requirements */}
                        {Object.keys(sysReqGroups).length > 0 && (
                            <div className="bg-[#0f1221]/60 border border-white/5 rounded-2xl p-6">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-5 flex items-center gap-2">
                                    <Monitor className="w-4 h-4 text-[var(--accent)]" />
                                    System Requirements
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {Object.entries(sysReqGroups).map(([category, values]) => (
                                        <div key={category} className="bg-white/5 rounded-xl p-3">
                                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{category.replace(/^Minimum /, "Min. ")}</p>
                                            <p className="text-sm text-white font-medium">{values.join(", ")}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Dev / Publisher */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-[#0f1221]/60 border border-white/5 rounded-2xl p-5">
                                <h3 className="text-xs uppercase text-gray-400 font-bold mb-3 tracking-widest">Developers</h3>
                                <div className="flex flex-wrap gap-2">
                                    {game.developers?.length > 0 ? (
                                        game.developers.map((d) => (
                                            <span key={d.company_id ?? d.company_name} className="text-white font-semibold text-sm">
                                                {d.company_name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-500 text-sm italic">Unknown</span>
                                    )}
                                </div>
                            </div>
                            <div className="bg-[#0f1221]/60 border border-white/5 rounded-2xl p-5">
                                <h3 className="text-xs uppercase text-gray-400 font-bold mb-3 tracking-widest">Publishers</h3>
                                <div className="flex flex-wrap gap-2">
                                    {game.publishers?.length > 0 ? (
                                        game.publishers.map((p) => (
                                            <span key={p.company_id ?? p.company_name} className="text-white font-semibold text-sm">
                                                {p.company_name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-500 text-sm italic">Unknown</span>
                                    )}
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
                                    {game.tags.filter((t) => t.language === "eng").slice(0, 24).map((t) => (
                                        <span key={t.slug} className="px-2.5 py-1 bg-white/5 rounded-lg text-xs text-gray-400 border border-white/5 hover:border-white/20 transition-colors">
                                            {t.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Community Ratings */}
                        <GameRating slug={slug} />
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-b from-[#0f1221]/90 to-[#0f1221]/70 border border-[var(--accent)]/20 rounded-3xl p-7 backdrop-blur-xl shadow-2xl sticky top-24">

                            {/* Track / Add to Collection */}
                            <div className="mb-5">
                                <TrackGameButton slug={slug} gameName={game.name} variant="full" />
                            </div>

                            {/* MobyGames link */}
                            {game.moby_url && (
                                <a href={game.moby_url} target="_blank" rel="noopener noreferrer"
                                    className="mb-5 flex items-center justify-center gap-2 w-full py-3 bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 border border-[var(--accent)]/30 rounded-xl text-white text-sm font-medium transition-all">
                                    <ExternalLink className="w-4 h-4" />
                                    View on MobyGames
                                </a>
                            )}

                            {/* Official Website */}
                            {game.website && (
                                <a href={game.website} target="_blank" rel="noopener noreferrer"
                                    className="mb-5 flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-medium transition-all">
                                    <Globe className="w-4 h-4" />
                                    Official Website
                                </a>
                            )}

                            {/* Age Ratings */}
                            {game.age_ratings && game.age_ratings.length > 0 && (
                                <div className="mb-5">
                                    <h3 className="text-xs uppercase text-gray-400 font-bold mb-3 tracking-widest">Age Ratings</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {game.age_ratings.map((r) => (
                                            <div key={r.rating_system_name} className="flex flex-col items-center bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                                                <span className="text-[10px] text-gray-400 uppercase tracking-wider">{r.rating_system_name.replace(" Rating", "")}</span>
                                                <span className="text-sm font-black text-white mt-0.5">{r.rating_name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Platforms */}
                            <div className="pt-5 border-t border-white/10">
                                <h3 className="text-xs uppercase text-gray-400 font-bold mb-3 tracking-widest">Available On</h3>
                                <div className="flex flex-wrap gap-2">
                                    {game.platforms?.map((p) => (
                                        <span key={`${p.platform_id}-${p.platform_name}`} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-gray-300">
                                            {p.platform_name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Series */}
                            {game.moby_group_name && (
                                <div className="mt-5 pt-5 border-t border-white/10">
                                    <h3 className="text-xs uppercase text-gray-400 font-bold mb-2 tracking-widest flex items-center gap-2">
                                        <Layers className="w-3.5 h-3.5" /> Series
                                    </h3>
                                    <p className="text-sm text-white font-semibold">{game.moby_group_name}</p>
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

                {/* ── Forum discussion ──────────────────────────────────────── */}
                <GameForumThreads gameSlug={slug} />
            </div>
        </div>
    );
}
