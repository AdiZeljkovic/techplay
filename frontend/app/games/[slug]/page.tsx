import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getApiUrl } from "@/lib/api";
import { fetchContent } from "@/lib/fetchContent";
import {
    Calendar, Star, Globe, Gamepad2, ChevronLeft, Tag, Info,
    Layers, Shield, Newspaper, Users, Cpu, Package, Eye,
    Clock, Languages, Check, Sparkles, ShoppingBag, ExternalLink, ChevronDown,
} from "lucide-react";
import GameScreenshotsLightbox from "@/components/games/GameScreenshotsLightbox";
import GameCountdownTimer from "@/components/games/GameCountdownTimer";
import GameRating from "@/components/games/GameRating";
import TrackGameButton from "@/components/games/TrackGameButton";
import AddToListButton from "@/components/games/AddToListButton";
import GameForumThreads from "@/components/games/GameForumThreads";
import UpcomingRelease from "@/components/games/UpcomingRelease";
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

/**
 * A game on the other end of a relation — a DLC, a remaster, a bundle.
 *
 * `slug` is null for most of them, and that is the normal case rather than a
 * gap: DLC, mods and packs have no page in this catalogue, so the other side
 * is a name to print, not a link to offer.
 */
interface RelatedGame {
    name: string;
    slug: string | null;
    cover_url: string | null;
    released: string | null;
}

/** One language, and the three separate questions asked about it. */
interface GameLanguage {
    name: string;
    audio: boolean;
    subtitles: boolean;
    interface: boolean;
}

/** The subset of a game's credits that has a studio page behind it. */
interface GameStudio {
    name: string;
    slug: string;
    logo_url: string | null;
    games_count: number;
    role: "developer" | "publisher" | "porting" | "supporting";
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
    /** Forum threads about this game; zero means the page does not ask for the list. */
    threads_count?: number;
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
    series_slug: string | null;
    studios: GameStudio[];
    videos: string[];

    /* From IGDB. Hours, not the seconds the column stores. */
    time_to_beat: { hastily?: number; normally?: number; completely?: number; count: number } | null;
    game_modes: string[];
    player_perspectives: string[];
    multiplayer: {
        splitscreen?: boolean; offlinecoop?: boolean; onlinecoop?: boolean;
        campaigncoop?: boolean; lancoop?: boolean; dropin?: boolean;
        onlinemax?: number; offlinemax?: number;
    } | null;
    languages: GameLanguage[];
    artworks: ApiScreenshot[];
    similar_games: { name: string; slug: string; cover_url: string | null }[];
    popularity: { percentile: number; metric: string } | null;
    engines: string[];

    /** Grouped by what the link is for: `store`, `social`, `reference`. */
    links: Record<string, { service: string; url: string }[]>;

