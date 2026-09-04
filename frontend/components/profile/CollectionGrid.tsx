"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import useSWR, { mutate as globalMutate } from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { differenceInDays, parseISO } from "date-fns";
import {
    Library, Trash2, Plus, Wallet, Search, X, Loader2, Heart, CalendarClock, Pin, Upload, Clock3, Gamepad2, NotebookPen, ChevronDown as ChevronMore,
} from "lucide-react";
import Segmented from "@/components/ui/Segmented";
import { ShelfMark, FinishMark, PileMark, WishMark } from "./ShelfMarks";
import PlatformMark from "@/components/games/PlatformMark";
import EmptyState from "@/components/ui/EmptyState";
import RingMeter from "@/components/ui/RingMeter";
import Select from "@/components/ui/Select";
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
    // Played, set down, never claimed finished — the bucket a library
    // import can honestly fill. Amber sits between the green of an active
    // game and the blue of one not started.
    played: { label: "Played", color: "#fbbf24" },
    // Playing it again, having finished it before. Teal rather than the
    // green of "playing": the same family, because it is playing, but its own
    // colour, because the distinction is the entire point of the status.
    replaying: { label: "Replaying", color: "#2dd4bf" },
    backlog: { label: "Backlog", color: "#60a5fa" },
    completed: { label: "Completed", color: "#22c55e" },
    wishlist: { label: "Wishlist", color: "#f472b6" },
    dropped: { label: "Dropped", color: "#9ca3af" },
};

const STATUS_OPTIONS: CollectionStatus[] = ["playing", "replaying", "played", "backlog", "completed", "wishlist", "dropped"];

/**
 * "2nd", "8th" — the lap somebody is on, or has finished.
 *
 * A count on its own reads as a quantity of games. An ordinal reads as a
 * story, which is what a fourth run at Dark Souls is.
 */
