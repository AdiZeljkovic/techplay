"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWR, { mutate as globalMutate } from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { differenceInDays, parseISO } from "date-fns";
import {
    Library, Trash2, Plus, Search, X, Loader2, Heart, CalendarClock, Pin, Upload, Clock3, Gamepad2, ChevronDown,
    Trophy, Layers, Bookmark, NotebookPen, ChevronDown as ChevronMore,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import RingMeter from "@/components/ui/RingMeter";
import { useCountUp } from "@/hooks/useCountUp";
import { RecentlyAdded, CollectionGoals, PlatformBreakdown } from "./CollectionSidebar";
import type { CollectionEntry, CollectionStatus, UserProfile } from "@/lib/types/profile";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

/** One page of the shelf; Load more widens the request rather than paging. */
const PAGE_SIZE = 24;

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
    /**
     * Send a game to the diary with the composer already open.
     *
     * Logging used to mean leaving the shelf, opening the journal and
     * searching backwards for the game you had just put down — a form to fill
     * in rather than a diary to keep. The Library wires this to its own view
     * switch, so the pen on a cover is one click from a written session.
     */
    onLogSession?: (game: { slug: string; name: string; cover_url: string | null }) => void;
}

interface UpcomingGame {
    slug: string;
    name: string;
    released: string;
    cover_url: string | null;
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
                            {game.cover_url && (
                                <Image unoptimized src={game.cover_url} alt={game.name} fill sizes="86px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
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
    onLog,
}: {
    entry: CollectionEntry;
    isOwnProfile: boolean;
    onUpdate: (slug: string, payload: Record<string, unknown>) => void;
    onRemove: (slug: string) => void;
    onShowcase: (slug: string) => void;
    /** Hand this game to the diary, composer already open. */
    onLog?: (game: { slug: string; name: string; cover_url: string | null }) => void;
}) {
    const meta = STATUS[entry.status] ?? STATUS.backlog;
    const pinned = entry.showcase_order != null;
    const hours = entry.hours_played ?? 0;
    const progress = entry.progress ?? 0;

    return (
        <div
            className="group relative rounded-[12px] overflow-hidden border border-white/[0.07] bg-[var(--surface-1)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.55)] transition-all duration-300"
            style={{ ["--tint" as string]: meta.color }}
        >
            {/* the status paints the card's top edge */}
            <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] z-10" style={{ background: meta.color }} />

            <Link href={entry.game ? `/games/${entry.game.slug}` : "#"} className="block relative aspect-[3/4] overflow-hidden">
                {entry.game?.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={entry.game.cover_url}
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
                <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[var(--ease-hud)] bg-[var(--surface-1)]/97 backdrop-blur-sm border-t border-white/[0.09] p-2 flex items-center gap-1.5">
                    <span className="relative flex-1 min-w-0">
                        <select
                            value={entry.status}
                            onChange={(ev) => onUpdate(entry.game!.slug, { status: ev.target.value })}
                            aria-label="Change status"
                            className="w-full appearance-none bg-white/[0.06] text-white font-display text-[9.5px] font-bold uppercase tracking-[0.08em] rounded-[6px] pl-2 pr-5 py-1.5 border border-white/[0.1] focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] cursor-pointer"
                        >
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s} className="bg-[var(--surface-1)] normal-case">{STATUS[s].label}</option>
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
                    {onLog && (
                        <button
                            onClick={() => onLog({ slug: entry.game!.slug, name: entry.game!.name, cover_url: entry.game!.cover_url ?? null })}
                            title="Log a session"
                            className="shrink-0 p-1.5 rounded-[6px] hover:bg-white/10 text-white/35 hover:text-[var(--accent)] transition-colors"
                        >
                            <NotebookPen className="w-3.5 h-3.5" />
                        </button>
                    )}
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


/* ── the ledger across the top ────────────────────────────────────────── */

function StatCell({
    icon,
    label,
    value,
    sub,
    tint,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    sub?: React.ReactNode;
    tint: string;
}) {
    const shown = useCountUp(value, 900);

    return (
        <span className="flex items-center gap-3 min-w-0">
            <span
                className="shrink-0 w-9 h-9 rounded-[9px] flex items-center justify-center"
                style={{ background: `${tint}1f`, color: tint }}
            >
                {icon}
            </span>
            <span className="min-w-0">
                <span className="block font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/40 whitespace-nowrap">
                    {label}
                </span>
                <span className="mt-1 flex items-baseline gap-1.5">
                    <span className="font-display text-[20px] font-black tabular-nums leading-none text-white">{shown}</span>
                    {sub}
                </span>
            </span>
        </span>
    );
}

/** The shelf's headline figures, plus how much of it you've actually finished. */
function CollectionLedger({ stats }: { stats?: UserProfile["stats"] }) {
    const total = stats?.games_count ?? 0;
    const completed = stats?.completed_count ?? 0;
    const backlog = stats?.backlog_count ?? 0;
    const wishlist = stats?.wishlist_count ?? 0;
    const added = stats?.games_added_this_month ?? 0;

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const ring = useCountUp(rate, 1100);

    const share = (n: number) => (total > 0 ? `${Math.round((n / total) * 100)}%` : null);
    const pct = (v: string | null) =>
        v ? <span className="font-display text-[11px] font-bold tabular-nums text-white/30">{v}</span> : null;

    return (
        <div
            className="rounded-[var(--radius-panel)] border px-5 py-4 mb-4 overflow-x-auto scrollbar-none"
            style={{
                background: "var(--surface-2)",
                borderColor: "var(--line-strong)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
        >
            <div className="flex items-center gap-6 md:gap-0 md:justify-between min-w-max md:min-w-0">
                <StatCell
                    icon={<Library className="w-4 h-4" />}
                    label="Total games"
                    value={total}
                    tint="var(--accent)"
                    sub={added > 0 ? <span className="font-display text-[11px] font-bold tabular-nums text-emerald-400">+{added} this month</span> : null}
                />
                <span aria-hidden className="hidden md:block w-px h-9 bg-white/[0.08]" />
                <StatCell icon={<Trophy className="w-4 h-4" />} label="Completed" value={completed} tint={STATUS.completed.color} sub={pct(share(completed))} />
                <span aria-hidden className="hidden md:block w-px h-9 bg-white/[0.08]" />
                <StatCell icon={<Layers className="w-4 h-4" />} label="Backlog" value={backlog} tint={STATUS.backlog.color} sub={pct(share(backlog))} />
                <span aria-hidden className="hidden md:block w-px h-9 bg-white/[0.08]" />
                <StatCell icon={<Bookmark className="w-4 h-4" />} label="Wishlist" value={wishlist} tint={STATUS.wishlist.color} sub={pct(share(wishlist))} />
                <span aria-hidden className="hidden md:block w-px h-9 bg-white/[0.08]" />

                {/* the one figure that is a verdict, not a count */}
                <span className="flex items-center gap-3.5 shrink-0">
                    <RingMeter value={ring} size={54} strokeWidth={5}>
                        <span className="font-display text-[12px] font-black tabular-nums text-[var(--accent)]">{ring}%</span>
                    </RingMeter>
                    <span>
                        <span className="block font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/40 whitespace-nowrap">
                            Completion rate
                        </span>
                        <span className="block mt-1 text-[12px] font-semibold text-white">
                            {total === 0 ? "Add your first game" : rate >= 50 ? "Great progress" : rate >= 20 ? "Chipping away" : "Plenty left to play"}
                        </span>
                    </span>
                </span>
            </div>
        </div>
    );
}

/* ── the featured slot ────────────────────────────────────────────────── */

/**
 * The pinned game, given the room it deserves. Pinning already existed and
 * did nothing visible; this is its reward. With nothing pinned it falls back
 * to what you're playing, so the slot is never empty on an active shelf.
 */
function FeaturedCard({ entry }: { entry: CollectionEntry }) {
    const meta = STATUS[entry.status] ?? STATUS.backlog;
    const pinned = entry.showcase_order != null;
    const genres = (entry.game?.genres ?? []).slice(0, 2).join(" · ");
    const progress = entry.progress ?? 0;

    return (
        <Link
            href={entry.game ? `/games/${entry.game.slug}` : "#"}
            className="group relative flex flex-col justify-end h-full min-h-[320px] rounded-[12px] overflow-hidden border border-white/[0.07] bg-[var(--surface-1)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300"
        >
            {entry.game?.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={entry.game.cover_url}
                    alt={entry.game.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-[var(--ease-hud)]"
                />
            ) : (
                <span className="absolute inset-0 flex items-center justify-center text-white/10 bg-white/[0.03]">
                    <Gamepad2 className="w-12 h-12" />
                </span>
            )}
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

            <span
                className="absolute top-3 left-3 inline-flex items-center gap-1.5 h-[22px] pl-2 pr-2.5 rounded-[5px] backdrop-blur-md font-display text-[8.5px] font-black uppercase tracking-[0.14em] text-white"
                style={{ backgroundColor: pinned ? "var(--accent)" : `${meta.color}33`, boxShadow: pinned ? undefined : `inset 0 0 0 1px ${meta.color}66` }}
            >
                {pinned ? <><Pin className="w-3 h-3 fill-current" /> Featured</> : <><span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />{meta.label}</>}
            </span>

            {entry.is_favorite && (
                <span className="absolute top-3 right-3 w-[26px] h-[26px] rounded-full bg-black/55 backdrop-blur-md flex items-center justify-center">
                    <Heart className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </span>
            )}

            <span className="relative p-4">
                <span className="flex items-center gap-2.5 min-w-0">
                    <span className="font-display text-[20px] font-black text-white leading-none truncate">{entry.game?.name}</span>
                    {entry.platform && (
                        <span className="shrink-0 inline-flex items-center h-[20px] px-2 rounded-[5px] bg-white/[0.12] font-display text-[9px] font-black uppercase tracking-[0.1em] text-white/80">
                            {entry.platform}
                        </span>
                    )}
                </span>

                {genres && <span className="block mt-1.5 text-[12px] text-white/50 truncate">{genres}</span>}

                {(progress > 0 || (entry.hours_played ?? 0) > 0) && (
                    <>
                        <span className="mt-3 flex items-baseline gap-2.5">
                            {progress > 0 && (
                                <span className="font-display text-[17px] font-black tabular-nums" style={{ color: meta.color }}>{progress}%</span>
                            )}
                            {(entry.hours_played ?? 0) > 0 && (
                                <span className="font-display text-[11px] font-bold tabular-nums text-white/45">{entry.hours_played}h played</span>
                            )}
                        </span>
                        {progress > 0 && (
                            <span className="mt-2 block h-[4px] rounded-full bg-white/15 overflow-hidden">
                                <span className="block h-full rounded-full" style={{ width: `${progress}%`, background: meta.color }} />
                            </span>
                        )}
                    </>
                )}
            </span>
        </Link>
    );
}

/* ── the shelf ────────────────────────────────────────────────────────── */

export default function CollectionGrid({ username, isOwnProfile, onLogSession }: Props) {
    const [filter, setFilter] = useState("all");
    const [pages, setPages] = useState(1);
    const [addOpen, setAddOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const query = filter === "all" || filter === "upcoming" ? "" : filter === "favorites" ? "?favorite=1" : `&status=${filter}`;
    // "Load more" used to widen page_size, which the API clamps at 60 — so a
    // library past sixty games simply stopped, with the button still showing.
    // Real pages, accumulated as they arrive.
    const key = filter === "upcoming"
        ? null
        : `/users/${username}/collection?page=${pages}&page_size=${PAGE_SIZE}${filter === "favorites" ? "&favorite=1" : query.replace("?favorite=1", "")}`;
    const { data, isLoading, mutate } = useSWR<{ data: CollectionEntry[]; pagination?: { total: number } }>(
        key, fetcher, { keepPreviousData: true }
    );

    const [accumulated, setAccumulated] = useState<CollectionEntry[]>([]);
    useEffect(() => {
        if (!data?.data) return;
        setAccumulated((prev) => (pages === 1 ? data.data : [...prev, ...data.data.filter(
            (row) => !prev.some((seen) => seen.game?.slug === row.game?.slug)
        )]));
    }, [data, pages]);

    // Same SWR key the profile page already loaded — the counts come free.
    const { data: profile } = useSWR<UserProfile>(`/users/${username}`, fetcher);
    const stats = profile?.stats;

    const entries = pages === 1 ? (data?.data ?? []) : accumulated;
    const total = data?.pagination?.total ?? entries.length;
    const hasMore = entries.length < total;

    const pick = (next: string) => {
        setFilter(next);
        setPages(1);
    };

    // The pinned game leads the shelf; with nothing pinned, whatever you're
    // playing does. It's lifted out of the grid so it can't appear twice.
    const featured = filter === "all"
        ? entries.find((e) => e.showcase_order != null) ?? entries.find((e) => e.status === "playing")
        : undefined;
    const rest = featured ? entries.filter((e) => e.id !== featured.id) : entries;

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
            <CollectionLedger stats={stats} />

            {/* shelf on the left, the reading of it on the right */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            <div className="xl:col-span-9 min-w-0">
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
                                onClick={() => pick(f.id)}
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
                <>
                    {/* the pinned game takes a two-by-two slot beside the grid */}
                    <div className={featured ? "grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch" : ""}>
                        {featured && (
                            <div className="lg:col-span-4 xl:col-span-3 min-w-0">
                                <FeaturedCard entry={featured} />
                            </div>
                        )}
                        <div className={featured ? "lg:col-span-8 xl:col-span-9 min-w-0" : ""}>
                            <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 ${featured ? "lg:grid-cols-4 xl:grid-cols-5" : "lg:grid-cols-5 xl:grid-cols-6"}`}>
                                {rest.map((e, i) => (
                                    <div key={e.id} className={`tp-fade-up tp-d${Math.min(6, Math.floor(i / 3) + 1)}`}>
                                        <GameCard
                                            entry={e}
                                            isOwnProfile={isOwnProfile}
                                            onUpdate={updateEntry}
                                            onRemove={removeEntry}
                                            onShowcase={toggleShowcase}
                                            onLog={isOwnProfile ? onLogSession : undefined}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {hasMore && (
                        <div className="mt-5 flex justify-center">
                            <button
                                onClick={() => setPages((p) => p + 1)}
                                className="inline-flex items-center gap-2 h-10 px-5 rounded-[8px] bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.12] text-white font-display text-[10.5px] font-bold uppercase tracking-[0.1em] transition-colors"
                            >
                                Load more games
                                <ChevronMore className="w-4 h-4" />
                                <span className="font-black tabular-nums text-white/35">{entries.length}/{total}</span>
                            </button>
                        </div>
                    )}
                </>
            )}

            </div>

                <aside className="xl:col-span-3 min-w-0 space-y-5">
                    <RecentlyAdded username={username} />
                    <CollectionGoals username={username} isOwnProfile={isOwnProfile} />
                    <PlatformBreakdown data={profile?.platforms_genres} />
                </aside>
            </div>

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
                className="w-full max-w-lg rounded-[16px] bg-[var(--surface-1)] border border-white/[0.1] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.9)] overflow-hidden"
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
                                    <option key={s} value={s} className="bg-[var(--surface-1)] normal-case">{STATUS[s].label}</option>
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
                                            {g.cover_url && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={g.cover_url} alt={g.name} className="w-full h-full object-cover" />
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
