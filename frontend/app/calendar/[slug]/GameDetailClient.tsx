"use client";

import Image from "next/image";
import Link from "next/link";
import {
    CalendarPlus, Flame, Calendar, Building2, Code2, Gamepad2,
    Clock, Shield, MessageCircle, Heart, Target,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Article } from "@/types";
import HypeMeter from "@/components/games/HypeMeter";
import GameMediaGallery from "@/components/games/GameMediaGallery";
import NewsCard from "@/components/news/NewsCard";

interface RawgGame {
    id: number;
    slug: string;
    name: string;
    released: string | null;
    tba: boolean;
    description_raw: string;
    rating: number;
    ratings_count: number;
    added: number;
    playtime: number;
    tags: { id: number; name: string; slug: string; language: string }[];
    genres: { id: number; name: string; slug: string }[];
    developers: { id: number; name: string; slug: string }[];
    publishers: { id: number; name: string; slug: string }[];
    esrb_rating: { id: number; name: string; slug: string } | null;
    metacritic: number | null;
    clip: { clip: string; preview: string; clips: Record<string, string>; video: string } | null;
    ratings: { id: number; title: string; count: number; percent: number }[];
    added_by_status: {
        yet: number; owned: number; beaten: number;
        toplay: number; dropped: number; playing: number;
    } | null;
}

interface Screenshot { id: number; image: string; width: number; height: number }
interface Movie { id: number; name: string; preview: string; data: { "480": string; max: string } }
interface SuggestedGame {
    id: number; slug: string; name: string;
    released: string | null; background_image: string | null;
    rating: number;
    genres: { name: string }[];
    platforms: { platform: { name: string; slug: string } }[];
}