function ordinal(n: number): string {
    const tens = n % 100;

    if (tens >= 11 && tens <= 13) return `${n}th`;

    return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

/** What to say beside a replay, or nothing when there is nothing to say. */
function lapLabel(entry: { status: string; playthroughs?: number }): string | null {
    const finished = entry.playthroughs ?? 0;

    if (entry.status === "replaying") {
        // Mid-run, so the lap is the one after the last finish. Somebody who
        // replays a game they never finished here is simply on their first.
        return `${ordinal(finished + 1)} playthrough`;
    }

    // Only worth saying once it is more than one. "Finished 1×" is noise.
    return finished > 1 ? `Finished ${finished}×` : null;
}

/** How the shelf can be ordered. The API keeps the same names. */
const SORTS = [
    { id: "recent", label: "Last touched" },
    { id: "added", label: "Recently added" },
    { id: "name", label: "Title A–Z" },
    { id: "hours", label: "Most played" },
    { id: "rating", label: "Highest rated" },
    { id: "released", label: "Newest release" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

/** Past this many games, typing beats scrolling — so the search field appears. */
const SEARCHABLE_FROM = 8;

/** The shelf's one grid. The featured tile spans two of these cells each way. */
const SHELF_GRID = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3";

/**
 * Launchers a reader has to name themselves.
 *
 * Steam, Xbox, PlayStation, GOG and Epic import their own libraries and stamp
 * their own provenance. These cannot: Ubisoft publishes no third-party API at
 * all; Battle.net's scopes are per-game profiles with no notion of a library —
 * the OAuth we already have there syncs WoW characters, because that is all
 * Blizzard exposes; EA has nothing public either.
 *
 * So the honest answer is a field. Free text underneath — somebody's shelf may
 * hold a Switch cartridge or a GameCube disc, and no list we write will
 * anticipate that.
 */
const UNIMPORTABLE_LAUNCHERS = ["Ubisoft Connect", "Battle.net", "EA app", "Nintendo", "PC", "Itch.io"];

/** Holds a value still until it stops changing — one request per word, not per key. */
function useDebounced<T>(value: T, ms: number): T {
    const [held, setHeld] = useState(value);

    useEffect(() => {
        const t = setTimeout(() => setHeld(value), ms);

        return () => clearTimeout(t);
    }, [value, ms]);

    return held;
}

/** Filters, plus which stat on the profile payload counts them. */
const FILTERS: { id: string; label: string; countKey?: keyof NonNullable<UserProfile["stats"]> }[] = [
    { id: "all", label: "All", countKey: "games_count" },
    { id: "playing", label: "Playing", countKey: "playing_count" },
    { id: "played", label: "Played", countKey: "played_count" },
    { id: "backlog", label: "Backlog", countKey: "backlog_count" },
    { id: "completed", label: "Completed", countKey: "completed_count" },
    { id: "wishlist", label: "Wishlist", countKey: "wishlist_count" },
    { id: "favorites", label: "Favorites", countKey: "favorites_count" },
    // The API has sent `dropped_count` all along — ProfileService builds it
    // beside the other seven — and this row simply never asked for it, so
    // Dropped was the one status chip with no figure on it.
    { id: "dropped", label: "Dropped", countKey: "dropped_count" },
    // Upcoming has none and should not: it is not a status but a reading of the
    // wishlist against the release calendar, and the number that would mean
    // something there is "how many are dated", which the shelf stats do not
    // hold.
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
    /**
     * Where to draw Import and Add game.
     *
     * The Library keeps a slot on its own header row, because nine status chips
     * and two buttons never fitted one line. The buttons are the shelf's, so
     * they are built here and portalled up rather than lifted — the CSV reader,
     * the add dialog and the mutate() that refreshes the grid all live in this
     * component, and moving two buttons is no reason to move those with them.
     *
     * Null for one render, until that node exists.
     */
    actionsHost?: HTMLElement | null;
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
                                <span className="font-display text-[10px] font-bold uppercase tracking-[0.12em] tabular-nums text-white/50">
                                    {parseISO(game.released).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </span>
                            </span>
                        </span>
                    </Link>
                );
            })}

            <Link
                href="/calendar"
                className="block pt-2 text-center font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/50 hover:text-[var(--accent)] transition-colors"
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
    const lap = lapLabel(entry);
    const marks = sourceMarks(entry);
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

                {/* Which lap this is, under the status it qualifies. Only drawn
                    when there is something to say: a first playthrough is just
                    playing, and saying so on every card would be noise. */}
                {lap && (
                    <span
                        className="absolute top-[26px] left-2.5 inline-flex items-center h-[17px] px-1.5 rounded-[4px] backdrop-blur-md font-display text-[8px] font-black uppercase tracking-[0.12em]"
                        style={{ backgroundColor: `${meta.color}1f`, color: meta.color }}
                    >
                        {lap}
                    </span>
                )}

                {/* Top-right: where it came from, then the two marks you can
                    set. Provenance leads because it is on every card and the
                    other two are occasional — and it sits up here rather than
                    on the playtime line, where at 11px over cover art it was
                    too small to read as anything. */}
                <span className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5">
                    {/* Every store that reported it, not just the one that got
                        here first. A game really can be on two, and reading
                        `platform` put an Xbox mark over Steam's hours on 37
                        rows — Morrowind at 243 of them. */}
                    {marks.map((mark) => (
                        <span key={mark} className="w-[26px] h-[26px] rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center">
                            <PlatformMark platform={mark} size={15} className="text-white/90" />
                        </span>
                    ))}
                    {entry.is_favorite && (
                        <span className="w-[26px] h-[26px] rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center" title="Favorite">
                            <Heart className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        </span>
                    )}
                    {pinned && (
                        <span className="w-[26px] h-[26px] rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center" title="Pinned to showcase">
                            <Pin className="w-3.5 h-3.5 text-[var(--accent)] fill-[var(--accent)]" />
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

            {/*
             * The owner's controls, as a shelf under the art rather than a
             * drawer over it.
             *
             * This was `translate-y-full group-hover:translate-y-0`, so it slid
             * up across the bottom of the cover and covered the title and the
             * hours while it was open — the two things the card exists to show.
             * Worse, a drawer that opens on hover does not open at all on a
             * phone: every one of these controls was unreachable on touch, and
             * the collection is a page people scroll on a phone.
             *
             * Standing still it can also afford to be legible. The icons were
             * white/35 on a translucent panel over artwork, which is where the
             * whole strip read as an afterthought; they sit on a solid surface
             * now, brighter, in squares big enough to hit with a thumb, and
             * each one keeps its own colour when it is on — amber for a
             * favourite, accent for pinned, red only on the way to deleting.
             */}
            {isOwnProfile && entry.game && (
                <div className="p-1.5 bg-[var(--surface-2)] border-t border-white/[0.07] space-y-1.5">
                    {/*
                     * The status gets the whole width, and it needs it.
                     *
                     * Sharing a line with four buttons, at six cards to a row,
                     * left the trigger narrow enough that `truncate` took the
                     * label down to nothing — so the control read as an empty
                     * pill with a chevron stranded beside it. The chevron was
                     * never outside the button; the word in front of it had
                     * been squeezed out of existence.
                     *
                     * The dot carries the status colour that the badge on the
                     * art already uses, so the two agree, and the chevron is
                     * the accent — the one moving part, and the only thing here
                     * that opens something.
                     */}
                    <Select
                        value={entry.status}
                        onChange={(v) => onUpdate(entry.game!.slug, { status: v })}
                        ariaLabel="Change status"
                        options={STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS[s].label }))}
                        icon={<span aria-hidden className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: meta.color }} />}
                        className="w-full px-2.5 py-[7px] rounded-[7px] bg-white/[0.05] hover:bg-white/[0.09] border-white/[0.08] hover:border-white/15 font-display text-[10px] font-bold uppercase tracking-[0.09em] text-white/85 [&>svg]:text-[var(--accent)] [&>svg]:w-3.5 [&>svg]:h-3.5"
                        menuClassName="w-[150px]"
                    />

                    {/* Four switches, sharing the width evenly — a row of equal
                        squares reads as a set, and each is wide enough to hit
                        with a thumb. */}
                    <div className="flex items-center gap-1">
                    <button
                        onClick={() => onUpdate(entry.game!.slug, { status: entry.status, is_favorite: !entry.is_favorite })}
                        title={entry.is_favorite ? "Remove from favorites" : "Mark as favorite"}
                        aria-pressed={!!entry.is_favorite}
                        className={`flex-1 h-[30px] grid place-items-center rounded-[7px] transition-colors ${
                            entry.is_favorite
                                ? "bg-amber-400/15 text-amber-400"
                                : "text-white/50 hover:bg-white/[0.09] hover:text-amber-400"
                        }`}
                    >
                        <Heart className={`w-4 h-4 ${entry.is_favorite ? "fill-amber-400" : ""}`} />
                    </button>
                    {onLog && (
                        <button
                            onClick={() => onLog({ slug: entry.game!.slug, name: entry.game!.name, cover_url: entry.game!.cover_url ?? null })}
                            title="Log a session"
                            className="flex-1 h-[30px] grid place-items-center rounded-[7px] text-white/50 hover:bg-white/[0.09] hover:text-[var(--accent)] transition-colors"
                        >
                            <NotebookPen className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => onShowcase(entry.game!.slug)}
                        title={pinned ? "Unpin from showcase" : "Pin to showcase"}
                        aria-pressed={pinned}
                        className={`flex-1 h-[30px] grid place-items-center rounded-[7px] transition-colors ${
                            pinned
                                ? "bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--accent)]"
                                : "text-white/50 hover:bg-white/[0.09] hover:text-[var(--accent)]"
                        }`}
                    >
                        <Pin className={`w-4 h-4 ${pinned ? "fill-[var(--accent)]" : ""}`} />
                    </button>
                    <button
                        onClick={() => onRemove(entry.game!.slug)}
                        title="Remove from collection"
                        className="flex-1 h-[30px] grid place-items-center rounded-[7px] text-white/50 hover:bg-red-500/15 hover:text-red-400 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    </div>
                </div>
            )}
        </div>
    );
}


