"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import {
    List as ListIcon, Plus, Heart, MessageSquare, Lock, FileEdit, AlertTriangle, Pencil, Trash2, Loader2, Gamepad2,
    Trophy, CalendarDays, Skull, Gem, FilePlus, ChevronDown,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import Segmented from "@/components/ui/Segmented";
import ListEditor, { CommunityInspiration } from "./ListEditor";
import type { GameListPreview, ListType } from "@/lib/types/profile";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

const TYPE_LABEL: Record<ListType, string> = {
    top10: "Top 10",
    top25: "Top 25",
    top100: "Top 100",
    genre: "Genre",
    custom: "Ranking",
};

interface Props {
    username: string;
    isOwnProfile: boolean;
}

/**
 * What a new list starts as.
 *
 * "Untitled list" was the single biggest thing standing between somebody and
 * a list: an empty name field is a question with no hint of an answer, and the
 * blank ones sitting on profiles are all the evidence needed. A starter names
 * the list and picks its shape, and the name is still the first thing you can
 * edit.
 *
 * Each one carries its own mark and colour. Six identical list glyphs made six
 * different ideas look like six ways of saying the same thing, which is the
 * opposite of what a starter is for.
 */
const STARTERS: {
    key: string;
    name: string;
    type: ListType;
    blurb: string;
    icon: typeof Trophy;
    tint: string;
}[] = [
    { key: "top10", name: "My Top 10", type: "top10", blurb: "The ten you would defend", icon: Trophy, tint: "#fbbf24" },
    { key: "year", name: `Best of ${new Date().getFullYear()}`, type: "top10", blurb: "This year, ranked", icon: CalendarDays, tint: "var(--accent-ink)" },
    { key: "comfort", name: "Comfort Games", type: "custom", blurb: "The ones you go back to", icon: Heart, tint: "#f472b6" },
    { key: "shame", name: "Hall of Shame", type: "custom", blurb: "Bought, never finished", icon: Skull, tint: "#9ca3af" },
    { key: "hidden", name: "Hidden Gems", type: "custom", blurb: "What nobody else played", icon: Gem, tint: "#a855f7" },
    { key: "blank", name: "Untitled list", type: "custom", blurb: "Start from nothing", icon: FilePlus, tint: "#60a5fa" },
];

/** State a list can be in, and how the bar counts them. */
const SHELVES = [
    { id: "all", label: "All", match: () => true },
    { id: "published", label: "Published", match: (l: GameListPreview) => !l.is_draft && l.is_public, dot: "#34d399" },
    { id: "drafts", label: "Drafts", match: (l: GameListPreview) => !!l.is_draft, dot: "#fbbf24" },
    { id: "private", label: "Private", match: (l: GameListPreview) => !l.is_draft && !l.is_public, dot: "#9ca3af" },
] as const;

