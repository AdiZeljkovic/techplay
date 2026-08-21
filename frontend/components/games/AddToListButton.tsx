"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { ListPlus, Check, Loader2, Plus, X } from "lucide-react";
import type { GameListPreview } from "@/lib/types/profile";

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data ?? []);

interface Props {
    slug: string;
    gameName?: string;
    className?: string;
}

/**
 * Put this game on one of your lists, from wherever you are looking at it.
 *
 * Lists were only reachable from inside the profile, so making one meant
 * remembering a game long enough to go and find it again. The thought "this
 * belongs on my top ten" happens on the game's page, and that is where it
 * should be actionable.
 *
 * Signed-out readers get nothing rather than a button that asks them to sign
 * in — the page already has one of those.
 */
export default function AddToListButton({ slug, gameName, className = "" }: Props) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState<number | "new" | null>(null);
    const [added, setAdded] = useState<Set<number>>(new Set());

    // Only asked for once the menu is opened — most readers never will.
    const { data: lists, mutate } = useSWR<GameListPreview[]>(
        user && open ? "/game-lists/mine" : null,
        fetcher,
    );

    if (!user) return null;

    const addTo = async (list: GameListPreview) => {
        setBusy(list.id);
        try {
            await axios.post(`/game-lists/${list.id}/items`, { slug });
            setAdded((prev) => new Set(prev).add(list.id));
            toast.success(`Added to ${list.name}.`);
            mutate();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "Couldn't add it to that list.");
        } finally {
            setBusy(null);
        }
    };

    const createWith = async () => {
        setBusy("new");
        try {
            const res = await axios.post("/game-lists", {
                name: gameName ? `Games like ${gameName}` : "New list",
                list_type: "custom",
                is_draft: true,
            });
            const created = res.data?.data;

            if (created?.id) {
                await axios.post(`/game-lists/${created.id}/items`, { slug });
                setAdded((prev) => new Set(prev).add(created.id));
                toast.success(`Started “${created.name}” with this game.`);
                mutate();
            }
        } catch {
            toast.error("Couldn't start a list.");
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="w-full inline-flex items-center justify-center gap-2 h-11 px-5 whitespace-nowrap rounded-[var(--radius-card)] bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.12] text-white font-display text-[11px] font-bold uppercase tracking-[0.1em] transition-colors"
            >
                <ListPlus className="w-4 h-4" /> Save to a list
            </button>

            {open && (
                <>
                    {/* A click anywhere else closes it; the menu is not modal. */}
                    <button
                        aria-label="Close"
                        onClick={() => setOpen(false)}
                        className="fixed inset-0 z-40 cursor-default"
                    />

                    <div className="absolute z-50 left-0 right-0 mt-2 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-1)] shadow-[0_18px_44px_rgba(0,0,0,0.6)] overflow-hidden">
                        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-white/[0.06]">
                            <span className="font-display text-[9.5px] font-black uppercase tracking-[0.16em] text-white/40">
                                Your lists
                            </span>
                            <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white transition-colors">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="max-h-[260px] overflow-y-auto">
                            {lists === undefined ? (
                                <p className="px-3.5 py-4 text-center text-[12px] text-white/30">
                                    <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                                </p>
                            ) : lists.length === 0 ? (
                                <p className="px-3.5 py-4 text-[12px] text-white/35 leading-snug">
                                    No lists yet. Start one with this game in it.
                                </p>
                            ) : (
                                lists.map((list) => {
                                    const on = added.has(list.id);

                                    return (
                                        <button
                                            key={list.id}
                                            onClick={() => addTo(list)}
                                            disabled={busy !== null || on}
                                            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-white/[0.04] transition-colors disabled:opacity-60"
                                        >
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-[12.5px] font-semibold text-white truncate">{list.name}</span>
                                                <span className="block text-[10.5px] text-white/30">
                                                    {list.items_count}
                                                    {list.item_limit ? ` / ${list.item_limit}` : ""} games
                                                </span>
                                            </span>
                                            {busy === list.id ? (
                                                <Loader2 className="w-4 h-4 shrink-0 animate-spin text-white/40" />
                                            ) : on ? (
                                                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                                            ) : null}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        <button
                            onClick={createWith}
                            disabled={busy !== null}
                            className="w-full flex items-center gap-2.5 px-3.5 py-3 border-t border-white/[0.06] text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors disabled:opacity-60"
                        >
                            {busy === "new" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            <span className="font-display text-[10.5px] font-bold uppercase tracking-[0.1em]">New list with this game</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
