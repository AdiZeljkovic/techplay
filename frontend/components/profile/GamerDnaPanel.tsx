"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import {
    Dna, Clock3, Gamepad2, Trophy, Sparkles, BookOpen, Swords, Moon, Compass, Feather, HelpCircle,
    Flame, CalendarDays, Timer, Layers, Heart, Star, type LucideIcon,
} from "lucide-react";
import Panel from "@/components/ui/Panel";
import EmptyState from "@/components/ui/EmptyState";
import ShareCard from "./ShareCard";
import { useCountUp } from "@/hooks/useCountUp";
import type { DistributionStat, DnaArchetype, DnaAxis, GamerDnaPayload } from "@/lib/types/profile";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

/** The donut palette — deliberately wide so eight genres stay separable. */
const WHEEL = ["#f97316", "#ef4444", "#a78bfa", "#22d3ee", "#38bdf8", "#34d399", "#84cc16", "#eab308"];

const ARCHETYPE_ICONS: Record<string, LucideIcon> = {
    book: BookOpen, chess: Swords, trophy: Trophy, moon: Moon, compass: Compass, quill: Feather };

const ARCHETYPE_TINTS = ["#a78bfa", "#f97316", "#eab308", "#60a5fa"];

/** The journal's own mood colours — the same feeling wears the same colour. */
const MOOD_COLORS: Record<string, string> = {
    hooked: "#f97316", relaxed: "#34d399", grinding: "#60a5fa", frustrated: "#f87171",
    impressed: "#a855f7", bored: "#9ca3af", emotional: "#f472b6" };