    /** Both directions in one map, keyed by the words the page uses. */
    related: Record<string, RelatedGame[]>;
    box_art: BoxArt[];
    critic_scores: {
        opencritic?: { score?: number | null; tier?: string | null; url?: string | null } | null;
        metacritic?: { score?: number | null; url?: string | null } | null;
    } | null;
    techplay_score: number | null;
    screenshots_count: number;
    views: number;
    /** Member lists this game sits in — the widest door the site has to them. */
    in_lists?: {
        total: number;
        items: {
            name: string; slug: string; list_type: string;
            items_count: number; likes_count: number;
            username: string; display_name?: string | null;
        }[];
    } | null;
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
 * The same company, said once.
 *
 * Matched on name because that is the only key the two sides share: the plain
 * `developers`/`publishers` arrays come off the game row and `studios` is the
 * subset we matched to IGDB. Case-insensitive and trimmed, because the two
 * sources disagree on both.
 */
function studioRef(name: string, studios: GameStudio[]) {
    const match = studios.find(
        (s) => s.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );

    if (!match) {
        return { "@type": "Organization", name };
    }

    const url = `https://techplay.gg/studios/${match.slug}`;

    return { "@type": "Organization", "@id": `${url}#organization`, name, url };
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
            <p className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/50">{label}</p>
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

/**
 * Who made it, directly under the title.
 *
 * It was three panels down in a facts list, which is a strange place for the
 * thing a reader checks right after the name. Links where the studio has a page
 * and plain text where it does not, same rule as everywhere else.
 */
function HeroCredits({ game }: { game: GameDetail }) {
    const by = (names: string[], role: "developer" | "publisher") => {
        if (names.length === 0) return null;

        const linkable = new Map(
            (game.studios ?? []).filter((s) => s.role === role).map((s) => [s.name.toLowerCase(), s.slug]),
        );

        return names.slice(0, 3).map((name, index) => {
            const slug = linkable.get(name.toLowerCase());

            return (
                <span key={name}>
                    {index > 0 && ", "}
                    {slug ? (
                        <Link href={`/studios/${slug}`} className="text-white/85 hover:text-[var(--accent)] transition-colors">
                            {name}
                        </Link>
                    ) : (
                        <span className="text-white/85">{name}</span>
                    )}
                </span>
            );
        });
    };

    const developers = by(game.developers ?? [], "developer");
    const publishers = by(game.publishers ?? [], "publisher");

    if (!developers && !publishers) return null;

    return (
        <p className="mt-2.5 text-[13.5px] text-white/55">
            {developers && <>by {developers}</>}
            {developers && publishers && <span className="mx-2 text-white/45">·</span>}
            {publishers && <>published by {publishers}</>}
        </p>
    );
}

/**
 * Every score this page holds, together and at a size worth reading.
 *
 * They were four small chips in a row of metadata — on a page whose whole job
 * is to answer "is this any good". The reader's own average leads because it is
 * ours; the critics follow with the outlet named, since 94 from OpenCritic and
 * 94 from Metacritic are not the same claim.
 */
function ScoreStack({ game }: { game: GameDetail }) {
    const critics = [
        game.critic_scores?.opencritic?.score != null && {
            label: "OpenCritic",
            value: String(game.critic_scores.opencritic.score),
            tone: criticTone(game.critic_scores.opencritic.score),
            href: game.critic_scores.opencritic.url,
        },
        game.critic_scores?.metacritic?.score != null && {
            label: "Metacritic",
            value: String(game.critic_scores.metacritic.score),
            tone: criticTone(game.critic_scores.metacritic.score),
            href: game.critic_scores.metacritic.url,
        },
    ].filter(Boolean) as { label: string; value: string; tone: string; href?: string | null }[];

    const readers = Number(game.rating) > 0 ? Number(game.rating) : null;
    const house = game.techplay_score;

    if (!readers && !house && critics.length === 0) return null;

    return (
        <div className="shrink-0 rounded-[14px] border border-white/[0.09] bg-black/40 backdrop-blur-sm p-4 md:min-w-[196px]">
            {readers !== null && (
                <div className="pb-3.5 border-b border-white/[0.07]">
                    <p className="font-display text-[9.5px] font-black uppercase tracking-[0.14em] text-white/50">
                        Reader score
                    </p>
                    <p className="mt-1 flex items-baseline gap-1.5">
                        <span className="font-display text-[38px] font-black leading-none tabular-nums text-white">
                            {readers.toFixed(1)}
                        </span>
                        <span className="font-display text-[13px] font-bold text-white/50">/ {game.rating_top ?? 10}</span>
                    </p>
                    {game.ratings_count > 0 && (
                        <p className="mt-1 text-[11.5px] text-white/50 tabular-nums">
                            {game.ratings_count.toLocaleString()} {game.ratings_count === 1 ? "vote" : "votes"}
                        </p>
                    )}
                </div>
            )}

            {(house !== null || critics.length > 0) && (
                <div className={`flex flex-wrap gap-2 ${readers !== null ? "pt-3.5" : ""}`}>
                    {house !== null && (
                        <ScoreChip label="TechPlay" value={house.toFixed(1)} tone="bg-[var(--accent)]" />
                    )}
                    {critics.map((critic) => (
                        <ScoreChip key={critic.label} {...critic} />
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * Each shop's own colour, so the row is recognised before it is read.
 *
 * A wall of identical grey buttons makes a reader parse every label; Steam blue
 * and Xbox green are recognised at a glance. Mixed rather than used at full
 * strength — ten saturated brand colours side by side on a dark page is a
 * carnival, and the point is recognition, not volume.
 */
const STORE_COLORS: Record<string, string> = {
    "Steam": "#66c0f4",
    "GOG": "#a05fb4",
    "Epic Games Store": "#f5f5f5",
    "Microsoft Store": "#3fa64a",
    "Xbox Marketplace": "#3fa64a",
    "PlayStation Store": "#3b82f6",
    "itch.io": "#fa5c5c",
    "App Store": "#3ea0f0",
    "Google Play": "#3ddc84",
    "Amazon": "#ffa724",
};

/**
 * Where to get it, and where its people are.
 *
 * Store links carry the shop's name and nothing else — a row of buttons that
 * says Steam, GOG, Epic reads faster than any wording around it. The official
 * site sits with them: it is the same question, "where do I go for this", and
 * it was a line of text at the bottom of a facts list. Community links sit
 * under both, quieter, because somebody looking for the Discord is looking for
 * it and does not need it competing with the buy row.
 */
function LinkRows({ links, website }: { links: GameDetail["links"]; website: string | null }) {
    const stores = links?.store ?? [];
    const social = links?.social ?? [];

    if (stores.length === 0 && social.length === 0 && !website) return null;

    return (
        <Panel title="Where to get it" meta={<ShoppingBag className="w-4 h-4 text-white/25" />}>
            <div className="space-y-3.5">
                {(stores.length > 0 || website) && (
                    <div className="flex flex-wrap gap-2">
                        {stores.map((link) => {
                            const brand = STORE_COLORS[link.service];

                            return (
                                <a
                                    key={link.service}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group inline-flex h-[38px] items-center gap-2 rounded-[9px] border px-4 font-display text-[12.5px] font-bold text-white transition-colors"
                                    style={brand ? {
                                        borderColor: `color-mix(in srgb, ${brand} 45%, transparent)`,
                                        backgroundColor: `color-mix(in srgb, ${brand} 14%, transparent)`,
                                    } : undefined}
                                >
                                    {brand && (
                                        <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: brand }} />
                                    )}
                                    {link.service}
                                    <ExternalLink className="w-3 h-3 text-white/35" />
                                </a>
                            );
                        })}

                        {website && (
                            <a
                                href={website}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                className="inline-flex h-[38px] items-center gap-2 rounded-[9px] border border-white/[0.12] bg-white/[0.04] px-4 font-display text-[12.5px] font-bold text-white/85 hover:border-white/25 hover:text-white transition-colors"
                            >
                                <Globe className="w-3.5 h-3.5 text-white/45" />
                                Official site
                                <ExternalLink className="w-3 h-3 text-white/30" />
                            </a>
                        )}
                    </div>
                )}

                {social.length > 0 && (
                    <div className="pt-0.5">
                        <p className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/50">Community</p>
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                            {social.map((link) => (
                                <a
                                    key={link.service}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[13px] text-white/50 hover:text-[var(--accent)] transition-colors"
                                >
                                    {link.service}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Panel>
    );
}

/**
 * What this game belongs to, and what belongs to it.
 *
 * The heading is the relation itself — "DLC", "Remastered as", "Editions" —
 * because that is the whole content of the row. A shelf labelled "Related"
 * would be throwing away the one thing IGDB actually told us.
 *
 * Most entries have no page of their own: DLC and packs are not imported as
 * pages, so they arrive as names. Those are drawn as plain chips rather than as
 * cards with a dead cover — a card that cannot be clicked is a card that looks
 * broken. The ones with a page come first and get the cover.
 */
function RelatedShelves({ groups }: { groups: Record<string, RelatedGame[]> }) {
    const entries = Object.entries(groups ?? {});

    if (entries.length === 0) return null;

    return (
        <>
            {entries.map(([label, games]) => {
                const linked = games.filter((g) => g.slug);
                const named = games.filter((g) => !g.slug);

                return (
                    <Panel key={label} title={label} meta={<Layers className="w-4 h-4 text-white/25" />}>
                        <div className="space-y-3">
                            {linked.length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                                    {linked.map((related) => (
                                        <Link key={related.slug} href={`/games/${related.slug}`} className="group block">
                                            <span className="relative block h-[128px] overflow-hidden rounded-[8px] border border-white/[0.07] group-hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors">
                                                {related.cover_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={related.cover_url}
                                                        alt={related.name}
                                                        loading="lazy"
                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                                                    />
                                                ) : (
                                                    <span className="flex h-full w-full items-center justify-center bg-white/[0.03] text-white/15">
                                                        <Gamepad2 className="h-5 w-5" />
                                                    </span>
                                                )}
                                                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/15 to-transparent" />
                                                <span className="absolute inset-x-0 bottom-0 p-1.5">
                                                    <span className="block font-display text-[10.5px] font-black leading-tight text-white line-clamp-2">
                                                        {related.name}
                                                    </span>
                                                </span>
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {named.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {named.map((related) => (
                                        <span
                                            key={related.name}
                                            className="inline-flex h-[26px] items-center rounded-[6px] border border-white/[0.07] bg-white/[0.02] px-2.5 text-[12px] text-white/60"
                                        >
                                            {related.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Panel>
                );
            })}
        </>
    );
}

/**
 * How long the game takes, in three figures.
 *
 * IGDB collects these from players who finished it, so the sample size belongs
 * beside them: "24 hours" from four people and "24 hours" from four thousand
 * are not the same claim, and a reader deciding whether to start a hundred-hour
 * game deserves to know which they are looking at.
 */
function TimeToBeat({ times }: { times: GameDetail["time_to_beat"] }) {
    if (!times) return null;

    const paces: { key: "hastily" | "normally" | "completely"; label: string; note: string }[] = [
        { key: "hastily", label: "Rushed", note: "main story only" },
        { key: "normally", label: "Normally", note: "story and some extras" },
        { key: "completely", label: "Completionist", note: "everything in it" },
    ];

    const shown = paces.filter((p) => times[p.key]);
    if (shown.length === 0) return null;

    /* Three figures reported by three people is not the same claim as three
       reported by three thousand, and the difference decides whether a reader
       should believe them. Below five it is said plainly rather than tucked
       into the corner in grey. */
    const thin = times.count > 0 && times.count < 5;

    return (
        <div className="container-page pt-5">
            {/* The figures sit together, left, rather than spread across the
                full width of the page. Stretched edge to edge on a wide screen
                they read as three unrelated numbers with a lot of nothing
                between them — which is exactly what a game with one report
                looked like. */}
            <div className="inline-flex w-full flex-col rounded-[14px] border border-white/[0.07] bg-white/[0.02] px-4 sm:px-5 py-4 lg:w-auto">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3.5">
                    <p className="flex items-center gap-2 font-display text-[10px] font-black uppercase tracking-[0.14em] text-white/45">
                        <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                        How long to beat
                    </p>
                    {times.count > 0 && (
                        <span className={`inline-flex h-[19px] items-center rounded-[5px] px-1.5 font-display text-[9.5px] font-bold tabular-nums ${
                            thin
                                ? "border border-amber-400/25 bg-amber-400/10 text-amber-300/80"
                                : "bg-white/[0.06] text-white/55"
                        }`}>
                            {thin ? `only ${times.count} ${times.count === 1 ? "report" : "reports"}` : `${times.count.toLocaleString()} players`}
                        </span>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-stretch gap-4 sm:gap-0">
                    {shown.map((pace, index) => (
                        <div
                            key={pace.key}
                            className={`sm:px-6 sm:first:pl-0 sm:last:pr-0 ${
                                index > 0 ? "sm:border-l sm:border-white/[0.07]" : ""
                            }`}
                        >
                            <p className="font-display text-[26px] sm:text-[30px] font-black leading-none tabular-nums text-white">
                                {times[pace.key]}
                                <span className="ml-1 text-[13px] font-bold text-white/50">h</span>
                            </p>
                            <p className="mt-1.5 font-display text-[10px] font-black uppercase tracking-[0.1em] text-white/55">
                                {pace.label}
                            </p>
                            <p className="text-[11px] leading-snug text-white/50 whitespace-nowrap">{pace.note}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Whether you can play it with somebody, and how.
 *
 * The flags are only ever written when true, so the absent ones are genuinely
 * unknown rather than false — which is why this lists what a game *has* instead
 * of drawing a grid of ticks and crosses that would claim knowledge it lacks.
 */
function WaysToPlay({
    modes,
    perspectives,
    multiplayer,
    engines,
}: {
    modes: string[];
    perspectives: string[];
    multiplayer: GameDetail["multiplayer"];
    engines: string[];
}) {
    const together: string[] = [];

    if (multiplayer?.splitscreen) together.push("Split-screen");
    if (multiplayer?.offlinecoop) together.push("Local co-op");
    if (multiplayer?.onlinecoop) together.push("Online co-op");
    if (multiplayer?.campaigncoop) together.push("Co-op campaign");
    if (multiplayer?.lancoop) together.push("LAN");
    if (multiplayer?.dropin) together.push("Drop-in / drop-out");

    const players: string[] = [];
    if (multiplayer?.offlinemax) players.push(`${multiplayer.offlinemax} offline`);
    if (multiplayer?.onlinemax) players.push(`${multiplayer.onlinemax} online`);

    if (modes.length === 0 && perspectives.length === 0 && together.length === 0 && players.length === 0 && engines.length === 0) {
        return null;
    }

    return (
        <Panel title="Ways to play" meta={<Users className="w-4 h-4 text-white/25" />}>
            <div className="space-y-3.5">
                <ChipRow label="Modes" values={modes} />
                <ChipRow label="Together" values={together} />
                <ChipRow label="Perspective" values={perspectives} />
                <ChipRow label="Engine" values={engines} />
                {players.length > 0 && (
                    <div>
                        <p className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/50">Players</p>
                        <p className="mt-1 text-[13px] font-medium text-white/85 tabular-nums">{players.join(" · ")}</p>
                    </div>
                )}
            </div>
        </Panel>
    );
}

function ChipRow({ label, values }: { label: string; values: string[] }) {
    if (values.length === 0) return null;

    return (
        <div>
            <p className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/50">{label}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
                {values.map((value) => (
                    <span
                        key={value}
                        className="inline-flex h-[24px] items-center rounded-[6px] border border-white/[0.07] bg-white/[0.03] px-2 text-[12px] text-white/75"
                    >
                        {value}
                    </span>
                ))}
            </div>
        </div>
    );
}

/**
 * Audio, subtitles, interface — three separate questions.
 *
 * A game can be subtitled in twenty languages and dubbed into two, and somebody
 * who needs to hear their own language is asking about the second column, not
 * the first. Which is why this is a table and not a list of flags.
 */
function LanguageTable({ rows }: { rows: GameLanguage[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
                <thead>
                    <tr className="text-left">
                        <th className="pb-2 font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/50">Language</th>
                        {(["audio", "subtitles", "interface"] as const).map((column) => (
                            <th key={column} className="pb-2 w-[86px] font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/50">
                                {column}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.name} className="border-t border-white/[0.05]">
                            <td className="py-1.5 pr-3 text-white/80">{row.name}</td>
                            {(["audio", "subtitles", "interface"] as const).map((column) => (
                                <td key={column} className="py-1.5">
                                    {row[column] ? (
                                        <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                                    ) : (
                                        <span className="text-white/15">—</span>
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/**
 * A credit that exists only as a studio.
 *
 * `developers` and `publishers` are name arrays covering the whole catalogue,
 * which is why those two rows fall back to plain text. Porting and support have
 * no such column and never will — they are not who the game is by — so these
 * rows exist only where the studio does, and are always links.
 */
function StudioRow({
    label,
    studios,
    role,
}: {
    label: string;
    studios: GameStudio[];
    role: "porting" | "supporting";
}) {
    const credited = (studios ?? []).filter((s) => s.role === role);

    if (credited.length === 0) return null;

    return (
        <div>
            <p className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/50">{label}</p>
            <p className="mt-1 text-[13px] font-medium text-white/85">
                {credited.map((studio, index) => (
                    <span key={studio.slug}>
                        {index > 0 && ", "}
                        <Link href={`/studios/${studio.slug}`} className="hover:text-[var(--accent)] transition-colors">
                            {studio.name}
                        </Link>
                    </span>
                ))}
            </p>
        </div>
    );
}

function AttributeGrid({ groups }: { groups: Record<string, string[]> }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Object.entries(groups).map(([category, values]) => (
                <div key={category} className="rounded-[8px] border border-white/[0.06] bg-white/[0.03] px-3.5 py-3">
                    <p className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/50">
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
                    <p className="mt-0.5 text-[10.5px] text-white/50">{game.released.slice(0, 4)}</p>
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
    const toGallery = (pictures: ApiScreenshot[]) =>
        pictures.map((s, i) => ({
            id:     i,
            image:  typeof s === "string" ? s : s.image,
            width:  typeof s === "string" ? 1280 : (s.width  ?? 640),
            height: typeof s === "string" ? 720  : (s.height ?? 480),
        })).filter((s) => !!s.image);

    const screenshots = toGallery(bundle.screenshots ?? []);

    /* Key art, kept apart from screenshots: they are different pictures made
       for different purposes, and mixing them makes a gallery of neither. */
    const artworks = toGallery(game.artworks ?? []);

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
    /**
     * The backdrop, in order of how well it survives being stretched wide.
     *
     * Key art is drawn landscape and made to be a background — that is what
     * `artworks` is, and 151,024 games now have one. A screenshot is the next
     * best thing. The cover is last and gets blurred: it is portrait box art
     * roughly 310x440, and across a full-width band it is upscaled past four
     * times and cropped to a strip.
     */
    const heroArt = artworks[0]?.image ?? screenshots[0]?.image ?? game.cover_url;
    const heroIsCover = !artworks[0]?.image && !screenshots[0]?.image;

    const series     = (bundle.series ?? []).filter((g) => g.slug !== slug);
    const suggested  = bundle.suggested ?? [];
    const isUpcoming = game.released ? new Date(game.released) > new Date() : false;
    const released   = releaseLine(game);
    const trailer    = game.videos?.[0] ?? null;
    const trailerYt  = trailer ? youtubeId(trailer) : null;
    const { details, sysreq } = groupAttributes(game.attributes);

    /**
     * Whether this page has earned an advertisement.
     *
     * The catalogue is 332,128 games and 116,087 of them carry fewer than 200
     * characters of description — 26,886 carry none at all. Measured on
     * /games/avalon-remake: 1,666 characters of visible text, nearly all of it
     * navigation, with perhaps a hundred that belong to the game. An ad on a
     * page like that is what Google's policies call scaled content, and on
     * 21 Aug 2026 this account was placed under an ad serving limit.
     *
     * So the slot is earned rather than automatic. A thin page keeps every
     * other feature it has — it simply stops carrying advertising until it has
     * something to say. Those pages barely filled anyway; what they cost was
     * the quality signal across the other 216,041.
     */
    const adWorthy = (game.description ?? "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .length >= 200;

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
        /*
         * A credit that points at the studio's page, where one exists.
         *
         * These were bare `{ "@type": "Organization", name }` — a name and
         * nothing to resolve it against, so "Rockstar Games" on this page and
         * "Rockstar Games" on the 47 others were, as far as a search engine
         * could tell, unrelated strings. The visible credits already link to
         * /studios/{slug} when we hold a row for the company (see CompanyRow),
         * and the markup now says the same thing: an @id a crawler can join on,
         * and the URL it lives at.
         *
         * Names without a studio row keep the plain form. They cover the games
         * that never matched IGDB, which is most of the catalogue, and a made-up
         * URL would be worse than no URL.
         */
        publisher:           (game.publishers ?? []).map((name) => studioRef(name, game.studios)),
        developer:           (game.developers ?? []).map((name) => studioRef(name, game.studios)),
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

            {/* ── hero — the calendar page's matte treatment, one language across the site ──

                The clipping belongs to the art, not to the hero. `overflow-hidden`
                on this element cut off the "Save to a list" dropdown the moment
                the buttons moved up here: the panel opened inside a box that
                hides anything past its edge, so it rendered and was invisible. */}
            <div className="relative border-b border-white/[0.07]">
                {heroArt && (
                    <span aria-hidden className="absolute inset-0 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={heroArt} alt=""
                            className={`absolute inset-0 w-full h-full object-cover ${
                                heroIsCover ? "opacity-[0.22] blur-[10px] scale-[1.08]" : "opacity-[0.45]"
                            }`} />
                        {/* Two scrims, not one. The vertical fade lets the art
                            read at the top while the text sits on solid ground
                            at the bottom; a single flat overlay either drowns
                            the art or leaves the type unreadable over it. */}
                        <span className="absolute inset-0 bg-gradient-to-t from-[var(--surface-0)] via-[var(--surface-0)]/85 to-[var(--surface-0)]/35" />
                        <span className="absolute inset-0 bg-gradient-to-r from-[var(--surface-0)]/90 via-transparent to-[var(--surface-0)]/60" />
                    </span>
                )}

                <div className="relative z-10 container-page pt-6 pb-8">
                    <Link href="/games"
                        className="inline-flex items-center gap-1.5 font-display text-[10px] font-black uppercase tracking-[0.14em] text-white/45 hover:text-white transition-colors">
                        <ChevronLeft className="w-3.5 h-3.5" /> Games database
                    </Link>

                    <div className="mt-6 flex flex-col md:flex-row md:items-end gap-6 lg:gap-8">
                        {/* The box art, which this page never showed. It is the
                            one image a reader recognises the game by, and it was
                            reachable only as a blurred smear behind the title. */}
                        {game.cover_url && (
                            <span className="relative block w-[152px] md:w-[190px] shrink-0 aspect-[3/4] rounded-[12px] overflow-hidden border border-white/[0.12] shadow-[0_18px_50px_-12px_rgba(0,0,0,0.9)]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={game.cover_url} alt={`${game.name} cover art`}
                                    className="w-full h-full object-cover" />
                            </span>
                        )}

                        <div className="min-w-0 flex-1">
                            {game.genres.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {game.genres.slice(0, 4).map((g) => (
                                        <span key={g} className="rounded-[5px] bg-[var(--accent)] px-2 py-0.5 font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white">
                                            {g}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <h1 className="mt-3 font-display font-black text-white tracking-tight leading-[0.94] text-[34px] md:text-[50px]">
                                {game.name}
                            </h1>

                            {/* Who made it, right under the name — the credit a
                                reader looks for first, and it was three panels
                                down in a facts list. */}
                            <HeroCredits game={game} />

                            <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
                                {released && (
                                    <span className="inline-flex items-center gap-2 text-white/75">
                                        <Calendar className="w-4 h-4 text-[var(--accent)]" />
                                        <span className="font-display font-bold text-white">{released}</span>
                                    </span>
                                )}
                                {game.esrb_rating && (
                                    <span className={`inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.5 ${ESRB_COLORS[game.esrb_rating.name] ?? "bg-white/20"}`}>
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

                            {game.platforms.length > 0 && (
                                <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                                    {game.platforms.slice(0, 10).map((p) => (
                                        <span key={p} className="inline-flex h-[24px] items-center rounded-[6px] border border-white/[0.09] bg-black/35 px-2 font-display text-[10.5px] font-bold text-white/70">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* The primary action takes the room it deserves and
                                the secondary one takes what its words need —
                                "Save to a list" was wrapping onto two lines in a
                                box sized for an icon. */}
                            <div className="mt-5 flex flex-col sm:flex-row sm:items-stretch gap-2.5 sm:max-w-[520px]">
                                <div className="sm:flex-1">
                                    <TrackGameButton slug={slug} gameName={game.name} variant="full" released={game.released} />
                                </div>
                                <AddToListButton slug={slug} gameName={game.name} className="sm:w-auto sm:shrink-0" />
                            </div>
                        </div>

                        {/* The scores as a block of their own. They were a line
                            of small chips lost among the metadata, on a page
                            whose whole job is to answer "is this any good". */}
                        <ScoreStack game={game} />
                    </div>

                    {isUpcoming && game.released && (
                        <div className="mt-6">
                            <GameCountdownTimer targetDate={game.released} />
                        </div>
                    )}
                </div>
            </div>

            {/* The first thing anybody asks about a game they are considering,
                so it sits above everything else rather than in a panel halfway
                down. Absent for the games IGDB has no reading on, which is most
                of them — an empty row of dashes would be worse than silence. */}
            <TimeToBeat times={game.time_to_beat} />

            {/* No `items-start` here, deliberately.

                The sidebar below is `sticky`, and with `items-start` its grid
                cell is only as tall as its own content — so it had nothing to
                stick within and simply stopped, leaving two thousand pixels of
                empty black beside the main column. Stretched cells give it the
                runway the whole page scroll long. */}
            <div className="container-page py-6 grid grid-cols-1 xl:grid-cols-12 gap-5">
                {/* ── main column ── */}
                <div className="xl:col-span-8 min-w-0 space-y-5">

                    {/* Above the trailer: somebody who already knows the game
                        came here to buy it, and should not have to scroll past
                        a video they have seen. */}
                    <LinkRows links={game.links ?? {}} website={game.website} />

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

                    {/* One gallery, not two panels of the same thing stacked.
                        Screenshots and key art are different pictures, so they
                        keep their own headings — but under one roof, where a
                        reader looking at pictures stays looking at pictures. */}
                    {(screenshots.length > 0 || artworks.length > 0) && (
                        <Panel title="Gallery" meta={
                            <span className="font-display text-[10px] font-bold tabular-nums text-white/45">
                                {screenshots.length + artworks.length}
                            </span>
                        }>
                            <div className="space-y-4">
                                {screenshots.length > 0 && (
                                    <div>
                                        {artworks.length > 0 && (
                                            <p className="mb-2 font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/50">
                                                Screenshots
                                            </p>
                                        )}
                                        <GameScreenshotsLightbox screenshots={screenshots} wrapperClassName="" />
                                    </div>
                                )}
                                {artworks.length > 0 && (
                                    <div>
                                        {screenshots.length > 0 && (
                                            <p className="mb-2 font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/50">
                                                Key art
                                            </p>
                                        )}
                                        <GameScreenshotsLightbox screenshots={artworks} wrapperClassName="" />
                                    </div>
                                )}
                            </div>
                        </Panel>
                    )}

                    <Panel title="About">
                        {game.description ? (
                            <div className="prose prose-invert prose-sm max-w-none text-white/65 leading-relaxed [&_a]:text-[var(--accent)]"
                                dangerouslySetInnerHTML={{ __html: game.description }} />
                        ) : (
                            <p className="text-[13px] text-white/50 italic">No description available yet.</p>
                        )}
                    </Panel>

                    {/* `?? []` throughout, not out of habit: /games/* is also
                        cached by nginx, which Laravel's cache version cannot
                        reach, so a payload from before these fields existed can
                        still arrive here. Missing sections are correct then;
                        reading .length off undefined is a blank page. */}
                    <WaysToPlay
                        modes={game.game_modes ?? []}
                        perspectives={game.player_perspectives ?? []}
                        multiplayer={game.multiplayer ?? null}
                        engines={game.engines ?? []}
                    />

                    <RelatedShelves groups={game.related ?? {}} />

                    {/* Folded away. It is a twelve-row table that answers a
                        question most readers never ask, and open it took as
                        much of the page as the trailer. The count is in the
                        summary so somebody who does ask can see it is worth
                        opening. */}
                    {(game.languages ?? []).length > 0 && (
                        <Panel title="Languages" padding="none">
                            <details className="group">
                                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-[13px] text-white/60 hover:text-white/85 transition-colors">
                                    <span className="inline-flex items-center gap-2">
                                        <Languages className="w-4 h-4 text-white/25" />
                                        {game.languages.length} languages, with audio, subtitles and interface
                                    </span>
                                    <ChevronDown className="w-4 h-4 text-white/30 transition-transform group-open:rotate-180" />
                                </summary>
                                <div className="px-4 pb-4">
                                    <LanguageTable rows={game.languages} />
                                </div>
                            </details>
                        </Panel>
                    )}

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

                    {/* Somebody put this game in a ranking.
                        332,455 game pages and not one of them said so — while
                        the lists themselves were reachable from nowhere at all.
                        This is the widest door the site has to them. */}
                    {(game.in_lists?.total ?? 0) > 0 && (
                        <Panel
                            title="In member lists"
                            meta={
                                <span className="font-display text-[10px] font-bold uppercase tracking-[0.12em] tabular-nums text-white/50">
                                    {game.in_lists!.total}
                                </span>
                            }
                        >
                            <div className="space-y-1.5">
                                {game.in_lists!.items.map((l) => (
                                    <Link
                                        key={`${l.username}/${l.slug}`}
                                        href={`/lists/${l.username}/${l.slug}`}
                                        className="group flex items-center gap-3 rounded-[8px] border border-white/[0.06] bg-white/[0.02] p-2.5 hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors"
                                    >
                                        <span
                                            aria-hidden
                                            className="shrink-0 w-[3px] self-stretch rounded-full"
                                            style={{ background: l.list_type === "tier" ? "var(--accent)" : "var(--line-strong)" }}
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="block font-display text-[12.5px] font-bold text-white/85 truncate group-hover:text-[var(--accent)] transition-colors">
                                                {l.name}
                                            </span>
                                            <span className="mt-0.5 block text-[10.5px] text-white/50 truncate">
                                                {l.display_name || l.username} · {l.items_count} {l.items_count === 1 ? "game" : "games"}
                                                {l.list_type === "tier" ? " · tier list" : ""}
                                            </span>
                                        </span>
                                        {l.likes_count > 0 && (
                                            <span className="shrink-0 font-display text-[10.5px] font-bold tabular-nums text-white/50">
                                                ♥ {l.likes_count}
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </div>

                            {game.in_lists!.total > game.in_lists!.items.length && (
                                <Link
                                    href="/lists"
                                    className="mt-3 flex items-center justify-center gap-2 h-9 rounded-[8px] bg-white/[0.04] border border-white/[0.08] font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/55 hover:text-white hover:bg-white/[0.08] transition-colors"
                                >
                                    Browse all game lists
                                </Link>
                            )}
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
                                                <p className="mt-1 text-[10.5px] text-white/50">
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
                                        {alt.description && <span className="text-white/50"> — {alt.description}</span>}
                                    </p>
                                ))}
                            </div>
                        </Panel>
                    )}

                    {/*
                      * The count comes from the payload this page already
                      * fetched, so the widget can skip a request that would
                      * return an empty list — which is what 99% of them did.
                      */}
                    {/*
                      * The countdown and the reminder, which used to live only
                      * on /calendar/{slug}. That page now points its canonical
                      * here, so the function comes with it rather than being
                      * lost to a metadata fix.
                      *
                      * Renders nothing for a game that has already shipped.
                      */}
                    <UpcomingRelease
                        slug={slug}
                        name={game.name}
                        released={game.released}
                        precision={game.release_precision}
                    />

                    <GameRating slug={slug} ratingsCount={game.ratings_count ?? 0} />
                </div>

                {/* ── sidebar ── */}
                <div className="xl:col-span-4 min-w-0 space-y-5 xl:sticky xl:top-[92px] xl:self-start">
                    {/* "Your collection" used to repeat both actions here. It
                        existed because the hero only carried them on phones;
                        now the hero carries them everywhere, and the same two
                        buttons twice on one screen is a question about which
                        one is the real one. */}

                    <Panel title="Facts">
                        <div className="space-y-4">
                            {/* Companies appear the day the enrichment lands — an empty
                                "Unknown" row is a shrug, so absence stays silent. */}
                            <CompanyRow label="Developer" names={game.developers} studios={game.studios} role="developer" />
                            <CompanyRow label="Publisher" names={game.publishers} studios={game.studios} role="publisher" />

                            {/* Credits that are not authorship, and were
                                invisible until now: the studio that brought a
                                game to another platform, and the ones that
                                worked on it without its name being theirs. */}
                            <StudioRow label="Ported by" studios={game.studios} role="porting" />
                            <StudioRow label="Also worked on it" studios={game.studios} role="supporting" />
                            {released && (
                                <div>
                                    <p className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/50">Released</p>
                                    <p className="mt-1 text-[13px] font-medium text-white/85">{released}</p>
                                </div>
                            )}
                            {game.series_name && (
                                <div>
                                    <p className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/50">Series</p>
                                    {game.series_slug ? (
                                        <Link
                                            href={`/games/series/${game.series_slug}`}
                                            className="mt-1 block text-[13px] font-medium text-white/85 hover:text-[var(--accent)] transition-colors"
                                        >
                                            {game.series_name}
                                        </Link>
                                    ) : (
                                        <p className="mt-1 text-[13px] font-medium text-white/85">{game.series_name}</p>
                                    )}
                                </div>
                            )}
                            {game.platforms.length > 0 && (
                                <div>
                                    <p className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/50">Platforms</p>
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
                                    <p className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/50">Age ratings</p>
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        {game.age_ratings.map((r) => (
                                            <span key={r.rating_system_name} className="rounded-[5px] border border-white/[0.09] bg-white/[0.04] px-2 py-1 text-center">
                                                <span className="block text-[8.5px] font-bold uppercase tracking-[0.1em] text-white/50">{r.rating_system_name.replace(" Rating", "")}</span>
                                                <span className="block font-display text-[12px] font-black text-white">{r.rating_name}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* A standing without the measure that produced it
                                is a number nobody can check, so the measure is
                                printed with it. */}
                            {game.popularity && (
                                <div>
                                    <p className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/50">Standing</p>
                                    <p className="mt-1 text-[13px] font-medium text-white/85">
                                        Top {Math.max(1, 100 - game.popularity.percentile)}%
                                        <span className="text-white/55"> by {game.popularity.metric.toLowerCase()}</span>
                                    </p>
                                </div>
                            )}
                            {/* The official site moved up to "Where to get it",
                                beside the shops. It is the same question — where
                                do I go for this — and it was the one thing in
                                this panel a reader could act on, reading like
                                another fact. */}
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
                            {game.series_slug && (
                                <Link
                                    href={`/games/series/${game.series_slug}`}
                                    className="ml-auto font-display text-[11px] font-bold uppercase tracking-[0.1em] text-white/55 hover:text-[var(--accent)] transition-colors"
                                >
                                    See all
                                </Link>
                            )}
                        </h2>
                        <div className="flex sm:grid gap-3.5 overflow-x-auto scrollbar-hide snap-x scroll-pl-4 sm:scroll-pl-0 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                            {series.slice(0, 6).map((g) => <MiniGameCard key={g.id} game={g} />)}
                        </div>
                    </section>
                )}

                {/* IGDB's own "games like this one", which is a better answer
                    than our genre overlap when it exists — so it leads, and the
                    genre-based row below stays for the games it has nothing on. */}
                {(game.similar_games ?? []).length > 0 && (
                    <section>
                        <h2 className="mb-4 flex items-center gap-2.5 font-display text-[15px] font-black uppercase tracking-[0.08em] text-white">
                            <Sparkles className="w-[18px] h-[18px] text-[var(--accent)]" /> Games like this
                        </h2>
                        {/* Covers, not text chips. A row of grey pills under a
                            heading about games reads as a tag list, and it sat
                            directly above a shelf of real cards doing the same
                            job better. */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                            {game.similar_games.slice(0, 8).map((similar) => (
                                <Link key={similar.slug} href={`/games/${similar.slug}`} className="group block">
                                    <span className="relative block h-[150px] overflow-hidden rounded-[9px] border border-white/[0.07] bg-white/[0.03] group-hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors">
                                        {similar.cover_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={similar.cover_url}
                                                alt={similar.name}
                                                loading="lazy"
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                                            />
                                        ) : (
                                            <span className="flex h-full w-full items-center justify-center text-white/12">
                                                <Gamepad2 className="h-6 w-6" />
                                            </span>
                                        )}
                                        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent" />
                                        <span className="absolute inset-x-0 bottom-0 p-2">
                                            <span className="block font-display text-[11px] font-black leading-tight text-white line-clamp-3">
                                                {similar.name}
                                            </span>
                                        </span>
                                    </span>
                                </Link>
                            ))}
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
                    for, still on the page rather than under its footer — and
                    only where the page carries enough of its own to justify
                    one. See `adWorthy` above. */}
                {adWorthy && <DisplayAd minHeight={110} />}

                <GameForumThreads gameSlug={slug} threadsCount={game.threads_count ?? 0} />

                <DataAttribution className="mt-10 border-t border-white/[0.05] pt-5" />
            </div>
        </main>
    );
}
