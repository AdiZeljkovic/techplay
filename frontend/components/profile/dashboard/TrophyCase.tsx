"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { Trophy, Pin, X, Loader2, Search, Check } from "lucide-react";
import { getStorageUrl } from "@/lib/imageUrl";
import type { TrophyCaseItem } from "@/lib/types/profile";

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data);

const CAPACITY = 5;

interface Props {
    username: string;
    isOwnProfile: boolean;
    /** What the profile payload already shipped — no second request to draw it. */
    initial: TrophyCaseItem[];
    /**
     * Recent unlocks, used only while nothing is arranged.
     *
     * Almost nobody has arranged a case yet, and a visitor should not meet a
     * blank where achievements used to be. The heading changes with it: these
     * are what happened last, and the page says so rather than passing a
     * sorting off as a choice.
     */
    fallback?: TrophyCaseItem[];
}

/** Steam icons are absolute URLs; ours are storage paths. */
function iconSrc(item: TrophyCaseItem) {
    return item.icon?.startsWith("http") ? item.icon : getStorageUrl(item.icon ?? "");
}

/* ── one shelf ────────────────────────────────────────────────────────── */

function Slot({ item, onClear }: { item: TrophyCaseItem; onClear?: () => void }) {
    return (
        <div className="group/slot relative flex flex-col items-center text-center rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--fill-1)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] p-4 transition-colors duration-300">
            {onClear && (
                <button
                    onClick={onClear}
                    aria-label={`Remove ${item.name} from your case`}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white/40 opacity-0 group-hover/slot:opacity-100 hover:text-red-400 transition-all duration-200"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}

            <span className="relative w-14 h-14 mb-3 flex items-center justify-center">
                {item.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={iconSrc(item)}
                        alt=""
                        aria-hidden
                        className="w-14 h-14 object-contain drop-shadow-[0_3px_10px_rgba(0,0,0,0.6)]"
                    />
                ) : (
                    <Trophy className="w-7 h-7 text-[var(--accent)]" />
                )}

                {/* Where it came from. A Steam unlock and one of ours mean
                    different things, and the shelf holds both. */}
                {item.source === "steam" && (
                    <span className="absolute -bottom-0.5 -right-0.5 px-1.5 h-[15px] rounded-full bg-[#1b2838] border border-white/15 flex items-center font-display text-[8px] font-black uppercase tracking-[0.08em] text-white/70">
                        Steam
                    </span>
                )}
            </span>

            <p className="font-display text-[12px] font-bold text-white leading-tight line-clamp-2">{item.name}</p>

            {item.game ? (
                <Link
                    href={`/games/${item.game.slug}`}
                    className="mt-1 text-[10px] text-white/30 hover:text-[var(--accent)] transition-colors line-clamp-1"
                >
                    {item.game.name}
                </Link>
            ) : item.points != null ? (
                <span className="mt-1 font-display text-[10px] font-black tabular-nums text-[var(--accent)]">{item.points} pts</span>
            ) : null}
        </div>
    );
}

/* ── the picker ───────────────────────────────────────────────────────── */

function Picker({
    current, onCancel, onSave,
}: {
    current: TrophyCaseItem[];
    onCancel: () => void;
    onSave: (picks: TrophyCaseItem[]) => Promise<void>;
}) {
    const { data, isLoading } = useSWR<{ items: TrophyCaseItem[] }>("/me/trophy-case/available", fetcher);
    const [picked, setPicked] = useState<TrophyCaseItem[]>(current);
    const [query, setQuery] = useState("");
    const [saving, setSaving] = useState(false);

    const key = (i: TrophyCaseItem) => `${i.source}:${i.reference}`;
    const chosen = useMemo(() => new Set(picked.map(key)), [picked]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        const all = data?.items ?? [];

        return q ? all.filter((i) => i.name.toLowerCase().includes(q) || i.game?.name.toLowerCase().includes(q)) : all;
    }, [data, query]);

    const toggle = (item: TrophyCaseItem) => {
        setPicked((prev) => {
            if (prev.some((p) => key(p) === key(item))) {
                return prev.filter((p) => key(p) !== key(item));
            }

            if (prev.length >= CAPACITY) {
                toast.error(`A case holds ${CAPACITY}. Remove one first.`);
                return prev;
            }

            return [...prev, item];
        });
    };

    const save = async () => {
        setSaving(true);
        try {
            await onSave(picked);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-0)] p-4">
            <div className="flex flex-wrap items-center gap-3 mb-3.5">
                <p className="font-display text-[10.5px] font-black uppercase tracking-[0.14em] text-white/45">
                    Picked <span className="text-[var(--accent)] tabular-nums">{picked.length}</span> / {CAPACITY}
                </p>

                <div className="relative ml-auto">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search your unlocks…"
                        className="h-8 w-[200px] pl-8 pr-3 rounded-[7px] bg-white/[0.04] border border-white/[0.08] text-[12px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
                    />
                </div>

                <button onClick={onCancel} className="h-8 px-3.5 rounded-[7px] bg-white/[0.04] hover:bg-white/[0.09] font-display text-[10.5px] font-bold uppercase tracking-[0.08em] text-white/60 transition-colors">
                    Cancel
                </button>
                <button
                    onClick={save}
                    disabled={saving}
                    className="inline-flex items-center gap-2 h-8 px-4 rounded-[7px] bg-[var(--accent)] hover:brightness-110 font-display text-[10.5px] font-bold uppercase tracking-[0.08em] text-white transition-[filter] disabled:opacity-60"
                >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save case
                </button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {[...Array(10)].map((_, i) => <div key={i} className="h-[64px] rounded-[8px] bg-white/[0.04] animate-pulse" />)}
                </div>
            ) : visible.length === 0 ? (
                <p className="py-6 text-center text-[12px] text-white/30">
                    {query ? "Nothing matches that." : "Unlock an achievement and it lands here."}
                </p>
            ) : (
                <div className="max-h-[320px] overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {visible.map((item) => {
                        const on = chosen.has(key(item));

                        return (
                            <button
                                key={key(item)}
                                onClick={() => toggle(item)}
                                aria-pressed={on}
                                className={`flex items-center gap-3 p-2.5 rounded-[8px] border text-left transition-colors duration-200 ${
                                    on
                                        ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                                        : "border-white/[0.07] bg-white/[0.02] hover:border-white/20"
                                }`}
                            >
                                <span className="w-9 h-9 shrink-0 flex items-center justify-center">
                                    {item.icon ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={iconSrc(item)} alt="" aria-hidden className="w-9 h-9 object-contain" />
                                    ) : (
                                        <Trophy className="w-4 h-4 text-white/30" />
                                    )}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[12px] font-semibold text-white truncate">{item.name}</span>
                                    <span className="block text-[10.5px] text-white/30 truncate">
                                        {item.game?.name ?? (item.points != null ? `${item.points} pts` : "TechPlay")}
                                    </span>
                                </span>
                                {on && <Check className="w-4 h-4 shrink-0 text-[var(--accent)]" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ── the case ─────────────────────────────────────────────────────────── */

/**
 * Five achievements the owner chose, from any source they have.
 *
 * This replaces "Achievement Spotlight", which showed the five most recent
 * unlocks — a sorting, not a choice. What somebody is proud of is rarely what
 * they happened to unlock last, and the shelf is the one place on a profile
 * where the owner should be doing the talking.
 *
 * A visitor never sees an empty slot: an unarranged case simply does not draw.
 */
export default function TrophyCase({ isOwnProfile, initial, fallback = [] }: Props) {
    const [items, setItems] = useState<TrophyCaseItem[]>(initial);
    const [editing, setEditing] = useState(false);

    const arranged = items.length > 0;
    const shown = arranged ? items : fallback;

    const save = async (picks: TrophyCaseItem[]) => {
        try {
            const res = await axios.put("/me/trophy-case", {
                picks: picks.map((p) => ({ source: p.source, reference: p.reference })),
            });
            setItems(res.data?.data?.items ?? []);
            setEditing(false);
            toast.success("Trophy case updated.");
        } catch {
            toast.error("Couldn't save your case.");
        }
    };

    if (shown.length === 0 && !isOwnProfile) return null;

    return (
        <section className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)] p-5 md:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="flex items-center gap-2.5 font-display text-[13px] font-black uppercase tracking-[0.14em] text-white">
                    <Trophy className="w-4 h-4 text-[var(--accent)]" />
                    {arranged ? "Trophy Case" : "Recent Unlocks"}
                </h2>

                <div className="flex items-center gap-3">
                    <Link href="?tab=achievements" className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/35 hover:text-[var(--accent)] transition-colors">
                        All achievements
                    </Link>
                    {isOwnProfile && !editing && (
                        <button
                            onClick={() => setEditing(true)}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[7px] bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.1] font-display text-[10px] font-bold uppercase tracking-[0.1em] text-white/70 transition-colors"
                        >
                            <Pin className="w-3.5 h-3.5" /> {arranged ? "Arrange" : "Pin your five"}
                        </button>
                    )}
                </div>
            </div>

            {shown.length === 0 ? (
                <button
                    onClick={() => setEditing(true)}
                    className="w-full flex flex-col items-center justify-center gap-2 min-h-[150px] rounded-[var(--radius-card)] border border-dashed border-white/[0.14] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] bg-white/[0.02] transition-colors duration-300"
                >
                    <span className="w-11 h-11 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)]">
                        <Pin className="w-5 h-5" />
                    </span>
                    <span className="font-display text-[12.5px] font-bold text-white">Pin your five best</span>
                    <span className="text-[11px] text-white/35 max-w-[300px] text-center">
                        Anything you have unlocked here or on Steam. This is the part of your profile that talks.
                    </span>
                </button>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {shown.map((item, i) => (
                        <div key={`${item.source}:${item.reference}`} className={`tp-fade-up tp-d${Math.min(6, i + 1)}`}>
                            <Slot
                                item={item}
                                // Only an arranged case can be un-arranged. The
                                // fallback is a view of history, not a shelf.
                                onClear={isOwnProfile && arranged ? () => save(items.filter((x) => !(x.source === item.source && x.reference === item.reference))) : undefined}
                            />
                        </div>
                    ))}
                </div>
            )}

            {editing && <Picker current={items} onCancel={() => setEditing(false)} onSave={save} />}

            {!arranged && shown.length > 0 && isOwnProfile && (
                <p className="mt-3.5 text-[11.5px] text-white/30">
                    These are simply your latest. Pin five and this becomes the part of your profile that talks.
                </p>
            )}
        </section>
    );
}
