"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR, { mutate as globalMutate } from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { ListChecks, Plus, X, Trash2, Lock, Globe, ArrowLeft, Search, Loader2, Gamepad2, Share2 } from "lucide-react";
import ListCoverCollage from "./dashboard/ListCoverCollage";
import type { GameListPreview, GameListDetail } from "@/lib/types/profile";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

interface Props {
    username: string;
    isOwnProfile: boolean;
}

export default function ListsTab({ username, isOwnProfile }: Props) {
    const [openId, setOpenId] = useState<number | null>(null);
    const [createOpen, setCreateOpen] = useState(false);

    const listKey = isOwnProfile ? "/game-lists/mine" : `/users/${username}/lists`;
    const { data, isLoading, mutate } = useSWR<{ data: GameListPreview[] }>(listKey, fetcher);
    const lists = data?.data ?? [];

    if (openId !== null) {
        return <ListDetail id={openId} ownerUsername={username} isOwnProfile={isOwnProfile} onBack={() => { setOpenId(null); mutate(); }} onChanged={() => { mutate(); globalMutate(`/users/${username}`); }} />;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h3 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-white">
                    <ListChecks className="w-4 h-4 text-[var(--accent)]" /> {isOwnProfile ? "Your Lists" : "Lists"}
                </h3>
                {isOwnProfile && (
                    <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[11px] font-bold uppercase tracking-wider transition-colors">
                        <Plus className="w-3.5 h-3.5" /> New List
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/3] bg-white/[0.04] rounded-xl animate-pulse" />)}
                </div>
            ) : lists.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/30 mb-3"><ListChecks className="w-6 h-6" /></div>
                    <p className="text-[13px] font-semibold text-white/55">{isOwnProfile ? "No lists yet" : "No public lists"}</p>
                    {isOwnProfile && <button onClick={() => setCreateOpen(true)} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[11px] font-bold uppercase tracking-wider"><Plus className="w-3.5 h-3.5" /> Create a List</button>}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {lists.map((l) => (
                        <button key={l.id} onClick={() => setOpenId(l.id)} className="group text-left rounded-xl overflow-hidden border border-white/[0.06] bg-[#0B0E14] hover:border-[var(--accent)]/40 transition-colors">
                            <ListCoverCollage covers={l.covers} className="aspect-video w-full" />
                            <div className="p-3">
                                <div className="flex items-center gap-1.5">
                                    <h4 className="text-[13px] font-bold text-white line-clamp-1 group-hover:text-[var(--accent)] transition-colors flex-1">{l.name}</h4>
                                    {l.is_public === false && <Lock className="w-3 h-3 text-white/30 shrink-0" />}
                                </div>
                                <span className="text-[10px] text-white/35">{l.items_count} {l.items_count === 1 ? "game" : "games"}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {createOpen && <CreateListModal onClose={() => setCreateOpen(false)} onCreated={(id) => { setCreateOpen(false); mutate(); setOpenId(id); }} />}
        </div>
    );
}

function CreateListModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: number) => void }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [saving, setSaving] = useState(false);

    const submit = async () => {
        if (name.trim().length < 2) return toast.error("Name is too short.");
        setSaving(true);
        try {
            const res = await axios.post("/game-lists", { name: name.trim(), description: description.trim() || null, is_public: isPublic });
            toast.success("List created");
            onCreated(res.data?.data?.id);
        } catch {
            toast.error("Failed to create list.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal title="New List" onClose={onClose}>
            <div className="space-y-3">
                <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="List name (e.g. Best RPGs)" className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--accent)]/50" />
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={3} className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--accent)]/50 resize-none" />
                <label className="flex items-center gap-2.5 text-[12px] text-white/70 cursor-pointer">
                    <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="accent-[var(--accent)] w-4 h-4" />
                    {isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />} Public list
                </label>
                <button onClick={submit} disabled={saving} className="w-full py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white text-[12px] font-bold uppercase tracking-wider">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Create List"}
                </button>
            </div>
        </Modal>
    );
}

