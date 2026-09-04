"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { ArrowLeft, Rocket, Save, Search, Plus, X, GripVertical, Loader2, Eye, MessageSquare, Heart, Gamepad2, Trophy, ChevronUp, ChevronDown } from "lucide-react";
import Panel from "@/components/ui/Panel";
import type { GameListDetail, GameListItemEntry, GameListPreview, ListType, Tier } from "@/lib/types/profile";
import Select from "@/components/ui/Select";
import TierBoard from "@/components/profile/TierBoard";
import LibraryPicker from "@/components/profile/LibraryPicker";
import ImageDropzone from "@/components/settings/ImageDropzone";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

const TYPES: { id: ListType; label: string; limit: number | null }[] = [
    { id: "top10", label: "Top 10", limit: 10 },
    { id: "top25", label: "Top 25", limit: 25 },
    { id: "top100", label: "Top 100", limit: 100 },
    { id: "genre", label: "Genre List", limit: null },
    { id: "custom", label: "Custom Ranking", limit: null },
    { id: "tier", label: "Tier List (S–F)", limit: null },
];

/*
 * Genres, then the one option that is not a genre.
 *
 * "Mixed" is last on purpose. Most lists worth writing do not sit inside a
 * single genre — a favourites-of-the-year list, a comfort-games list — and
 * before this the only honest answer was to leave the field empty, which
 * reads as unfinished rather than as a choice.
 */
