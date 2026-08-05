"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import { Trophy, Lock, Search, X, Sparkles, Award, ChevronDown, Star } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import RingMeter from "@/components/ui/RingMeter";
import Panel from "@/components/ui/Panel";
import { useCountUp } from "@/hooks/useCountUp";
import { getStorageUrl } from "@/lib/imageUrl";
import { timeAgo } from "@/lib/timeAgo";
import type { AchievementEntry, AchievementRarity, AchievementsPayload } from "@/lib/types/profile";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

/**
 * Rarity keeps the convention every player already knows: gold is the one
 * almost nobody has. It is deliberately not the accent or the XP violet —
 * those two already mean something else on this page.
 */
const RARITY: Record<AchievementRarity, { label: string; color: string }> = {
    epic: { label: "Epic", color: "#f0b429" },
    rare: { label: "Rare", color: "#60a5fa" },
    common: { label: "Common", color: "#9ca3af" },
};

type FilterId = "all" | "unlocked" | "locked" | "progress" | "rare";
type SortId = "default" | "closest" | "rarest" | "points" | "recent";

const SORTS: { id: SortId; label: string }[] = [
    { id: "default", label: "Unlocked first" },
    { id: "closest", label: "Closest to unlock" },
    { id: "rarest", label: "Rarest first" },
    { id: "points", label: "Highest points" },
    { id: "recent", label: "Most recent" },
];

/* ── the score strip ──────────────────────────────────────────────────── */

function ScoreCell({
    icon, label, value, sub, tint,
}: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    sub?: React.ReactNode;
    tint: string;
}) {
    return (
        <span className="flex items-center gap-3 shrink-0">
            <span
                className="w-9 h-9 rounded-[9px] flex items-center justify-center shrink-0"
                style={{ background: `color-mix(in srgb, ${tint} 14%, transparent)`, color: tint }}
            >
                {icon}
            </span>
            <span>
                <span className="block font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/40 whitespace-nowrap">
                    {label}
                </span>
                <span className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-display text-[19px] font-black tabular-nums leading-none text-white">{value}</span>
                    {sub}
                </span>
            </span>
        </span>
    );
}

function ScoreStrip({ data }: { data: AchievementsPayload }) {
    const rate = data.total > 0 ? Math.round((data.unlocked_count / data.total) * 100) : 0;
    const ring = useCountUp(rate, 1100);
    const score = useCountUp(data.score, 1100);

    const rarest = useMemo(() => {
        const owned = data.items.filter((a) => a.is_unlocked && a.rarity_percent != null);
        if (owned.length === 0) return null;
        return owned.reduce((best, a) => (a.rarity_percent! < best.rarity_percent! ? a : best));
    }, [data.items]);

    return (
        <div className="rounded-[var(--radius-panel)] border border-white/[0.07] bg-[#100e0d] px-5 py-4 mb-4">
            <div className="flex items-center gap-6 md:gap-0 md:justify-between overflow-x-auto scrollbar-none min-w-max md:min-w-0">
                <ScoreCell
                    icon={<Trophy className="w-4 h-4" />}
                    label="Achievement score"
                    value={score.toLocaleString("en-US")}
                    tint="var(--accent)"
                />
                <span aria-hidden className="hidden md:block w-px h-9 bg-white/[0.08]" />
                <ScoreCell
                    icon={<Award className="w-4 h-4" />}
                    label="Unlocked"
                    value={data.unlocked_count}
                    sub={<span className="font-display text-[12px] font-bold tabular-nums text-white/30">/ {data.total}</span>}
                    tint="#34d399"
                />
                <span aria-hidden className="hidden md:block w-px h-9 bg-white/[0.08]" />
                <ScoreCell
                    icon={<Sparkles className="w-4 h-4" />}
                    label="Rarest owned"
                    value={rarest ? `${rarest.rarity_percent}%` : "—"}
                    sub={
                        rarest ? (
                            <span className="text-[11.5px] font-semibold text-white/45 truncate max-w-[150px]">{rarest.name}</span>
                        ) : (
                            <span className="text-[11.5px] text-white/25">Not enough players yet</span>
                        )
                    }
                    tint={RARITY.epic.color}
                />
                <span aria-hidden className="hidden md:block w-px h-9 bg-white/[0.08]" />

                <span className="flex items-center gap-3.5 shrink-0">
                    <RingMeter value={ring} size={54} strokeWidth={5}>
                        <span className="font-display text-[12px] font-black tabular-nums text-[var(--accent)]">{ring}%</span>
                    </RingMeter>
                    <span>
                        <span className="block font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/40 whitespace-nowrap">
                            Completion
                        </span>
                        <span className="block mt-1 text-[12px] font-semibold text-white">
                            {data.unlocked_count === 0
                                ? "Nothing unlocked yet"
                                : rate >= 75 ? "Almost the full set"
                                : rate >= 40 ? "Well on the way"
                                : "Just getting started"}
                        </span>
                    </span>
                </span>
            </div>
        </div>
    );
}

