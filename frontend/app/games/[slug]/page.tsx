import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getApiUrl } from "@/lib/api";
import { fetchContent } from "@/lib/fetchContent";
import {
    Calendar, Star, Globe, Gamepad2, ChevronLeft, Tag, Info,
    Layers, Shield, Newspaper, Users, Cpu, Package, Eye,
} from "lucide-react";
import GameScreenshotsLightbox from "@/components/games/GameScreenshotsLightbox";
import GameCountdownTimer from "@/components/games/GameCountdownTimer";
import GameRating from "@/components/games/GameRating";
import TrackGameButton from "@/components/games/TrackGameButton";
import AddToListButton from "@/components/games/AddToListButton";
import GameForumThreads from "@/components/games/GameForumThreads";
import DataAttribution from "@/components/games/DataAttribution";
import BoxArtGallery, { type BoxArt } from "@/components/games/BoxArtGallery";
import TrailerPlayer from "@/components/games/TrailerPlayer";
import Panel from "@/components/ui/Panel";
import { DisplayAd } from "@/components/ads/AdSense";

/* ─── Rendering: SSR on every request, Cloudflare caches at edge ─────────────
   ISR disabled — game slugs create millions of files and exhaust disk/inodes.
   Cloudflare CDN caches page responses; Next.js writes nothing to disk.
─────────────────────────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic";

/* ─── Types — the canonical /games/{slug} payload ───────────────────────────── */

interface AgeRating {
    rating_name: string;
    rating_system_name: string;
}

interface GameAttribute {
    attribute_category_name: string;
    attribute_name: string;
}

interface AlternateTitle {
    title: string;
    description: string | null;
}

/** The subset of a game's credits that has a studio page behind it. */
interface GameStudio {
    name: string;
    slug: string;
    logo_url: string | null;
    games_count: number;
    role: "developer" | "publisher";
}

interface GameDetail {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    released: string | null;
    release_precision: string | null;
    cover_url: string | null;
    website: string | null;
    rating: number;
    rating_top: number;
    ratings_count: number;
    esrb_rating: { name: string } | null;
    age_ratings: AgeRating[];
    attributes: GameAttribute[];
    alt_titles: AlternateTitle[];
    platforms: string[];
    genres: string[];
    tags: string[];
    developers: string[];
    publishers: string[];
    series_key: number | null;
    series_name: string | null;
    studios: GameStudio[];
    videos: string[];
    box_art: BoxArt[];
    critic_scores: {
        opencritic?: { score?: number | null; tier?: string | null; url?: string | null } | null;
        metacritic?: { score?: number | null; url?: string | null } | null;
    } | null;
    techplay_score: number | null;
    screenshots_count: number;
    views: number;
}

/** The screenshots endpoint serves Moby objects and aggregator URL strings alike. */
type ApiScreenshot = string | {
    image: string;
    thumbnail_image?: string;
    caption?: string;
    width?: number;
    height?: number;
};

interface GameListItem {
    id: number;
    name: string;
    slug: string;
    cover_url: string;
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

/* ─── Loading ────────────────────────────────────────────────────────────────── */

/** Everything the page draws, in one response. */
interface GameBundle {
    game: GameDetail;
    screenshots: ApiScreenshot[];
    series: GameListItem[];
    suggested: GameListItem[];
    articles: RelatedArticle[];
}

/**
 * One request per render, for the whole page.
 *
 * This used to be five — the game, its screenshots, its series, its suggestions
 * and its related articles — plus a sixth from generateMetadata. The API meters
 * at sixty requests a minute keyed on the caller's IP, and every server render
 * leaves from one address, so twelve game views a minute drained the budget and
 * the thirteenth got a 429 that this page turned into a 500. Measured against
 * production: five of twelve pages failed at fifteen requests a minute, and
 * sixty-three of seventy-five at full speed.
 *
 * That is a page count no reader would ever hit, and exactly the pace a crawler
 * works at — with 114,000 game URLs in the sitemap, the catalogue was
 * effectively closed to indexing.
 *
 * generateMetadata and the body both call this. Next deduplicates identical
 * fetches within one render, so the pair costs a single request; they must stay
 * identical for that to hold.
 */
function loadGame(slug: string) {
    return fetchContent<GameBundle>(`${getApiUrl()}/games/${slug}/bundle`);
}

/* ─── generateMetadata ───────────────────────────────────────────────────────── */

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;

