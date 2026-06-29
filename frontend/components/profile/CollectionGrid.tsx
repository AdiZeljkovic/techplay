"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { differenceInDays, parseISO } from "date-fns";
import { Library, Star, Trash2, Plus, Search, X, Loader2, Heart, CalendarClock } from "lucide-react";
import type { CollectionEntry, CollectionStatus } from "@/lib/types/profile";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

const STATUS_FILTERS: { id: string; label: string }[] = [
    { id: "all", label: "All" },
    { id: "playing", label: "Playing" },
    { id: "backlog", label: "Backlog" },
    { id: "completed", label: "Completed" },
    { id: "wishlist", label: "Wishlist" },
    { id: "favorites", label: "Favorites" },
    { id: "dropped", label: "Dropped" },
    { id: "upcoming", label: "Upcoming" },
];

const STATUS_OPTIONS: CollectionStatus[] = ["playing", "backlog", "completed", "wishlist", "dropped"];

const statusColor: Record<string, string> = {
    playing: "#34d399", backlog: "#60a5fa", completed: "#22c55e", wishlist: "#f472b6", dropped: "#9ca3af",
};

interface Props {
    username: string;
    isOwnProfile: boolean;
}

interface UpcomingGame {
    slug: string;
    name: string;
    released: string;
    background_image: string | null;
    status: "wishlist" | "backlog";
}