const CATEGORIES = ["RPG", "Action", "Adventure", "Shooter", "Strategy", "Horror", "Indie", "Sports", "Racing", "Simulation", "Mixed"];

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
                <span className="block text-[11px] text-white/50 leading-snug">{body}</span>
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
    });
    const [tagDraft, setTagDraft] = useState("");
    const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
    const [items, setItems] = useState<GameListItemEntry[]>([]);
    const dragFrom = useRef<number | null>(null);
    // Held in state, not a ref, because the whole point is that you can see
    // where the row will land. Dragging with no feedback at all is why the
    // reorder read as broken even when it worked.
    const [dragging, setDragging] = useState<number | null>(null);
    const [over, setOver] = useState<number | null>(null);
    /** The saved artwork's URL, kept here so the dropzone updates the moment it lands. */
    const [cover, setCover] = useState<string | null>(null);

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
            allow_comments: list.allow_comments ?? true });
        setCover(list.cover_image ?? null);
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

    /** A batch from the library — one request, and the server says what fitted. */
    const addFromLibrary = async (slugs: string[]) => {
        try {
            const res = await axios.post(`${key}/items/bulk`, { slugs });
            toast.success(res.data?.message ?? "Added.");
            mutate();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Couldn't add those.");
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

    /**
     * The list's own artwork.
     *
     * Sent to its own endpoint as multipart: a file cannot ride the PUT that
     * saves the rest of the form, and taking the picture off is a different
     * act from editing a name.
     */
    const [coverBusy, setCoverBusy] = useState(false);

    const sendCover = async (body: FormData) => {
        setCoverBusy(true);
        try {
            const res = await axios.post(`${key}/cover`, body, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setCover(res.data?.data?.cover_image ?? null);
            mutate();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Couldn't save that image.");
        } finally {
            setCoverBusy(false);
        }
    };

    const uploadCover = (file: File) => {
        const body = new FormData();
        body.append("cover_image", file);
        return sendCover(body);
    };

    const clearCover = () => {
        const body = new FormData();
        body.append("remove_cover", "1");
        return sendCover(body);
    };

    /**
     * Put a game on a rung, or send it back to the tray.
     *
     * Optimistic, because a tier list is made by moving twenty cards in a
     * minute and a card that waits for the network before it lands makes the
     * board feel broken.
     */
    const assignTier = async (itemId: number, tier: Tier | null) => {
        setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, tier } : i)));
        try {
            await axios.put(`${key}/items/${itemId}`, { tier });
        } catch {
            toast.error("Couldn't move that one.");
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

    /**
     * Move one entry to a new rank.
     *
     * Reordering was drag-and-drop only, and HTML5 drag events do not fire on
     * touch at all — so on a phone the ranking could be built and never
     * ranked. The arrows are the same call, and they are also the only way to
     * do this from a keyboard.
     */
    const move = async (from: number, to: number) => {
        if (from === to || to < 0 || to >= items.length) return;

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

    const drop = async (to: number) => {
        const from = dragFrom.current;
        dragFrom.current = null;
        setDragging(null);
        setOver(null);
        if (from !== null) await move(from, to);
    };

    if (!list) {
        return <div className="h-[60vh] rounded-[var(--radius-panel)] bg-[var(--fill-2)] animate-pulse" />;
    }

    return (
        <div>
            {/* ── header ──

                The title is the header. It used to be a field in the first of
                four settings panels, under a heading that said "Create New
                List" — so the page announced itself and buried the one thing
                that names it. Typing here is the first thing you do, and it is
                the thing you see on every visit after. */}
            <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <button
                            onClick={onClose}
                            className="inline-flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/55 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to lists
                        </button>
                        <span
                            className="inline-flex items-center h-[19px] px-2 rounded-[4px] font-display text-[8px] font-black uppercase tracking-[0.12em]"
                            style={list.is_draft
                                ? { background: "rgba(251,191,36,0.18)", color: "#fbbf24" }
                                : { background: "rgba(52,211,153,0.16)", color: "#34d399" }}
                        >
                            {list.is_draft ? "Draft" : "Published"}
                        </span>
                    </div>
                    <input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.slice(0, 80) }))}
                        placeholder="Name this list…"
                        aria-label="List title"
                        className="w-full max-w-[560px] bg-transparent border-0 border-b border-transparent hover:border-white/[0.09] focus:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] font-display text-[26px] font-black text-white leading-tight placeholder:text-white/20 focus:outline-none transition-colors py-0.5"
                    />
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
                {/* ── left: the work ──

                    Adding games and ranking them is what this screen is for,
                    and both used to sit at the bottom, under four panels of
                    settings you had to scroll past every time. The settings
                    are set once; the ranking is the reason you came back. */}
                <div className="xl:col-span-8 min-w-0 space-y-5">
                    <GameSearch onAdd={addGame} disabled={full} limitLabel={full ? `This list holds ${limit}` : undefined} />

                    {/* The other way in. Searching the catalogue is right for a
                        game you do not own; for the 280 you do, it is the wrong
                        question. */}
                    {!full && (
                        <LibraryPicker
                            username={username}
                            taken={new Set(items.map((i) => i.game?.slug).filter(Boolean) as string[])}
                            room={limit === null ? null : Math.max(0, limit - items.length)}
                            onAdd={addFromLibrary}
                        />
                    )}

                    <Panel
                        title="The ranking"
                        meta={
                            <span className="font-display text-[10px] font-bold uppercase tracking-[0.12em] tabular-nums text-white/50">
                                {items.length}{limit !== null ? ` / ${limit}` : ""} games
                            </span>
                        }
                        bodyClassName="p-3"
                    >
                        {items.length === 0 ? (
                            <div className="py-8 px-4 text-center">
                                <p className="text-[12.5px] text-white/50">Add games above and they line up here, ready to rank.</p>
                                {/* The advice used to be a panel of its own in the
                                    sidebar, permanently, which is where writing
                                    nobody reads goes. It belongs in the moment
                                    the page is still blank. */}
                                <ul className="mt-4 inline-flex flex-col gap-2 text-left">
                                    {TIPS.map((tip) => (
                                        <li key={tip} className="flex gap-2.5 max-w-[420px] text-[11.5px] text-white/55 leading-snug">
                                            <span aria-hidden className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : form.list_type === "tier" ? (
                            /* A tier list is not a running order, so it does not
                               get the ranked rows — the board is the editor. */
                            <TierBoard
                                items={items}
                                editable
                                onAssign={assignTier}
                                onRemove={removeItem}
                            />
                        ) : (
                            <div className="space-y-1.5">
                                {items.map((item, i) => (
                                    <div
                                        key={item.id}
                                        draggable
                                        onDragStart={() => { dragFrom.current = i; setDragging(i); }}
                                        onDragEnd={() => { dragFrom.current = null; setDragging(null); setOver(null); }}
                                        onDragOver={(e) => { e.preventDefault(); if (over !== i) setOver(i); }}
                                        onDrop={() => drop(i)}
                                        className={`group relative flex gap-3 p-2.5 rounded-[10px] border transition-[border-color,opacity] duration-200 ${
                                            dragging === i
                                                ? "opacity-40 border-[color-mix(in_srgb,var(--accent)_55%,transparent)] bg-[var(--accent-soft)]"
                                                : "border-white/[0.07] bg-white/[0.02] hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)]"
                                        }`}
                                    >
                                        {/* where it will land */}
                                        {over === i && dragging !== null && dragging !== i && (
                                            <span
                                                aria-hidden
                                                className={`absolute inset-x-2 h-[2px] rounded-full bg-[var(--accent)] ${dragging > i ? "-top-1" : "-bottom-1"}`}
                                            />
                                        )}

                                        <GripVertical className="w-4 h-4 shrink-0 self-center text-white/20 cursor-grab active:cursor-grabbing" />

                                        <span
                                            className="shrink-0 self-center w-7 text-center font-display text-[16px] font-black tabular-nums leading-none"
                                            style={{ color: i < 3 ? "var(--accent-ink)" : "rgba(255,255,255,0.35)" }}
                                        >
                                            {i + 1}
                                        </span>

                                        <span className="relative w-[44px] shrink-0 aspect-[3/4] rounded-[6px] overflow-hidden bg-white/[0.04] border border-white/[0.06]">
                                            {item.game?.cover_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={item.game.cover_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="w-full h-full flex items-center justify-center text-white/20"><Gamepad2 className="w-3.5 h-3.5" /></span>
                                            )}
                                        </span>

                                        {/* The note gets its own line. Sharing one
                                            with a 150px name and a score box left it
                                            about eleven characters wide, which is
                                            not room for the argument that is the
                                            whole reason this is a list. */}
                                        <div className="min-w-0 flex-1 flex flex-col justify-center gap-1.5">
                                            <p className="flex items-baseline gap-2 min-w-0">
                                                <span className="text-[13px] font-bold text-white truncate">{item.game?.name}</span>
                                                {item.game?.released && (
                                                    <span className="shrink-0 font-display text-[9.5px] font-bold uppercase tracking-[0.1em] tabular-nums text-white/45">
                                                        {item.game.released.slice(0, 4)}
                                                    </span>
                                                )}
                                            </p>
                                            <input
                                                value={item.note ?? ""}
                                                onChange={(e) => patchLocal(item.id, { note: e.target.value.slice(0, 300) })}
                                                onBlur={(e) => saveItem(item.id, { note: e.target.value.trim() || null })}
                                                placeholder={`Why this game ranks #${i + 1}…`}
                                                className="w-full h-8 px-2.5 rounded-[6px] bg-white/[0.03] border border-white/[0.08] text-[12px] text-white placeholder:text-white/45 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
                                            />
                                        </div>

                                        <div className="shrink-0 self-center flex items-center gap-1.5">
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
                                                className="w-[58px] h-9 px-2 rounded-[7px] bg-white/[0.03] border border-white/[0.08] font-display text-[13px] font-black tabular-nums text-center text-[var(--accent)] placeholder:text-white/45 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
                                            />

                                            {/* Drag events never fire on touch, so on a
                                                phone the ranking could be built and
                                                never ranked. These are also the only
                                                way to do it from a keyboard. */}
                                            <span className="flex flex-col gap-0.5">
                                                <button
                                                    onClick={() => move(i, i - 1)}
                                                    disabled={i === 0}
                                                    aria-label={`Move ${item.game?.name ?? "this game"} up`}
                                                    className="w-6 h-[17px] rounded-[4px] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                                                >
                                                    <ChevronUp className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => move(i, i + 1)}
                                                    disabled={i === items.length - 1}
                                                    aria-label={`Move ${item.game?.name ?? "this game"} down`}
                                                    className="w-6 h-[17px] rounded-[4px] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                                                >
                                                    <ChevronDown className="w-3.5 h-3.5" />
                                                </button>
                                            </span>

                                            <button
                                                onClick={() => removeItem(item.id)}
                                                title="Remove from list"
                                                className="p-1.5 rounded-[6px] text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>
                </div>

                {/* ── right: what it is, and what it will look like ── */}
                <aside className="xl:col-span-4 min-w-0 space-y-5">
                    <Panel title="Details" material="instrument" bodyClassName="p-4 space-y-4">
                        {/* The picture the list is published under. Without one
                            the page falls back to a strip of its game covers,
                            which says "a list of games" and nothing about which
                            list — "Hall of Shame" and "Comfort Games" holding the
                            same four titles looked identical. */}
                        <div>
                            <span className="flex items-baseline justify-between font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/45 mb-1.5">
                                <span>Featured image</span>
                                {coverBusy && <Loader2 className="w-3 h-3 animate-spin text-white/35" />}
                            </span>
                            <ImageDropzone
                                shape="cover"
                                label="List artwork"
                                hint="Wide image, up to 5 MB — JPG, PNG or WebP"
                                preview={cover}
                                onFile={uploadCover}
                                onClear={cover ? clearCover : undefined}
                            />
                        </div>

                        <label className="block">
                            <span className="flex items-baseline justify-between font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/45 mb-1.5">
                                <span>Short description</span>
                                <span className="tabular-nums text-white/45">{form.description.length} / 200</span>
                            </span>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value.slice(0, 200) }))}
                                rows={3}
                                placeholder="What is this list arguing for?"
                                className="w-full px-3 py-2.5 rounded-[8px] bg-white/[0.04] border border-white/[0.1] text-[13px] text-white placeholder:text-white/45 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] resize-none"
                            />
                        </label>

                        <label className="block">
                            <span className="block font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/45 mb-1.5">Category</span>
                            <div className="relative">
                                <Select
                                    value={form.category}
                                    onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                                    ariaLabel="Category"
                                    placeholder="Select category"
                                    options={CATEGORIES.map((c) => ({
                                        value: c,
                                        // The only entry that needs saying out
                                        // loud: on its own "Mixed" could mean
                                        // mixed quality rather than mixed genre.
                                        label: c === "Mixed" ? "Mixed / Various genres" : c,
                                    }))}
                                    className="w-full h-10 px-3 text-[13px] text-white"
                                />
                            </div>
                        </label>

                        <div>
                            <span className="block font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/45 mb-1.5">
                                Tags <span className="text-white/45">(up to 5)</span>
                            </span>
                            {form.tags.length > 0 && (
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
                            )}
                            <input
                                value={tagDraft}
                                onChange={(e) => setTagDraft(e.target.value.slice(0, 24))}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                                onBlur={addTag}
                                disabled={form.tags.length >= 5}
                                placeholder={form.tags.length >= 5 ? "Five is the limit" : "Add a tag and press Enter…"}
                                className="w-full h-10 px-3 rounded-[8px] bg-white/[0.04] border border-white/[0.1] text-[13px] text-white placeholder:text-white/45 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] disabled:opacity-50"
                            />
                        </div>
                    </Panel>

                    <Panel
                        title="List type"
                        material="instrument"
                        meta={limit !== null
                            ? <span className="font-display text-[10px] font-bold uppercase tracking-[0.12em] tabular-nums text-white/50">{items.length} / {limit}</span>
                            : undefined}
                        bodyClassName="p-4"
                    >
                        <div className="flex flex-wrap gap-1.5">
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
                                        className={`h-8 px-3 rounded-[7px] font-display text-[10px] font-bold uppercase tracking-[0.1em] border transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed ${
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
                    </Panel>

                    <Panel title="Visibility" material="instrument" bodyClassName="p-4 space-y-4">
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
                    </Panel>

                    <Panel title="Public preview" bodyClassName="p-4">
                        <PreviewCard form={form} cover={cover} list={list} items={items} username={username} />
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
    cover,
    list,
    items,
    username }: {
    form: { name: string; description: string; list_type: ListType };
    /** The list's own artwork, so the preview shows what will actually publish. */
    cover: string | null;
    list: GameListDetail;
    items: GameListItemEntry[];
    username: string;
}) {
    // Same order of preference the published page uses: the author's artwork
    // first, the top game's cover only as a stand-in.
    const art = cover ?? items[0]?.game?.cover_url ?? null;
    const typeLabel = TYPES.find((t) => t.id === form.list_type)?.label;

    return (
        <div className="relative rounded-[12px] overflow-hidden border border-white/[0.07] bg-[var(--surface-1)] min-h-[190px] flex flex-col justify-end">
            {art ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={art} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-70" />
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
                    <span className="flex items-center gap-3 font-display text-[10px] font-bold tabular-nums text-white/50">
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
                    className="w-full h-10 pl-9 pr-3 rounded-[8px] bg-white/[0.04] border border-white/[0.1] text-[13px] text-white placeholder:text-white/45 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] disabled:opacity-50"
                />
            </div>

            {term.trim().length < 2 ? (
                <p className="py-6 text-center text-[12px] text-white/45">Type at least 2 characters to search.</p>
            ) : isLoading ? (
                <div className="flex justify-center py-6 text-white/40"><Loader2 className="w-5 h-5 animate-spin" /></div>
            ) : results.length === 0 ? (
                <p className="py-6 text-center text-[12px] text-white/45">No games found.</p>
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
                                        <span className="block mt-0.5 font-display text-[9px] font-bold tabular-nums text-white/50">
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
            material="matte"
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
                            <span className="mt-1 flex items-center gap-2.5 font-display text-[9.5px] font-bold tabular-nums text-white/50">
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