    try {
        const bundle = await loadGame(slug);
        if (!bundle) return { title: "Game Not Found" };
        const game = bundle.game;

        const year      = game.released ? new Date(game.released).getFullYear() : null;
        const platforms = (game.platforms ?? []).slice(0, 3).join(", ");
        const developer = game.developers?.[0];
        const esrb      = game.esrb_rating?.name;
        const plainDescription = (game.description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

        // Trim description to last complete sentence within 155 chars
        let description = "";
        if (plainDescription.length > 50) {
            const raw        = plainDescription.slice(0, 200);
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
            ...(game.genres ?? []),
            ...(game.platforms ?? []).slice(0, 4),
            ...(game.tags ?? []).slice(0, 5),
            game.name,
            year?.toString(),
            developer,
            "game", "review", "rating",
        ].filter(Boolean).join(", ");

        // The root layout's title template already appends "| TechPlay" to the
        // document title, so writing it here too produced
        // "Elden Ring (2022) — TechPlay | TechPlay" on every game page.
        // openGraph and twitter titles do not go through that template, so
        // those keep the suffix.
        const title       = year ? `${game.name} (${year})` : game.name;
        const socialTitle = `${title} — TechPlay`;
        const hasContent  = plainDescription.length > 50;

        return {
            title,
            description,
            keywords,
            ...(!hasContent ? { robots: { index: false, follow: false } } : {}),
            alternates: { canonical: `https://techplay.gg/games/${slug}` },
            openGraph: {
                title: socialTitle,
                description,
                url:   `https://techplay.gg/games/${slug}`,
                type:  "website",
                siteName: "TechPlay",
                images: game.cover_url
                    ? [{ url: game.cover_url, width: 1280, height: 720, alt: `${game.name} cover` }]
                    : [],
            },
            twitter: {
                card:        "summary_large_image",
                title: socialTitle,
                description,
                images: game.cover_url ? [game.cover_url] : [],
            },
        };
    } catch {
        return { title: "TechPlay Games" };
    }
}

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

// ESRB rating label → chip tint
const ESRB_COLORS: Record<string, string> = {
    "Everyone":       "bg-green-600/90",
    "Everyone 10+":   "bg-green-500/90",
    "Teen":           "bg-yellow-500/90",
    "Mature":         "bg-orange-600/90",
    "Adults Only":    "bg-red-700/90",
    "Rating Pending": "bg-white/35/90",
};

/** 0-100 critic scales wear the traffic-light everyone already reads. */
function criticTone(score: number): string {
    if (score >= 75) return "bg-emerald-600/90";
    if (score >= 50) return "bg-yellow-600/90";
    return "bg-red-700/90";
}

function ScoreChip({ label, value, tone, href }: { label: string; value: string; tone: string; href?: string | null }) {
    const body = (
        <span className={`inline-flex items-center overflow-hidden rounded-[5px] border border-white/[0.12] ${href ? "hover:border-white/[0.3] transition-colors" : ""}`}>
            <span className={`px-2 py-1 font-display text-[15px] font-black tabular-nums text-white leading-none ${tone}`}>{value}</span>
            <span className="px-2 py-1 font-display text-[9px] font-black uppercase tracking-[0.12em] text-white/55 bg-black/40 leading-none">{label}</span>
        </span>
    );

    return href ? <a href={href} target="_blank" rel="noopener noreferrer">{body}</a> : body;
}

/**
 * What the record actually claims. Moby dates default to Jan 1 when only a
 * year is known; rendering "January 1" for those would be inventing
 * precision nobody gave us — same rule the release calendar follows.
 */
function releaseLine(game: GameDetail): string | null {
    if (!game.released) return game.release_precision === "tba" ? "TBA" : null;

    const date = new Date(game.released);
    if (Number.isNaN(date.getTime())) return null;

    switch (game.release_precision) {
        case "year":    return `${date.getFullYear()}`;
        case "quarter": return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
        case "month":   return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
        default:        return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    }
}

/**
 * Moby files everything from player counts to RAM under one attribute list.
 * The split matters: "how many can play" is a gameplay fact readers scan
 * for; "minimum CPU class" is a spec sheet. Two panels, not one mislabel.
 */
const SYSREQ = (cat: string) =>
    cat.startsWith("Minimum") || cat.includes("Video ") || cat.includes("Sound Devices");

function groupAttributes(attributes: GameAttribute[]) {
    const details: Record<string, string[]> = {};
    const sysreq: Record<string, string[]> = {};
    for (const attr of attributes ?? []) {
        const bucket = SYSREQ(attr.attribute_category_name) ? sysreq : details;
        (bucket[attr.attribute_category_name] ??= []).push(attr.attribute_name);
    }
    return { details, sysreq };
}

/** YouTube URL → embeddable id; anything else plays as a plain video file. */
function youtubeId(url: string): string | null {
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
}

/**
 * A studio credit, as a link where there is one to give.
 *
 * `developers` and `publishers` are plain names and cover the whole catalogue,
 * including the games we never matched to IGDB. `studios` is the subset that
 * has a page of its own. Names carry the row; the studio list decides which of
 * them a reader can follow — so a game keeps its credits either way, and gains
 * somewhere to go the moment its studio exists.
 */
function CompanyRow({
    label,
    names,
    studios,
    role,
}: {
    label: string;
    names: string[];
    studios: GameStudio[];
    role: "developer" | "publisher";
}) {
    if (names.length === 0) return null;

    const linkable = new Map(
        (studios ?? []).filter((s) => s.role === role).map((s) => [s.name.toLowerCase(), s.slug]),
    );

    return (
        <div>
            <p className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/35">{label}</p>
            <p className="mt-1 text-[13px] font-medium text-white/85">
                {names.map((name, index) => {
                    const slug = linkable.get(name.toLowerCase());

                    return (
                        <span key={name}>
                            {index > 0 && ", "}
                            {slug ? (
                                <Link href={`/studios/${slug}`} className="hover:text-[var(--accent)] transition-colors">
                                    {name}
                                </Link>
                            ) : (
                                name
                            )}
                        </span>
                    );
                })}
            </p>
        </div>
    );
}

function AttributeGrid({ groups }: { groups: Record<string, string[]> }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Object.entries(groups).map(([category, values]) => (
                <div key={category} className="rounded-[8px] border border-white/[0.06] bg-white/[0.03] px-3.5 py-3">
                    <p className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/35">
                        {category.replace(/^Minimum /, "Min. ")}
                    </p>
                    <p className="mt-1 text-[13px] font-medium text-white/85 leading-snug">{values.join(", ")}</p>
                </div>
            ))}
        </div>
    );
}

