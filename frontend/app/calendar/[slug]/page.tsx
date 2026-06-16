import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getServerApiUrl } from "@/lib/api";
import { format, parseISO } from "date-fns";
import { ChevronLeft, Star, Flame, Globe, Users, Tag, Calendar, Shield } from "lucide-react";

export const revalidate = false;

interface RawgPlatform {
    platform: { id: number; name: string; slug: string };
    released_at?: string;
}

interface RawgGame {
    id: number;
    slug: string;
    name: string;
    description: string;
    description_raw: string;
    released: string | null;
    tba: boolean;
    background_image: string | null;
    background_image_additional: string | null;
    website: string | null;
    metacritic: number | null;
    rating: number;
    rating_top: number;
    ratings_count: number;
    added: number;
    playtime: number;
    platforms: RawgPlatform[];
    genres: { id: number; name: string; slug: string }[];
    tags: { id: number; name: string; slug: string; language: string }[];
    developers: { id: number; name: string; slug: string }[];
    publishers: { id: number; name: string; slug: string }[];
    esrb_rating: { id: number; name: string; slug: string } | null;
    short_screenshots: { id: number; image: string }[];
    clip: { clip: string; preview: string } | null;
}

type Props = { params: Promise<{ slug: string }> };

async function getGame(slug: string): Promise<RawgGame | null> {
    try {
        const res = await fetch(`${getServerApiUrl()}/games/rawg/${slug}`, {
            cache: "force-cache",
            next: { tags: [`rawg-game-${slug}`] },
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const game = await getGame(slug);
    if (!game) return { title: "Game Not Found - TechPlay" };

    const desc = game.description_raw?.slice(0, 160) || `${game.name} — release info, screenshots and details on TechPlay.`;

    return {
        title: `${game.name} - Release Calendar - TechPlay`,
        description: desc,
        openGraph: {
            title: game.name,
            description: desc,
            images: game.background_image ? [game.background_image] : [],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: game.name,
            description: desc,
            images: game.background_image ? [game.background_image] : [],
        },
    };
}

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

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return (
        <div className="flex items-center gap-0.5">
            {[...Array(max)].map((_, i) => (
                <Star
                    key={i}
                    className={`w-4 h-4 ${i < full ? "text-yellow-400 fill-yellow-400" : i === full && half ? "text-yellow-400 fill-yellow-200" : "text-zinc-300 dark:text-[#3F3F46]"}`}
                />
            ))}
        </div>
    );
}

function SectionHeading({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
    return (
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-zinc-200 dark:border-white/5">
            <span className="w-1.5 h-5 bg-tp-accent rounded-sm shrink-0" />
            <Icon className="w-4 h-4 text-tp-accent" />
            <h2 className="font-display text-[16px] font-bold text-zinc-900 dark:text-white uppercase tracking-[0.06em] leading-none">
                {label}
            </h2>
        </div>
    );
}

export default async function CalendarGamePage({ params }: Props) {
    const { slug } = await params;
    const game = await getGame(slug);

    if (!game) notFound();

    const chips: { label: string; cls: string }[] = [];
    for (const p of game.platforms || []) {
        const chip = platformChip(p.platform.name, p.platform.slug);
        if (chip && !chips.some(c => c.label === chip.label)) chips.push(chip);
    }

    const screenshots = (game.short_screenshots || []).filter(s => s.id !== -1);

    const metacriticColor = game.metacritic
        ? game.metacritic >= 75 ? "bg-green-500 text-white" : game.metacritic >= 50 ? "bg-yellow-400 text-black" : "bg-red-500 text-white"
        : "";

    return (
        <div className="min-h-screen bg-white dark:bg-[#070A10]">

            {/* ── HERO ── */}
            <div className="relative h-[55vh] min-h-[380px] w-full overflow-hidden">
                {game.background_image && (
                    <Image
                        src={game.background_image}
                        alt={game.name}
                        fill
                        priority
                        quality={85}
                        sizes="100vw"
                        className="object-cover"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#070A10] via-[#070A10]/70 to-[#070A10]/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#070A10]/60 via-transparent to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 max-w-[1320px] mx-auto px-4 xl:px-0 pb-10">
                    <Link
                        href="/calendar"
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/60 hover:text-tp-accent transition-colors mb-6"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Release Calendar
                    </Link>

                    <div className="flex items-center gap-3 flex-wrap mb-4">
                        {game.metacritic && (
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-[15px] font-bold shadow-lg ${metacriticColor}`}>
                                {game.metacritic}
                            </div>
                        )}
                        {game.rating > 0 && (
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-3 py-2">
                                <StarRating rating={game.rating} />
                                <span className="text-white font-bold text-[13px]">
                                    {game.rating.toFixed(1)}
                                    <span className="text-white/50 font-normal text-[11px]">/5</span>
                                </span>
                            </div>
                        )}
                        {(game.added || 0) > 0 && (
                            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-3 py-2">
                                <Flame className="w-4 h-4 text-tp-accent" />
                                <span className="text-white font-bold text-[13px]">
                                    {game.added >= 1000 ? `${(game.added / 1000).toFixed(1)}K` : game.added}
                                    <span className="text-white/50 font-normal text-[11px] ml-1">tracking</span>
                                </span>
                            </div>
                        )}
                    </div>

                    <h1 className="font-display text-[36px] md:text-[52px] lg:text-[62px] font-black text-white uppercase leading-[0.9] tracking-tight mb-4">
                        {game.name}
                    </h1>

                    <div className="flex items-center gap-4 flex-wrap">
                        {game.released && (
                            <span className="flex items-center gap-1.5 text-[13px] text-white/70 font-medium">
                                <Calendar className="w-4 h-4 text-tp-accent" />
                                {format(parseISO(game.released), "MMMM d, yyyy")}
                            </span>
                        )}
                        {game.tba && !game.released && (
                            <span className="text-[13px] text-tp-accent font-bold uppercase tracking-widest">TBA</span>
                        )}
                        {chips.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {chips.map(c => (
                                    <span key={c.label} className={`${c.cls} text-[9px] font-bold tracking-wider px-2 py-1 rounded-[4px] leading-none`}>
                                        {c.label}
                                    </span>
                                ))}
                            </div>
                        )}
                        {game.genres.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {game.genres.slice(0, 3).map(g => (
                                    <span key={g.id} className="text-[11px] font-medium text-white/60 bg-white/10 border border-white/10 px-2.5 py-1 rounded-full">
                                        {g.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── CONTENT ── */}
            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">

                {/* Left column */}
                <div className="lg:col-span-2 space-y-12">

                    {/* About */}
                    {game.description_raw && (
                        <section>
                            <SectionHeading icon={Globe} label="About" />
                            <p className="text-[15px] text-zinc-600 dark:text-[#A1A1AA] leading-[1.8] whitespace-pre-line">
                                {game.description_raw.slice(0, 1200)}
                                {game.description_raw.length > 1200 && "..."}
                            </p>
                        </section>
                    )}

                    {/* Screenshots */}
                    {screenshots.length > 0 && (
                        <section>
                            <SectionHeading icon={Tag} label="Screenshots" />
                            <div className="grid grid-cols-2 gap-3">
                                {screenshots.slice(0, 6).map((ss, i) => (
                                    <div key={ss.id} className={`relative overflow-hidden rounded-xl border border-zinc-200 dark:border-[#161B22] bg-zinc-100 dark:bg-[#0B0E14] ${i === 0 ? "col-span-2 aspect-video" : "aspect-video"}`}>
                                        <Image
                                            src={ss.image}
                                            alt={`${game.name} screenshot ${i + 1}`}
                                            fill
                                            sizes="(max-width: 1024px) 100vw, 66vw"
                                            quality={80}
                                            className="object-cover hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Tags */}
                    {game.tags.filter(t => t.language === "eng").length > 0 && (
                        <section>
                            <SectionHeading icon={Tag} label="Tags" />
                            <div className="flex flex-wrap gap-2">
                                {game.tags.filter(t => t.language === "eng").slice(0, 24).map(tag => (
                                    <span
                                        key={tag.id}
                                        className="text-[12px] font-medium text-zinc-600 dark:text-[#A1A1AA] bg-zinc-100 dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] px-3 py-1.5 rounded-full hover:border-tp-accent/40 hover:text-tp-accent transition-colors cursor-default"
                                    >
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Right sidebar */}
                <div className="space-y-5">

                    {/* Quick Facts */}
                    <div className="bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-2xl p-5">
                        <h3 className="font-display text-[13px] font-bold text-zinc-900 dark:text-white uppercase tracking-[0.08em] mb-5 pb-4 border-b border-zinc-200 dark:border-white/5">
                            Quick Facts
                        </h3>
                        <dl className="space-y-4">
                            {game.released && (
                                <div>
                                    <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-[#71717A] mb-1">Release Date</dt>
                                    <dd className="text-[13px] font-medium text-zinc-900 dark:text-white">{format(parseISO(game.released), "MMMM d, yyyy")}</dd>
                                </div>
                            )}
                            {game.genres.length > 0 && (
                                <div>
                                    <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-[#71717A] mb-1">Genres</dt>
                                    <dd className="text-[13px] text-zinc-900 dark:text-white">{game.genres.map(g => g.name).join(", ")}</dd>
                                </div>
                            )}
                            {game.rating > 0 && (
                                <div>
                                    <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-[#71717A] mb-1.5">RAWG Rating</dt>
                                    <dd className="flex items-center gap-2">
                                        <StarRating rating={game.rating} />
                                        <span className="text-[13px] font-bold text-zinc-900 dark:text-white">{game.rating.toFixed(2)}<span className="text-zinc-500 dark:text-[#71717A] font-normal text-[11px]">/5</span></span>
                                    </dd>
                                </div>
                            )}
                            {game.ratings_count > 0 && (
                                <div>
                                    <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-[#71717A] mb-1">Community</dt>
                                    <dd className="flex items-center gap-1.5 text-[13px] text-zinc-900 dark:text-white">
                                        <Users className="w-3.5 h-3.5 text-tp-accent" />
                                        {game.ratings_count.toLocaleString()} ratings
                                    </dd>
                                </div>
                            )}
                            {game.esrb_rating && (
                                <div>
                                    <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-[#71717A] mb-1">ESRB Rating</dt>
                                    <dd className="flex items-center gap-1.5 text-[13px] text-zinc-900 dark:text-white">
                                        <Shield className="w-3.5 h-3.5 text-tp-accent" />
                                        {game.esrb_rating.name}
                                    </dd>
                                </div>
                            )}
                            {game.playtime > 0 && (
                                <div>
                                    <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-[#71717A] mb-1">Avg. Playtime</dt>
                                    <dd className="text-[13px] text-zinc-900 dark:text-white">{game.playtime}h</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* Credits */}
                    {(game.developers.length > 0 || game.publishers.length > 0) && (
                        <div className="bg-white dark:bg-[#0B0E14] border border-zinc-200 dark:border-[#161B22] rounded-2xl p-5">
                            <h3 className="font-display text-[13px] font-bold text-zinc-900 dark:text-white uppercase tracking-[0.08em] mb-5 pb-4 border-b border-zinc-200 dark:border-white/5">
                                Credits
                            </h3>
                            <dl className="space-y-4">
                                {game.developers.length > 0 && (
                                    <div>
                                        <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-[#71717A] mb-1">Developer</dt>
                                        <dd className="text-[13px] text-zinc-900 dark:text-white">{game.developers.map(d => d.name).join(", ")}</dd>
                                    </div>
                                )}
                                {game.publishers.length > 0 && (
                                    <div>
                                        <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-[#71717A] mb-1">Publisher</dt>
                                        <dd className="text-[13px] text-zinc-900 dark:text-white">{game.publishers.map(p => p.name).join(", ")}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    )}

                    {/* Website */}
                    {game.website && (
                        <a
                            href={game.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-tp-accent hover:bg-tp-accent-hover text-white text-[12px] font-bold uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-tp-accent/20"
                        >
                            <Globe className="w-4 h-4" />
                            Official Website
                        </a>
                    )}

                    {/* Back to calendar */}
                    <Link
                        href="/calendar"
                        className="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-white dark:bg-[#0B0E14] hover:bg-zinc-50 dark:hover:bg-[#0F1318] border border-zinc-200 dark:border-[#161B22] hover:border-tp-accent/40 text-zinc-600 dark:text-[#A1A1AA] hover:text-tp-accent text-[12px] font-bold uppercase tracking-widest rounded-xl transition-all"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Calendar
                    </Link>
                </div>
            </div>
        </div>
    );
}