/* ── one achievement ──────────────────────────────────────────────────── */

function AchievementCard({ a }: { a: AchievementEntry }) {
    const rarity = a.rarity ? RARITY[a.rarity] : null;
    const inProgress = !a.is_unlocked && a.percent != null && a.percent > 0;

    return (
        <div
            className={`group relative flex items-center gap-4 p-4 rounded-[12px] border transition-colors duration-300 ${
                a.is_unlocked
                    ? "border-white/[0.07] bg-white/[0.02] hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)]"
                    : "border-white/[0.05] bg-white/[0.012] hover:border-white/[0.11]"
            }`}
        >
            {/* the badge itself — greyed while locked, so the shelf reads at a glance */}
            <span className="relative w-14 h-14 shrink-0 rounded-[11px] flex items-center justify-center bg-white/[0.04]">
                {a.icon_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={getStorageUrl(a.icon_path)}
                        alt=""
                        aria-hidden
                        loading="lazy"
                        className={`w-full h-full object-contain ${a.is_unlocked ? "" : "grayscale opacity-30"}`}
                    />
                ) : (
                    <Trophy className={`w-6 h-6 ${a.is_unlocked ? "text-[var(--accent)]" : "text-white/15"}`} />
                )}
                {!a.is_unlocked && (
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#100e0d] border border-white/[0.09] flex items-center justify-center">
                        <Lock className="w-2.5 h-2.5 text-white/35" />
                    </span>
                )}
            </span>

            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                    <span className={`font-display text-[14px] font-bold truncate ${a.is_unlocked ? "text-white" : "text-white/55"}`}>
                        {a.name}
                    </span>
                    {rarity && (
                        <span
                            className="shrink-0 inline-flex items-center h-[17px] px-1.5 rounded-[4px] font-display text-[8px] font-black uppercase tracking-[0.12em]"
                            style={{
                                color: rarity.color,
                                background: `color-mix(in srgb, ${rarity.color} 14%, transparent)`,
                            }}
                        >
                            {rarity.label} · {a.rarity_percent}%
                        </span>
                    )}
                </span>

                <span className={`block mt-0.5 text-[12px] leading-snug line-clamp-1 ${a.is_unlocked ? "text-white/45" : "text-white/30"}`}>
                    {a.description}
                </span>

                {/* progress only where there's something real to show */}
                {inProgress && (
                    <span className="block mt-2">
                        <span className="flex items-center justify-between mb-1">
                            <span className="font-display text-[10px] font-bold tabular-nums text-white/35">
                                {a.current?.toLocaleString("en-US")} / {a.criteria_value.toLocaleString("en-US")}
                            </span>
                            <span className="font-display text-[10px] font-black tabular-nums text-[var(--xp-bright)]">{a.percent}%</span>
                        </span>
                        <span className="block h-[5px] rounded-full bg-[var(--track)] overflow-hidden">
                            <span
                                className="block h-full rounded-full transition-[width] duration-700 ease-[var(--ease-hud)]"
                                style={{
                                    width: `${a.percent}%`,
                                    background: "linear-gradient(90deg, var(--xp-deep), var(--xp-bright))",
                                }}
                            />
                        </span>
                    </span>
                )}

                {a.is_unlocked && a.unlocked_at && (
                    <span className="block mt-1.5 font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-emerald-400/70">
                        Unlocked {timeAgo(a.unlocked_at)}
                    </span>
                )}
            </span>

            <span className="shrink-0 text-right">
                <span className={`block font-display text-[15px] font-black tabular-nums leading-none ${a.is_unlocked ? "text-[var(--accent)]" : "text-white/20"}`}>
                    {a.points}
                </span>
                <span className="block mt-1 font-display text-[8px] font-bold uppercase tracking-[0.14em] text-white/25">Pts</span>
            </span>
        </div>
    );
}