function UpcomingList({ isOwnProfile }: { isOwnProfile: boolean }) {
    const { data, isLoading } = useSWR<{ data: UpcomingGame[] }>(
        isOwnProfile ? "/collection/upcoming" : null,
        fetcher,
        { revalidateOnFocus: false }
    );
    const games = data?.data ?? [];

    if (!isOwnProfile) {
        return <p className="text-[13px] text-white/30 text-center py-8">Upcoming releases are only visible on your own profile.</p>;
    }

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-3 items-center animate-pulse">
                        <div className="w-20 h-12 rounded-lg bg-white/[0.05] shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 bg-white/[0.05] rounded w-1/2" />
                            <div className="h-2 bg-white/[0.05] rounded w-1/4" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (games.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <CalendarClock className="w-8 h-8 text-white/15 mb-3" />
                <p className="text-[13px] font-semibold text-white/40">No upcoming releases in your wishlist or backlog</p>
                <p className="text-[11px] text-white/25 mt-1">Add games to your wishlist to be notified when they release.</p>
                <Link href="/calendar" className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[11px] font-bold uppercase tracking-wider transition-colors">
                    Browse Release Calendar
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {games.map((game) => {
                const days = differenceInDays(parseISO(game.released), new Date());
                const statusColor = game.status === "wishlist" ? "#f472b6" : "#60a5fa";
                return (
                    <Link
                        key={game.slug}
                        href={`/calendar/${game.slug}`}
                        className="group flex items-center gap-4 rounded-xl p-3 border border-white/[0.06] bg-[#0B0E14] hover:border-tp-accent/30 hover:bg-[#0F1318] transition-all"
                    >
                        <div className="relative w-20 h-12 rounded-lg overflow-hidden shrink-0 bg-white/[0.05]">
                            {game.background_image && (
                                <Image src={game.background_image} alt={game.name} fill sizes="80px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-[13px] font-bold text-white group-hover:text-tp-accent transition-colors line-clamp-1">{game.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold text-white/40">
                                    {days <= 0 ? "Out Now" : days === 1 ? "Tomorrow" : `${days} days`}
                                </span>
                                <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
                                    {game.status}
                                </span>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">
                                {parseISO(game.released).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </p>
                            <p className="text-[9px] text-white/20">{parseISO(game.released).getFullYear()}</p>
                        </div>
                    </Link>
                );
            })}
            <div className="pt-2 text-center">
                <Link href="/calendar" className="text-[10px] font-bold uppercase tracking-widest text-white/25 hover:text-tp-accent transition-colors">
                    View Full Release Calendar →
                </Link>
            </div>
        </div>
    );
}

export default function CollectionGrid({ username, isOwnProfile }: Props) {
    const [filter, setFilter] = useState("all");
    const [addOpen, setAddOpen] = useState(false);

    const query = filter === "all" || filter === "upcoming" ? "" : filter === "favorites" ? "?favorite=1" : `?status=${filter}`;
    const key = filter === "upcoming" ? null : `/users/${username}/collection${query}`;
    const { data, isLoading, mutate } = useSWR<{ data: CollectionEntry[] }>(key, fetcher);

    const entries = data?.data ?? [];

    const updateEntry = async (slug: string, payload: Record<string, unknown>) => {
        try {
            await axios.put(`/collection/games/${slug}`, payload);
            mutate();
        } catch {
            toast.error("Failed to update.");
        }
    };

    const removeEntry = async (slug: string) => {
        try {
            await axios.delete(`/collection/games/${slug}`);
            toast.success("Removed from collection");
            mutate();
        } catch {
            toast.error("Failed to remove.");
        }
    };

    return (
        <div>
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {STATUS_FILTERS.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                                filter === f.id ? "bg-[var(--accent)] text-white" : "bg-white/[0.04] text-white/45 hover:text-white/75 border border-white/[0.06]"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                {isOwnProfile && (
                    <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[11px] font-bold uppercase tracking-wider transition-colors shrink-0">
                        <Plus className="w-3.5 h-3.5" /> Add Game
                    </button>
                )}
            </div>

            {/* Upcoming list — special view */}
            {filter === "upcoming" ? (
                <UpcomingList isOwnProfile={isOwnProfile} />
            ) : isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Array.from({ length: 10 }).map((_, i) => <div key={i} className="aspect-[3/4] bg-white/[0.04] rounded-xl animate-pulse" />)}
                </div>
            ) : entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30 mb-3"><Library className="w-6 h-6" /></div>
                    <p className="text-[13px] font-semibold text-white/55">{isOwnProfile ? "No games here yet" : "Nothing in this category"}</p>
                    {isOwnProfile && <button onClick={() => setAddOpen(true)} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[11px] font-bold uppercase tracking-wider"><Plus className="w-3.5 h-3.5" /> Add Game</button>}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {entries.map((e) => (
                        <div key={e.id} className="group relative rounded-xl overflow-hidden border border-white/[0.06] bg-[#0B0E14]">
                            <Link href={e.game ? `/games/${e.game.slug}` : "#"} className="block relative aspect-[3/4] overflow-hidden bg-[#0B0E14]">
                                {e.game?.background_image ? (
                                    <img src={e.game.background_image} alt={e.game.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/15"><Library className="w-8 h-8" /></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                                <span className="absolute top-2 left-2 text-[8px] font-bold uppercase tracking-wider px-1.5 py-1 rounded text-white" style={{ backgroundColor: statusColor[e.status] }}>{e.status}</span>
                                {e.is_favorite && <Star className="absolute top-2 right-2 w-4 h-4 text-yellow-400 fill-yellow-400" />}
                                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                                    <h4 className="text-[12px] font-bold text-white line-clamp-2 leading-snug">{e.game?.name}</h4>
                                    {e.status === "playing" && (
                                        <div className="mt-1.5 h-1 bg-white/15 rounded-full overflow-hidden">
                                            <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${e.progress}%` }} />
                                        </div>
                                    )}
                                </div>
                            </Link>

                            {isOwnProfile && e.game && (
                                <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform bg-[#0B0E14]/95 backdrop-blur-sm border-t border-white/10 p-2 flex items-center gap-1.5">
                                    <select
                                        value={e.status}
                                        onChange={(ev) => updateEntry(e.game!.slug, { status: ev.target.value })}
                                        className="flex-1 min-w-0 bg-white/[0.06] text-white text-[10px] font-bold uppercase rounded px-1.5 py-1 border border-white/10 focus:outline-none"
                                    >
                                        {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="bg-[#0B0E14]">{s}</option>)}
                                    </select>
                                    <button onClick={() => updateEntry(e.game!.slug, { status: e.status, is_favorite: !e.is_favorite })} title="Favorite" className="p-1.5 rounded hover:bg-white/10 text-yellow-400">
                                        <Heart className={`w-3.5 h-3.5 ${e.is_favorite ? "fill-yellow-400" : ""}`} />
                                    </button>
                                    <button onClick={() => removeEntry(e.game!.slug)} title="Remove" className="p-1.5 rounded hover:bg-red-500/15 text-red-400">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {addOpen && <AddGameModal onClose={() => setAddOpen(false)} onAdded={() => mutate()} />}
        </div>
    );
}

function AddGameModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
    const [term, setTerm] = useState("");
    const [status, setStatus] = useState<CollectionStatus>("backlog");
    const [adding, setAdding] = useState<string | null>(null);

    const { data, isLoading } = useSWR(
        term.trim().length >= 2 ? `/games?search=${encodeURIComponent(term.trim())}&page_size=12` : null,
        fetcher,
    );
    const results = data?.results ?? [];

    const add = async (slug: string) => {
        setAdding(slug);
        try {
            await axios.put(`/collection/games/${slug}`, { status });
            toast.success("Added to collection");
            onAdded();
        } catch {
            toast.error("Failed to add.");
        } finally {
            setAdding(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 pt-[10vh]" onClick={onClose}>
            <div className="w-full max-w-lg rounded-2xl bg-[var(--bg-card)] border border-white/10 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                    <h3 className="text-[13px] font-bold uppercase tracking-wider text-white">Add a Game</h3>
                    <button onClick={onClose} className="p-1.5 rounded hover:bg-white/10 text-white/50"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input
                                autoFocus
                                value={term}
                                onChange={(e) => setTerm(e.target.value)}
                                placeholder="Search games…"
                                className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--accent)]/50"
                            />
                        </div>
                        <select value={status} onChange={(e) => setStatus(e.target.value as CollectionStatus)} className="bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-2.5 text-[11px] font-bold uppercase text-white focus:outline-none">
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="bg-[#0B0E14]">{s}</option>)}
                        </select>
                    </div>

                    <div className="max-h-[45vh] overflow-y-auto -mx-1 px-1">
                        {term.trim().length < 2 ? (
                            <p className="text-[12px] text-white/30 text-center py-8">Type at least 2 characters to search.</p>
                        ) : isLoading ? (
                            <div className="flex items-center justify-center py-8 text-white/40"><Loader2 className="w-5 h-5 animate-spin" /></div>
                        ) : results.length === 0 ? (
                            <p className="text-[12px] text-white/30 text-center py-8">No games found.</p>
                        ) : (
                            <ul className="space-y-1.5">
                                {results.map((g: any) => (
                                    <li key={g.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04]">
                                        <div className="w-12 h-12 rounded-md overflow-hidden bg-white/5 shrink-0">
                                            {g.background_image && <img src={g.background_image} alt={g.name} className="w-full h-full object-cover" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-semibold text-white truncate">{g.name}</p>
                                            {g.released && <p className="text-[10px] text-white/35">{new Date(g.released).getFullYear()}</p>}
                                        </div>
                                        <button onClick={() => add(g.slug)} disabled={adding === g.slug} className="px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white text-[10px] font-bold uppercase tracking-wider shrink-0">
                                            {adding === g.slug ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Add"}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
