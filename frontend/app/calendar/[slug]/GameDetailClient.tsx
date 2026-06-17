"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Images, Film, Gamepad2, AlignLeft, CalendarPlus, Bell } from "lucide-react";
import { format, parseISO } from "date-fns";
import GameScreenshotsLightbox from "@/components/games/GameScreenshotsLightbox";
import GameTrailersPlayer from "@/components/games/GameTrailersPlayer";

interface RawgGame {
    id: number;
    slug: string;
    name: string;
    released: string | null;
    description_raw: string;
    rating: number;
    ratings_count: number;
    added: number;
    tags: { id: number; name: string; slug: string; language: string }[];
    genres: { id: number; name: string; slug: string }[];
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
}

type Tab = "overview" | "screenshots" | "trailers" | "similar";

function platformChip(name: string, slug?: string): { label: string; cls: string } | null {
    const s = (slug || name).toLowerCase();
    if (s.includes("pc") || s === "windows") return { label: "PC", cls: "bg-[#2F6FED]" };
    if (s.includes("playstation-5") || name === "PlayStation 5") return { label: "PS5", cls: "bg-[#1A3FA8]" };
    if (s.includes("playstation-4") || name === "PlayStation 4") return { label: "PS4", cls: "bg-[#1A3FA8]" };
    if (s.includes("playstation")) return { label: "PS", cls: "bg-[#1A3FA8]" };
    if (s.includes("xbox-series") || name.includes("Series")) return { label: "SERIES", cls: "bg-[#107C10]" };
    if (s.includes("xbox-one")) return { label: "ONE", cls: "bg-[#107C10]" };
    if (s.includes("xbox")) return { label: "XBOX", cls: "bg-[#107C10]" };
    if (s.includes("nintendo") || s.includes("switch")) return { label: "SWITCH", cls: "bg-[#E60012]" };
    return null;
}

function AddToCalendarButton({ game }: { game: RawgGame }) {
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
            className="w-full flex items-center justify-center gap-2 py-3 bg-tp-accent hover:bg-tp-accent/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-tp-accent/20"
        >
            <CalendarPlus className="w-4 h-4" />
            Add to Calendar
        </button>
    );
}

export { AddToCalendarButton };

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview",    label: "Overview",    icon: AlignLeft  },
    { id: "screenshots", label: "Screenshots", icon: Images     },
    { id: "trailers",    label: "Trailers",    icon: Film       },
    { id: "similar",     label: "Similar",     icon: Gamepad2   },
];