/* ── sidebar ──────────────────────────────────────────────────────────── */

function MiniRow({ a }: { a: AchievementEntry }) {
    return (
        <div className="flex items-center gap-3">
            <span className="w-9 h-9 shrink-0 rounded-[8px] bg-white/[0.04] flex items-center justify-center">
                {a.icon_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={getStorageUrl(a.icon_path)}
                        alt=""
                        aria-hidden
                        loading="lazy"
                        className={`w-full h-full object-contain ${a.is_unlocked ? "" : "grayscale opacity-35"}`}
                    />
                ) : (
                    <Trophy className="w-4 h-4 text-white/25" />
                )}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-bold text-white truncate">{a.name}</span>
                {a.is_unlocked ? (
                    <span className="block font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/30">
                        {a.unlocked_at ? timeAgo(a.unlocked_at) : "Unlocked"}
                    </span>
                ) : (
                    <span className="block mt-1 h-[4px] rounded-full bg-[var(--track)] overflow-hidden">
                        <span
                            className="block h-full rounded-full"
                            style={{ width: `${a.percent ?? 0}%`, background: "linear-gradient(90deg, var(--xp-deep), var(--xp-bright))" }}
                        />
                    </span>
                )}
            </span>
            <span className="shrink-0 font-display text-[11px] font-black tabular-nums text-white/30">
                {a.is_unlocked ? `+${a.points}` : `${a.percent ?? 0}%`}
            </span>
        </div>
    );
}

