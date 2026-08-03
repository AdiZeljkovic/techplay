"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWR, { mutate as globalMutate } from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { differenceInDays, parseISO } from "date-fns";
import {
    Library, Trash2, Plus, Search, X, Loader2, Heart, CalendarClock, Pin, Upload, Clock3, Gamepad2, ChevronDown,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import type { CollectionEntry, CollectionStatus, UserProfile } from "@/lib/types/profile";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

/**
 * Each status owns a colour and keeps it everywhere — the chip on the card,
 * the rail down its edge, the dot in the filter. A collection you can read at
 * a glance is a collection you'll actually curate.
 */
const STATUS: Record<string, { label: string; color: string }> = {
    playing: { label: "Playing", color: "#34d399" },
    backlog: { label: "Backlog", color: "#60a5fa" },
    completed: { label: "Completed", color: "#22c55e" },
    wishlist: { label: "Wishlist", color: "#f472b6" },
    dropped: { label: "Dropped", color: "#9ca3af" },
};

const STATUS_OPTIONS: CollectionStatus[] = ["playing", "backlog", "completed", "wishlist", "dropped"];

/** Filters, plus which stat on the profile payload counts them. */
const FILTERS: { id: string; label: string; countKey?: keyof NonNullable<UserProfile["stats"]> }[] = [
    { id: "all", label: "All", countKey: "games_count" },
    { id: "playing", label: "Playing", countKey: "playing_count" },
    { id: "backlog", label: "Backlog", countKey: "backlog_count" },
    { id: "completed", label: "Completed", countKey: "completed_count" },
    { id: "wishlist", label: "Wishlist", countKey: "wishlist_count" },
    { id: "favorites", label: "Favorites", countKey: "favorites_count" },
    { id: "dropped", label: "Dropped" },
    { id: "upcoming", label: "Upcoming" },
];

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

/* ── upcoming ─────────────────────────────────────────────────────────── */

function UpcomingList({ isOwnProfile }: { isOwnProfile: boolean }) {
    const { data, isLoading } = useSWR<{ data: UpcomingGame[] }>(
        isOwnProfile ? "/collection/upcoming" : null,
        fetcher,
        { revalidateOnFocus: false }
    );
    const games = data?.data ?? [];

    if (!isOwnProfile) {
        return <EmptyState variant="compact" title="Upcoming releases are private" body="They're only visible on your own profile." />;
    }

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-[76px] rounded-[12px] bg-white/[0.04] animate-pulse" />
                ))}
            </div>
        );
    }

    if (games.length === 0) {
        return (
            <EmptyState
                icon={<CalendarClock className="w-[18px] h-[18px]" />}
                title="Nothing on the horizon"
                body="Wishlist or backlog a game that hasn't launched and its countdown lands here."
                action={{ label: "Browse the calendar", href: "/calendar" }}
            />
        );
    }

    return (
        <div className="space-y-2">
            {games.map((game) => {
                const days = differenceInDays(parseISO(game.released), new Date());
                const tint = STATUS[game.status].color;
                const imminent = days >= 0 && days < 7;

                return (
                    <Link
                        key={game.slug}
                        href={`/calendar/${game.slug}`}
                        className="group flex items-center gap-4 rounded-[12px] p-3 border border-white/[0.07] bg-white/[0.02] hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-colors duration-300"
                    >
                        {/* the countdown leads — it's the reason this list exists */}
                        <span
                            className={`shrink-0 flex flex-col items-center justify-center w-[54px] h-[54px] rounded-[10px] leading-none ${
                                imminent ? "bg-[var(--accent)] text-white" : "bg-white/[0.05] border border-white/[0.08] text-white"
                            }`}
                        >
                            <span className="font-display text-[17px] font-black tabular-nums">
                                {days <= 0 ? "OUT" : days}
                            </span>
                            <span className="mt-1 font-display text-[7.5px] font-bold uppercase tracking-[0.14em] opacity-70">
                                {days <= 0 ? "now" : days === 1 ? "day" : "days"}
                            </span>
                        </span>

                        <span className="relative w-[86px] h-[52px] rounded-[8px] overflow-hidden shrink-0 bg-white/[0.04]">
                            {game.background_image && (
                                <Image src={game.background_image} alt={game.name} fill sizes="86px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                            )}
                        </span>

                        <span className="flex-1 min-w-0">
                            <span className="block font-display text-[13.5px] font-bold text-white group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                                {game.name}
                            </span>
                            <span className="mt-1 flex items-center gap-2">
                                <span
                                    className="inline-flex items-center h-[16px] px-1.5 rounded-[3px] font-display text-[8px] font-black uppercase tracking-[0.1em]"
                                    style={{ backgroundColor: `${tint}22`, color: tint }}
                                >
                                    {game.status}
                                </span>
                                <span className="font-display text-[10px] font-bold uppercase tracking-[0.12em] tabular-nums text-white/35">
                                    {parseISO(game.released).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </span>
                            </span>
                        </span>
                    </Link>
                );
            })}

            <Link
                href="/calendar"
                className="block pt-2 text-center font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/30 hover:text-[var(--accent)] transition-colors"
            >
                View full release calendar →
            </Link>
        </div>
    );
}

/* ── one shelf card ───────────────────────────────────────────────────── */

function GameCard({
    entry,
    isOwnProfile,
    onUpdate,
    onRemove,
    onShowcase,
}: {
    entry: CollectionEntry;
    isOwnProfile: boolean;
    onUpdate: (slug: string, payload: Record<string, unknown>) => void;
    onRemove: (slug: string) => void;
    onShowcase: (slug: string) => void;
}) {
    const meta = STATUS[entry.status] ?? STATUS.backlog;
    const pinned = entry.showcase_order != null;
    const hours = entry.hours_played ?? 0;
    const progress = entry.progress ?? 0;

    return (
        <div
            className="group relative rounded-[12px] overflow-hidden border border-white/[0.07] bg-[#0d0b0a] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.55)] transition-all duration-300"
            style={{ ["--tint" as string]: meta.color }}
        >
            {/* the status paints the card's top edge */}
            <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] z-10" style={{ background: meta.color }} />

            <Link href={entry.game ? `/games/${entry.game.slug}` : "#"} className="block relative aspect-[3/4] overflow-hidden">
                {entry.game?.background_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={entry.game.background_image}
                        alt={entry.game.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-[var(--ease-hud)]"
                    />
                ) : (
                    <span className="w-full h-full flex items-center justify-center text-white/15 bg-white/[0.03]">
                        <Gamepad2 className="w-8 h-8" />
                    </span>
                )}

                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

                {/* status, top-left, with its own dot */}
                <span
                    className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 h-[19px] pl-1.5 pr-2 rounded-[4px] backdrop-blur-md font-display text-[8px] font-black uppercase tracking-[0.12em] text-white"
                    style={{ backgroundColor: `${meta.color}2e`, boxShadow: `inset 0 0 0 1px ${meta.color}66` }}
                >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
                    {meta.label}
                </span>

                {/* the two marks you can set, stacked top-right */}
                <span className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5">
                    {entry.is_favorite && (
                        <span className="w-[22px] h-[22px] rounded-full bg-black/55 backdrop-blur-md flex items-center justify-center" title="Favorite">
                            <Heart className="w-3 h-3 text-amber-400 fill-amber-400" />
                        </span>
                    )}
                    {pinned && (
                        <span className="w-[22px] h-[22px] rounded-full bg-black/55 backdrop-blur-md flex items-center justify-center" title="Pinned to showcase">
                            <Pin className="w-3 h-3 text-[var(--accent)] fill-[var(--accent)]" />
                        </span>
                    )}
                </span>

                <span className="absolute inset-x-0 bottom-0 p-2.5">
                    <span className="block font-display text-[12px] font-bold text-white leading-snug line-clamp-2">
                        {entry.game?.name}
                    </span>

                    {/* the facts worth carrying on a cover */}
                    {(hours > 0 || (entry.status === "playing" && progress > 0)) && (
                        <span className="mt-1.5 flex items-center gap-2 font-display text-[9.5px] font-bold tabular-nums text-white/50">
                            {hours > 0 && (
                                <span className="inline-flex items-center gap-1">
                                    <Clock3 className="w-3 h-3" /> {hours}h
                                </span>
                            )}
                            {entry.status === "playing" && progress > 0 && (
                                <span style={{ color: meta.color }}>{progress}%</span>
                            )}
                        </span>
                    )}

                    {entry.status === "playing" && progress > 0 && (
                        <span className="mt-1.5 block h-[3px] rounded-full bg-white/15 overflow-hidden">
                            <span className="block h-full rounded-full" style={{ width: `${progress}%`, background: meta.color }} />
                        </span>
                    )}
                </span>
            </Link>

            {/* owner controls slide up over the art */}
            {isOwnProfile && entry.game && (
                <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[var(--ease-hud)] bg-[#0d0b0a]/97 backdrop-blur-sm border-t border-white/[0.09] p-2 flex items-center gap-1.5">
                    <span className="relative flex-1 min-w-0">
                        <select
                            value={entry.status}
                            onChange={(ev) => onUpdate(entry.game!.slug, { status: ev.target.value })}
                            aria-label="Change status"
                            className="w-full appearance-none bg-white/[0.06] text-white font-display text-[9.5px] font-bold uppercase tracking-[0.08em] rounded-[6px] pl-2 pr-5 py-1.5 border border-white/[0.1] focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] cursor-pointer"
                        >
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s} className="bg-[#0d0b0a] normal-case">{STATUS[s].label}</option>
                            ))}
                        </select>
                        <ChevronDown aria-hidden className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" />
                    </span>

                    <button
                        onClick={() => onUpdate(entry.game!.slug, { status: entry.status, is_favorite: !entry.is_favorite })}
                        title={entry.is_favorite ? "Remove from favorites" : "Mark as favorite"}
                        className={`shrink-0 p-1.5 rounded-[6px] hover:bg-white/10 transition-colors ${entry.is_favorite ? "text-amber-400" : "text-white/35"}`}
                    >
                        <Heart className={`w-3.5 h-3.5 ${entry.is_favorite ? "fill-amber-400" : ""}`} />
                    </button>
                    <button
                        onClick={() => onShowcase(entry.game!.slug)}
                        title={pinned ? "Unpin from showcase" : "Pin to showcase"}
                        className={`shrink-0 p-1.5 rounded-[6px] hover:bg-white/10 transition-colors ${pinned ? "text-[var(--accent)]" : "text-white/35"}`}
                    >
                        <Pin className={`w-3.5 h-3.5 ${pinned ? "fill-[var(--accent)]" : ""}`} />
                    </button>
                    <button
                        onClick={() => onRemove(entry.game!.slug)}
                        title="Remove from collection"
                        className="shrink-0 p-1.5 rounded-[6px] hover:bg-red-500/15 text-white/35 hover:text-red-400 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}

/* ── the shelf ────────────────────────────────────────────────────────── */

export default function CollectionGrid({ username, isOwnProfile }: Props) {
    const [filter, setFilter] = useState("all");
    const [addOpen, setAddOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const query = filter === "all" || filter === "upcoming" ? "" : filter === "favorites" ? "?favorite=1" : `?status=${filter}`;
    const key = filter === "upcoming" ? null : `/users/${username}/collection${query}`;
    const { data, isLoading, mutate } = useSWR<{ data: CollectionEntry[] }>(key, fetcher);

    // Same SWR key the profile page already loaded — the counts come free.
    const { data: profile } = useSWR<UserProfile>(`/users/${username}`, fetcher);
    const stats = profile?.stats;

    const entries = data?.data ?? [];

    const updateEntry = async (slug: string, payload: Record<string, unknown>) => {
        try {
            await axios.put(`/collection/games/${slug}`, payload);
            mutate();
            globalMutate(`/users/${username}`);
        } catch {
            toast.error("Failed to update.");
        }
    };

    const removeEntry = async (slug: string) => {
        try {
            await axios.delete(`/collection/games/${slug}`);
            toast.success("Removed from collection");
            mutate();
            globalMutate(`/users/${username}`);
        } catch {
            toast.error("Failed to remove.");
        }
    };

    const importCsv = async (file: File) => {
        setImporting(true);
        try {
            const form = new FormData();
            form.append("file", file);
            const res = await axios.post("/collection/import", form, { headers: { "Content-Type": "multipart/form-data" } });
            toast.success(res.data?.message ?? "Import finished");
            mutate();
            globalMutate(`/users/${username}`);
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Import failed.");
        } finally {
            setImporting(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const connectSteam = async () => {
        try {
            const res = await axios.get("/connected-accounts/steam/connect");
            if (res.data?.data?.url) {
                window.location.href = res.data.data.url;
                return;
            }
            toast.error("Couldn't start the Steam connection.");
        } catch {
            toast.error("Couldn't start the Steam connection.");
        }
    };

    const toggleShowcase = async (slug: string) => {
        try {
            const res = await axios.post(`/collection/games/${slug}/showcase`);
            toast.success(res.data?.message ?? "Showcase updated");
            mutate();
            globalMutate(`/users/${username}`);
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Failed to update showcase.");
        }
    };

    return (
        <div>
            {/* ── toolbar ── */}
            <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                    {FILTERS.map((f) => {
                        const on = filter === f.id;
                        const count = f.countKey ? stats?.[f.countKey] : undefined;
                        const tint = STATUS[f.id]?.color;

                        return (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id)}
                                aria-pressed={on}
                                className={`group/chip shrink-0 inline-flex items-center gap-2 h-9 px-3.5 rounded-full font-display text-[10.5px] font-bold uppercase tracking-[0.12em] border transition-colors duration-300 ${
                                    on
                                        ? "bg-[var(--accent)] border-transparent text-white"
                                        : "bg-white/[0.03] border-white/[0.09] text-white/45 hover:text-white hover:border-white/25"
                                }`}
                            >
                                {tint && (
                                    <span
                                        aria-hidden
                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                        style={{ background: on ? "#fff" : tint }}
                                    />
                                )}
                                {f.label}
                                {typeof count === "number" && (
                                    <span className={`font-display text-[10px] font-black tabular-nums ${on ? "text-white/70" : "text-white/25"}`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {isOwnProfile && (
                    <div className="flex items-center gap-2 shrink-0">
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".csv,.txt"
                            className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f); }}
                        />
                        <button
                            onClick={() => fileRef.current?.click()}
                            disabled={importing}
                            title="Import CSV (name,status,hours) — works with Backloggd/HLTB exports"
                            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-[8px] bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.12] text-white font-display text-[10.5px] font-bold uppercase tracking-[0.08em] transition-colors disabled:opacity-50"
                        >
                            {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Import
                        </button>
                        <button
                            onClick={() => setAddOpen(true)}
                            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-[8px] bg-[var(--accent)] hover:brightness-110 text-white font-display text-[10.5px] font-bold uppercase tracking-[0.08em] transition-[filter]"
                        >
                            <Plus className="w-3.5 h-3.5" /> Add game
                        </button>
                    </div>
                )}
            </div>

            {/* ── shelf ── */}
            {filter === "upcoming" ? (
                <UpcomingList isOwnProfile={isOwnProfile} />
            ) : isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="aspect-[3/4] rounded-[12px] bg-white/[0.04] animate-pulse" />
                    ))}
                </div>
            ) : entries.length === 0 ? (
                isOwnProfile ? (
                    // Two real ways in, not a link that goes nowhere
                    <div className="flex flex-col items-center justify-center gap-2.5 min-h-[220px] rounded-[var(--radius-card)] border border-dashed border-white/[0.12] bg-white/[0.02] text-center p-6">
                        <span className="w-11 h-11 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)]">
                            <Library className="w-5 h-5" />
                        </span>
                        <p className="font-display text-[13px] font-bold text-white">Nothing on this shelf yet</p>
                        <p className="text-[11px] text-white/35 max-w-[280px]">
                            Pull your Steam library across in one click, or add a game by hand.
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                            <button
                                onClick={connectSteam}
                                className="inline-flex items-center h-9 px-4 rounded-[8px] bg-[var(--accent)] hover:brightness-110 text-white font-display text-[10.5px] font-bold uppercase tracking-[0.08em] transition-[filter]"
                            >
                                Connect Steam
                            </button>
                            <button
                                onClick={() => setAddOpen(true)}
                                className="inline-flex items-center gap-2 h-9 px-4 rounded-[8px] bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.12] text-white font-display text-[10.5px] font-bold uppercase tracking-[0.08em] transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add game
                            </button>
                        </div>
                    </div>
                ) : (
                    <EmptyState
                        icon={<Library className="w-[18px] h-[18px]" />}
                        title="Nothing in this category"
                    />
                )
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {entries.map((e, i) => (
                        <div key={e.id} className={`tp-fade-up tp-d${Math.min(6, Math.floor(i / 3) + 1)}`}>
                            <GameCard
                                entry={e}
                                isOwnProfile={isOwnProfile}
                                onUpdate={updateEntry}
                                onRemove={removeEntry}
                                onShowcase={toggleShowcase}
                            />
                        </div>
                    ))}
                </div>
            )}

            {addOpen && <AddGameModal onClose={() => setAddOpen(false)} onAdded={() => { mutate(); globalMutate(`/users/${username}`); }} />}
        </div>
    );
}

/* ── add-game modal ───────────────────────────────────────────────────── */

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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center p-4 pt-[10vh]" onClick={onClose}>
            <div
                className="w-full max-w-lg rounded-[16px] bg-[#0d0b0a] border border-white/[0.1] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.9)] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
                    <h3 className="flex items-center gap-2.5 font-display text-[11px] font-bold uppercase tracking-[0.15em] text-white/55">
                        <span className="w-1 h-3.5 rounded-full bg-[var(--accent)]" />
                        Add a game
                    </h3>
                    <button onClick={onClose} className="p-1.5 rounded-[6px] hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
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
                                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-[8px] pl-9 pr-3 h-10 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
                            />
                        </div>
                        <span className="relative">
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as CollectionStatus)}
                                aria-label="Status for added games"
                                className="appearance-none bg-white/[0.04] border border-white/[0.1] rounded-[8px] pl-3 pr-7 h-10 font-display text-[10.5px] font-bold uppercase tracking-[0.08em] text-white focus:outline-none cursor-pointer"
                            >
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s} className="bg-[#0d0b0a] normal-case">{STATUS[s].label}</option>
                                ))}
                            </select>
                            <ChevronDown aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                        </span>
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
                                    <li key={g.id} className="flex items-center gap-3 p-2 rounded-[10px] hover:bg-white/[0.04] transition-colors">
                                        <span className="w-[52px] h-[34px] rounded-[6px] overflow-hidden bg-white/5 shrink-0">
                                            {g.background_image && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={g.background_image} alt={g.name} className="w-full h-full object-cover" />
                                            )}
                                        </span>
                                        <span className="flex-1 min-w-0">
                                            <span className="block text-[13px] font-semibold text-white truncate">{g.name}</span>
                                            {g.released && (
                                                <span className="block font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/30">
                                                    {new Date(g.released).getFullYear()}
                                                </span>
                                            )}
                                        </span>
                                        <button
                                            onClick={() => add(g.slug)}
                                            disabled={adding === g.slug}
                                            className="shrink-0 inline-flex items-center h-8 px-3 rounded-[6px] bg-[var(--accent)] hover:brightness-110 disabled:opacity-50 text-white font-display text-[10px] font-bold uppercase tracking-[0.08em] transition-[filter]"
                                        >
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
