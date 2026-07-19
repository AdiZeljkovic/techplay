"use client";

import useSWR from "swr";
import Image from "next/image";
import Link from "next/link";
import { differenceInDays, parseISO } from "date-fns";
import axios from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { CalendarClock, Heart, Layers } from "lucide-react";

interface UpcomingGame {
    slug: string;
    name: string;
    released: string;
    background_image: string | null;
    status: "wishlist" | "backlog";
}

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data ?? []);

const STATUS_CONFIG = {
    wishlist: { label: "Wishlist", icon: Heart, color: "text-pink-400 bg-pink-500/10" },
    backlog:  { label: "Backlog",  icon: Layers, color: "text-blue-400 bg-blue-500/10"  },
};

function DaysChip({ released }: { released: string }) {
    const days = differenceInDays(parseISO(released), new Date());
    if (days <= 0) return <span className="text-[10px] font-bold text-[var(--accent)]">Out Now</span>;
    if (days === 1) return <span className="text-[10px] font-bold text-yellow-400">Tomorrow</span>;
    return (
        <span className="text-[10px] font-bold text-white/50">
            <span className="text-white font-black">{days}</span> days
        </span>
    );
}

export default function UpcomingReleasesWidget() {
    const { user } = useAuth();
    const { data: games, isLoading } = useSWR<UpcomingGame[]>(
        user ? "/collection/upcoming" : null,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 120_000 }
    );

    if (!user) return null;

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-3 items-center animate-pulse">
                        <div className="w-14 h-9 rounded-lg bg-white/[0.06] shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <div className="h-3 bg-white/[0.06] rounded w-3/4" />
                            <div className="h-2 bg-white/[0.06] rounded w-1/3" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!games || games.length === 0) {
        return (
            <div className="text-center py-4">
                <CalendarClock className="w-6 h-6 text-white/20 mx-auto mb-2" />
                <p className="text-[12px] text-white/30">No upcoming releases in your wishlist or backlog.</p>
                <Link href="/calendar" className="text-[11px] font-bold text-[var(--accent)] hover:underline mt-1 block">
                    Browse Release Calendar →
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {games.slice(0, 5).map((game) => {
                const cfg = STATUS_CONFIG[game.status];
                const StatusIcon = cfg.icon;
                return (
                    <Link
                        key={game.slug}
                        href={`/calendar/${game.slug}`}
                        className="group flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.04] transition-colors"
                    >
                        {/* Thumbnail */}
                        <div className="relative w-14 h-9 rounded-lg overflow-hidden shrink-0 bg-white/[0.05] border border-white/[0.06]">
                            {game.background_image && (
                                <Image
                                    src={game.background_image}
                                    alt={game.name}
                                    fill
                                    sizes="56px"
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-white group-hover:text-[var(--accent)] transition-colors line-clamp-1 leading-snug mb-0.5">
                                {game.name}
                            </p>
                            <div className="flex items-center gap-2">
                                <DaysChip released={game.released} />
                                <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${cfg.color}`}>
                                    <StatusIcon className="w-2.5 h-2.5" />
                                    {cfg.label}
                                </span>
                            </div>
                        </div>
                    </Link>
                );
            })}

            <div className="pt-2 border-t border-white/[0.05] mt-1">
                <Link
                    href="/calendar"
                    className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-[var(--accent)] transition-colors"
                >
                    View Release Calendar →
                </Link>
            </div>
        </div>
    );
}