function AchievementsSidebar({ data }: { data: AchievementsPayload }) {
    const rarest = useMemo(() => {
        const owned = data.items.filter((a) => a.is_unlocked && a.rarity_percent != null);
        if (owned.length === 0) return null;
        return owned.reduce((best, a) => (a.rarity_percent! < best.rarity_percent! ? a : best));
    }, [data.items]);

    const next = useMemo(
        () =>
            data.items
                .filter((a) => !a.is_unlocked && a.percent != null && a.percent > 0)
                .sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0))
                .slice(0, 4),
        [data.items]
    );

    const recent = useMemo(
        () =>
            data.items
                .filter((a) => a.is_unlocked && a.unlocked_at)
                .sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime())
                .slice(0, 4),
        [data.items]
    );

    // Progress per category — what a completionist actually navigates by.
    const categories = useMemo(() => {
        const map = new Map<string, { done: number; total: number }>();
        data.items.forEach((a) => {
            const row = map.get(a.category) ?? { done: 0, total: 0 };
            row.total += 1;
            if (a.is_unlocked) row.done += 1;
            map.set(a.category, row);
        });
        return [...map.entries()]
            .map(([name, row]) => ({ name, ...row, pct: Math.round((row.done / row.total) * 100) }))
            .sort((a, b) => b.pct - a.pct || b.total - a.total);
    }, [data.items]);

    return (
        <div className="space-y-4">
            {rarest && (
                <Panel title="Rarest Owned" variant="console">
                    <div className="flex flex-col items-center text-center py-1">
                        <span
                            className="w-16 h-16 rounded-[13px] flex items-center justify-center mb-3"
                            style={{ background: `color-mix(in srgb, ${RARITY.epic.color} 12%, transparent)` }}
                        >
                            {rarest.icon_path ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={getStorageUrl(rarest.icon_path)} alt="" aria-hidden className="w-full h-full object-contain" />
                            ) : (
                                <Trophy className="w-7 h-7" style={{ color: RARITY.epic.color }} />
                            )}
                        </span>
                        <p className="font-display text-[14px] font-bold text-white">{rarest.name}</p>
                        <p className="mt-1 text-[11.5px] text-white/40 leading-snug">{rarest.description}</p>
                        <p
                            className="mt-2.5 inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-[5px] font-display text-[9px] font-black uppercase tracking-[0.12em]"
                            style={{ color: RARITY.epic.color, background: `color-mix(in srgb, ${RARITY.epic.color} 14%, transparent)` }}
                        >
                            <Star className="w-2.5 h-2.5 fill-current" />
                            Held by {rarest.rarity_percent}% of players
                        </p>
                    </div>
                </Panel>
            )}

            {next.length > 0 && (
                <Panel title="Next to Unlock">
                    <div className="space-y-3.5">
                        {next.map((a) => <MiniRow key={a.id} a={a} />)}
                    </div>
                </Panel>
            )}

            <Panel title="By Category">
                <div className="space-y-3">
                    {categories.map((c) => (
                        <div key={c.name}>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[12px] font-semibold text-white/70">{c.name}</span>
                                <span className="font-display text-[10.5px] font-black tabular-nums text-white/35">
                                    {c.done}<span className="text-white/20">/{c.total}</span>
                                </span>
                            </div>
                            <span className="block h-[5px] rounded-full bg-[var(--track)] overflow-hidden">
                                <span
                                    className="block h-full rounded-full transition-[width] duration-700 ease-[var(--ease-hud)]"
                                    style={{
                                        width: `${c.pct}%`,
                                        background: c.pct === 100
                                            ? "linear-gradient(90deg, #059669, #34d399)"
                                            : "linear-gradient(90deg, var(--xp-deep), var(--xp-bright))",
                                    }}
                                />
                            </span>
                        </div>
                    ))}
                </div>
            </Panel>

            {recent.length > 0 && (
                <Panel title="Recent Unlocks">
                    <div className="space-y-3.5">
                        {recent.map((a) => <MiniRow key={a.id} a={a} />)}
                    </div>
                </Panel>
            )}
        </div>
    );
}

/* ── the tab ──────────────────────────────────────────────────────────── */