function ListDetail({ id, ownerUsername, isOwnProfile, onBack, onChanged }: { id: number; ownerUsername: string; isOwnProfile: boolean; onBack: () => void; onChanged: () => void }) {
    const [addOpen, setAddOpen] = useState(false);
    const { data, isLoading, mutate } = useSWR<{ data: GameListDetail }>(`/game-lists/${id}`, fetcher);
    const list = data?.data;

    const shareList = () => {
        if (!list) return;
        const url = `${window.location.origin}/lists/${ownerUsername}/${list.slug}`;
        navigator.clipboard.writeText(url).then(() => toast.success("List link copied!"));
    };

    const removeItem = async (itemId: number) => {
        try {
            await axios.delete(`/game-lists/${id}/items/${itemId}`);
            mutate();
            onChanged();
        } catch {
            toast.error("Failed to remove.");
        }
    };

    const deleteList = async () => {
        if (!confirm("Delete this list?")) return;
        try {
            await axios.delete(`/game-lists/${id}`);
            toast.success("List deleted");
            onBack();
        } catch {
            toast.error("Failed to delete list.");
        }
    };

    return (
        <div>
            <button onClick={onBack} className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/45 hover:text-white mb-4">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Lists
            </button>

            {isLoading || !list ? (
                <div className="h-40 bg-white/[0.04] rounded-xl animate-pulse" />
            ) : (
                <>
                    <div className="flex items-start justify-between gap-4 mb-5">
                        <div className="min-w-0">
                            <h2 className="text-xl font-black text-white flex items-center gap-2">{list.name} {list.is_public === false && <Lock className="w-4 h-4 text-white/30" />}</h2>
                            {list.description && <p className="text-[13px] text-white/50 mt-1 max-w-2xl">{list.description}</p>}
                            <span className="text-[11px] text-white/35">{list.items_count} {list.items_count === 1 ? "game" : "games"}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {list.is_public !== false && (
                                <button onClick={shareList} title="Copy shareable link" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white text-[11px] font-bold uppercase tracking-wider transition-colors">
                                    <Share2 className="w-3.5 h-3.5" /> Share
                                </button>
                            )}
                            {isOwnProfile && (
                                <>
                                    <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[11px] font-bold uppercase tracking-wider"><Plus className="w-3.5 h-3.5" /> Add</button>
                                    <button onClick={deleteList} title="Delete list" className="p-2 rounded-lg bg-white/[0.04] hover:bg-red-500/15 text-red-400"><Trash2 className="w-4 h-4" /></button>
                                </>
                            )}
                        </div>
                    </div>

                    {list.items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 text-white/30">
                            <Gamepad2 className="w-7 h-7 mb-2" />
                            <span className="text-[13px]">No games in this list yet.</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {list.items.map((it) => it.game && (
                                <div key={it.id} className="group relative rounded-xl overflow-hidden border border-white/[0.06] bg-[#0B0E14]">
                                    <Link href={`/games/${it.game.slug}`} prefetch={false} className="block relative aspect-[3/4] overflow-hidden">
                                        {it.game.background_image ? (
                                            <img src={it.game.background_image} alt={it.game.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : <div className="w-full h-full flex items-center justify-center text-white/15"><Gamepad2 className="w-8 h-8" /></div>}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                                        <h4 className="absolute bottom-0 left-0 right-0 p-2.5 text-[12px] font-bold text-white line-clamp-2 leading-snug">{it.game.name}</h4>
                                    </Link>
                                    {isOwnProfile && (
                                        <button onClick={() => removeItem(it.id)} title="Remove" className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-red-500/70 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {addOpen && <AddToListModal listId={id} onClose={() => setAddOpen(false)} onAdded={() => { mutate(); onChanged(); }} />}
                </>
            )}
        </div>
    );
}

function AddToListModal({ listId, onClose, onAdded }: { listId: number; onClose: () => void; onAdded: () => void }) {
    const [term, setTerm] = useState("");
    const [adding, setAdding] = useState<string | null>(null);
    const { data, isLoading } = useSWR(term.trim().length >= 2 ? `/games?search=${encodeURIComponent(term.trim())}&page_size=12` : null, fetcher);
    const results = data?.results ?? [];

    const add = async (slug: string) => {
        setAdding(slug);
        try {
            await axios.post(`/game-lists/${listId}/items`, { slug });
            toast.success("Added to list");
            onAdded();
        } catch {
            toast.error("Failed to add.");
        } finally {
            setAdding(null);
        }
    };

    return (
        <Modal title="Add a Game" onClose={onClose}>
            <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input autoFocus value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search games…" className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--accent)]/50" />
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
                                <div className="w-12 h-12 rounded-md overflow-hidden bg-white/5 shrink-0">{g.background_image && <img src={g.background_image} alt={g.name} className="w-full h-full object-cover" />}</div>
                                <div className="flex-1 min-w-0"><p className="text-[13px] font-semibold text-white truncate">{g.name}</p>{g.released && <p className="text-[10px] text-white/35">{new Date(g.released).getFullYear()}</p>}</div>
                                <button onClick={() => add(g.slug)} disabled={adding === g.slug} className="px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white text-[10px] font-bold uppercase tracking-wider shrink-0">
                                    {adding === g.slug ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Add"}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </Modal>
    );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 pt-[10vh]" onClick={onClose}>
            <div className="w-full max-w-lg rounded-2xl bg-[var(--bg-card)] border border-white/10 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                    <h3 className="text-[13px] font-bold uppercase tracking-wider text-white">{title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded hover:bg-white/10 text-white/50"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}
