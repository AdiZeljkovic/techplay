"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import { Dna, Share2, Check, Clock3, Fingerprint, Gamepad2, Trophy, Monitor, Sparkles, BookOpen, Swords, Moon, Compass, Feather, Cpu, MemoryStick, MonitorPlay, MessageSquare, MessagesSquare, Bookmark, Gem, HelpCircle, type LucideIcon } from "lucide-react";
import Panel from "@/components/ui/Panel";
import EmptyState from "@/components/ui/EmptyState";
import { useCountUp } from "@/hooks/useCountUp";
import { getStorageUrl } from "@/lib/imageUrl";
import type { DistributionStat, DnaArchetype, DnaAxis, GamerDnaPayload } from "@/lib/types/profile";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

/** The donut palette — deliberately wide so eight genres stay separable. */
const WHEEL = ["#f97316", "#ef4444", "#a78bfa", "#22d3ee", "#38bdf8", "#34d399", "#84cc16", "#eab308"];

const STATUS_COLORS: Record<string, string> = {
    playing: "#34d399",
    completed: "#22c55e",
    backlog: "#60a5fa",
    wishlist: "#f472b6",
    favorites: "#f97316",
};

const PLATFORM_ICONS: Record<string, string> = {
    pc: "🖥️", playstation: "🎮", xbox: "🎯", nintendo: "🕹️", switch: "🕹️",
    steam: "🖥️", mobile: "📱", retro: "👾",
};

const ARCHETYPE_ICONS: Record<string, LucideIcon> = {
    book: BookOpen, chess: Swords, trophy: Trophy, moon: Moon, compass: Compass, quill: Feather,
};

const ARCHETYPE_TINTS = ["#a78bfa", "#f97316", "#eab308", "#60a5fa"];

const SPEC_META: Record<string, { label: string; icon: LucideIcon }> = {
    cpu: { label: "CPU", icon: Cpu },
    gpu: { label: "GPU", icon: MonitorPlay },
    ram: { label: "RAM", icon: MemoryStick },
    display: { label: "Display", icon: Monitor },
    monitor: { label: "Display", icon: Monitor },
    storage: { label: "Storage", icon: MemoryStick },
    motherboard: { label: "Motherboard", icon: Cpu },
};

const CONTRIBUTION_ICONS = [MessageSquare, MessagesSquare, Bookmark, Gem];

/* ── donut ────────────────────────────────────────────────────────────── */

/**
 * A ring of arcs, drawn with stroke-dasharray on one circle per slice. No
 * chart library — the whole thing is five numbers and a radius.
 */
function Donut({
    slices, size = 168, thickness = 20, children,
}: {
    slices: { value: number; color: string; label: string }[];
    size?: number;
    thickness?: number;
    children?: React.ReactNode;
}) {
    const total = slices.reduce((s, x) => s + x.value, 0);
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;

    let offset = 0;

    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke="var(--track)" strokeWidth={thickness}
                />
                {total > 0 && slices.map((s, i) => {
                    // A 2px gap between arcs so neighbouring colours never merge.
                    const length = (s.value / total) * circumference;
                    const dash = Math.max(0, length - 2);
                    const el = (
                        <circle
                            key={i}
                            cx={size / 2} cy={size / 2} r={radius}
                            fill="none"
                            stroke={s.color}
                            strokeWidth={thickness}
                            strokeDasharray={`${dash} ${circumference - dash}`}
                            strokeDashoffset={-offset}
                            strokeLinecap="butt"
                        >
                            <title>{`${s.label}: ${s.value}`}</title>
                        </circle>
                    );
                    offset += length;
                    return el;
                })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">{children}</div>
        </div>
    );
}

/* ── identity ─────────────────────────────────────────────────────────── */

/**
 * The double helix, drawn rather than shipped as an image: two sine strands
 * and the rungs between them, so it scales and takes the accent colour.
 */