const hhmm = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
};

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
        <div className="relative w-[140px] h-[140px] shrink-0">
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

    const percent = Math.min(100, Math.round((data.score.value / data.score.max) * 100));

    return (
        <section
            className="relative overflow-hidden rounded-[var(--radius-panel)] border"
            style={{
                background: "var(--surface-2)",
                borderColor: "color-mix(in srgb, var(--accent) 26%, transparent)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 44px -22px color-mix(in srgb, var(--accent) 45%, transparent)",
            }}
        >
            <span
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(58% 120% at 8% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 62%)" }}
            />
            <span aria-hidden className="absolute inset-x-0 top-0 h-[2px]" style={{ background: "linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 18%, transparent) 62%, transparent)" }} />

            <div className="relative p-6 md:p-7 flex flex-col lg:flex-row items-center lg:items-start gap-7">
                <HelixMark />

                <div className="min-w-0 flex-1 text-center lg:text-left">
                    <p className="font-display text-[9.5px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
                        Your gamer identity
                    </p>
                    {/* The traits are the headline of the whole page — set at
                        the size a headline gets, not at panel-title size. */}
                    <h3 className="mt-2.5 font-display text-[28px] md:text-[38px] font-black uppercase text-white leading-[0.95] tracking-[-0.02em]">
                        {data.identity.traits.map((t, i) => (
                            <span key={t}>
                                {i > 0 && <span className="text-[var(--accent)]/45 mx-2">/</span>}
                                {t}
                            </span>
                        ))}
                    </h3>
                    <p className="mt-3 text-[13px] text-white/50 leading-relaxed max-w-[520px] mx-auto lg:mx-0">
                        {data.identity.blurb}
                    </p>

                    <p className="mt-4 flex flex-wrap items-center justify-center lg:justify-start gap-2">
                        <span className="inline-flex items-center gap-1.5 h-[24px] px-2.5 rounded-[6px] bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] font-display text-[9.5px] font-black uppercase tracking-[0.14em] text-[var(--accent-ink)]">
                            <Dna className="w-3 h-3" /> {data.identity.traits[0]} {data.identity.tier}
                        </span>
                        {data.score.percentile != null && (
                            <span className="inline-flex items-center h-[24px] px-2.5 rounded-[6px] bg-white/[0.05] border border-white/[0.09] font-display text-[9.5px] font-black uppercase tracking-[0.14em] text-white/60">
                                Top {data.score.percentile}% of TechPlay
                            </span>
                        )}
                    </p>
                </div>

                {/* the score, as a dial rather than a line of the same size as
                    everything around it */}
                <div className="shrink-0 flex flex-col items-center gap-3">
                    <Donut
                        size={132}
                        thickness={11}
                        slices={[{ value: percent, color: "var(--accent)", label: "DNA score" }, { value: 100 - percent, color: "transparent", label: "" }]}
                    >
                        <span className="flex flex-col items-center">
                            <span className="font-display text-[30px] font-black tabular-nums leading-none text-white">
                                {score.toLocaleString("en-US")}
                            </span>
                            <span className="mt-1 font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/30">
                                / {data.score.max.toLocaleString("en-US")}
                            </span>
                        </span>
                    </Donut>
                    <button
                        onClick={() => setOpenBreakdown((v) => !v)}
                        className="inline-flex items-center gap-1 font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/30 hover:text-[var(--accent)] transition-colors"
                    >
                        <HelpCircle className="w-3 h-3" />
                        {openBreakdown ? "Hide the working" : "How it's calculated"}
                    </button>
                </div>
            </div>

            {/* the working, on request — a score nobody can audit is a score nobody trusts */}
            {openBreakdown && (
                <div className="relative px-6 md:px-7 pb-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
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
        </section>
    );
}

/* ── signature games ──────────────────────────────────────────────────── */

/**
 * The three games that took the hours.
 *
 * A genre wheel says "you like RPGs". This says which one you gave four
 * hundred hours to, which is the difference between a summary of a library
 * and a portrait of a player — and it is the thing anybody landing on this
 * page actually wants to know first.
 */
function SignatureStrip({ games }: { games: GamerDnaPayload["signature"] }) {
    const BASIS: Record<string, { label: string; icon: LucideIcon; tint: string }> = {
        hours: { label: "Most played", icon: Clock3, tint: "var(--accent-ink)" },
        favorite: { label: "Favourite", icon: Heart, tint: "#f472b6" },
        completed: { label: "Finished", icon: Trophy, tint: "#22c55e" },
    };

    return (
        <Panel
            title="Signature games"
            meta={<span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-white/30">What the hours went into</span>}
            bodyClassName="p-4"
        >
            {games.length === 0 ? (
                <EmptyState
                    variant="compact"
                    title="Nothing has claimed the hours yet"
                    body="Log playtime, star a favourite or finish something and the three that define your shelf land here."
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {games.map((g, i) => {
                        const basis = BASIS[g.basis] ?? BASIS.completed;
                        const Icon = basis.icon;

                        return (
                            <Link
                                key={g.slug}
                                href={`/games/${g.slug}`}
                                prefetch={false}
                                className="group relative flex flex-col rounded-[12px] overflow-hidden border border-white/[0.07] bg-white/[0.02] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300"
                            >
                                <span className="relative block aspect-[16/10] overflow-hidden bg-white/[0.04]">
                                    {g.cover_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={g.cover_url} alt="" aria-hidden loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700" />
                                    ) : (
                                        <span className="w-full h-full flex items-center justify-center text-white/15"><Gamepad2 className="w-8 h-8" /></span>
                                    )}
                                    <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

                                    {/* the rank, struck into the corner */}
                                    <span className="absolute top-2.5 left-2.5 flex items-center justify-center w-[30px] h-[30px] rounded-[8px] bg-black/60 backdrop-blur-md border border-white/[0.14] font-display text-[15px] font-black tabular-nums text-white leading-none">
                                        {i + 1}
                                    </span>

                                    {g.hours > 0 && (
                                        <span className="absolute bottom-2.5 right-2.5 inline-flex items-baseline gap-1 font-display tabular-nums">
                                            <span className="text-[22px] font-black leading-none text-white">{g.hours}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">h</span>
                                        </span>
                                    )}
                                </span>

                                <span className="p-3">
                                    <span className="block font-display text-[13.5px] font-black text-white leading-tight line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
                                        {g.name}
                                    </span>
                                    <span
                                        className="mt-1.5 inline-flex items-center gap-1.5 font-display text-[9px] font-black uppercase tracking-[0.14em]"
                                        style={{ color: basis.tint }}
                                    >
                                        <Icon className="w-3 h-3" /> {basis.label}
                                    </span>
                                </span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </Panel>
    );
}

/* ── rhythm ───────────────────────────────────────────────────────────── */

/** One reading of the play habit — mark, figure, label. */
function Readout({ icon: Icon, label, value, sub, tint }: {
    icon: LucideIcon;
    label: string;
    value: string;
    sub?: string;
    tint: string;
}) {
    return (
        <div className="group/bay flex items-center gap-3 min-w-0 px-4 py-4" style={{ background: "var(--surface-2)" }}>
            <span className="shrink-0 w-9 h-9 flex items-center justify-center" style={{ color: tint }}>
                <Icon className="w-[23px] h-[23px] transition-transform duration-300 group-hover/bay:scale-110" strokeWidth={1.5} />
            </span>
            <span className="min-w-0">
                <span className="block font-display text-[8.5px] font-bold uppercase tracking-[0.16em] text-white/40 whitespace-nowrap">{label}</span>
                <span className="block mt-1 font-display text-[17px] font-black tabular-nums leading-none text-white truncate">{value}</span>
                {sub && <span className="block mt-1 text-[10.5px] text-white/30 truncate">{sub}</span>}
            </span>
        </div>
    );
}

/**
 * How the playing actually happens.
 *
 * Everything else on this page is read off a shelf, which says what somebody
 * owns. This is read off the journal, which says what they did — and the two
 * are different players more often than not.
 */
function RhythmPanel({ rhythm }: { rhythm: GamerDnaPayload["rhythm"] }) {
    if (rhythm.sessions === 0) {
        return (
            <Panel title="Play rhythm" material="instrument" className="h-full" bodyClassName="p-4 flex-1 flex">
                <EmptyState
                    variant="compact"
                    icon={<Timer className="w-[18px] h-[18px]" />}
                    title="No sessions logged yet"
                    body="The diary in your Library turns into this — when you play, how long for, and how it felt."
                    action={{ label: "Open the diary", href: "?tab=library" }}
                />
            </Panel>
        );
    }

    return (
        <Panel title="Play rhythm" material="instrument" className="h-full" padding="none" bodyClassName="flex-1 flex flex-col">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: "var(--line)" }}>
                <Readout icon={Flame} label="Sessions" value={rhythm.sessions.toLocaleString("en-US")} tint="var(--accent-ink)" />
                <Readout icon={Clock3} label="Total played" value={hhmm(rhythm.minutes)} tint="#34d399" />
                <Readout icon={Timer} label="Typical session" value={hhmm(rhythm.average)} sub={`Longest ${hhmm(rhythm.longest)}`} tint="#60a5fa" />
                <Readout
                    icon={CalendarDays}
                    label="Best day"
                    value={rhythm.best_day?.name ?? "—"}
                    sub={rhythm.best_day ? hhmm(rhythm.best_day.minutes) : undefined}
                    tint="#fbbf24"
                />
            </div>

            {rhythm.moods.length > 0 && (
                <div className="p-4 border-t border-white/[0.07]">
                    <p className="font-display text-[9px] font-black uppercase tracking-[0.16em] text-white/40 mb-2.5">
                        How it feels
                    </p>
                    {/* One bar, split by mood — a mood is a share of your
                        evenings, and shares belong side by side rather than
                        stacked as four separate meters. */}
                    <div className="flex h-[10px] rounded-full overflow-hidden bg-[var(--track)]">
                        {rhythm.moods.map((m) => (
                            <span
                                key={m.name}
                                title={`${m.name}: ${m.count}`}
                                style={{ width: `${m.percent}%`, background: MOOD_COLORS[m.name] ?? "#9ca3af" }}
                            />
                        ))}
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        {rhythm.moods.map((m) => (
                            <span key={m.name} className="inline-flex items-center gap-1.5 font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/35">
                                <span aria-hidden className="w-1.5 h-1.5 rounded-full" style={{ background: MOOD_COLORS[m.name] ?? "#9ca3af" }} />
                                {m.name}
                                <span className="tabular-nums text-white/60">{m.percent}%</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}
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
    const on = a.level > 0;

    return (
        <div
            className="group relative flex flex-col items-center text-center p-4 rounded-[12px] border transition-colors duration-300"
            style={{
                borderColor: `color-mix(in srgb, ${tint} ${on ? 34 : 12}%, transparent)`,
                background: `color-mix(in srgb, ${tint} ${on ? 8 : 3}%, transparent)` }}
            title={a.hint}
        >
            <Icon
                className="w-[30px] h-[30px] mb-2.5 transition-transform duration-300 group-hover:scale-110"
                strokeWidth={1.5}
                style={{ color: on ? tint : "rgba(255,255,255,0.2)" }}
            />
            <p className="font-display text-[12px] font-bold text-white leading-tight">{a.name}</p>

            {/* Five pips, one per step of the ladder — a level reads faster as
                marks than as the word "Level" followed by a digit. */}
            <span className="mt-2 flex items-center gap-1" aria-label={on ? `Level ${a.level} of 5` : "Locked"}>
                {[1, 2, 3, 4, 5].map((step) => (
                    <span
                        key={step}
                        className="block w-[6px] h-[6px] rounded-full"
                        style={{
                            background: step <= a.level ? tint : "rgba(255,255,255,0.12)",
                            boxShadow: step <= a.level ? `0 0 7px color-mix(in srgb, ${tint} 65%, transparent)` : undefined,
                        }}
                    />
                ))}
            </span>

            <span className="block w-full mt-2.5 h-[3px] rounded-full bg-[var(--track)] overflow-hidden">
                <span className="block h-full rounded-full" style={{ width: `${a.percent}%`, background: tint }} />
            </span>
        </div>
    );
}

/* ── the tab ──────────────────────────────────────────────────────────── */

export default function GamerDnaPanel({ username }: { username: string }) {
    const { data, isLoading } = useSWR<{ data: GamerDnaPayload }>(
        `/users/${username}/gamer-dna`,
        fetcher,
        { revalidateOnFocus: false }
    );

    const dna = data?.data;

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-[52px] rounded-[var(--radius-panel)] bg-white/[0.04] animate-pulse" />
                <div className="h-[260px] rounded-[var(--radius-panel)] bg-white/[0.04] animate-pulse" />
                <div className="h-[300px] rounded-[var(--radius-panel)] bg-white/[0.04] animate-pulse" />
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                    <div className="xl:col-span-5 h-[300px] rounded-[var(--radius-panel)] bg-white/[0.04] animate-pulse" />
                    <div className="xl:col-span-7 h-[300px] rounded-[var(--radius-panel)] bg-white/[0.04] animate-pulse" />
                </div>
            </div>
        );
    }

    if (!dna) {
        return <EmptyState icon={<Dna className="w-[18px] h-[18px]" />} title="No DNA yet" body="Add games to your collection and this page fills in." />;
    }

    // This payload is cached server-side for fifteen minutes, so for a quarter
    // of an hour after any deploy the page can be handed an object written by
    // the build before it. Reading .length off a key that did not exist yet
    // takes the whole tab down — a missing section is a far cheaper failure,
    // so every field added after the first release is read defensively.
    const signature = dna.signature ?? [];
    const series = dna.series ?? [];
    const rhythm = dna.rhythm ?? { sessions: 0, minutes: 0, average: 0, longest: 0, best_day: null, moods: [] };

    return (
        <div className="space-y-4">
            {/* ── page head ── */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <span className="w-11 h-11 shrink-0 flex items-center justify-center text-[var(--accent-ink)]">
                        <Dna className="w-[30px] h-[30px]" strokeWidth={1.5} />
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
                    {/* The card is the thing being shared, so the button
                        opens the card. "Copied" was a clipboard operation
                        wearing the word Share. */}
                    <ShareCard
                        imageUrl={`/og/profile?username=${encodeURIComponent(username)}`}
                        pageUrl={`${typeof window !== "undefined" ? window.location.origin : "https://techplay.gg"}/profile/${username}?tab=stats`}
                        title={`${username} on TechPlay`}
                        fileName={`${username}-gamer-dna`}
                        label="Share DNA"
                    />
                </div>
            </div>

            {/* ── who you are ── */}
            <IdentityCard data={dna} />

            {/* ── what the hours went into ── */}
            <SignatureStrip games={signature} />

            {/* ── how you play ── */}
            <RhythmPanel rhythm={rhythm} />

            {/* ── what you play ── */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
                <div className="xl:col-span-5 min-w-0">
                    <Panel title="Genre Profile" material="instrument" className="h-full" bodyClassName="flex flex-col justify-center">
                        {dna.genres.length === 0 ? (
                            <EmptyState variant="compact" title="No genres yet" body="Add games and the wheel fills in." />
                        ) : (
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <Donut
                                    size={158}
                                    thickness={19}
                                    slices={dna.genres.map((g, i) => ({ value: g.count, color: WHEEL[i % WHEEL.length], label: g.name }))}
                                >
                                    <span className="flex flex-col items-center">
                                        <span className="font-display text-[20px] font-black tabular-nums leading-none text-white">{dna.genres.length}</span>
                                        <span className="mt-1 font-display text-[8px] font-bold uppercase tracking-[0.14em] text-white/30">Genres</span>
                                    </span>
                                </Donut>
                                <div className="w-full flex-1 space-y-1.5">
                                    {dna.genres.slice(0, 6).map((g, i) => (
                                        <LegendRow key={g.name} item={g} color={WHEEL[i % WHEEL.length]} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </Panel>
                </div>

                <div className="xl:col-span-7 min-w-0">
                    <Panel
                        title="Playstyle Fingerprint"
                        material="instrument"
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

            {/* ── when you play, and where you keep going back to ──

                Collection Breakdown and Platform Affinity used to open this
                row, and both were the Library's job: the shelf counts its own
                statuses, and the Collection tab already draws a Platforms
                panel from the same aggregation. Two readings of one number in
                two places is how they end up disagreeing. */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
                <div className="xl:col-span-8 min-w-0">
                    <Panel title="Gaming Eras" material="instrument" className="h-full" bodyClassName="flex flex-col justify-center">
                        {dna.eras.every((e) => e.count === 0) ? (
                            <EmptyState variant="compact" title="No release dates yet" body="Games without a release year can't be placed on the timeline." />
                        ) : (
                            <>
                                <div className="grid grid-cols-5 gap-1">
                                    {dna.eras.map((e) => (
                                        <div key={e.key} className="flex flex-col items-center text-center" title={`${e.count} games`}>
                                            <Gamepad2 className="w-6 h-6 mb-2" strokeWidth={1.5} style={{ color: e.color, opacity: e.count > 0 ? 1 : 0.2 }} />
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

                <div className="xl:col-span-4 min-w-0">
                    <Panel title="Worlds you return to" material="instrument" className="h-full" bodyClassName="flex-1 flex flex-col">
                        {series.length === 0 ? (
                            <EmptyState
                                variant="compact"
                                icon={<Layers className="w-[18px] h-[18px]" />}
                                title="No series yet"
                                body="Own two games from the same series and the loyalty shows up here."
                            />
                        ) : (
                            <div className="space-y-2.5">
                                {series.map((s, i) => (
                                    <div
                                        key={s.name}
                                        className="flex items-center gap-3 rounded-[10px] border border-white/[0.07] bg-white/[0.02] px-3 py-2.5"
                                    >
                                        <span
                                            className="shrink-0 w-7 h-7 rounded-[7px] flex items-center justify-center font-display text-[12px] font-black tabular-nums"
                                            style={{ background: `color-mix(in srgb, ${WHEEL[i % WHEEL.length]} 16%, transparent)`, color: WHEEL[i % WHEEL.length] }}
                                        >
                                            {i + 1}
                                        </span>
                                        <span className="min-w-0 flex-1 text-[12.5px] font-semibold text-white truncate">{s.name}</span>
                                        <span className="shrink-0 inline-flex items-center gap-1 font-display text-[11px] font-black tabular-nums text-white/45">
                                            <Star className="w-3 h-3 text-white/25" /> {s.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>
                </div>
            </div>

            {/* ── what you have become ── */}
            <Panel title="Player Archetype" material="lit">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {dna.archetypes.map((a, i) => (
                        <ArchetypeCard key={a.key} a={a} tint={ARCHETYPE_TINTS[i % ARCHETYPE_TINTS.length]} />
                    ))}
                </div>
                <p className="mt-3.5 text-[11px] text-white/30 leading-snug">
                    {dna.archetypes[0]?.hint ?? "Play, collect and post to grow your archetypes."}
                </p>
            </Panel>
        </div>
    );
}