function MiniGameCard({ game }: { game: GameListItem }) {
    return (
        <Link
            href={`/games/${game.slug}`}
            prefetch={false}
            // Fixed width in the phone's rail, auto in the desktop grid: a
            // flex child with no width collapses to its content, and a cover
            // with no intrinsic width collapses to nothing.
            className="group block w-[168px] shrink-0 snap-start sm:w-auto sm:shrink rounded-[8px] overflow-hidden border border-white/[0.07] bg-[var(--surface-1)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors"
        >
            <div className="relative aspect-video bg-black/40 overflow-hidden">
                {game.cover_url ? (
                    <Image unoptimized src={game.cover_url} alt={game.name} fill sizes="220px"
                        className="object-cover group-hover:scale-[1.04] transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Gamepad2 className="w-7 h-7 text-white/10" />
                    </div>
                )}
                {game.rating > 0 && (
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-[5px] bg-black/70 px-1.5 py-0.5 font-display text-[10px] font-black tabular-nums text-amber-400">
                        <Star className="w-3 h-3 fill-current" /> {Number(game.rating).toFixed(1)}
                    </span>
                )}
            </div>
            <div className="px-3 py-2.5">
                <p className="font-display text-[12px] font-black uppercase tracking-[0.04em] text-white leading-tight line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                    {game.name}
                </p>
                {game.released && (
                    <p className="mt-0.5 text-[10.5px] text-white/35">{game.released.slice(0, 4)}</p>
                )}
            </div>
        </Link>
    );
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */

export default async function GameDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // The whole page comes from fetchContent: a real 404/410 renders notFound,
    // a backend hiccup retries and then throws — it must never become a cached
    // claim that the game does not exist.
    //
    // The side rails used to be four separate calls that swallowed their own
    // failures, on the reasoning that a page without suggestions is still a
    // page. They now ride along with the record, and the backend already
    // answers with empty arrays rather than errors when a rail has nothing —
    // so the rails still cannot take the page down, they just no longer cost
    // four fifths of the API's rate limit to fetch.
    const bundle = await loadGame(slug);

    if (!bundle) notFound();

    const game = bundle.game;
    const relatedArticles = bundle.articles ?? [];
    if (game.rating) game.rating = Number(game.rating);

    // Normalise both shapes (Moby objects, aggregator URL strings) for the lightbox
    const screenshots = (bundle.screenshots ?? []).map((s, i) => ({
        id:     i,
        image:  typeof s === "string" ? s : s.image,
        width:  typeof s === "string" ? 1280 : (s.width  ?? 640),
        height: typeof s === "string" ? 720  : (s.height ?? 480),
    })).filter((s) => !!s.image);

    /**
     * What stands behind the title.
     *
     * This was the cover, and the cover is portrait box art — roughly 310x440.
     * Stretched across a 1440x242 strip with object-cover it is upscaled four
     * and a half times and cropped to a band, so Red Dead Redemption's hero was
     * the barrel of a gun at 4.6x, unrecognisable and blocky. A screenshot is
     * landscape and larger, which is the shape this slot actually wants.
     *
     * The cover stays as the fallback for the games that have no screenshot,
     * and there it gets a blur: an upscale that is obviously deliberate reads
     * as a backdrop, while a sharp one reads as a mistake.
     */
    const heroArt = screenshots[0]?.image ?? game.cover_url;
    const heroIsCover = !screenshots[0]?.image;

    const series     = (bundle.series ?? []).filter((g) => g.slug !== slug);
    const suggested  = bundle.suggested ?? [];
    const isUpcoming = game.released ? new Date(game.released) > new Date() : false;
    const released   = releaseLine(game);
    const trailer    = game.videos?.[0] ?? null;
    const trailerYt  = trailer ? youtubeId(trailer) : null;
    const { details, sysreq } = groupAttributes(game.attributes);

    /* ── JSON-LD ─────────────────────────────────────────────────────────────── */
    const structuredData: Record<string, unknown> = {
        "@context":          "https://schema.org",
        "@type":             "VideoGame",
        name:                game.name,
        description:         (game.description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500),
        image:               game.cover_url ?? "",
        url:                 `https://techplay.gg/games/${game.slug}`,
        ...(game.released   ? { datePublished: game.released } : {}),
        ...(game.esrb_rating ? { contentRating: game.esrb_rating.name } : {}),
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
        ...((game.alt_titles ?? []).length > 0 ? { alternateName: game.alt_titles.map((t) => t.title) } : {}),
        ...(trailerYt ? { trailer: { "@type": "VideoObject", name: `${game.name} — Trailer`, embedUrl: `https://www.youtube-nocookie.com/embed/${trailerYt}` } } : {}),
        genre:               game.genres    ?? [],
        gamePlatform:        game.platforms ?? [],
        publisher:           (game.publishers ?? []).map((name) => ({ "@type": "Organization", name })),
        developer:           (game.developers ?? []).map((name) => ({ "@type": "Organization", name })),
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
        <main className="min-h-screen bg-[var(--surface-0)]">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

            {/* ── hero — the calendar page's matte treatment, one language across the site ── */}
            <div className="relative overflow-hidden border-b border-white/[0.07]">
                {heroArt && (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={heroArt} alt="" aria-hidden
                            className={`absolute inset-0 w-full h-full object-cover opacity-[0.3] ${
                                heroIsCover ? "blur-[3px] scale-[1.04]" : ""
                            }`} />
                        <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-[var(--surface-0)] via-[var(--surface-0)]/85 to-transparent" />
                        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[var(--surface-0)] to-transparent" />
                    </>
                )}

                <div className="relative z-10 container-page py-10">
                    <Link href="/games"
                        className="inline-flex items-center gap-1.5 font-display text-[10px] font-black uppercase tracking-[0.14em] text-white/45 hover:text-white transition-colors">
                        <ChevronLeft className="w-3.5 h-3.5" /> Games database
                    </Link>

                    {game.genres.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                            {game.genres.map((g) => (
                                <span key={g} className="rounded-[5px] bg-[var(--accent)] px-2 py-0.5 font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white">
                                    {g}
                                </span>
                            ))}
                        </div>
                    )}

                    <h1 className="mt-3 font-display font-black text-white tracking-tight leading-[0.92] text-[38px] md:text-[54px] max-w-[900px]">
                        {game.name}
                    </h1>

                    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                        {released && (
                            <span className="inline-flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[var(--accent)]" />
                                <span className="font-display text-[15px] font-black text-white">{released}</span>
                            </span>
                        )}
                        {game.rating > 0 && (
                            <span className="inline-flex items-center gap-2">
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                <span className="font-display text-[15px] font-black text-white tabular-nums">{Number(game.rating).toFixed(1)}</span>
                                <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-white/40">
                                    / {game.rating_top ?? 10}{game.ratings_count > 0 && ` · ${game.ratings_count.toLocaleString()} votes`}
                                </span>
                            </span>
                        )}
                        {game.esrb_rating && (
                            <span className={`inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.5 ${ESRB_COLORS[game.esrb_rating.name] ?? "bg-white/30/90"}`}>
                                <Shield className="w-3.5 h-3.5 text-white/85" />
                                <span className="font-display text-[10px] font-black uppercase tracking-[0.08em] text-white">{game.esrb_rating.name}</span>
                            </span>
                        )}
                        {game.views > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-white/35">
                                <Eye className="w-3.5 h-3.5" />
                                <span className="font-display text-[11px] font-bold tabular-nums">{game.views.toLocaleString()}</span>
                            </span>
                        )}
                    </div>

                    {(game.techplay_score !== null
                        || game.critic_scores?.opencritic?.score != null
                        || game.critic_scores?.metacritic?.score != null) && (
                        <div className="mt-5 flex flex-wrap items-center gap-2.5">
                            {game.techplay_score !== null && (
                                <ScoreChip label="TechPlay" value={game.techplay_score.toFixed(1)} tone="bg-[var(--accent)]" />
                            )}
                            {game.critic_scores?.opencritic?.score != null && (
                                <ScoreChip
                                    label="OpenCritic"
                                    value={String(game.critic_scores.opencritic.score)}
                                    tone={criticTone(game.critic_scores.opencritic.score)}
                                    href={game.critic_scores.opencritic.url}
                                />
                            )}
                            {game.critic_scores?.metacritic?.score != null && (
                                <ScoreChip
                                    label="Metacritic"
                                    value={String(game.critic_scores.metacritic.score)}
                                    tone={criticTone(game.critic_scores.metacritic.score)}
                                    href={game.critic_scores.metacritic.url}
                                />
                            )}
                        </div>
                    )}

                    {isUpcoming && game.released && (
                        <div className="mt-6">
                            <GameCountdownTimer targetDate={game.released} />
                        </div>
                    )}

                    {/* The actions, where a phone can reach them. */}
                    <div className="xl:hidden mt-5 space-y-2.5">
                        <TrackGameButton slug={slug} gameName={game.name} variant="full" released={game.released} />
                        <AddToListButton slug={slug} gameName={game.name} />
                    </div>
                </div>
            </div>

            <div className="container-page py-6 grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                {/* ── main column ── */}
                <div className="xl:col-span-8 min-w-0 space-y-5">

                    {/* Trailer — the column is filled by hand and by the aggregator; first video leads */}
                    {trailer && (
                        <Panel title="Trailer" padding="none">
                            {trailerYt ? (
                                <iframe
                                    src={`https://www.youtube-nocookie.com/embed/${trailerYt}?rel=0&modestbranding=1`}
                                    title={`${game.name} — Trailer`}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full aspect-video bg-black"
                                />
                            ) : (
                                <TrailerPlayer src={trailer} poster={game.cover_url} />
                            )}
                        </Panel>
                    )}

                    {screenshots.length > 0 && (
                        <Panel title={`Screenshots (${screenshots.length})`}>
                            <GameScreenshotsLightbox screenshots={screenshots} wrapperClassName="" />
                        </Panel>
                    )}

                    <Panel title="About">
                        {game.description ? (
                            <div className="prose prose-invert prose-sm max-w-none text-white/65 leading-relaxed [&_a]:text-[var(--accent)]"
                                dangerouslySetInnerHTML={{ __html: game.description }} />
                        ) : (
                            <p className="text-[13px] text-white/35 italic">No description available yet.</p>
                        )}
                    </Panel>

                    {/* Gameplay facts — players, input, media, business model */}
                    {Object.keys(details).length > 0 && (
                        <Panel title="Game details" meta={<Users className="w-4 h-4 text-white/25" />}>
                            <AttributeGrid groups={details} />
                        </Panel>
                    )}

                    {/* The spec sheet, separately — a RAM floor is not a gameplay fact */}
                    {Object.keys(sysreq).length > 0 && (
                        <Panel title="System requirements" meta={<Cpu className="w-4 h-4 text-white/25" />}>
                            <AttributeGrid groups={sysreq} />
                        </Panel>
                    )}

                    {game.box_art.length > 0 && (
                        <Panel title="Box art" meta={<Package className="w-4 h-4 text-white/25" />}>
                            <BoxArtGallery art={game.box_art} />
                        </Panel>
                    )}

                    {relatedArticles.length > 0 && (
                        <Panel title="News & reviews" meta={<Newspaper className="w-4 h-4 text-white/25" />}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {relatedArticles.map((a) => (
                                    <Link key={a.slug} href={`/${a.path}/${a.slug}`}
                                        className="group flex gap-3 rounded-[8px] border border-white/[0.06] bg-white/[0.03] p-3 hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors">
                                        {a.image && (
                                            <div className="relative w-24 h-16 rounded-[5px] overflow-hidden flex-shrink-0 bg-black/40">
                                                <Image src={a.image} alt={a.title} fill sizes="96px" className="object-cover" />
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                {a.category && (
                                                    <span className="font-display text-[9px] font-black uppercase tracking-[0.12em] text-[var(--accent)]">{a.category}</span>
                                                )}
                                                {a.review_score != null && (
                                                    <span className="inline-flex items-center gap-1 font-display text-[10px] font-black tabular-nums text-amber-400">
                                                        <Star className="w-3 h-3 fill-current" />
                                                        {Number(a.review_score).toFixed(1)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-0.5 text-[13px] font-semibold text-white leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                                                {a.title}
                                            </p>
                                            {a.published_at && (
                                                <p className="mt-1 text-[10.5px] text-white/35">
                                                    {new Date(a.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </Panel>
                    )}

                    {game.alt_titles.length > 0 && (
                        <Panel title="Also known as" meta={<Info className="w-4 h-4 text-white/25" />}>
                            <div className="space-y-1.5">
                                {game.alt_titles.map((alt) => (
                                    <p key={alt.title} className="text-[13px] leading-snug">
                                        <span className="font-medium text-white/85">{alt.title}</span>
                                        {alt.description && <span className="text-white/35"> — {alt.description}</span>}
                                    </p>
                                ))}
                            </div>
                        </Panel>
                    )}

                    <GameRating slug={slug} />
                </div>

                {/* ── sidebar ── */}
                <div className="xl:col-span-4 min-w-0 space-y-5 xl:sticky xl:top-[92px]">
                    <Panel title="Your collection" className="hidden xl:block">
                        <div className="space-y-2.5">
                            <TrackGameButton slug={slug} gameName={game.name} variant="full" released={game.released} />
                            {/* "This belongs on my top ten" is a thought that
                                happens here, on the game's page — not later, in
                                a tab, once you have remembered which game it
                                was. */}
                            <AddToListButton slug={slug} gameName={game.name} />
                        </div>
                    </Panel>

                    <Panel title="Facts">
                        <div className="space-y-4">
                            {/* Companies appear the day the enrichment lands — an empty
                                "Unknown" row is a shrug, so absence stays silent. */}
                            <CompanyRow label="Developer" names={game.developers} studios={game.studios} role="developer" />
                            <CompanyRow label="Publisher" names={game.publishers} studios={game.studios} role="publisher" />
                            {released && (
                                <div>
                                    <p className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/35">Released</p>
                                    <p className="mt-1 text-[13px] font-medium text-white/85">{released}</p>
                                </div>
                            )}
                            {game.series_name && (
                                <div>
                                    <p className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/35">Series</p>
                                    <p className="mt-1 text-[13px] font-medium text-white/85">{game.series_name}</p>
                                </div>
                            )}
                            {game.platforms.length > 0 && (
                                <div>
                                    <p className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/35">Platforms</p>
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        {game.platforms.map((p) => (
                                            <span key={p} className="rounded-[5px] border border-white/[0.09] bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-white/70">
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {game.age_ratings.length > 0 && (
                                <div>
                                    <p className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/35">Age ratings</p>
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        {game.age_ratings.map((r) => (
                                            <span key={r.rating_system_name} className="rounded-[5px] border border-white/[0.09] bg-white/[0.04] px-2 py-1 text-center">
                                                <span className="block text-[8.5px] font-bold uppercase tracking-[0.1em] text-white/35">{r.rating_system_name.replace(" Rating", "")}</span>
                                                <span className="block font-display text-[12px] font-black text-white">{r.rating_name}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {game.website && (
                                <a href={game.website} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 font-display text-[11px] font-black uppercase tracking-[0.1em] text-white/55 hover:text-[var(--accent)] transition-colors">
                                    <Globe className="w-4 h-4" /> Official website
                                </a>
                            )}
                        </div>
                    </Panel>

                    {game.tags.length > 0 && (
                        <Panel title="Tags" meta={<Tag className="w-4 h-4 text-white/25" />}>
                            <div className="flex flex-wrap gap-1.5">
                                {game.tags.slice(0, 24).map((t) => (
                                    <span key={t} className="rounded-[5px] border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[11px] text-white/55">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </Panel>
                    )}
                </div>
            </div>

            {/* ── rails ── */}
            <div className="container-page pb-16 space-y-10">
                {series.length > 0 && (
                    <section>
                        <h2 className="mb-4 flex items-center gap-2.5 font-display text-[15px] font-black uppercase tracking-[0.08em] text-white">
                            <Layers className="w-[18px] h-[18px] text-[var(--accent)]" /> More in the series
                        </h2>
                        <div className="flex sm:grid gap-3.5 overflow-x-auto scrollbar-hide snap-x scroll-pl-4 sm:scroll-pl-0 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                            {series.slice(0, 6).map((g) => <MiniGameCard key={g.id} game={g} />)}
                        </div>
                    </section>
                )}

                {suggested.length > 0 && (
                    <section>
                        <h2 className="mb-4 flex items-center gap-2.5 font-display text-[15px] font-black uppercase tracking-[0.08em] text-white">
                            <Gamepad2 className="w-[18px] h-[18px] text-[var(--accent)]" /> You might also like
                        </h2>
                        <div className="flex sm:grid gap-3.5 overflow-x-auto scrollbar-hide snap-x scroll-pl-4 sm:scroll-pl-0 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                            {suggested.slice(0, 6).map((g) => <MiniGameCard key={g.id} game={g} />)}
                        </div>
                    </section>
                )}

                {/* Below the game itself and its two recommendation rows,
                    above the forum threads: past everything the reader came
                    for, still on the page rather than under its footer. */}
                <DisplayAd minHeight={110} />

                <GameForumThreads gameSlug={slug} />

                <DataAttribution className="mt-10 border-t border-white/[0.05] pt-5" />
            </div>
        </main>
    );
}
