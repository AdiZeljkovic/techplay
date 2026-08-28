"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import { Library, Loader2, Check, Gamepad2 } from "lucide-react";
import Select from "@/components/ui/Select";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

/**
 * Fill a list from the shelf you already have.
 *
 * Four of the first seven lists on this site were empty. A starter names the
 * list and picks its shape and then leaves you in front of a search box —
 * and somebody with 280 games in their library was being asked to find their
 * own games again inside a catalogue of 332,455.
 *
 * The status filter is the point rather than a nicety: "everything I finished"
 * and "everything still in the backlog" are the two lists most people actually
 * want to make, and both are one filter and one Add away.
 */

interface Entry {
    status: string;
    game?: { slug: string; name: string; cover_url: string | null } | null;
}

const STATUSES = [
    { value: "", label: "Whole library" },
    { value: "playing", label: "Playing" },
    { value: "played", label: "Played" },
    { value: "completed", label: "Completed" },
    { value: "backlog", label: "Backlog" },
    { value: "wishlist", label: "Wishlist" },
];

export default function LibraryPicker({
    username,
    /** Slugs already on the list — they are shown as taken rather than hidden. */
    taken,
    room,
    onAdd,
}: {
    username: string;
    taken: Set<string>;
    /** How many more the list may hold, or null when unbounded. */
    room: number | null;
    onAdd: (slugs: string[]) => Promise<void>;
}) {
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState("");
    const [picked, setPicked] = useState<Set<string>>(new Set());
    const [busy, setBusy] = useState(false);

    const { data, isLoading } = useSWR<{ data: Entry[] }>(
        open ? `/users/${username}/collection?page_size=60${status ? `&status=${status}` : ""}` : null,
        fetcher,
        { revalidateOnFocus: false },
    );

    const rows = useMemo(
        () => (data?.data ?? []).filter((e): e is Entry & { game: NonNullable<Entry["game"]> } => Boolean(e.game)),
        [data],
    );

    const toggle = (slug: string) =>
        setPicked((prev) => {
            const next = new Set(prev);
            if (next.has(slug)) next.delete(slug);
            else if (room === null || next.size < room) next.add(slug);
            return next;
        });

    const commit = async () => {
        if (picked.size === 0) return;
        setBusy(true);
        try {
            await onAdd([...picked]);
            setPicked(new Set());
        } finally {
            setBusy(false);
        }
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-[10px] border border-dashed border-white/[0.14] bg-white/[0.02] font-display text-[10.5px] font-bold uppercase tracking-[0.1em] text-white/55 hover:text-white hover:border-white/25 transition-colors"
            >
                <Library className="w-4 h-4" /> Add from your library
            </button>
        );
    }

    return (
        <div className="rounded-[12px] border border-white/[0.09] bg-[var(--surface-1)] p-4">
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <p className="flex items-center gap-2 font-display text-[10px] font-black uppercase tracking-[0.14em] text-white/45">
                    <Library className="w-3.5 h-3.5 text-[var(--accent)]" /> Your library
                </p>

                <Select
                    value={status}
                    onChange={(v) => { setStatus(v); setPicked(new Set()); }}
                    ariaLabel="Filter your library"
                    options={STATUSES}
                    className="h-8 px-3 text-[12px] ml-auto"
                    menuClassName="w-[170px]"
                    align="end"
                />

                <button
                    type="button"
                    onClick={() => { setOpen(false); setPicked(new Set()); }}
                    className="h-8 px-3 rounded-[8px] bg-white/[0.04] border border-white/[0.09] font-display text-[10px] font-bold uppercase tracking-[0.1em] text-white/50 hover:text-white transition-colors"
                >
                    Close
                </button>
            </div>

            {isLoading ? (
                <p className="flex items-center justify-center gap-2 py-10 text-[12.5px] text-white/50">
                    <Loader2 className="w-4 h-4 animate-spin" /> Reading your shelf…
                </p>
            ) : rows.length === 0 ? (
                <p className="py-10 text-center text-[12.5px] text-white/50">
                    Nothing here under that filter.
                </p>
            ) : (
                <div className="max-h-[320px] overflow-y-auto -mx-1 px-1">
                    <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2">
                        {rows.map((e) => {
                            const already = taken.has(e.game.slug);
                            const on = picked.has(e.game.slug);

                            return (
                                <button
                                    key={e.game.slug}
                                    type="button"
                                    disabled={already}
                                    onClick={() => toggle(e.game.slug)}
                                    title={already ? `${e.game.name} — already on the list` : e.game.name}
                                    className={`group relative aspect-[3/4] rounded-[7px] overflow-hidden border transition-all ${
                                        already
                                            ? "border-white/[0.06] opacity-30 cursor-not-allowed"
                                            : on
                                                ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/40"
                                                : "border-white/[0.09] hover:border-white/30"
                                    }`}
                                >
                                    {e.game.cover_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={e.game.cover_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="w-full h-full flex items-center justify-center bg-[var(--fill-1)]">
                                            <Gamepad2 className="w-4 h-4 text-white/20" />
                                        </span>
                                    )}

                                    <span className="absolute inset-x-0 bottom-0 px-1 pt-3 pb-1 bg-gradient-to-t from-black/90 to-transparent">
                                        <span className="block text-[8px] leading-tight font-semibold text-white/85 line-clamp-2">
                                            {e.game.name}
                                        </span>
                                    </span>

                                    {(on || already) && (
                                        <span
                                            className="absolute top-1 right-1 w-[18px] h-[18px] rounded-full flex items-center justify-center"
                                            style={{ background: already ? "rgba(255,255,255,0.15)" : "var(--accent)" }}
                                        >
                                            <Check className="w-2.5 h-2.5 text-white" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="mt-3 flex items-center justify-between gap-3">
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] tabular-nums text-white/50">
                    {picked.size} picked
                    {room !== null && <span className="text-white/45"> · room for {room}</span>}
                </span>

                <button
                    type="button"
                    onClick={commit}
                    disabled={picked.size === 0 || busy}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-[8px] bg-[var(--accent)] hover:brightness-110 disabled:opacity-35 disabled:cursor-not-allowed font-display text-[10.5px] font-bold uppercase tracking-[0.08em] text-white transition-[filter,opacity]"
                >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Add to list
                </button>
            </div>
        </div>
    );
}
