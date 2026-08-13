"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "@/lib/axios";
import { Dna, Share2, Check, Clock3, Gamepad2, Trophy, Sparkles, BookOpen, Swords, Moon, Compass, Feather, HelpCircle, type LucideIcon } from "lucide-react";
import Panel from "@/components/ui/Panel";
import EmptyState from "@/components/ui/EmptyState";
import { useCountUp } from "@/hooks/useCountUp";
import type { DistributionStat, DnaArchetype, DnaAxis, GamerDnaPayload } from "@/lib/types/profile";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

/** The donut palette — deliberately wide so eight genres stay separable. */
const WHEEL = ["#f97316", "#ef4444", "#a78bfa", "#22d3ee", "#38bdf8", "#34d399", "#84cc16", "#eab308"];

const ARCHETYPE_ICONS: Record<string, LucideIcon> = {
    book: BookOpen, chess: Swords, trophy: Trophy, moon: Moon, compass: Compass, quill: Feather };

const ARCHETYPE_TINTS = ["#a78bfa", "#f97316", "#eab308", "#60a5fa"];

/* ── donut ────────────────────────────────────────────────────────────── */

/**
 * A ring of arcs, drawn with stroke-dasharray on one circle per slice. No
 * chart library — the whole thing is five numbers and a radius.
 */
function Donut({
    slices, size = 168, thickness = 20, children }: {
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
                            : "linear-gradient(90deg, color-mix(in srgb, var(--accent) 60%, transparent), var(--accent))" }}
                />
                <span
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[13px] h-[13px] rounded-full border-2 border-[var(--surface-2)] transition-[left] duration-700 ease-[var(--ease-hud)]"
                    style={{
                        left: `${axis.value}%`,
                        background: axis.measured ? "var(--xp-bright)" : "var(--accent)" }}
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
                background: `color-mix(in srgb, ${tint} ${a.level > 0 ? 8 : 3}%, transparent)` }}
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
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                    <div className="xl:col-span-7 h-[240px] rounded-[var(--radius-panel)] bg-white/[0.04] animate-pulse" />
                    <div className="xl:col-span-5 h-[240px] rounded-[var(--radius-panel)] bg-white/[0.04] animate-pulse" />
                </div>
            </div>
        );
    }

    if (!dna) {
        return <EmptyState icon={<Dna className="w-[18px] h-[18px]" />} title="No DNA yet" body="Add games to your collection and this page fills in." />;
    }

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
                        <p className="mt-1 text-[12px] text-white/40">What your library says about you</p>
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

            {/* ── row 2 — eras and archetypes ──

                Collection Breakdown and Platform Affinity used to open this
                row, and both were the Library's job: the shelf counts its own
                statuses, and the Collection tab already draws a Platforms
                panel from the same aggregation. Two readings of one number in
                two places is how they end up disagreeing. */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
                <div className="xl:col-span-7 min-w-0">
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
                                                        background: e.count > 0 ? e.color : "rgba(255,255,255,0.12)" }}
                                                />
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </Panel>
                </div>

                <div className="xl:col-span-5 min-w-0">
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
