"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { ArrowLeft, Rocket, Save, Search, Plus, X, GripVertical, Loader2, Eye, MessageSquare, AlertTriangle, Heart, Gamepad2, Trophy } from "lucide-react";
import Panel from "@/components/ui/Panel";
import type { GameListDetail, GameListItemEntry, GameListPreview, ListType } from "@/lib/types/profile";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

const TYPES: { id: ListType; label: string; limit: number | null }[] = [
    { id: "top10", label: "Top 10", limit: 10 },
    { id: "top25", label: "Top 25", limit: 25 },
    { id: "top100", label: "Top 100", limit: 100 },
    { id: "genre", label: "Genre List", limit: null },
    { id: "custom", label: "Custom Ranking", limit: null },
];

const CATEGORIES = ["RPG", "Action", "Adventure", "Shooter", "Strategy", "Horror", "Indie", "Sports", "Racing", "Simulation"];

const TIPS = [
    "Use a clear, engaging title that tells players what your list is about.",
    "Add a short description to provide context and attract readers.",
    "Rank thoughtfully and add notes to explain your picks.",
    "Engage with comments to build a community around your list.",
];

/** A labelled switch — the settings column's only control. */
function Toggle({
    icon,
    title,
    body,
    on,
    onChange }: {
    icon: React.ReactNode;
    title: string;
    body: string;
    on: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <button
            onClick={() => onChange(!on)}
            role="switch"
            aria-checked={on}
            className="w-full flex items-center gap-3 text-left group/sw"
        >
            <span className={`shrink-0 mt-0.5 ${on ? "text-[var(--accent)]" : "text-white/25"}`}>{icon}</span>
            <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-semibold text-white">{title}</span>
                <span className="block text-[11px] text-white/35 leading-snug">{body}</span>
            </span>
            <span
                className={`shrink-0 relative w-[42px] h-[24px] rounded-full transition-colors duration-300 ${
                    on ? "bg-[var(--accent)]" : "bg-white/[0.12]"
                }`}
            >
                <span
                    className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-transform duration-300 ${
                        on ? "translate-x-[21px]" : "translate-x-[3px]"
                    }`}
                />
            </span>
        </button>
    );
}

/* ── the editor ───────────────────────────────────────────────────────── */

export default function ListEditor({
    listId,
    username,
    onClose }: {
    listId: number;
    username: string;
    onClose: () => void;
}) {
    const key = `/game-lists/${listId}`;
    const { data, mutate } = useSWR<{ data: GameListDetail }>(key, fetcher);
    const list = data?.data;

    const [form, setForm] = useState({
        name: "",
        description: "",
        list_type: "custom" as ListType,
        category: "",
        tags: [] as string[],
        is_public: true,
        allow_comments: true,
        has_spoilers: false });
    const [tagDraft, setTagDraft] = useState("");
    const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
    const [items, setItems] = useState<GameListItemEntry[]>([]);
    const dragFrom = useRef<number | null>(null);

    // Adopt the server's copy once it lands, then let local edits win.
    const loaded = useRef(false);
    useEffect(() => {
        if (!list || loaded.current) return;
        loaded.current = true;
        setForm({
            name: list.name ?? "",
            description: list.description ?? "",
            list_type: list.list_type ?? "custom",
            category: list.category ?? "",
            tags: list.tags ?? [],
            is_public: list.is_public ?? true,
            allow_comments: list.allow_comments ?? true,
            has_spoilers: list.has_spoilers ?? false });
    }, [list]);

    useEffect(() => {
        if (list?.items) setItems(list.items);
    }, [list?.items]);

    const limit = TYPES.find((t) => t.id === form.list_type)?.limit ?? null;
    const full = limit !== null && items.length >= limit;

    const save = async (mode: "draft" | "publish") => {
        if (!form.name.trim()) return toast.error("Give the list a title first.");
        setSaving(mode);
        try {
            await axios.put(key, {
                ...form,
                category: form.category || null,
                is_draft: mode === "draft" });
            toast.success(mode === "draft" ? "Saved as draft" : "List published");
            mutate();
            if (mode === "publish") onClose();
        } catch {
            toast.error("Couldn't save the list.");
        } finally {
            setSaving(null);
        }
    };

    const addTag = () => {
        const t = tagDraft.trim().toLowerCase();
        if (!t || form.tags.includes(t) || form.tags.length >= 5) return;
        setForm((f) => ({ ...f, tags: [...f.tags, t] }));
        setTagDraft("");
    };

    const addGame = async (slug: string) => {
        try {
            await axios.post(`${key}/items`, { slug });
            mutate();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Couldn't add that game.");
        }
    };

    const removeItem = async (itemId: number) => {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        try {
            await axios.delete(`${key}/items/${itemId}`);
            mutate();
        } catch {
            toast.error("Couldn't remove that game.");
            mutate();
        }
    };

    /** Note and score save on blur — one request per field, not per keystroke. */
    const saveItem = async (itemId: number, payload: { note?: string | null; score?: number | null }) => {
        try {
            await axios.put(`${key}/items/${itemId}`, payload);
        } catch {
            toast.error("Couldn't save that change.");
        }
    };

    const patchLocal = (itemId: number, patch: Partial<GameListItemEntry>) =>
        setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, ...patch } : i)));

    const drop = async (to: number) => {
        const from = dragFrom.current;
        dragFrom.current = null;
        if (from === null || from === to) return;

        const next = [...items];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        setItems(next);

        try {
            await axios.put(`${key}/reorder`, { item_ids: next.map((i) => i.id) });
        } catch {
            toast.error("Couldn't save the new order.");
            mutate();
        }
    };

    if (!list) {
        return <div className="h-[60vh] rounded-[var(--radius-panel)] bg-[var(--fill-2)] animate-pulse" />;
    }

    return (
        <div>
            {/* ── header ── */}
            <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
                <div className="min-w-0">
                    <button
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 hover:text-white transition-colors mb-2"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to lists
                    </button>
                    <h2 className="font-display text-[26px] font-black text-white leading-none">
                        {list.is_draft ? "Create New List" : "Edit List"}
                    </h2>
                    <p className="mt-1.5 text-[12.5px] text-white/40">Build ranked lists, genre picks, and personal favorites</p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => save("draft")}
                        disabled={saving !== null}
                        className="inline-flex items-center gap-2 h-10 px-4 rounded-[8px] bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.12] text-white font-display text-[11px] font-bold uppercase tracking-[0.08em] transition-colors disabled:opacity-60"
                    >
                        {saving === "draft" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save draft
                    </button>
                    <button
                        onClick={() => save("publish")}
                        disabled={saving !== null}
                        className="btn-command inline-flex items-center gap-2 h-10 px-5 bg-[var(--accent)] hover:brightness-110 text-white font-display text-[11px] font-bold uppercase tracking-[0.08em] transition-[filter] disabled:opacity-60"
                    >
                        {saving === "publish" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
                        Publish list
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                {/* ── left: the form ── */}
                <div className="xl:col-span-8 min-w-0 space-y-5">
                    <Panel title="List Details" bodyClassName="p-5">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <div className="space-y-4">
                                <label className="block">
                                    <span className="block font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/45 mb-1.5">
                                        List title <span className="text-[var(--accent)]">*</span>
                                    </span>
                                    <input
                                        value={form.name}
                                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.slice(0, 80) }))}
                                        placeholder="e.g. Best RPGs of All Time"
                                        className="w-full h-10 px-3 rounded-[8px] bg-white/[0.04] border border-white/[0.1] text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
                                    />
                                </label>

                                <label className="block">
                                    <span className="flex items-baseline justify-between font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/45 mb-1.5">
                                        <span>Short description</span>
                                        <span className="tabular-nums text-white/25">{form.description.length} / 200</span>
                                    </span>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value.slice(0, 200) }))}
                                        rows={4}
                                        placeholder="Describe your list in a few sentences…"
                                        className="w-full px-3 py-2.5 rounded-[8px] bg-white/[0.04] border border-white/[0.1] text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] resize-none"
                                    />
                                </label>
                            </div>

                            <div className="space-y-4">
                                <label className="block">
                                    <span className="block font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/45 mb-1.5">Category</span>
                                    <select
                                        value={form.category}
                                        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                                        className="w-full h-10 px-3 rounded-[8px] bg-white/[0.04] border border-white/[0.1] text-[13px] text-white focus:outline-none cursor-pointer"
                                    >
                                        <option value="" className="bg-[var(--surface-1)]">Select category</option>
                                        {CATEGORIES.map((c) => <option key={c} value={c} className="bg-[var(--surface-1)]">{c}</option>)}
                                    </select>
                                </label>

                                <div>
                                    <span className="block font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/45 mb-1.5">
                                        Tags <span className="text-white/25">(up to 5)</span>
                                    </span>
                                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                        {form.tags.map((t) => (
                                            <span key={t} className="inline-flex items-center gap-1.5 h-[26px] pl-2.5 pr-1.5 rounded-full bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] text-[10.5px] font-bold text-[var(--accent)]">
                                                {t}
                                                <button onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }))} className="hover:text-white">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <input
                                        value={tagDraft}
                                        onChange={(e) => setTagDraft(e.target.value.slice(0, 24))}
                                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                                        onBlur={addTag}
                                        disabled={form.tags.length >= 5}
                                        placeholder={form.tags.length >= 5 ? "Five is the limit" : "Add a tag and press Enter…"}
                                        className="w-full h-10 px-3 rounded-[8px] bg-white/[0.04] border border-white/[0.1] text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] disabled:opacity-50"
                                    />
                                </div>
                            </div>
                        </div>
                    </Panel>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <Panel title="List Type" bodyClassName="p-5">
                            <div className="flex flex-wrap gap-2">
                                {TYPES.map((t) => {
                                    const on = form.list_type === t.id;
                                    // Switching down to a smaller type would orphan items — say so
                                    // rather than silently truncating the ranking.
                                    const blocked = t.limit !== null && items.length > t.limit;
                                    return (
                                        <button
                                            key={t.id}
                                            onClick={() => !blocked && setForm((f) => ({ ...f, list_type: t.id }))}
                                            disabled={blocked}
                                            title={blocked ? `Remove games first — ${t.label} holds ${t.limit}` : undefined}
                                            className={`h-9 px-4 rounded-full font-display text-[10.5px] font-bold uppercase tracking-[0.1em] border transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed ${
                                                on
                                                    ? "bg-[var(--accent)] border-transparent text-white"
                                                    : "bg-white/[0.03] border-white/[0.09] text-white/45 hover:text-white hover:border-white/25"
                                            }`}
                                        >
                                            {t.label}
                                        </button>
                                    );
                                })}
                            </div>
                            {limit !== null && (
                                <p className="mt-3 font-display text-[10px] font-bold uppercase tracking-[0.12em] tabular-nums text-white/30">
                                    {items.length} / {limit} games
                                </p>
                            )}
                        </Panel>

                        <Panel title="Visibility & Settings" bodyClassName="p-5 space-y-4">
                            <Toggle
                                icon={<Eye className="w-4 h-4" />}
                                title="Public list"
                                body="Anyone can view this list"
                                on={form.is_public}
                                onChange={(v) => setForm((f) => ({ ...f, is_public: v }))}
                            />
                            <Toggle
                                icon={<MessageSquare className="w-4 h-4" />}
                                title="Allow comments"
                                body="Let others comment on your list"
                                on={form.allow_comments}
                                onChange={(v) => setForm((f) => ({ ...f, allow_comments: v }))}
                            />
                            <Toggle
                                icon={<AlertTriangle className="w-4 h-4" />}
                                title="Spoiler warning"
                                body="Mark list as containing spoilers"
                                on={form.has_spoilers}
                                onChange={(v) => setForm((f) => ({ ...f, has_spoilers: v }))}
                            />
                        </Panel>
                    </div>

                    <GameSearch onAdd={addGame} disabled={full} limitLabel={full ? `This list holds ${limit}` : undefined} />

                    <Panel
                        title="Ranking Preview"
                        meta={<span className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">Drag to reorder</span>}
                        bodyClassName="p-4"
                    >
                        {items.length === 0 ? (
                            <p className="py-10 text-center text-[12.5px] text-white/30">
                                Add games above and they'll line up here, ready to rank.
                            </p>
                        ) : (
                            <div className="space-y-1.5">
                                {items.map((item, i) => (
                                    <div
                                        key={item.id}
                                        draggable
                                        onDragStart={() => { dragFrom.current = i; }}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={() => drop(i)}
                                        className="group flex items-center gap-3 p-2 rounded-[10px] border border-white/[0.07] bg-white/[0.02] hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)] transition-colors duration-300"
                                    >
                                        <GripVertical className="w-4 h-4 shrink-0 text-white/20 cursor-grab active:cursor-grabbing" />

                                        <span className="shrink-0 w-6 text-center font-display text-[14px] font-black tabular-nums text-white/60">
                                            {i + 1}
                                        </span>

                                        <span className="relative w-[46px] h-[32px] shrink-0 rounded-[6px] overflow-hidden bg-white/[0.04]">
                                            {item.game?.cover_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={item.game.cover_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="w-full h-full flex items-center justify-center text-white/20"><Gamepad2 className="w-3.5 h-3.5" /></span>
                                            )}
                                        </span>

                                        <span className="w-[150px] shrink-0 text-[12.5px] font-semibold text-white truncate">
                                            {item.game?.name}
                                        </span>

                                        <input
                                            value={item.note ?? ""}
                                            onChange={(e) => patchLocal(item.id, { note: e.target.value.slice(0, 300) })}
                                            onBlur={(e) => saveItem(item.id, { note: e.target.value.trim() || null })}
                                            placeholder={`Why this game ranks #${i + 1}…`}
                                            className="flex-1 min-w-0 h-9 px-3 rounded-[7px] bg-white/[0.03] border border-white/[0.08] text-[12px] text-white placeholder:text-white/20 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
                                        />

                                        <input
                                            type="number"
                                            step={0.1}
                                            min={1}
                                            max={10}
                                            value={item.score ?? ""}
                                            onChange={(e) => patchLocal(item.id, { score: e.target.value === "" ? null : Number(e.target.value) })}
                                            onBlur={(e) => saveItem(item.id, { score: e.target.value === "" ? null : Math.min(10, Math.max(1, Number(e.target.value))) })}
                                            placeholder="—"
                                            title="Score out of 10"
                                            className="w-[64px] shrink-0 h-9 px-2 rounded-[7px] bg-white/[0.03] border border-white/[0.08] font-display text-[13px] font-black tabular-nums text-center text-[var(--accent)] placeholder:text-white/20 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
                                        />

                                        <button
                                            onClick={() => removeItem(item.id)}
                                            title="Remove from list"
                                            className="shrink-0 p-1.5 rounded-[6px] text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>
                </div>

                {/* ── right: what it will look like, and how to make it good ── */}
                <aside className="xl:col-span-4 min-w-0 space-y-5">
                    <Panel title="Public Preview" bodyClassName="p-4">
                        <PreviewCard form={form} list={list} items={items} username={username} />
                    </Panel>

                    <Panel title="List Tips" bodyClassName="p-4">
                        <ul className="space-y-2.5">
                            {TIPS.map((tip) => (
                                <li key={tip} className="flex gap-2.5 text-[12px] text-white/50 leading-snug">
                                    <span aria-hidden className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </Panel>

                    <CommunityInspiration />
                </aside>
            </div>
        </div>
    );
}

/* ── live preview ─────────────────────────────────────────────────────── */

function PreviewCard({
    form,
    list,
    items,
    username }: {
    form: { name: string; description: string; list_type: ListType; has_spoilers: boolean };
    list: GameListDetail;
    items: GameListItemEntry[];
    username: string;
}) {
    const cover = items[0]?.game?.cover_url ?? null;
    const typeLabel = TYPES.find((t) => t.id === form.list_type)?.label;

    return (
        <div className="relative rounded-[12px] overflow-hidden border border-white/[0.07] bg-[var(--surface-1)] min-h-[190px] flex flex-col justify-end">
            {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-70" />
            ) : (
                <span aria-hidden className="absolute inset-0 bg-white/[0.03]" />
            )}
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20" />

            <span className="absolute top-3 left-3 flex items-center gap-1.5">
                {typeLabel && form.list_type !== "custom" && (
                    <span className="inline-flex items-center h-[20px] px-2 rounded-[4px] bg-[var(--accent)] font-display text-[8.5px] font-black uppercase tracking-[0.12em] text-white">
                        {typeLabel}
                    </span>
                )}
                {form.has_spoilers && (
                    <span className="inline-flex items-center gap-1 h-[20px] px-2 rounded-[4px] bg-amber-500/20 border border-amber-500/40 font-display text-[8.5px] font-black uppercase tracking-[0.12em] text-amber-400">
                        <AlertTriangle className="w-2.5 h-2.5" /> Spoilers
                    </span>
                )}
            </span>

            <div className="relative p-4">
                <p className="font-display text-[17px] font-black text-white leading-tight line-clamp-2">
                    {form.name || "Your list title"}
                </p>
                {form.description && (
                    <p className="mt-1.5 text-[11.5px] text-white/55 leading-snug line-clamp-2">{form.description}</p>
                )}

                <div className="mt-3 flex items-center gap-3">
                    <span className="text-[11px] font-semibold text-white/70">@{username}</span>
                    <span className="flex items-center gap-3 font-display text-[10px] font-bold tabular-nums text-white/35">
                        <span className="inline-flex items-center gap-1"><Heart className="w-3 h-3" /> {list.likes_count ?? 0}</span>
                        <span className="inline-flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {list.comments_count ?? 0}</span>
                        <span className="inline-flex items-center gap-1"><Trophy className="w-3 h-3" /> {items.length}</span>
                    </span>
                </div>
            </div>
        </div>
    );
}

/* ── game search ──────────────────────────────────────────────────────── */

function GameSearch({ onAdd, disabled, limitLabel }: { onAdd: (slug: string) => void; disabled: boolean; limitLabel?: string }) {
    const [term, setTerm] = useState("");
    const [busy, setBusy] = useState<string | null>(null);

    const { data, isLoading } = useSWR(
        term.trim().length >= 2 ? `/games?search=${encodeURIComponent(term.trim())}&page_size=12` : null,
        fetcher,
    );
    const results = data?.results ?? [];

    const add = async (slug: string) => {
        setBusy(slug);
        await onAdd(slug);
        setBusy(null);
    };

    return (
        <Panel
            title="Add Games"
            meta={limitLabel ? <span className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-amber-400">{limitLabel}</span> : undefined}
            bodyClassName="p-4"
        >
            <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    disabled={disabled}
                    placeholder={disabled ? "This list is full — remove a game to add another" : "Search for games to add…"}
                    className="w-full h-10 pl-9 pr-3 rounded-[8px] bg-white/[0.04] border border-white/[0.1] text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] disabled:opacity-50"
                />
            </div>

            {term.trim().length < 2 ? (
                <p className="py-6 text-center text-[12px] text-white/25">Type at least 2 characters to search.</p>
            ) : isLoading ? (
                <div className="flex justify-center py-6 text-white/40"><Loader2 className="w-5 h-5 animate-spin" /></div>
            ) : results.length === 0 ? (
                <p className="py-6 text-center text-[12px] text-white/25">No games found.</p>
            ) : (
                <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
                    {results.map((g: any) => (
                        <div key={g.id} className="group relative w-[124px] shrink-0 rounded-[10px] overflow-hidden border border-white/[0.07] bg-white/[0.02]">
                            <span className="relative block aspect-[3/4] bg-white/[0.03]">
                                {g.cover_url && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={g.cover_url} alt={g.name} loading="lazy" className="w-full h-full object-cover" />
                                )}
                                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                                <span className="absolute inset-x-0 bottom-0 p-2">
                                    <span className="block text-[11px] font-bold text-white leading-tight line-clamp-2">{g.name}</span>
                                    {g.released && (
                                        <span className="block mt-0.5 font-display text-[9px] font-bold tabular-nums text-white/35">
                                            {new Date(g.released).getFullYear()}
                                        </span>
                                    )}
                                </span>
                            </span>
                            <button
                                onClick={() => add(g.slug)}
                                disabled={disabled || busy === g.slug}
                                title="Add to list"
                                className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-[var(--accent)] hover:brightness-110 disabled:opacity-50 flex items-center justify-center text-white transition-[filter]"
                            >
                                {busy === g.slug ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-4 h-4" />}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </Panel>
    );
}

/* ── community inspiration ────────────────────────────────────────────── */

/**
 * What other people ranked.
 *
 * Two shapes for two places: a narrow rail beside the editor, where it is a
 * reference while you work, and a wide row under your own lists, where it is
 * the reason to keep reading rather than a footnote in a sidebar.
 */
export function CommunityInspiration({ variant = "rail" }: { variant?: "rail" | "row" }) {
    const limit = variant === "row" ? 4 : 5;
    const { data } = useSWR<{ data: GameListPreview[] }>(`/game-lists/discover?limit=${limit}`, fetcher, {
        revalidateOnFocus: false });
    const lists = data?.data ?? [];

    if (!lists.length) return null;

    return (
        <Panel
            title={variant === "row" ? "What others ranked" : "Community Inspiration"}
            action={{ label: "View all", href: "/lists" }}
            bodyClassName="p-3"
        >
            <div className={variant === "row"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2"
                : "flex flex-col gap-0.5"}>
                {lists.map((l) => (
                    <Link
                        key={l.id}
                        href={`/lists/${l.user?.username}/${l.slug}`}
                        className="group flex items-center gap-3 p-2 rounded-[10px] border border-transparent hover:border-[color-mix(in_srgb,var(--accent)_30%,transparent)] hover:bg-[var(--fill-1)] transition-colors duration-300"
                    >
                        <span className="relative w-[52px] h-[40px] shrink-0 rounded-[6px] overflow-hidden bg-white/[0.04]">
                            {l.covers?.[0] && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={l.covers[0]} alt="" className="w-full h-full object-cover" />
                            )}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-[12px] font-bold text-white leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                                {l.name}
                            </span>
                            <span className="mt-1 flex items-center gap-2.5 font-display text-[9.5px] font-bold tabular-nums text-white/30">
                                <span>@{l.user?.username}</span>
                                <span className="inline-flex items-center gap-1"><Heart className="w-2.5 h-2.5" /> {l.likes_count ?? 0}</span>
                                <span className="inline-flex items-center gap-1"><MessageSquare className="w-2.5 h-2.5" /> {l.comments_count ?? 0}</span>
                            </span>
                        </span>
                        {l.list_type && l.list_type !== "custom" && (
                            <span className="shrink-0 inline-flex items-center h-[18px] px-1.5 rounded-[4px] bg-[var(--accent)] font-display text-[8px] font-black uppercase tracking-[0.1em] text-white">
                                {TYPES.find((t) => t.id === l.list_type)?.label}
                            </span>
                        )}
                    </Link>
                ))}
            </div>
        </Panel>
    );
}