const SORTS = [
    { id: "recent", label: "Recently touched" },
    { id: "liked", label: "Most liked" },
    { id: "games", label: "Most games" },
    { id: "name", label: "Name A–Z" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

/* ── one list card ────────────────────────────────────────────────────── */

function ListCard({
    list,
    username,
    isOwnProfile,
    onEdit,
    onDelete,
}: {
    list: GameListPreview;
    username: string;
    isOwnProfile: boolean;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const covers = (list.covers ?? []).slice(0, 4);

    // A draft or private list is not readable at its public URL — that page
    // fetches without a session and answers 404, which is what the console
    // was reporting on every profile with a draft. The owner goes to the
    // editor instead, the only door that opens.
    const reachable = !list.is_draft && list.is_public;

    // Declared as an element rather than a component: a component defined
    // during render is a new type on every render, so React throws the whole
    // subtree away and rebuilds it — which for a card full of images means
    // they blink on every keystroke in the sort control above.
    const shell = (children: React.ReactNode) =>
        reachable ? (
            <Link href={`/lists/${username}/${list.slug}`} className="flex-1 flex flex-col">{children}</Link>
        ) : (
            <button type="button" onClick={onEdit} className="flex-1 flex flex-col w-full text-left">{children}</button>
        );

    return (
        <div className="group relative h-full flex flex-col rounded-[12px] overflow-hidden border border-white/[0.07] bg-[var(--surface-1)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.5)] transition-all duration-300">
            {shell(<>
                {/* A collage of what is inside, not a placeholder. The hairline
                    gaps matter: butted together, four covers cropped to a
                    quarter width each read as one smeared photograph rather
                    than as four games. */}
                <span className="relative flex gap-px h-[112px] bg-white/[0.06]">
                    {covers.length === 0 ? (
                        <span className="w-full flex items-center justify-center bg-white/[0.03] text-white/15">
                            <Gamepad2 className="w-7 h-7" />
                        </span>
                    ) : (
                        covers.map((c, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={i} src={c} alt="" aria-hidden loading="lazy" className="flex-1 min-w-0 h-full object-cover" />
                        ))
                    )}
                    <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[var(--surface-1)] via-[var(--surface-1)]/30 to-transparent" />

                    {/* The same corner bracket the game tiles carry, so a list
                        of covers reads as part of the same object family. */}
                    <span
                        aria-hidden
                        className="absolute right-1.5 bottom-1.5 w-4 h-4 border-b-2 border-r-2 border-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    />

                    <span className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5">
                        {list.list_type && list.list_type !== "custom" && (
                            <span className="inline-flex items-center h-[19px] px-2 rounded-[4px] bg-[var(--accent)] font-display text-[8px] font-black uppercase tracking-[0.12em] text-white">
                                {TYPE_LABEL[list.list_type]}
                            </span>
                        )}
                        {list.is_draft && (
                            <span className="inline-flex items-center gap-1 h-[19px] px-2 rounded-[4px] bg-amber-400/20 border border-amber-400/35 font-display text-[8px] font-black uppercase tracking-[0.12em] text-amber-300">
                                <FileEdit className="w-2.5 h-2.5" /> Draft
                            </span>
                        )}
                        {!list.is_public && !list.is_draft && (
                            <span className="inline-flex items-center gap-1 h-[19px] px-2 rounded-[4px] bg-white/[0.14] font-display text-[8px] font-black uppercase tracking-[0.12em] text-white/70">
                                <Lock className="w-2.5 h-2.5" /> Private
                            </span>
                        )}
                        {list.has_spoilers && (
                            <span className="inline-flex items-center gap-1 h-[19px] px-2 rounded-[4px] bg-amber-500/20 border border-amber-500/40 font-display text-[8px] font-black uppercase tracking-[0.12em] text-amber-400">
                                <AlertTriangle className="w-2.5 h-2.5" /> Spoilers
                            </span>
                        )}
                    </span>
                </span>

                {/* The body reserves the same room whether or not there is a
                    description, so a wall of cards has one floor. Before, an
                    undescribed list was thirty pixels shorter than its
                    neighbours and the grid came out as a broken comb. */}
                <span className="flex-1 flex flex-col p-3.5">
                    <span className="block font-display text-[14px] font-bold text-white leading-snug line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
                        {list.name}
                    </span>
                    <span className="block mt-1 min-h-[30px] text-[11.5px] text-white/40 leading-snug line-clamp-2">
                        {list.description || (
                            <span className="text-white/20">{list.items_count === 0 ? "Nothing in it yet" : "No description"}</span>
                        )}
                    </span>

                    {(list.tags?.length ?? 0) > 0 && (
                        <span className="mt-2.5 flex flex-wrap gap-1.5">
                            {list.tags!.slice(0, 3).map((t) => (
                                <span key={t} className="inline-flex items-center h-[18px] px-2 rounded-full bg-white/[0.05] text-[9.5px] font-bold text-white/40">
                                    {t}
                                </span>
                            ))}
                        </span>
                    )}

                    <span className="mt-auto pt-2.5 flex items-center gap-3 font-display text-[10px] font-bold tabular-nums text-white/30">
                        <span className="text-white/55">
                            {list.items_count}
                            {list.item_limit ? <span className="text-white/25"> / {list.item_limit}</span> : null} games
                        </span>
                        <span className="inline-flex items-center gap-1"><Heart className="w-3 h-3" /> {list.likes_count ?? 0}</span>
                        <span className="inline-flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {list.comments_count ?? 0}</span>
                    </span>
                </span>
            </>)}

            {isOwnProfile && (
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        onClick={onEdit}
                        title="Edit list"
                        className="w-7 h-7 rounded-[6px] bg-black/60 backdrop-blur-md flex items-center justify-center text-white/60 hover:text-[var(--accent)] transition-colors"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={onDelete}
                        title="Delete list"
                        className="w-7 h-7 rounded-[6px] bg-black/60 backdrop-blur-md flex items-center justify-center text-white/60 hover:text-red-400 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}

/* ── the starters ─────────────────────────────────────────────────────── */

function StarterGrid({
    creating, onPick, heading,
}: {
    creating: string | null;
    onPick: (s: (typeof STARTERS)[number]) => void;
    heading: string;
}) {
    return (
        <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-1)] p-4">
            <p className="font-display text-[10px] font-black uppercase tracking-[0.16em] text-white/40 mb-3">{heading}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {STARTERS.map((s) => {
                    const Icon = s.icon;

                    return (
                        <button
                            key={s.key}
                            onClick={() => onPick(s)}
                            disabled={creating !== null}
                            className="group/starter flex items-center gap-3 p-3 rounded-[8px] border border-white/[0.07] bg-white/[0.02] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:bg-[var(--accent-soft)] text-left transition-colors disabled:opacity-50"
                        >
                            <span
                                className="w-9 h-9 shrink-0 flex items-center justify-center transition-transform duration-300 group-hover/starter:scale-110"
                                style={{ color: s.tint }}
                            >
                                {creating === s.key
                                    ? <Loader2 className="w-5 h-5 animate-spin" />
                                    : <Icon className="w-[23px] h-[23px]" strokeWidth={1.5} />}
                            </span>
                            <span className="min-w-0">
                                <span className="block text-[12.5px] font-semibold text-white truncate">{s.name}</span>
                                <span className="block text-[10.5px] text-white/35 truncate">{s.blurb}</span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/* ── the tab ──────────────────────────────────────────────────────────── */

export default function ListsTab({ username, isOwnProfile }: Props) {
    // Own lists include drafts and private ones; a visitor sees the public set.
    const key = isOwnProfile ? "/game-lists/mine" : `/users/${username}/lists`;
    const { data, isLoading, mutate } = useSWR<{ data: GameListPreview[] }>(key, fetcher);
    const lists = useMemo(() => data?.data ?? [], [data]);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [creating, setCreating] = useState<string | null>(null);
    const [picking, setPicking] = useState(false);
    const [shelf, setShelf] = useState<string>("all");
    const [sort, setSort] = useState<SortId>("recent");

    // Everything arrives in one response, so the bar and the order are free —
    // no round trip, and the counts are the real ones rather than an estimate.
    const shown = useMemo(() => {
        const rule = SHELVES.find((s) => s.id === shelf) ?? SHELVES[0];
        const rows = lists.filter(rule.match);

        switch (sort) {
            case "liked": return [...rows].sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0));
            case "games": return [...rows].sort((a, b) => b.items_count - a.items_count);
            case "name": return [...rows].sort((a, b) => a.name.localeCompare(b.name));
            default: return rows;   // the API already answers newest-touched first
        }
    }, [lists, shelf, sort]);

    const create = async (starter: (typeof STARTERS)[number]) => {
        setCreating(starter.key);
        try {
            // A new list starts as a draft so the editor has something real to
            // write into — publishing is the deliberate second step.
            const res = await axios.post("/game-lists", {
                name: starter.name,
                list_type: starter.type,
                is_draft: true,
            });
            mutate();
            setPicking(false);
            setEditingId(res.data?.data?.id ?? null);
        } catch {
            toast.error("Couldn't start a new list.");
        } finally {
            setCreating(null);
        }
    };

    const remove = async (id: number) => {
        // A list carries its items, its likes and its comments — one stray tap
        // should not take all of it.
        if (!window.confirm('Delete this list? This cannot be undone.')) return;
        try {
            await axios.delete(`/game-lists/${id}`);
            toast.success("List deleted");
            mutate();
        } catch {
            toast.error("Couldn't delete that list.");
        }
    };

    if (editingId !== null) {
        return (
            <ListEditor
                listId={editingId}
                username={username}
                onClose={() => { setEditingId(null); mutate(); }}
            />
        );
    }

    return (
        <div className="space-y-5">
            {/* The same bar the shelf uses, for the same reason: a set of
                states, one at a time, with its counts on it. */}
            <div className="flex items-center gap-3">
                {isOwnProfile ? (
                    <Segmented
                        ariaLabel="Filter your lists"
                        value={shelf}
                        onChange={setShelf}
                        className="flex-1 min-w-0"
                        items={SHELVES.map((s) => ({
                            id: s.id,
                            label: s.label,
                            dot: "dot" in s ? s.dot : undefined,
                            count: lists.filter(s.match).length,
                        }))}
                    />
                ) : (
                    <h2 className="flex-1 min-w-0 flex items-center gap-2.5 font-display text-[12px] font-bold uppercase tracking-[0.15em] text-white/55">
                        <ListIcon className="w-[22px] h-[22px] text-[var(--accent-ink)]" strokeWidth={1.5} />
                        Lists
                        {lists.length > 0 && <span className="font-black tabular-nums text-white/25">{lists.length}</span>}
                    </h2>
                )}

                {lists.length > 1 && (
                    <span className="relative shrink-0">
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortId)}
                            aria-label="Order the lists"
                            className="appearance-none h-9 pl-3 pr-8 rounded-[8px] bg-white/[0.03] border border-white/[0.09] font-display text-[10.5px] font-bold uppercase tracking-[0.08em] text-white/70 hover:text-white focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] cursor-pointer transition-colors"
                        >
                            {SORTS.map((s) => (
                                <option key={s.id} value={s.id} className="bg-[var(--surface-1)] normal-case">{s.label}</option>
                            ))}
                        </select>
                        <ChevronDown aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/35" />
                    </span>
                )}

                {isOwnProfile && (
                    <button
                        onClick={() => setPicking((v) => !v)}
                        className="shrink-0 inline-flex items-center gap-2 h-9 px-4 rounded-[8px] bg-[var(--accent)] hover:brightness-110 text-white font-display text-[10.5px] font-bold uppercase tracking-[0.08em] transition-[filter]"
                    >
                        <Plus className="w-3.5 h-3.5" /> New list
                    </button>
                )}
            </div>

            {picking && isOwnProfile && (
                <StarterGrid heading="Start with" creating={creating} onPick={create} />
            )}

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-[248px] rounded-[12px] bg-white/[0.04] animate-pulse" />)}
                </div>
            ) : lists.length === 0 ? (
                // An empty shelf gets the starters themselves, not an empty
                // state and a button that reveals them. The whole point of a
                // starter is to skip the blank page; making it cost a click
                // first put the blank page back.
                isOwnProfile ? (
                    <StarterGrid heading="Your first list starts here" creating={creating} onPick={create} />
                ) : (
                    <EmptyState icon={<ListIcon className="w-[18px] h-[18px]" />} title="No public lists" />
                )
            ) : shown.length === 0 ? (
                <EmptyState
                    variant="compact"
                    title={`Nothing ${SHELVES.find((s) => s.id === shelf)?.label.toLowerCase()}`}
                    body="Every list you have is on another shelf of this bar."
                    action={{ label: "Show all", onClick: () => setShelf("all") }}
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 items-stretch">
                    {shown.map((l, i) => (
                        <div key={l.id} className={`min-w-0 tp-fade-up tp-d${Math.min(6, i + 1)}`}>
                            <ListCard
                                list={l}
                                username={username}
                                isOwnProfile={isOwnProfile}
                                onEdit={() => setEditingId(l.id)}
                                onDelete={() => remove(l.id)}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Other people's lists are a reason to stay, not a footnote in a
                sidebar. They run under your own, at the same width. */}
            <CommunityInspiration variant="row" />
        </div>
    );
}