/* ── the ledger across the top ────────────────────────────────────────── */

function StatCell({
    icon: Icon,
    label,
    value,
    sub,
    tint,
}: {
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    label: string;
    value: number;
    sub?: React.ReactNode;
    tint: string;
}) {
    const shown = useCountUp(value, 900);

    return (
        <div className="group/bay flex items-center gap-3.5 min-w-0 px-5 py-4" style={{ background: "var(--surface-2)" }}>
            {/* The mark IS the icon — the same way the Community and Tools
                menus draw theirs. It used to be a 16px glyph inside a tinted
                rounded box, and the box was the loudest thing in the cell:
                five different readings ended up looking like five of the same
                thing in five colours, with the actual mark too small inside to
                tell a trophy from a bookmark. Line art at a light stroke, in
                the reading's own colour, at a size you aim at rather than
                decorate with. */}
            <span className="shrink-0 w-10 h-10 flex items-center justify-center" style={{ color: tint }}>
                <Icon className="w-[27px] h-[27px] transition-transform duration-300 group-hover/bay:scale-110" strokeWidth={1.6} />
            </span>
            <span className="min-w-0">
                <span className="block font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/55 whitespace-nowrap">
                    {label}
                </span>
                <span className="mt-1 flex items-baseline gap-1.5">
                    <span className="font-display text-[20px] font-black tabular-nums leading-none text-white">{shown}</span>
                    {sub}
                </span>
            </span>
        </div>
    );
}