export default function AchievementsTab({ username }: { username: string }) {
    const { data, isLoading } = useSWR<{ data: AchievementsPayload }>(
        `/users/${username}/achievements`,
        fetcher,
        { revalidateOnFocus: false }
    );

    const [filter, setFilter] = useState<FilterId>("all");
    const [category, setCategory] = useState<string>("all");
    const [sort, setSort] = useState<SortId>("default");
    const [query, setQuery] = useState("");

    const payload = data?.data;
    const items = useMemo(() => payload?.items ?? [], [payload]);

    const counts = useMemo(() => ({
        all: items.length,
        unlocked: items.filter((a) => a.is_unlocked).length,
        locked: items.filter((a) => !a.is_unlocked).length,
        progress: items.filter((a) => !a.is_unlocked && (a.percent ?? 0) > 0).length,
        rare: items.filter((a) => a.rarity === "epic" || a.rarity === "rare").length,
    }), [items]);

    const categories = useMemo(
        () => [...new Set(items.map((a) => a.category))].sort(),
        [items]
    );

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();

        const filtered = items.filter((a) => {
            if (filter === "unlocked" && !a.is_unlocked) return false;
            if (filter === "locked" && a.is_unlocked) return false;
            if (filter === "progress" && (a.is_unlocked || (a.percent ?? 0) === 0)) return false;
            if (filter === "rare" && a.rarity !== "epic" && a.rarity !== "rare") return false;
            if (category !== "all" && a.category !== category) return false;
            if (q && !a.name.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q)) return false;
            return true;
        });

        const byDate = (a: AchievementEntry) => (a.unlocked_at ? new Date(a.unlocked_at).getTime() : 0);

        return [...filtered].sort((a, b) => {
            switch (sort) {
                case "closest":
                    // Unlocked ones are done — they belong at the back of this view.
                    if (a.is_unlocked !== b.is_unlocked) return a.is_unlocked ? 1 : -1;
                    return (b.percent ?? 0) - (a.percent ?? 0);
                case "rarest":
                    return (a.rarity_percent ?? 101) - (b.rarity_percent ?? 101);
                case "points":
                    return b.points - a.points;
                case "recent":
                    return byDate(b) - byDate(a);
                default:
                    if (a.is_unlocked !== b.is_unlocked) return a.is_unlocked ? -1 : 1;
                    if (a.is_unlocked && b.is_unlocked) return byDate(b) - byDate(a);
                    return (b.percent ?? 0) - (a.percent ?? 0);
            }
        });
    }, [items, filter, category, query, sort]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-[86px] rounded-[var(--radius-panel)] bg-white/[0.04] animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[...Array(6)].map((_, i) => <div key={i} className="h-[92px] rounded-[12px] bg-white/[0.04] animate-pulse" />)}
                </div>
            </div>
        );
    }

    if (!payload || items.length === 0) {
        return (
            <EmptyState
                icon={<Trophy className="w-[18px] h-[18px]" />}
                title="No achievements yet"
                body="They appear here as soon as the catalog is live."
            />
        );
    }

    const FILTERS: { id: FilterId; label: string; count: number }[] = [
        { id: "all", label: "All", count: counts.all },
        { id: "unlocked", label: "Unlocked", count: counts.unlocked },
        { id: "locked", label: "Locked", count: counts.locked },
        { id: "progress", label: "In progress", count: counts.progress },
        ...(payload.rarity_available ? [{ id: "rare" as FilterId, label: "Rare", count: counts.rare }] : []),
    ];

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            <div className="xl:col-span-9 min-w-0">
                <ScoreStrip data={payload} />

                {/* ── controls ── */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {FILTERS.map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id)}
                                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[7px] font-display text-[10.5px] font-bold uppercase tracking-[0.08em] transition-colors duration-200 ${
                                    filter === f.id
                                        ? "bg-[var(--accent)] text-white"
                                        : "bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.08]"
                                }`}
                            >
                                {f.label}
                                <span className={`tabular-nums ${filter === f.id ? "text-white/70" : "text-white/25"}`}>{f.count}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex-1" />

                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search achievements…"
                            className="h-8 w-[190px] pl-8 pr-7 rounded-[7px] bg-white/[0.04] border border-white/[0.08] text-[12px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="relative">
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="h-8 pl-3 pr-7 rounded-[7px] bg-white/[0.04] border border-white/[0.08] text-[12px] text-white/70 appearance-none focus:outline-none cursor-pointer"
                        >
                            <option value="all">All categories</option>
                            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortId)}
                            className="h-8 pl-3 pr-7 rounded-[7px] bg-white/[0.04] border border-white/[0.08] text-[12px] text-white/70 appearance-none focus:outline-none cursor-pointer"
                        >
                            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                    </div>
                </div>

                {visible.length === 0 ? (
                    <EmptyState variant="compact" title="Nothing matches" body="Try a different filter or clear the search." />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {visible.map((a, i) => (
                            <div key={a.id} className={i < 8 ? `tp-fade-up tp-d${Math.min(6, i + 1)}` : undefined}>
                                <AchievementCard a={a} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <aside className="xl:col-span-3 min-w-0">
                <AchievementsSidebar data={payload} />
            </aside>
        </div>
    );
}
