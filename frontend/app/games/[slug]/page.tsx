"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import { useParams } from "next/navigation";
import { Calendar, Monitor, Star, Globe, Clock, ShoppingCart, ExternalLink, Timer, Gamepad2, ArrowLeft, Tag, Info, Hourglass } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDistanceToNow, differenceInSeconds, parseISO, isFuture, format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface Store {
    id: number;
    url: string;
    store: {
        id: number;
        name: string;
        domain: string;
        image_background: string;
    };
}

interface GameDetail {
    id: number;
    name: string;
    description: string;
    released: string;
    background_image: string;
    website: string;
    rating: number;
    metacritic: number;
    metacritic_url: string;
    playtime: number;
    esrb_rating: { name: string; slug: string };
    platforms: { platform: { name: string } }[];
    developers: { name: string }[];
    publishers: { name: string }[];
    genres: { name: string }[];
    tags: { name: string; slug: string; language: string }[];
    stores: Store[];
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = differenceInSeconds(parseISO(targetDate), new Date());

            if (difference > 0) {
                return {
                    days: Math.floor(difference / (3600 * 24)),
                    hours: Math.floor((difference % (3600 * 24)) / 3600),
                    minutes: Math.floor((difference % 3600) / 60),
                    seconds: Math.floor(difference % 60),
                };
            }
            return null;
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft) return null;

    return (
        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <div className="flex flex-col items-center bg-black/60 backdrop-blur-xl border border-[var(--accent)]/50 p-4 rounded-2xl min-w-[90px] shadow-[0_0_30px_rgba(var(--accent-rgb),0.2)]">
                <span className="text-4xl font-black text-white font-mono">{timeLeft.days}</span>
                <span className="text-[10px] uppercase text-[var(--accent)] font-bold tracking-widest mt-1">Days</span>
            </div>
            <div className="flex flex-col items-center bg-black/60 backdrop-blur-xl border border-[var(--accent)]/50 p-4 rounded-2xl min-w-[90px] shadow-[0_0_30px_rgba(var(--accent-rgb),0.2)]">
                <span className="text-4xl font-black text-white font-mono">{timeLeft.hours}</span>
                <span className="text-[10px] uppercase text-[var(--accent)] font-bold tracking-widest mt-1">Hours</span>
            </div>
            <div className="flex flex-col items-center bg-black/60 backdrop-blur-xl border border-[var(--accent)]/50 p-4 rounded-2xl min-w-[90px] shadow-[0_0_30px_rgba(var(--accent-rgb),0.2)]">
                <span className="text-4xl font-black text-white font-mono">{timeLeft.minutes}</span>
                <span className="text-[10px] uppercase text-[var(--accent)] font-bold tracking-widest mt-1">Mins</span>
            </div>
            <div className="flex flex-col items-center bg-black/60 backdrop-blur-xl border border-[var(--accent)]/50 p-4 rounded-2xl min-w-[90px] shadow-[0_0_30px_rgba(var(--accent-rgb),0.2)]">
                <span className="text-4xl font-black text-white font-mono">{timeLeft.seconds}</span>
                <span className="text-[10px] uppercase text-[var(--accent)] font-bold tracking-widest mt-1">Secs</span>
            </div>
        </div>
    );
}