/** The shelf's headline figures, plus how much of it has actually been finished. */
/**
 * What the shelf cost, at the prices the stores ask today.
 *
 * Its own line rather than a seventh cell in the ledger above: the other six
 * are counts of what somebody has done, and this is a number with a caveat
 * attached — a caveat that will not fit in a stat cell and must not be dropped.
 *
 * Full price, not this week's. A library that lost sixty dollars because four
 * of its games went on sale, and got them back on Monday, would be a number
 * nobody could trust. What is cheap today is said beside it instead.
 *
 * And it says what it does not know. Free-to-play games count as nothing and
 * that is correct; games the store has withdrawn are not worth nothing, they
 * are unknown, and there are fifty-two of those across the shelves today. The
 * count is on the line, not in a tooltip.
 */
function ShelfWorth({ worth, isOwnProfile }: { worth?: UserProfile["stats"] extends infer S ? S extends { shelf_worth?: infer W } ? W : never : never; isOwnProfile: boolean }) {
    if (!worth || worth.priced === 0) return null;

    const money = (cents: number) =>
        (cents / 100).toLocaleString("en-US", { style: "currency", currency: worth.currency || "USD", maximumFractionDigits: 0 });

    const saving = worth.full_cents - worth.on_sale_cents;

    return (
        <div
            className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--radius-panel)] border px-5 py-3.5"
            style={{ borderColor: "var(--line-strong)", background: "var(--surface-1)" }}
        >
            <Wallet className="w-[18px] h-[18px] shrink-0 text-amber-400" strokeWidth={1.7} />

            <span className="font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/55">
                {isOwnProfile ? "Your library is worth" : "This library is worth"}
            </span>

            <span className="font-display text-[22px] font-black tabular-nums leading-none text-amber-400">
                {money(worth.full_cents)}
            </span>

            <span className="text-[12px] text-white/45">
                at full price
                {saving > 0 && (
                    <>
                        {" · "}
                        <span className="text-white/70">{money(worth.on_sale_cents)}</span> at today&apos;s prices
                    </>
                )}
                {worth.unpriced > 0 && (
                    <>
                        {" · "}
                        {worth.unpriced} {worth.unpriced === 1 ? "game has" : "games have"} no price
                    </>
                )}
            </span>
        </div>
    );
}

