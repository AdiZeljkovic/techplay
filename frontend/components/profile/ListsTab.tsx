"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import {
    List as ListIcon, Plus, Heart, MessageSquare, Lock, FileEdit, AlertTriangle, Pencil, Trash2, Loader2, Gamepad2,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
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
 */
const STARTERS: { key: string; name: string; type: ListType; blurb: string }[] = [
    { key: "top10", name: "My Top 10", type: "top10", blurb: "The ten you would defend" },
    { key: "year", name: `Best of ${new Date().getFullYear()}`, type: "top10", blurb: "This year, ranked" },
    { key: "comfort", name: "Comfort Games", type: "custom", blurb: "The ones you go back to" },
    { key: "shame", name: "Hall of Shame", type: "custom", blurb: "Bought, never finished" },
    { key: "hidden", name: "Hidden Gems", type: "custom", blurb: "What nobody else played" },
    { key: "blank", name: "Untitled list", type: "custom", blurb: "Start from nothing" },
];

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
    const CardShell = ({ children }: { children: React.ReactNode }) =>
        reachable ? (
            <Link href={`/lists/${username}/${list.slug}`} className="block">{children}</Link>
        ) : (
            <button type="button" onClick={onEdit} className="block w-full text-left">{children}</button>
        );

    return (
        <div className="group relative rounded-[12px] overflow-hidden border border-white/[0.07] bg-[var(--surface-1)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.5)] transition-all duration-300">
            <CardShell>
                {/* a collage of what's inside, not a placeholder */}
                <span className="relative flex h-[104px] bg-white/[0.03]">
                    {covers.length === 0 ? (
                        <span className="w-full flex items-center justify-center text-white/15">
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
                            <span className="inline-flex items-center gap-1 h-[19px] px-2 rounded-[4px] bg-white/[0.14] font-display text-[8px] font-black uppercase tracking-[0.12em] text-white/70">
                                <FileEdit className="w-2.5 h-2.5" /> Draft
                            </span>
                        )}
                        {!list.is_public && (
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

                <span className="block p-3.5">
                    <span className="block font-display text-[14px] font-bold text-white leading-snug line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
                        {list.name}
                    </span>
                    {list.description && (
                        <span className="block mt-1 text-[11.5px] text-white/40 leading-snug line-clamp-2 min-h-[30px]">
                            {list.description}
                        </span>
                    )}

                    <span className="mt-2.5 flex items-center gap-3 font-display text-[10px] font-bold tabular-nums text-white/30">
                        <span className="text-white/55">
                            {list.items_count}
                            {list.item_limit ? <span className="text-white/25"> / {list.item_limit}</span> : null} games
                        </span>
                        <span className="inline-flex items-center gap-1"><Heart className="w-3 h-3" /> {list.likes_count ?? 0}</span>
                        <span className="inline-flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {list.comments_count ?? 0}</span>
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
                </span>
            </CardShell>

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

/* ── the tab ──────────────────────────────────────────────────────────── */

export default function ListsTab({ username, isOwnProfile }: Props) {
    // Own lists include drafts and private ones; a visitor sees the public set.
    const key = isOwnProfile ? "/game-lists/mine" : `/users/${username}/lists`;
    const { data, isLoading, mutate } = useSWR<{ data: GameListPreview[] }>(key, fetcher);
    const lists = data?.data ?? [];

    const [editingId, setEditingId] = useState<number | null>(null);
    const [creating, setCreating] = useState<string | null>(null);
    const [picking, setPicking] = useState(false);

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
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className="xl:col-span-12 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-5">
                    <h2 className="flex items-center gap-2.5 font-display text-[12px] font-bold uppercase tracking-[0.15em] text-white/55">
                        <span className="w-1 h-3.5 rounded-full bg-[var(--accent)]" />
                        <ListIcon className="w-4 h-4 text-[var(--accent)]" />
                        {isOwnProfile ? "Your lists" : "Lists"}
                        {lists.length > 0 && <span className="font-black tabular-nums text-white/25">{lists.length}</span>}
                    </h2>

                    {isOwnProfile && (
                        <button
                            onClick={() => setPicking((v) => !v)}
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-[8px] bg-[var(--accent)] hover:brightness-110 text-white font-display text-[10.5px] font-bold uppercase tracking-[0.08em] transition-[filter]"
                        >
                            <Plus className="w-3.5 h-3.5" /> New list
                        </button>
                    )}
                </div>

                {picking && isOwnProfile && (
                    <div className="mb-5 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-1)] p-4">
                        <p className="font-display text-[10px] font-black uppercase tracking-[0.16em] text-white/40 mb-3">
                            Start with
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {STARTERS.map((s) => (
                                <button
                                    key={s.key}
                                    onClick={() => create(s)}
                                    disabled={creating !== null}
                                    className="group/starter flex items-center gap-3 p-3 rounded-[8px] border border-white/[0.07] bg-white/[0.02] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:bg-[var(--accent-soft)] text-left transition-colors disabled:opacity-50"
                                >
                                    <span className="w-8 h-8 shrink-0 rounded-[7px] bg-white/[0.05] flex items-center justify-center text-white/35 group-hover/starter:text-[var(--accent)] transition-colors">
                                        {creating === s.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListIcon className="w-4 h-4" />}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-[12.5px] font-semibold text-white truncate">{s.name}</span>
                                        <span className="block text-[10.5px] text-white/35 truncate">{s.blurb}</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-[240px] rounded-[12px] bg-white/[0.04] animate-pulse" />)}
                    </div>
                ) : lists.length === 0 ? (
                    <EmptyState
                        icon={<ListIcon className="w-[18px] h-[18px]" />}
                        title={isOwnProfile ? "No lists yet" : "No public lists"}
                        body={isOwnProfile ? "Rank your favourites, argue for your picks, and share the result." : undefined}
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {lists.map((l, i) => (
                            <div key={l.id} className={`tp-fade-up tp-d${Math.min(6, i + 1)}`}>
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
            </div>

            {/* Other people's lists are a reason to stay, not a footnote in a
                sidebar. They run under your own, at the same width. */}
            <div className="xl:col-span-12 min-w-0">
                <CommunityInspiration variant="row" />
            </div>
        </div>
    );
}
