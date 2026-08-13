"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useSWR, { mutate as globalMutate } from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { Check, Loader2, Gamepad2 } from "lucide-react";
import Panel from "@/components/ui/Panel";
import PlatformIcon from "@/components/games/PlatformIcon";
import { timeAgo } from "@/lib/timeAgo";
import type { CollectionEntry, CollectionGoal, PlatformsGenres } from "@/lib/types/profile";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

/* ── recently added ───────────────────────────────────────────────────── */

export function RecentlyAdded({ username }: { username: string }) {
    // Its own sort — the shelf leads with what you last touched, this rail
    // with what last arrived.
    const { data, isLoading } = useSWR<{ data: CollectionEntry[] }>(
        `/users/${username}/collection?sort=added&page_size=10`,
        fetcher,
        { revalidateOnFocus: false }
    );

    const entries = (data?.data ?? []).slice(0, 5);

    return (
        <Panel
            title="Recently Added"
            action={{ label: "View all", href: `/profile/${username}?tab=library` }}
            bodyClassName="p-3"
        >
            {isLoading ? (
                <div className="space-y-1.5">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-[52px] rounded-[10px] bg-white/[0.04] animate-pulse" />)}
                </div>
            ) : entries.length === 0 ? (
                <p className="py-6 text-center text-[12px] text-white/30">Nothing added yet.</p>
            ) : (
                <div className="flex flex-col gap-0.5">
                    {entries.map((e) => (
                        <Link
                            key={e.id}
                            href={e.game ? `/games/${e.game.slug}` : "#"}
                            className="group flex items-center gap-3 p-2 rounded-[10px] border border-transparent hover:border-[color-mix(in_srgb,var(--accent)_30%,transparent)] hover:bg-[var(--fill-1)] transition-colors duration-300"
                        >
                            <span className="relative w-[44px] h-[36px] shrink-0 rounded-[6px] overflow-hidden bg-white/[0.04]">
                                {e.game?.cover_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={e.game.cover_url} alt={e.game.name} loading="lazy" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="w-full h-full flex items-center justify-center text-white/20"><Gamepad2 className="w-3.5 h-3.5" /></span>
                                )}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-[12px] font-semibold text-white truncate group-hover:text-[var(--accent)] transition-colors duration-150">
                                    {e.game?.name}
                                </span>
                                <span className="block mt-0.5 font-display text-[9px] font-bold uppercase tracking-[0.12em] text-white/25">
                                    Added {timeAgo(e.added_at ?? e.updated_at).toLowerCase()}
                                </span>
                            </span>
                            {e.platform && (
                                <span className="shrink-0 inline-flex items-center h-[18px] px-1.5 rounded-[4px] bg-white/[0.06] font-display text-[8px] font-black uppercase tracking-[0.1em] text-white/45">
                                    {e.platform}
                                </span>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </Panel>
    );
}

/* ── goals ────────────────────────────────────────────────────────────── */

export function CollectionGoals({ username, isOwnProfile }: { username: string; isOwnProfile: boolean }) {
    const key = `/users/${username}/collection-goals`;
    const { data, isLoading } = useSWR<{ data: CollectionGoal[] }>(key, fetcher, { revalidateOnFocus: false });
    const goals = data?.data ?? [];

    const [editing, setEditing] = useState(false);
    const [drafts, setDrafts] = useState<Record<string, number>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (goals.length) setDrafts(Object.fromEntries(goals.map((g) => [g.type, g.target])));
    }, [data]);

    const save = async () => {
        setSaving(true);
        try {
            await axios.put("/me/collection-goals", {
                goals: Object.entries(drafts).map(([type, target]) => ({ type, target })),
            });
            toast.success("Goals updated");
            globalMutate(key);
            setEditing(false);
        } catch {
            toast.error("Couldn't save your goals.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Panel
            title="Collection Goals"
            material="instrument"
            action={
                isOwnProfile && !isLoading
                    ? { label: editing ? "Cancel" : "Edit goals", onClick: () => setEditing((v) => !v) }
                    : undefined
            }
            bodyClassName="p-4"
        >
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-[38px] rounded-[8px] bg-white/[0.04] animate-pulse" />)}
                </div>
            ) : editing ? (
                <div className="space-y-3">
                    {goals.map((g) => (
                        <label key={g.type} className="block">
                            <span className="block font-display text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/40 mb-1.5">
                                {g.label.replace(String(g.target), "…")}
                            </span>
                            <input
                                type="number"
                                min={1}
                                max={10000}
                                value={drafts[g.type] ?? g.target}
                                onChange={(e) => setDrafts((d) => ({ ...d, [g.type]: Math.max(1, Number(e.target.value) || 1) }))}
                                className="w-full h-9 px-3 rounded-[8px] bg-white/[0.04] border border-white/[0.1] font-display text-[13px] font-bold tabular-nums text-white focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
                            />
                        </label>
                    ))}
                    <button
                        onClick={save}
                        disabled={saving}
                        className="w-full inline-flex items-center justify-center gap-2 h-9 rounded-[8px] bg-[var(--accent)] hover:brightness-110 disabled:opacity-60 text-white font-display text-[10.5px] font-bold uppercase tracking-[0.08em] transition-[filter]"
                    >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save goals
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {goals.map((g) => (
                        <div key={g.type}>
                            <div className="flex items-baseline justify-between gap-3 mb-1.5">
                                <span className="text-[12px] font-semibold text-white truncate">{g.label}</span>
                                <span className="shrink-0 flex items-center gap-1.5 font-display text-[11px] font-black tabular-nums text-white/45">
                                    {g.current}
                                    <span className="text-white/20">/ {g.target}</span>
                                    {g.done && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                                </span>
                            </div>
                            <span className="block h-[5px] rounded-full bg-[var(--track)] overflow-hidden">
                                <span
                                    className="block h-full rounded-full transition-[width] duration-700 ease-[var(--ease-hud)]"
                                    style={{
                                        width: `${g.percent}%`,
                                        background: g.done
                                            ? "linear-gradient(90deg, #34d399, #10b981)"
                                            : "linear-gradient(90deg, var(--accent), var(--accent-bright))",
                                    }}
                                />
                            </span>
                        </div>
                    ))}
                    {isOwnProfile && goals.some((g) => g.is_default) && (
                        <p className="text-[10.5px] text-white/25 leading-snug">
                            These are suggested targets — set your own with Edit goals.
                        </p>
                    )}
                </div>
            )}
        </Panel>
    );
}

/* ── platforms ────────────────────────────────────────────────────────── */

export function PlatformBreakdown({ data }: { data?: PlatformsGenres }) {
    const platforms = (data?.platforms ?? []).slice(0, 5);

    return (
        <Panel
            title="Platforms"
            material="instrument"
            bodyClassName="p-4"
        >
            {platforms.length === 0 ? (
                <p className="py-4 text-center text-[12px] text-white/30">No platform data yet.</p>
            ) : (
                <div className="space-y-3">
                    {platforms.map((p) => (
                        <div key={p.name} className="flex items-center gap-3">
                            <span className="shrink-0 w-[18px] text-white/40">
                                <PlatformIcon label={p.name} className="w-[16px] h-[16px]" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="flex items-baseline justify-between gap-2 mb-1">
                                    <span className="text-[11.5px] font-semibold text-white/75 truncate">{p.name}</span>
                                    <span className="shrink-0 font-display text-[11px] font-black tabular-nums text-white">{p.count}</span>
                                </span>
                                <span className="block h-[4px] rounded-full bg-[var(--track)] overflow-hidden">
                                    <span
                                        className="block h-full rounded-full bg-[var(--xp)]"
                                        style={{ width: `${Math.max(3, p.percent)}%` }}
                                    />
                                </span>
                            </span>
                            <span className="shrink-0 w-[34px] text-right font-display text-[10px] font-bold tabular-nums text-white/30">
                                {p.percent}%
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </Panel>
    );
}