export default function GameDetailPage() {
    const params = useParams();
    const slug = params.slug as string;

    const { data: game, isLoading } = useSWR<GameDetail>(slug ? `/games/${slug}` : null, fetcher);

    if (isLoading) return (
        <div className="min-h-screen bg-[var(--bg-primary)] pt-20 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!game) return (
        <div className="min-h-screen bg-[var(--bg-primary)] pt-20 flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-3xl font-bold text-white mb-4">Game Not Found</h1>
            <p className="text-[var(--text-secondary)] mb-8">The game you are looking for might have been removed or does not exist.</p>
            <Link href="/calendar">
                <Button>Back to Calendar</Button>
            </Link>
        </div>
    );

    const isUpcoming = game.released && isFuture(parseISO(game.released));

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Immersive Hero Section */}
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
                    <Link href="/calendar" className="absolute top-8 left-4 md:left-8 flex items-center gap-2 text-white/70 hover:text-white transition-colors bg-black/30 px-4 py-2 rounded-full backdrop-blur-md hover:bg-black/50">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Calendar
                    </Link>

                    <div className="max-w-4xl animate-in slide-in-from-bottom-10 fade-in duration-700">
                        <div className="flex flex-wrap gap-3 mb-6">
                            {game.genres?.map(g => (
                                <span key={g.name} className="px-4 py-1.5 bg-[var(--accent)]/90 text-white border border-[var(--accent)] rounded-full text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]">
                                    {g.name}
                                </span>
                            ))}
                        </div>

                        <h1 className="text-5xl md:text-8xl font-black text-white mb-6 leading-[0.9] tracking-tight drop-shadow-2xl">
                            {game.name}
                        </h1>

                        {isUpcoming ? (
                            <div className="mt-8 mb-8">
                                <h3 className="text-white/80 font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-[var(--accent)]" />
                                    Releasing {format(parseISO(game.released), 'MMMM d, yyyy')}
                                </h3>
                                <CountdownTimer targetDate={game.released} />
                            </div>
                        ) : (
                            <div className="flex items-center gap-6 mt-8 mb-8 text-white/50">
                                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                                    <Calendar className="w-5 h-5 text-white" />
                                    <span className="text-sm">Released: <span className="text-white font-bold">{game.released}</span></span>
                                </div>

                                {/* Metacritic Score Replacement */}
                                {game.metacritic ? (
                                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                                        <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${game.metacritic >= 80 ? 'bg-green-500 text-white' :
                                            game.metacritic >= 60 ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'
                                            }`}>
                                            {game.metacritic}
                                        </div>
                                        <span className="text-sm text-gray-300">Metascore</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                                        <Star className="w-5 h-5 text-gray-500" />
                                        <span className="text-sm text-gray-300">No Score Yet</span>
                                    </div>
                                )}

                                {game.esrb_rating && (
                                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                                        <Info className="w-5 h-5 text-white" />
                                        <span className="text-sm text-white font-bold">{game.esrb_rating.name}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-20 relative z-20 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Description Panel */}
                        <div className="glass-panel p-8 md:p-10 rounded-3xl border border-white/5 bg-[#0f1221]/80 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-[20%] bg-[var(--accent)]/5 blur-[100px] rounded-full pointer-events-none" />

                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <Monitor className="w-6 h-6 text-[var(--accent)]" />
                                About The Game
                            </h2>
                            <div
                                className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed font-light"
                                dangerouslySetInnerHTML={{ __html: game.description }}
                            />
                        </div>

                        {/* More Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-[#0f1221]/60 hover:bg-[#0f1221]/80 transition-colors">
                                <h3 className="text-xs uppercase text-gray-500 font-bold mb-3 tracking-widest flex items-center gap-2">
                                    <Hourglass className="w-4 h-4" /> Average Playtime
                                </h3>
                                <div className="text-2xl font-bold text-white">
                                    {game.playtime ? `${game.playtime} Hours` : "N/A"}
                                </div>
                            </div>

                            <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-[#0f1221]/60 hover:bg-[#0f1221]/80 transition-colors">
                                <h3 className="text-xs uppercase text-gray-500 font-bold mb-3 tracking-widest flex items-center gap-2">
                                    <Tag className="w-4 h-4" /> Genres & Tags
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {game.genres?.slice(0, 3).map(g => (
                                        <span key={g.name} className="px-2 py-1 bg-white/5 rounded text-xs text-gray-300 border border-white/5">{g.name}</span>
                                    ))}
                                    {game.tags?.filter(t => t.language === 'eng').slice(0, 5).map(t => (
                                        <span key={t.name} className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400 border border-white/5">{t.name}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Additional Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-[#0f1221]/60 hover:bg-[#0f1221]/80 transition-colors">
                                <h3 className="text-xs uppercase text-gray-500 font-bold mb-3 tracking-widest">Developers</h3>
                                <div className="flex flex-wrap gap-2">
                                    {game.developers?.map(d => (
                                        <span key={d.name} className="text-white font-medium text-lg">{d.name}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-[#0f1221]/60 hover:bg-[#0f1221]/80 transition-colors">
                                <h3 className="text-xs uppercase text-gray-500 font-bold mb-3 tracking-widest">Publishers</h3>
                                <div className="flex flex-wrap gap-2">
                                    {game.publishers?.map(p => (
                                        <span key={p.name} className="text-white font-medium text-lg">{p.name}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Stores / Buy Now Card */}
                        <div className="glass-panel p-8 rounded-3xl border border-[var(--accent)]/20 bg-gradient-to-b from-[#0f1221]/90 to-[#0f1221]/70 backdrop-blur-xl shadow-2xl sticky top-24">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <ShoppingCart className="w-5 h-5 text-[var(--accent)]" />
                                {isUpcoming ? 'Pre-Order / Wishlist' : 'Available Stores'}
                            </h3>

                            {game.stores && game.stores.length > 0 ? (
                                <div className="space-y-3">
                                    {game.stores.map((store) => {
                                        const getStoreUrl = () => {
                                            if (store.url && store.url.startsWith('http')) return store.url;

                                            // Fallback search URLs based on store name
                                            const name = store.store.name.toLowerCase();
                                            const gameName = encodeURIComponent(game.name);

                                            if (name.includes('steam')) return `https://store.steampowered.com/search/?term=${gameName}`;
                                            if (name.includes('gog')) return `https://www.gog.com/en/games?query=${gameName}`;
                                            if (name.includes('epic')) return `https://store.epicgames.com/en-US/browse?q=${gameName}`;
                                            if (name.includes('playstation')) return `https://store.playstation.com/search/${gameName}`;
                                            if (name.includes('xbox')) return `https://www.xbox.com/en-US/games/all-games?q=${gameName}`;
                                            if (name.includes('nintendo')) return `https://www.nintendo.com/search/?q=${gameName}`;
                                            if (name.includes('app store')) return `https://www.apple.com/us/search/${gameName}?src=globalnav`;
                                            if (name.includes('google play')) return `https://play.google.com/store/search?q=${gameName}&c=apps`;

                                            // Generic fallback
                                            if (store.store.domain) return `https://${store.store.domain}`;

                                            return '#';
                                        };

                                        const url = getStoreUrl();
                                        if (url === '#') return null; // Skip if no valid URL

                                        return (
                                            <a
                                                key={store.id}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-[var(--accent)] hover:text-white border border-white/5 hover:border-[var(--accent)] transition-all group duration-300"
                                            >
                                                <span className="font-bold text-gray-300 group-hover:text-white">
                                                    {store.store.name}
                                                </span>
                                                <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-white" />
                                            </a>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">Store links not available yet.</p>
                            )}

                            {game.website && (
                                <div className="mt-8 pt-8 border-t border-white/10">
                                    <a
                                        href={game.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all"
                                    >
                                        <Globe className="w-4 h-4" />
                                        Official Website
                                    </a>
                                </div>
                            )}

                            {/* Platforms Tags */}
                            <div className="mt-8">
                                <h3 className="text-xs uppercase text-gray-500 font-bold mb-4 tracking-widest">Available On</h3>
                                <div className="flex flex-wrap gap-2">
                                    {game.platforms?.map(p => (
                                        <span key={p.platform.name} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-gray-300">
                                            {p.platform.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