function HelixMark() {
    const rungs = Array.from({ length: 9 }, (_, i) => i);

    return (
        <div className="relative w-[132px] h-[132px] shrink-0">
            <span aria-hidden className="absolute inset-0 rounded-full border border-[color-mix(in_srgb,var(--accent)_28%,transparent)]" />
            <span aria-hidden className="absolute inset-[10px] rounded-full border border-[color-mix(in_srgb,var(--accent)_14%,transparent)]" />
            <span
                aria-hidden
                className="absolute inset-[18px] rounded-full"
                style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 22%, transparent), transparent 68%)" }}
            />
            <svg viewBox="0 0 60 60" className="absolute inset-0 w-full h-full p-[26px]">
                {rungs.map((i) => {
                    const y = 4 + i * 6.5;
                    const phase = Math.sin((i / 8) * Math.PI * 2);
                    const x1 = 30 - phase * 15;
                    const x2 = 30 + phase * 15;
                    return (
                        <line
                            key={i}
                            x1={x1} y1={y} x2={x2} y2={y}
                            stroke="var(--accent)"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            opacity={0.35 + Math.abs(phase) * 0.5}
                        />
                    );
                })}
                <path
                    d="M15 4 Q45 17 15 30 Q-15 43 15 56"
                    fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"
                    transform="translate(15 0)"
                />
                <path
                    d="M45 4 Q15 17 45 30 Q75 43 45 56"
                    fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"
                    opacity="0.55" transform="translate(-15 0)"
                />
            </svg>
        </div>
    );
}