function CollectionLedger({ stats, isOwnProfile }: { stats?: UserProfile["stats"]; isOwnProfile: boolean }) {
    const total = stats?.games_count ?? 0;
    const completed = stats?.completed_count ?? 0;
    // Played games left the backlog when `played` arrived, and the ledger did
    // not follow them — a hundred of them simply stopped being counted
    // anywhere on this strip while Backlog appeared to have shrunk for free.
    const played = stats?.played_count ?? 0;
    const backlog = stats?.backlog_count ?? 0;
    const wishlist = stats?.wishlist_count ?? 0;
    const added = stats?.games_added_this_month ?? 0;

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const ring = useCountUp(rate, 1100);

    const share = (n: number) => (total > 0 ? `${Math.round((n / total) * 100)}%` : null);
    const pct = (v: string | null) =>
        v ? <span className="font-display text-[11px] font-bold tabular-nums text-white/50">{v}</span> : null;

    return (
        <div
            className="rounded-[var(--radius-panel)] border overflow-hidden"
            style={{
                borderColor: "var(--line-strong)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
        >
            {/* Five equal bays, hairlines between them.
                It used to be one flex row with justify-between, which on a
                wide monitor pushed the five readings to the far corners of
                nineteen hundred pixels with a dividing rule stranded in the
                middle of each gap. The gap-px trick draws the rules: the grid
                shows through between cells that each paint their own face, so
                the seams stay correct however the cells wrap. */}
            <div
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px"
                style={{ background: "var(--line)" }}
            >
                <StatCell
                    icon={ShelfMark}
                    label="Total games"
                    value={total}
                    tint="var(--accent-ink)"
                    sub={added > 0 ? <span className="font-display text-[11px] font-bold tabular-nums text-emerald-400">+{added} this month</span> : null}
                />
                <StatCell icon={FinishMark} label="Completed" value={completed} tint={STATUS.completed.color} sub={pct(share(completed))} />
                {/* Between finished and not started, which is where they are. */}
                <StatCell icon={ShelfMark} label="Played" value={played} tint={STATUS.played.color} sub={pct(share(played))} />
                <StatCell icon={PileMark} label="Backlog" value={backlog} tint={STATUS.backlog.color} sub={pct(share(backlog))} />
                <StatCell icon={WishMark} label="Wishlist" value={wishlist} tint={STATUS.wishlist.color} sub={pct(share(wishlist))} />

                {/* the one figure that is a verdict, not a count */}
                <div className="flex items-center gap-3.5 px-5 py-4 col-span-2 md:col-span-3 lg:col-span-1" style={{ background: "var(--surface-2)" }}>
                    <RingMeter value={ring} size={54} strokeWidth={5}>
                        <span className="font-display text-[12px] font-black tabular-nums text-[var(--accent)]">{ring}%</span>
                    </RingMeter>
                    <span className="min-w-0">
                        <span className="block font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/55 whitespace-nowrap">
                            Completion rate
                        </span>
                        <span className="block mt-1 text-[12px] font-semibold text-white">
                            {/* An empty shelf prompts its owner and reports to
                                everybody else — "Add your first game" told a
                                visitor to do something to a shelf that is not
                                theirs. */}
                            {total === 0
                                ? (isOwnProfile ? "Add your first game" : "Nothing on the shelf yet")
                                : rate >= 50 ? "Great progress" : rate >= 20 ? "Chipping away" : "Plenty left to play"}
                        </span>
                    </span>
                </div>
            </div>
        </div>
    );
}

/* ── the featured slot ────────────────────────────────────────────────── */

/**
 * The pinned game, given the room it deserves. Pinning already existed and
 * did nothing visible; this is its reward. With nothing pinned it falls back
 * to what you're playing, so the slot is never empty on an active shelf.
 *
 * It is a cell of the shelf's own grid — two columns by two rows — rather
 * than a card in a column beside it. Kept apart, it stood a fixed 320px tall
 * next to rows the covers had sized, so its floor landed a hundred and thirty
 * pixels below theirs and the shelf came out as two things that missed each
 * other. Two cells of a 3:4 grid make one 3:4 card, so at double size it is
 * the same object, and every edge on the shelf lines up.
 */
/**
 * The stores that reported a game, for the marks on its card.
 *
 * `platform` is the reader's own free-text label and was also being stamped by
 * whichever importer arrived first — so a row the Xbox import created and the
 * Steam import later filled with hours kept an Xbox mark over Steam's numbers,
 * 37 of them on the live shelf. Provenance now travels as its own set;
 * `platform` is the fallback for a row imported before that existed, or one
 * whose owner typed their own answer.
 */
function sourceMarks(entry: CollectionEntry): string[] {
    const sources = entry.sources ?? [];

    if (sources.length > 0) return sources;

    return entry.platform ? [entry.platform] : [];
}

function FeaturedCard({ entry }: { entry: CollectionEntry }) {
    const meta = STATUS[entry.status] ?? STATUS.backlog;
    const marks = sourceMarks(entry);
    const pinned = entry.showcase_order != null;
    const genres = (entry.game?.genres ?? []).slice(0, 2).join(" · ");
    const progress = entry.progress ?? 0;

    return (
        <Link
            href={entry.game ? `/games/${entry.game.slug}` : "#"}
            className="group relative flex flex-col justify-end h-full min-h-[260px] rounded-[12px] overflow-hidden border border-white/[0.07] bg-[var(--surface-1)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300"
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
                    {marks.map((mark) => (
                        <span key={mark} className="shrink-0 inline-flex items-center gap-1.5 h-[20px] px-2 rounded-[5px] bg-white/[0.12] font-display text-[9px] font-black uppercase tracking-[0.1em] text-white/80">
                            {/* The mark first, the word after it. This view has
                                the room the cover does not, so it says both. */}
                            <PlatformMark platform={mark} size={10} />
                            {mark}
                        </span>
                    ))}
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

export default function CollectionGrid({ username, isOwnProfile, onLogSession, actionsHost = null }: Props) {
    const [filter, setFilter] = useState("all");
    const [pages, setPages] = useState(1);
    const [addOpen, setAddOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    const [sort, setSort] = useState<SortId>("recent");
    const [term, setTerm] = useState("");
    const search = useDebounced(term, 300);
    const fileRef = useRef<HTMLInputElement>(null);

    const query = filter === "all" || filter === "upcoming" ? "" : filter === "favorites" ? "?favorite=1" : `&status=${filter}`;
    // "Load more" used to widen page_size, which the API clamps at 60 — so a
    // library past sixty games simply stopped, with the button still showing.
    // Real pages, accumulated as they arrive.
    const key = filter === "upcoming"
        ? null
        : `/users/${username}/collection?page=${pages}&page_size=${PAGE_SIZE}&sort=${sort}`
            + (search ? `&search=${encodeURIComponent(search)}` : "")
            + (filter === "favorites" ? "&favorite=1" : query.replace("?favorite=1", ""));
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

    // Any change to what is being asked for starts the accumulation over —
    // otherwise page 2 of a search lands on top of page 1 of the old order.
    useEffect(() => { setPages(1); }, [sort, search]);

    // The pinned game leads the shelf; with nothing pinned, whatever you're
    // playing does. It's lifted out of the grid so it can't appear twice.
    //
    // Only on the unsorted, unsearched, unfiltered shelf: a hero tile in the
    // middle of search results is a game that ignored what was asked for. And
    // only with enough games behind it to wrap around a double-width cell —
    // below that the shelf is a hero tile and three stragglers with a hole
    // under them.
    const candidate = filter === "all" && sort === "recent" && !search
        ? entries.find((e) => e.showcase_order != null) ?? entries.find((e) => e.status === "playing")
        : undefined;
    const featured = candidate && entries.length >= 7 ? candidate : undefined;
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
        <div className="space-y-5">
            <CollectionLedger stats={stats} isOwnProfile={isOwnProfile} />
            <ShelfWorth worth={stats?.shelf_worth} isOwnProfile={isOwnProfile} />

            {/* shelf on the left, the reading of it on the right */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            <div className="xl:col-span-9 min-w-0">
            {/* ── toolbar ──

                The filters wrap; the buttons do not.

                Nine status chips and two buttons never fitted a line, and the
                track scrolls with `scrollbar-none` — so the last chips were
                simply gone and nothing on screen said so. On a 340-game shelf
                that was Dropped and Upcoming: filters that existed, held games,
                and could not be reached or even seen.

                Import and Add game moved up beside the Shelf/Diary switch,
                which had most of its row empty, and the filters have the width
                to themselves. At a desktop column all nine fit one line; below
                that they wrap, which is the honest failure mode rather than a
                hidden one. */}
            <div className="mb-5 space-y-3">
            <Segmented
                ariaLabel="Filter the shelf"
                value={filter}
                onChange={pick}
                wrap
                className="w-full"
                items={FILTERS.map((f) => ({
                    id: f.id,
                    label: f.label,
                    dot: STATUS[f.id]?.color,
                    count: f.countKey && typeof stats?.[f.countKey] === "number" ? (stats[f.countKey] as number) : undefined,
                }))}
            />

            {/*
                Drawn into the Library's own header row.

                A portal rather than lifting the state: the CSV reader, the
                add-game dialog and the mutate() that refreshes the shelf all
                belong to this component, and moving two buttons up a level is
                not a reason to move all of that with them.
            */}
            {isOwnProfile && actionsHost && createPortal(
                <>
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
                        className="inline-flex items-center gap-2 h-10 px-3.5 rounded-[8px] bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.12] text-white font-display text-[10.5px] font-bold uppercase tracking-[0.08em] transition-colors disabled:opacity-50"
                    >
                        {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Import
                    </button>
                    <button
                        onClick={() => setAddOpen(true)}
                        className="inline-flex items-center gap-2 h-10 px-3.5 rounded-[8px] bg-[var(--accent)] hover:brightness-110 text-white font-display text-[10.5px] font-bold uppercase tracking-[0.08em] transition-[filter]"
                    >
                        <Plus className="w-3.5 h-3.5" /> Add game
                    </button>
                </>,
                actionsHost,
            )}

            {/* Search and order, once there is enough shelf to lose something
                on. Four games do not need a search field; four hundred — which
                is what one Steam import leaves behind — cannot be read without
                one. */}
            {filter !== "upcoming" && ((stats?.games_count ?? 0) >= SEARCHABLE_FROM || !!term) && (
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 min-w-0 max-w-[340px]">
                        <Search aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                        <input
                            value={term}
                            onChange={(e) => setTerm(e.target.value)}
                            placeholder="Search this shelf…"
                            aria-label="Search your collection"
                            className="w-full h-9 pl-9 pr-8 rounded-[8px] bg-white/[0.03] border border-white/[0.09] text-[12.5px] text-white placeholder:text-white/45 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] transition-colors"
                        />
                        {term && (
                            <button
                                onClick={() => setTerm("")}
                                aria-label="Clear search"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-[5px] text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <span className="shrink-0">
                        <Select
                            value={sort}
                            onChange={(v) => setSort(v as SortId)}
                            ariaLabel="Order the shelf"
                            options={SORTS.map((s) => ({ value: s.id, label: s.label }))}
                            className="h-9 px-3 font-display text-[10.5px] font-bold uppercase tracking-[0.08em] text-white/70"
                            menuClassName="w-[180px]"
                            align="end"
                        />
                    </span>

                    {(search || sort !== "recent") && (
                        <span className="font-display text-[10px] font-bold uppercase tracking-[0.12em] tabular-nums text-white/50">
                            {total} {total === 1 ? "game" : "games"}
                        </span>
                    )}
                </div>
            )}
            </div>

            {/* ── shelf ── */}
            {filter === "upcoming" ? (
                <UpcomingList isOwnProfile={isOwnProfile} />
            ) : isLoading ? (
                <div className={SHELF_GRID}>
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="aspect-[3/4] rounded-[12px] bg-white/[0.04] animate-pulse" />
                    ))}
                </div>
            ) : entries.length === 0 && search ? (
                <EmptyState
                    variant="compact"
                    icon={<Search className="w-[18px] h-[18px]" />}
                    title={`Nothing on this shelf matches “${search}”`}
                    body="Try a shorter word, or clear the filter beside it."
                    action={{ label: "Clear search", onClick: () => setTerm("") }}
                />
            ) : entries.length === 0 ? (
                isOwnProfile ? (
                    // Two real ways in, not a link that goes nowhere
                    <div className="flex flex-col items-center justify-center gap-2.5 min-h-[220px] rounded-[var(--radius-card)] border border-dashed border-white/[0.12] bg-white/[0.02] text-center p-6">
                        <span className="w-11 h-11 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)]">
                            <Library className="w-5 h-5" />
                        </span>
                        <p className="font-display text-[13px] font-bold text-white">Nothing on this shelf yet</p>
                        <p className="text-[11px] text-white/50 max-w-[280px]">
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
                    {/* One grid, and the pinned game is a two-by-two cell of
                        it rather than a card in a column beside it. */}
                    <div className={SHELF_GRID}>
                        {featured && (
                            <div className="col-span-2 row-span-2 min-w-0">
                                <FeaturedCard entry={featured} />
                            </div>
                        )}
                        {rest.map((e, i) => (
                            <div key={e.id} className={`min-w-0 tp-fade-up tp-d${Math.min(6, Math.floor(i / 3) + 1)}`}>
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

                        {/* The empty slot at the end of the row — the shelf
                            says it has room, which a wall of covers stopping
                            mid-row does not. Only when there is nothing more to
                            load, or it would read as the end of a list that
                            has another page behind it. */}
                        {isOwnProfile && !hasMore && !search && (
                            <button
                                onClick={() => setAddOpen(true)}
                                className="group aspect-[3/4] min-w-0 rounded-[12px] border border-dashed border-white/[0.12] bg-white/[0.015] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:bg-[var(--accent)]/[0.04] flex flex-col items-center justify-center gap-2 transition-colors duration-300"
                            >
                                <span className="w-9 h-9 rounded-full bg-white/[0.05] group-hover:bg-[var(--accent)]/15 flex items-center justify-center text-white/30 group-hover:text-[var(--accent)] transition-colors">
                                    <Plus className="w-4 h-4" />
                                </span>
                                <span className="font-display text-[9px] font-bold uppercase tracking-[0.14em] text-white/45 group-hover:text-white/60 transition-colors">
                                    Add game
                                </span>
                            </button>
                        )}
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
    const [platform, setPlatform] = useState("");
    const [adding, setAdding] = useState<string | null>(null);

    const { data, isLoading } = useSWR(
        term.trim().length >= 2 ? `/games?search=${encodeURIComponent(term.trim())}&page_size=12` : null,
        fetcher,
    );
    const results = data?.results ?? [];

    const add = async (slug: string) => {
        setAdding(slug);
        try {
            await axios.put(`/collection/games/${slug}`, {
                status,
                // Only when they said one. An empty string would set the label
                // to nothing, which is not the same as leaving it unset.
                ...(platform.trim() ? { platform: platform.trim() } : {}),
            });
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
                                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-[8px] pl-9 pr-3 h-10 text-[13px] text-white placeholder:text-white/50 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
                            />
                        </div>
                        <span className="shrink-0">
                            <Select
                                value={status}
                                onChange={(v) => setStatus(v as CollectionStatus)}
                                ariaLabel="Status for added games"
                                options={STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS[s].label }))}
                                className="h-10 px-3 font-display text-[10.5px] font-bold uppercase tracking-[0.08em] text-white"
                                menuClassName="w-[170px]"
                                align="end"
                            />
                        </span>
                    </div>

                    {/* Where you play it. The four stores that import their own
                        libraries fill this in themselves; this is for the ones
                        that cannot, and for a shelf that holds cartridges. */}
                    <div>
                        <label htmlFor="add-platform" className="block font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/50 mb-1.5">
                            Platform <span className="text-white/45">— optional</span>
                        </label>
                        <input
                            id="add-platform"
                            list="tp-launchers"
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
                            placeholder="Ubisoft Connect, Battle.net, Switch…"
                            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-[8px] px-3 h-9 text-[12.5px] text-white placeholder:text-white/45 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
                        />
                        <datalist id="tp-launchers">
                            {UNIMPORTABLE_LAUNCHERS.map((l) => <option key={l} value={l} />)}
                        </datalist>
                    </div>

                    <div className="max-h-[45vh] overflow-y-auto -mx-1 px-1">
                        {term.trim().length < 2 ? (
                            <p className="text-[12px] text-white/50 text-center py-8">Type at least 2 characters to search.</p>
                        ) : isLoading ? (
                            <div className="flex items-center justify-center py-8 text-white/40"><Loader2 className="w-5 h-5 animate-spin" /></div>
                        ) : results.length === 0 ? (
                            <p className="text-[12px] text-white/50 text-center py-8">No games found.</p>
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
                                                <span className="block font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/50">
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