export default function GameDetailClient({ game, screenshots, movies, suggested }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>("overview");

    const tags = game.tags.filter(t => t.language === "eng").slice(0, 20);

    return (
        <div>
            {/* Tab bar */}
            <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-white/[0.06] mb-8">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    const disabled = tab.id === "trailers" && movies.count === 0;
                    if (disabled) return null;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-[11px] font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors ${
                                active
                                    ? "border-tp-accent text-tp-accent"
                                    : "border-transparent text-zinc-500 dark:text-white/40 hover:text-zinc-800 dark:hover:text-white/70"
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            {tab.label}
                            {tab.id === "screenshots" && screenshots.count > 0 && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none ${active ? "bg-tp-accent/20 text-tp-accent" : "bg-zinc-200 dark:bg-white/10 text-zinc-500 dark:text-white/40"}`}>
                                    {screenshots.count}
                                </span>
                            )}
                            {tab.id === "similar" && suggested.count > 0 && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none ${active ? "bg-tp-accent/20 text-tp-accent" : "bg-zinc-200 dark:bg-white/10 text-zinc-500 dark:text-white/40"}`}>
                                    {suggested.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab content */}
            {activeTab === "overview" && (
                <div className="space-y-10">
                    {game.description_raw ? (
                        <section>
                            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-zinc-200 dark:border-white/5">
                                <span className="w-1 h-5 bg-tp-accent rounded-full shrink-0" />
                                <h2 className="font-display text-[15px] font-bold text-zinc-900 dark:text-white uppercase tracking-[0.08em] leading-none">
                                    About the Game
                                </h2>
                            </div>
                            <div className="text-[14px] text-zinc-600 dark:text-white/60 leading-[1.85] whitespace-pre-line">
                                {game.description_raw}
                            </div>
                        </section>
                    ) : (
                        <p className="text-[14px] text-zinc-500 dark:text-white/30 italic">No description available.</p>
                    )}

                    {tags.length > 0 && (
                        <section>
                            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-zinc-200 dark:border-white/5">
                                <span className="w-1 h-5 bg-tp-accent rounded-full shrink-0" />
                                <h2 className="font-display text-[15px] font-bold text-zinc-900 dark:text-white uppercase tracking-[0.08em] leading-none">
                                    Tags
                                </h2>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {tags.map(tag => (
                                    <span
                                        key={tag.id}
                                        className="text-[12px] font-medium text-zinc-600 dark:text-white/50 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/[0.07] px-3 py-1.5 rounded-full hover:border-tp-accent/40 hover:text-tp-accent dark:hover:text-tp-accent transition-colors cursor-default"
                                    >
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {activeTab === "screenshots" && (
                <div>
                    {screenshots.results.length > 0 ? (
                        <GameScreenshotsLightbox screenshots={screenshots.results} wrapperClassName="w-full" />
                    ) : (
                        <div className="flex items-center justify-center py-20 text-zinc-400 dark:text-white/20">
                            <Images className="w-8 h-8 mr-3" />
                            <span className="text-[14px]">No screenshots available</span>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "trailers" && (
                <div>
                    {movies.results.length > 0 ? (
                        <GameTrailersPlayer movies={movies.results} />
                    ) : (
                        <div className="flex items-center justify-center py-20 text-zinc-400 dark:text-white/20">
                            <Film className="w-8 h-8 mr-3" />
                            <span className="text-[14px]">No trailers available</span>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "similar" && (
                <div>
                    {suggested.results.length > 0 ? (
                        <>
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-200 dark:border-white/5">
                                <span className="w-1 h-5 bg-tp-accent rounded-full shrink-0" />
                                <h2 className="font-display text-[15px] font-bold text-zinc-900 dark:text-white uppercase tracking-[0.08em] leading-none">
                                    You May Also Like
                                </h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {suggested.results.map(sg => {
                                    const chips: { label: string; cls: string }[] = [];
                                    for (const p of sg.platforms || []) {
                                        const chip = platformChip(p.platform.name, p.platform.slug);
                                        if (chip && !chips.some(c => c.label === chip.label)) chips.push(chip);
                                    }
                                    return (
                                        <Link
                                            key={sg.id}
                                            href={`/calendar/${sg.slug}`}
                                            className="group relative block rounded-xl overflow-hidden border border-zinc-200 dark:border-white/[0.06] bg-zinc-100 dark:bg-[#0B0E14] hover:border-tp-accent/40 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(252,65,0,0.15)] transition-all duration-300"
                                        >
                                            <div className="relative aspect-video overflow-hidden bg-zinc-200 dark:bg-[#0B0E14]">
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
                                                <h3 className="text-[12px] font-bold text-zinc-900 dark:text-white group-hover:text-tp-accent transition-colors line-clamp-2 leading-snug mb-1.5">
                                                    {sg.name}
                                                </h3>
                                                {sg.released && (
                                                    <p className="text-[10px] text-zinc-500 dark:text-white/35 mb-1.5">
                                                        {format(parseISO(sg.released), "MMM d, yyyy")}
                                                    </p>
                                                )}
                                                <div className="flex gap-1 flex-wrap">
                                                    {chips.slice(0, 3).map(chip => (
                                                        <span key={chip.label} className={`${chip.cls} text-white text-[7px] font-bold px-1.5 py-[3px] rounded-[3px] leading-none`}>
                                                            {chip.label}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center py-20 text-zinc-400 dark:text-white/20">
                            <Gamepad2 className="w-8 h-8 mr-3" />
                            <span className="text-[14px]">No similar games found</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export { AddToCalendarButton as default_AddToCalendarButton };