function IdentityCard({ data }: { data: GamerDnaPayload }) {
    const score = useCountUp(data.score.value, 1200);
    const [openBreakdown, setOpenBreakdown] = useState(false);

    return (
        <Panel variant="console" padding="none" className="h-full">
            <div className="p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <HelixMark />

                    <div className="min-w-0 flex-1 text-center sm:text-left">
                        <p className="font-display text-[9.5px] font-bold uppercase tracking-[0.18em] text-white/40">
                            Your gamer identity
                        </p>
                        <h3 className="mt-1.5 font-display text-[24px] md:text-[27px] font-black text-white leading-tight tracking-tight">
                            {data.identity.traits.map((t, i) => (
                                <span key={t}>
                                    {i > 0 && <span className="text-white/25 mx-1.5">·</span>}
                                    {t}
                                </span>
                            ))}
                        </h3>
                        <p className="mt-2 text-[13px] text-white/50 leading-relaxed max-w-[420px]">{data.identity.blurb}</p>
                    </div>
                </div>

                <div className="mt-6 pt-5 border-t border-white/[0.07] grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                        <p className="font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">DNA Score</p>
                        <p className="mt-1.5 flex items-baseline gap-1.5">
                            <span className="font-display text-[26px] font-black tabular-nums leading-none text-white">
                                {score.toLocaleString("en-US")}
                            </span>
                            <span className="font-display text-[12px] font-bold tabular-nums text-white/25">
                                / {data.score.max.toLocaleString("en-US")}
                            </span>
                        </p>
                        <button
                            onClick={() => setOpenBreakdown((v) => !v)}
                            className="mt-1.5 inline-flex items-center gap-1 font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/30 hover:text-[var(--accent)] transition-colors"
                        >
                            <HelpCircle className="w-3 h-3" />
                            {openBreakdown ? "Hide" : "How it's calculated"}
                        </button>
                    </div>

                    <div className="sm:border-l sm:border-white/[0.07] sm:pl-5">
                        <p className="font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">Percentile</p>
                        {data.score.percentile != null ? (
                            <>
                                <p className="mt-1.5 font-display text-[22px] font-black leading-none text-[var(--accent)]">
                                    Top {data.score.percentile}%
                                </p>
                                <p className="mt-1.5 text-[11px] text-white/35">of TechPlay gamers</p>
                            </>
                        ) : (
                            <>
                                <p className="mt-1.5 font-display text-[22px] font-black leading-none text-white/20">—</p>
                                <p className="mt-1.5 text-[11px] text-white/35">Unlocks as more profiles are scored</p>
                            </>
                        )}
                    </div>

                    <div className="sm:border-l sm:border-white/[0.07] sm:pl-5">
                        <p className="font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">DNA Rank</p>
                        <p className="mt-2 flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-full bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] flex items-center justify-center shrink-0">
                                <Dna className="w-4 h-4 text-[var(--accent)]" />
                            </span>
                            <span className="font-display text-[14px] font-bold text-white leading-tight">
                                {data.identity.traits[0]} {data.identity.tier}
                            </span>
                        </p>
                    </div>
                </div>

                {/* the working, on request — a score nobody can audit is a score nobody trusts */}
                {openBreakdown && (
                    <div className="mt-5 pt-4 border-t border-white/[0.07] grid grid-cols-1 sm:grid-cols-5 gap-3">
                        {data.score.breakdown.map((b) => (
                            <div key={b.key}>
                                <p className="flex items-baseline justify-between gap-2 mb-1">
                                    <span className="text-[11px] font-semibold text-white/55">{b.label}</span>
                                    <span className="font-display text-[10px] font-black tabular-nums text-white/35">{b.value}</span>
                                </p>
                                <span className="block h-[4px] rounded-full bg-[var(--track)] overflow-hidden">
                                    <span
                                        className="block h-full rounded-full bg-[var(--accent)]"
                                        style={{ width: `${(b.value / data.score.component_max) * 100}%` }}
                                    />
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Panel>
    );
}

/* ── fingerprint ──────────────────────────────────────────────────────── */

function AxisRow({ axis }: { axis: DnaAxis }) {
    // 50 is neutral; the fill runs from the middle out towards whichever side wins.
    const left = Math.min(axis.value, 50);
    const width = Math.abs(axis.value - 50);

    return (
        <div className="group">
            <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className={`font-display text-[10.5px] font-bold ${axis.value < 50 ? "text-white" : "text-white/35"}`}>
                    {axis.left}
                </span>
                <span className={`font-display text-[10.5px] font-bold ${axis.value > 50 ? "text-white" : "text-white/35"}`}>
                    {axis.right}
                </span>
            </div>

            <div className="relative h-[6px] rounded-full bg-[var(--track)]">
                <span aria-hidden className="absolute left-1/2 top-[-3px] bottom-[-3px] w-px bg-white/[0.12]" />
                <span
                    className="absolute top-0 h-full rounded-full transition-[left,width] duration-700 ease-[var(--ease-hud)]"
                    style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        background: axis.measured
                            ? "linear-gradient(90deg, var(--xp-deep), var(--xp-bright))"
                            : "linear-gradient(90deg, color-mix(in srgb, var(--accent) 60%, transparent), var(--accent))",
                    }}
                />
                <span
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[13px] h-[13px] rounded-full border-2 border-[#100e0d] transition-[left] duration-700 ease-[var(--ease-hud)]"
                    style={{
                        left: `${axis.value}%`,
                        background: axis.measured ? "var(--xp-bright)" : "var(--accent)",
                    }}
                />
            </div>

            <p className="mt-1.5 flex items-center justify-between gap-2">
                <span className="font-display text-[9px] font-bold uppercase tracking-[0.1em] text-white/25">{axis.basis}</span>
                <span className="font-display text-[10px] font-black tabular-nums text-white/45">{axis.value}%</span>
            </p>
        </div>
    );
}

/* ── the tab ──────────────────────────────────────────────────────────── */

function LegendRow({ item, color }: { item: DistributionStat; color: string }) {
    return (
        <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
            <span className="flex-1 min-w-0 text-[12px] text-white/60 truncate">{item.name}</span>
            <span className="font-display text-[11px] font-bold tabular-nums text-white/40">{item.percent}%</span>
        </div>
    );
}

function ArchetypeCard({ a, tint }: { a: DnaArchetype; tint: string }) {
    const Icon = ARCHETYPE_ICONS[a.icon] ?? Sparkles;

    return (
        <div
            className="group relative flex flex-col items-center text-center p-4 rounded-[12px] border transition-colors duration-300"
            style={{
                borderColor: `color-mix(in srgb, ${tint} ${a.level > 0 ? 34 : 12}%, transparent)`,
                background: `color-mix(in srgb, ${tint} ${a.level > 0 ? 8 : 3}%, transparent)`,
            }}
            title={a.hint}
        >
            <Icon className="w-7 h-7 mb-2.5" style={{ color: a.level > 0 ? tint : "rgba(255,255,255,0.2)" }} />
            <p className="font-display text-[12px] font-bold text-white leading-tight">{a.name}</p>
            <p className="mt-1 font-display text-[10px] font-bold uppercase tracking-[0.1em] text-white/35">
                {a.level > 0 ? `Level ${a.level}` : "Locked"}
            </p>
            <span className="block w-full mt-2.5 h-[3px] rounded-full bg-[var(--track)] overflow-hidden">
                <span className="block h-full rounded-full" style={{ width: `${a.percent}%`, background: tint }} />
            </span>
        </div>
    );
}

export default function GamerDnaPanel({ username }: { username: string }) {
    const { data, isLoading } = useSWR<{ data: GamerDnaPayload }>(
        `/users/${username}/gamer-dna`,
        fetcher,
        { revalidateOnFocus: false }
    );
    const [copied, setCopied] = useState(false);

    const dna = data?.data;

    const collectionSlices = useMemo(() => {
        if (!dna) return [];
        const c = dna.collection;
        return [
            { label: "Playing", value: c.playing, color: STATUS_COLORS.playing },
            { label: "Completed", value: c.completed, color: STATUS_COLORS.completed },
            { label: "Backlog", value: c.backlog, color: STATUS_COLORS.backlog },
            { label: "Wishlist", value: c.wishlist, color: STATUS_COLORS.wishlist },
        ].filter((s) => s.value > 0);
    }, [dna]);

    const share = () => {
        navigator.clipboard?.writeText(`${window.location.origin}/profile/${username}?tab=stats`).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-[52px] rounded-[var(--radius-panel)] bg-white/[0.04] animate-pulse" />
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                    <div className="xl:col-span-5 h-[300px] rounded-[var(--radius-panel)] bg-white/[0.04] animate-pulse" />
                    <div className="xl:col-span-3 h-[300px] rounded-[var(--radius-panel)] bg-white/[0.04] animate-pulse" />
                    <div className="xl:col-span-4 h-[300px] rounded-[var(--radius-panel)] bg-white/[0.04] animate-pulse" />
                </div>
            </div>
        );
    }

    if (!dna) {
        return <EmptyState icon={<Dna className="w-[18px] h-[18px]" />} title="No DNA yet" body="Add games to your collection and this page fills in." />;
    }

    const specEntries = Object.entries(dna.setup.specs).filter(([, v]) => v);
    const gamertagEntries = Object.entries(dna.setup.gamertags ?? {}).filter(([, v]) => v);

    return (
        <div className="space-y-4">
            {/* ── page head ── */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <span className="w-11 h-11 rounded-[11px] bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center justify-center shrink-0">
                        <Dna className="w-5 h-5 text-[var(--accent)]" />
                    </span>
                    <div>
                        <h2 className="font-display text-[22px] font-black uppercase tracking-[0.02em] text-white leading-none">Gamer DNA</h2>
                        <p className="mt-1 text-[12px] text-white/40">The statistics of your taste in games</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">
                        <Clock3 className="w-3.5 h-3.5" />
                        Updated {new Date(dna.updated_at).toLocaleDateString("en-GB")}
                    </span>
                    <button
                        onClick={share}
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-[8px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white font-display text-[10.5px] font-bold uppercase tracking-[0.1em] transition-colors"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                        {copied ? "Copied" : "Share DNA"}
                    </button>
                </div>
            </div>

            {/* ── row 1 — identity, genres, fingerprint ── */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
                <div className="xl:col-span-5 min-w-0">
                    <IdentityCard data={dna} />
                </div>

                <div className="xl:col-span-3 min-w-0">
                    <Panel title="Genre Profile" className="h-full" bodyClassName="flex flex-col justify-center">
                        {dna.genres.length === 0 ? (
                            <EmptyState variant="compact" title="No genres yet" body="Add games and the wheel fills in." />
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <Donut
                                    size={150}
                                    thickness={18}
                                    slices={dna.genres.map((g, i) => ({ value: g.count, color: WHEEL[i % WHEEL.length], label: g.name }))}
                                >
                                    <Gamepad2 className="w-6 h-6 text-white/20" />
                                </Donut>
                                <div className="w-full space-y-1.5">
                                    {dna.genres.slice(0, 6).map((g, i) => (
                                        <LegendRow key={g.name} item={g} color={WHEEL[i % WHEEL.length]} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </Panel>
                </div>

                <div className="xl:col-span-4 min-w-0">
                    <Panel
                        title="Playstyle Fingerprint"
                        className="h-full"
                        bodyClassName="flex flex-col justify-center"
                    >
                        <div className="space-y-4">
                            {dna.fingerprint.map((axis) => <AxisRow key={axis.key} axis={axis} />)}
                        </div>
                        <p className="mt-4 pt-3 border-t border-white/[0.07] text-[10.5px] text-white/25 leading-snug">
                            Violet axes are measured off your collection. Orange ones are read from the genres and tags of the
                            games you own.
                        </p>
                    </Panel>
                </div>
            </div>

            {/* ── row 2 — collection, platforms, eras ── */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
                <div className="xl:col-span-3 min-w-0">
                    <Panel title="Collection Breakdown" className="h-full" bodyClassName="flex flex-col justify-center">
                        {dna.collection.total === 0 ? (
                            <EmptyState variant="compact" title="Nothing on the shelf yet" />
                        ) : (
                            <div className="flex items-center gap-4">
                                <Donut size={118} thickness={15} slices={collectionSlices}>
                                    <span className="text-center">
                                        <span className="block font-display text-[17px] font-black tabular-nums leading-none text-white">
                                            {dna.collection.total}
                                        </span>
                                        <span className="block mt-0.5 font-display text-[7.5px] font-bold uppercase tracking-[0.14em] text-white/30">
                                            Games
                                        </span>
                                    </span>
                                </Donut>
                                <div className="flex-1 min-w-0 space-y-2">
                                    {(["playing", "completed", "backlog", "wishlist", "favorites"] as const).map((k) => (
                                        <div key={k} className="flex items-center gap-2.5">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[k] }} />
                                            <span className="flex-1 text-[12px] text-white/60 capitalize">{k}</span>
                                            <span className="font-display text-[12px] font-black tabular-nums text-white">
                                                {dna.collection[k]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Panel>
                </div>

                <div className="xl:col-span-4 min-w-0">
                    <Panel title="Platform Affinity" className="h-full" bodyClassName="flex flex-col justify-center">
                        {dna.platforms.length === 0 ? (
                            <EmptyState variant="compact" title="No platforms tagged" body="Tag a platform on your collection entries." />
                        ) : (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                                    {dna.platforms.slice(0, 5).map((p, i) => (
                                        <div
                                            key={p.name}
                                            className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-[10px] border transition-colors ${
                                                i === 0
                                                    ? "border-[color-mix(in_srgb,var(--accent)_45%,transparent)] bg-[var(--accent-soft)]"
                                                    : "border-white/[0.07] bg-white/[0.02]"
                                            }`}
                                        >
                                            <span className="text-[19px] leading-none">
                                                {PLATFORM_ICONS[p.name.toLowerCase()] ?? "🎮"}
                                            </span>
                                            <span className="font-display text-[10px] font-bold text-white/70 text-center leading-tight px-1 truncate max-w-full">
                                                {p.name}
                                            </span>
                                            <span className={`font-display text-[13px] font-black tabular-nums ${i === 0 ? "text-[var(--accent)]" : "text-white"}`}>
                                                {p.percent}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 flex h-[5px] rounded-full overflow-hidden bg-[var(--track)]">
                                    {dna.platforms.map((p, i) => (
                                        <span
                                            key={p.name}
                                            style={{
                                                width: `${p.percent}%`,
                                                background: i === 0 ? "var(--accent)" : WHEEL[(i + 2) % WHEEL.length],
                                            }}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </Panel>
                </div>

                <div className="xl:col-span-5 min-w-0">
                    <Panel title="Gaming Eras" className="h-full" bodyClassName="flex flex-col justify-center">
                        {dna.eras.every((e) => e.count === 0) ? (
                            <EmptyState variant="compact" title="No release dates yet" body="Games without a release year can't be placed on the timeline." />
                        ) : (
                            <>
                                <div className="grid grid-cols-5 gap-1">
                                    {dna.eras.map((e) => (
                                        <div key={e.key} className="flex flex-col items-center text-center" title={`${e.count} games`}>
                                            <Gamepad2 className="w-6 h-6 mb-2" style={{ color: e.color, opacity: e.count > 0 ? 1 : 0.2 }} />
                                            <span className="font-display text-[10.5px] font-bold leading-tight" style={{ color: e.count > 0 ? e.color : "rgba(255,255,255,0.25)" }}>
                                                {e.label}
                                            </span>
                                            <span className="mt-0.5 font-display text-[8.5px] font-bold uppercase tracking-[0.08em] text-white/25">
                                                {e.range}
                                            </span>
                                            <span className="mt-1.5 font-display text-[15px] font-black tabular-nums" style={{ color: e.count > 0 ? e.color : "rgba(255,255,255,0.2)" }}>
                                                {e.percent}%
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* the timeline itself — one dot per era, sized by share */}
                                <div className="relative mt-4 h-[14px]">
                                    <span aria-hidden className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-white/[0.09]" />
                                    <div className="relative grid grid-cols-5 h-full">
                                        {dna.eras.map((e) => (
                                            <span key={e.key} className="flex items-center justify-center">
                                                <span
                                                    className="rounded-full transition-all duration-500"
                                                    style={{
                                                        width: e.count > 0 ? 8 + (e.percent / 100) * 8 : 6,
                                                        height: e.count > 0 ? 8 + (e.percent / 100) * 8 : 6,
                                                        background: e.count > 0 ? e.color : "rgba(255,255,255,0.12)",
                                                    }}
                                                />
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </Panel>
                </div>
            </div>

            {/* ── row 3 — contribution, setup, archetypes ── */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
                <div className="xl:col-span-4 min-w-0">
                    <Panel title="Community Contribution" className="h-full">
                        <div className="grid grid-cols-2 gap-4">
                            {dna.contribution.map((c, i) => {
                                const Icon = CONTRIBUTION_ICONS[i] ?? MessageSquare;
                                return (
                                    <div key={c.label}>
                                        <p className="flex items-center gap-1.5 font-display text-[9.5px] font-bold uppercase tracking-[0.1em] text-white/40 leading-tight">
                                            <Icon className="w-3.5 h-3.5 shrink-0" />
                                            {c.label}
                                        </p>
                                        <p className="mt-1.5 flex items-baseline gap-1">
                                            <span className="font-display text-[19px] font-black tabular-nums leading-none text-white">
                                                {c.value.toLocaleString("en-US")}
                                            </span>
                                            <span className="font-display text-[10px] font-bold tabular-nums text-white/25">
                                                /{c.target.toLocaleString("en-US")}
                                            </span>
                                        </p>
                                        <span className="block mt-2 h-[4px] rounded-full bg-[var(--track)] overflow-hidden">
                                            <span className="block h-full rounded-full bg-emerald-400/80" style={{ width: `${c.percent}%` }} />
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {dna.badges.items.length > 0 && (
                            <div className="mt-5 pt-4 border-t border-white/[0.07]">
                                <p className="font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/40 mb-2.5">Top badges</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {dna.badges.items.map((b) => (
                                        <span
                                            key={b.id}
                                            title={`${b.name} · ${b.points} pts`}
                                            className="inline-flex items-center gap-1.5 h-[26px] pl-1.5 pr-2.5 rounded-[6px] bg-white/[0.04] border border-white/[0.08]"
                                        >
                                            {b.icon_path ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={getStorageUrl(b.icon_path)} alt="" aria-hidden className="w-4 h-4 object-contain" />
                                            ) : (
                                                <Trophy className="w-3 h-3 text-[var(--accent)]" />
                                            )}
                                            <span className="text-[10.5px] font-bold text-white/70">{b.name}</span>
                                        </span>
                                    ))}
                                    {dna.badges.more > 0 && (
                                        <span className="inline-flex items-center h-[26px] px-2.5 rounded-[6px] font-display text-[10px] font-bold text-white/35">
                                            +{dna.badges.more} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </Panel>
                </div>

                <div className="xl:col-span-4 min-w-0">
                    <Panel title="Setup Overview" className="h-full">
                        {specEntries.length === 0 ? (
                            <EmptyState
                                variant="compact"
                                title="No rig on file"
                                body="Add your specs in settings and they show up here."
                                action={{ label: "Add specs", href: "/settings" }}
                            />
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-2">
                                    {specEntries.slice(0, 4).map(([key, value]) => {
                                        const meta = SPEC_META[key.toLowerCase()] ?? { label: key, icon: Cpu };
                                        const Icon = meta.icon;
                                        return (
                                            <div key={key} className="p-3 rounded-[10px] border border-white/[0.07] bg-white/[0.02]">
                                                <p className="flex items-center gap-1.5 font-display text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">
                                                    <Icon className="w-3.5 h-3.5" />
                                                    {meta.label}
                                                </p>
                                                <p className="mt-1.5 text-[12.5px] font-bold text-white leading-snug break-words">{value}</p>
                                            </div>
                                        );
                                    })}
                                </div>

                                {dna.setup.tier && (
                                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                                        <span className="font-display text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/40">
                                            Performance tier
                                        </span>
                                        <span className="font-display text-[12px] font-black text-[var(--accent)]">{dna.setup.tier.label}</span>
                                        <span className="flex items-center gap-1">
                                            {[1, 2, 3, 4].map((n) => (
                                                <span
                                                    key={n}
                                                    className="block w-[18px] h-[5px] rounded-full"
                                                    style={{ background: n <= dna.setup.tier!.level ? "var(--accent)" : "var(--track)" }}
                                                />
                                            ))}
                                        </span>
                                        <span className="ml-auto text-[11px] text-white/35">{dna.setup.tier.note}</span>
                                    </div>
                                )}
                            </>
                        )}

                        {gamertagEntries.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/[0.07]">
                                <p className="font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/40 mb-2.5">Gamer IDs</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {gamertagEntries.map(([platform, handle]) => (
                                        <span
                                            key={platform}
                                            className="inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-[6px] bg-white/[0.04] border border-white/[0.08]"
                                        >
                                            <span className="text-[12px] leading-none">{PLATFORM_ICONS[platform.toLowerCase()] ?? "🎮"}</span>
                                            <span className="text-[10.5px] font-bold text-white/70">{handle}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Panel>
                </div>

                <div className="xl:col-span-4 min-w-0">
                    <Panel title="Player Archetype" className="h-full">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {dna.archetypes.map((a, i) => (
                                <ArchetypeCard key={a.key} a={a} tint={ARCHETYPE_TINTS[i % ARCHETYPE_TINTS.length]} />
                            ))}
                        </div>
                        <p className="mt-3.5 text-[11px] text-white/30 leading-snug">
                            {dna.archetypes[0]?.hint ?? "Play, collect and post to grow your archetypes."}
                        </p>
                    </Panel>
                </div>
            </div>
        </div>
    );
}