interface Props {
    game: RawgGame;
    screenshots: { count: number; results: Screenshot[] };
    movies: { count: number; results: Movie[] };
    suggested: { count: number; results: SuggestedGame[] };
    news: Article[];
    isUpcoming: boolean;
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

function hypeLabel(n: number): string {
    if (n >= 10000) return `${(n / 1000).toFixed(0)}K`;
    if (n >= 1000)  return `${(n / 1000).toFixed(1)}K`;
    return String(n);
}

export function AddToCalendarButton({ game }: { game: RawgGame }) {
    const handleClick = () => {
        if (!game.released) return;
        const d = game.released.replace(/-/g, "");
        const ics = [
            "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//TechPlay//EN",
            "BEGIN:VEVENT",
            `DTSTART;VALUE=DATE:${d}`,
            `DTEND;VALUE=DATE:${d}`,
            `SUMMARY:${game.name} - Release Day`,
            `DESCRIPTION:Game release tracked on TechPlay.gg`,
            `URL:https://techplay.gg/calendar/${game.slug}`,
            "STATUS:CONFIRMED",
            "END:VEVENT", "END:VCALENDAR",
        ].join("\r\n");
        const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${game.slug}-release.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <button
            onClick={handleClick}
            disabled={!game.released}
            className="flex items-center justify-center gap-2 px-5 py-[11px] bg-white/[0.05] hover:bg-white/10 border border-white/15 hover:border-white/30 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all whitespace-nowrap"
        >
            <CalendarPlus className="w-3.5 h-3.5" />
            Add to Calendar
        </button>
    );
}

function SectionHeading({ title, linkHref, linkText }: { title: string; linkHref?: string; linkText?: string }) {
    return (
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
                <span className="w-1 h-5 bg-tp-accent rounded-full shrink-0" />
                <h2 className="font-display text-[14px] font-black text-white uppercase tracking-[0.1em] leading-none">
                    {title}
                </h2>
            </div>
            {linkHref && linkText && (
                <Link href={linkHref} className="text-[10px] font-bold uppercase tracking-widest text-white/35 hover:text-tp-accent transition-colors">
                    {linkText} →
                </Link>
            )}
        </div>
    );
}

const RATING_COLORS: Record<string, string> = {
    exceptional: "bg-green-500",
    recommended: "bg-blue-500",
    meh: "bg-yellow-400",
    skip: "bg-red-500",
};
const RATING_EMOJI: Record<string, string> = {
    exceptional: "🏆", recommended: "👍", meh: "😐", skip: "👎",
};

export default function GameDetailClient({
    game, screenshots, movies, suggested, news, isUpcoming,
}: Props) {
    const hypeScore = game.rating > 0 ? Math.round((game.rating / 5) * 100) : 0;
    const hypeLabelText = isUpcoming ? "RISING" : game.rating >= 4 ? "PEAKED" : "GROWING";

    const confirmedDetails = [
        game.released && {
            icon: Calendar,
            label: "Release Date",
            value: format(parseISO(game.released), "MMM d, yyyy"),
        },
        game.developers.length > 0 && {
            icon: Code2,
            label: "Developer",
            value: game.developers.map(d => d.name).join(", "),
        },
        game.publishers.length > 0 && {
            icon: Building2,
            label: "Publisher",
            value: game.publishers.map(p => p.name).join(", "),
        },
        game.genres.length > 0 && {
            icon: Gamepad2,
            label: "Genre",
            value: game.genres.map(g => g.name).join(", "),
        },
        game.playtime > 0 && {
            icon: Clock,
            label: "Avg. Playtime",
            value: `${game.playtime}h`,
        },
        game.esrb_rating && {
            icon: Shield,
            label: "ESRB",
            value: game.esrb_rating.name,
        },
    ].filter(Boolean) as { icon: typeof Calendar; label: string; value: string }[];

    const engTags = game.tags.filter(t => t.language === "eng").slice(0, 16);

    return (
        <div>
            {/* ── 1. OVERVIEW ─────────────────────────────────────────────── */}
            <section className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8 mb-14">
                {/* Left — description + confirmed details */}
                <div>
                    <SectionHeading title="Overview" />

                    {game.description_raw ? (
                        <p className="text-[15px] text-white/80 leading-[1.9] whitespace-pre-line mb-8">
                            {game.description_raw}
                        </p>
                    ) : (
                        <p className="text-[14px] text-white/30 italic mb-8">No description available.</p>
                    )}

                    {/* Confirmed Details grid */}
                    {confirmedDetails.length > 0 && (
                        <>
                            <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 mb-3">
                                Confirmed Details
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {confirmedDetails.map(item => (
                                    <div
                                        key={item.label}
                                        className="flex items-start gap-3 bg-[#0B0E14] border border-[#161B22] rounded-xl p-3.5"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-tp-accent/10 border border-tp-accent/20 flex items-center justify-center shrink-0">
                                            <item.icon className="w-4 h-4 text-tp-accent" />
                                        </div>
                                        <div className="min-w-0">
                                            <dt className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1 leading-none">
                                                {item.label}
                                            </dt>
                                            <dd className="text-[12px] font-semibold text-white leading-snug">
                                                {item.value}
                                            </dd>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Tags */}
                    {engTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-6">
                            {engTags.map(tag => (
                                <span
                                    key={tag.id}
                                    className="text-[11px] font-medium text-white/40 bg-white/[0.04] border border-white/[0.07] px-2.5 py-1 rounded-full"
                                >
                                    {tag.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right — Hype Meter */}
                <div className="bg-[#0B0E14] border border-[#161B22] rounded-2xl p-6 flex flex-col items-center self-start sticky top-6">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-tp-accent mb-4">
                        🔥 Hype Meter
                    </p>
                    <HypeMeter score={hypeScore} label={hypeLabelText} size={150} />

                    {/* Stats — boxed tiles, real data only */}
                    <div className="w-full space-y-2 mt-5">
                        {[
                            game.added > 0 && { icon: Flame, label: "Players Tracking", value: game.added },
                            (game.added_by_status?.yet ?? 0) > 0 && { icon: Target, label: "Want to Play", value: game.added_by_status!.yet },
                            (game.added_by_status?.playing ?? 0) > 0 && { icon: Gamepad2, label: "Currently Playing", value: game.added_by_status!.playing },
                            (game.added_by_status?.owned ?? 0) > 0 && { icon: Heart, label: "Own It", value: game.added_by_status!.owned },
                        ].filter(Boolean).map((stat) => {
                            const s = stat as { icon: typeof Flame; label: string; value: number };
                            return (
                                <div key={s.label} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
                                    <span className="text-[11px] text-white/55 flex items-center gap-2">
                                        <s.icon className="w-3.5 h-3.5 text-tp-accent" /> {s.label}
                                    </span>
                                    <span className="text-[13px] font-black text-white tabular-nums">{hypeLabel(s.value)}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Community discussions */}
                    <Link
                        href="/forum"
                        className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/20 text-white/60 hover:text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all"
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        View Community Discussions
                    </Link>

                    {/* Ratings bars */}
                    {game.ratings && game.ratings.length > 0 && (
                        <div className="w-full mt-5 pt-4 border-t border-white/[0.06] space-y-2.5">
                            {game.ratings.map(r => (
                                <div key={r.id}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] text-white/50 capitalize">
                                            {RATING_EMOJI[r.title] ?? ""} {r.title}
                                        </span>
                                        <span className="text-[10px] font-bold text-white">{r.percent.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${RATING_COLORS[r.title] ?? "bg-tp-accent"}`}
                                            style={{ width: `${r.percent}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ── 2. MEDIA GALLERY ────────────────────────────────────────── */}
            {(movies.count > 0 || screenshots.count > 0) && (
                <section className="mb-14">
                    <SectionHeading title="Media Gallery" />
                    <GameMediaGallery
                        movies={movies.results}
                        screenshots={screenshots.results}
                        gameName={game.name}
                    />
                </section>
            )}

            {/* ── 3. LATEST NEWS ──────────────────────────────────────────── */}
            {news.length > 0 && (
                <section className="mb-14">
                    <SectionHeading
                        title="Latest News About This Game"
                        linkHref="/news"
                        linkText="View All News"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {news.slice(0, 4).map((article, i) => (
                            <NewsCard key={article.id} article={article} index={i} />
                        ))}
                    </div>
                </section>
            )}

            {/* ── 4. SIMILAR GAMES ────────────────────────────────────────── */}
            {suggested.count > 0 && suggested.results.length > 0 && (
                <section>
                    <SectionHeading
                        title="Similar Games"
                        linkHref="/calendar"
                        linkText="View All"
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {suggested.results.slice(0, 8).map(sg => {
                            const chips: { label: string; cls: string }[] = [];
                            for (const p of sg.platforms || []) {
                                const chip = platformChip(p.platform.name, p.platform.slug);
                                if (chip && !chips.some(c => c.label === chip.label)) chips.push(chip);
                            }
                            return (
                                <Link
                                    key={sg.id}
                                    href={`/calendar/${sg.slug}`}
                                    className="group relative block rounded-xl overflow-hidden border border-white/[0.06] bg-[#0B0E14] hover:border-tp-accent/40 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(252,65,0,0.15)] transition-all duration-300"
                                >
                                    <div className="relative aspect-video overflow-hidden bg-[#0B0E14]">
                                        {sg.background_image && (
                                            <Image
                                                src={sg.background_image}
                                                alt={sg.name}
                                                fill
                                                sizes="(max-width: 640px) 50vw, 25vw"
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    </div>
                                    <div className="p-3">
                                        <h3 className="text-[12px] font-bold text-white group-hover:text-tp-accent transition-colors line-clamp-2 leading-snug mb-1.5">
                                            {sg.name}
                                        </h3>
                                        {sg.released && (
                                            <p className="text-[10px] text-white/35 mb-1.5">
                                                {format(parseISO(sg.released), "MMM d, yyyy")}
                                            </p>
                                        )}
                                        <div className="flex gap-1 flex-wrap">
                                            {chips.slice(0, 3).map(chip => (
                                                <span key={chip.label} className={`${chip.cls} text-[7px] font-bold px-1.5 py-[3px] rounded-[3px] leading-none`}>
                                                    {chip.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
}
