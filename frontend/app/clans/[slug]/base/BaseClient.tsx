"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { Shield, ShieldCheck, Castle, Radar, Swords, Vault as VaultIcon, Trophy, Library, Hammer, RadioTower, Lock, Plus, ChevronRight, Coins, Clock3, Zap, Loader2, X, ArrowUp, Check, Flag, Crown, Rocket } from "lucide-react";
import Panel from "@/components/ui/Panel";
import EmptyState from "@/components/ui/EmptyState";
import Avatar from "@/components/ui/Avatar";
import { useCountdown } from "@/hooks/useCountdown";
import { timeAgo } from "@/lib/timeAgo";
import { getStorageUrl } from "@/lib/imageUrl";
import { TIER_COLORS } from "../../ClansClient";
import type { ClanBasePayload, ClanBoostRow, ClanBuildingRow, ClanMissionRow, ClanPollRow, ClanProjectRow } from "@/lib/types/clan";
import type { LucideIcon } from "lucide-react";

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data);

const BUILDING_ICONS: Record<string, LucideIcon> = {
    command_center: Castle,
    mission_control: Radar,
    training_grounds: Swords,
    vault: VaultIcon,
    trophy_hall: Trophy,
    archive: Library,
    workshop: Hammer,
    communications_hub: RadioTower,
};

/** Node coordinates on the command grid (percentages), Command Center centred. */
const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
    command_center: { x: 50, y: 34 },
    mission_control: { x: 22, y: 18 },
    training_grounds: { x: 78, y: 18 },
    communications_hub: { x: 88, y: 52 },
    archive: { x: 12, y: 52 },
    workshop: { x: 26, y: 82 },
    trophy_hall: { x: 50, y: 88 },
    vault: { x: 74, y: 82 },
};

const RESOURCE_META = {
    intel: { label: "Intel", color: "#60a5fa" },
    materials: { label: "Materials", color: "#f0b429" },
    prestige: { label: "Prestige", color: "#a855f7" },
} as const;

/* ── one node ─────────────────────────────────────────────────────────── */

function BuildingNode({
    building, selected, onSelect, positioned,
}: {
    building: ClanBuildingRow;
    selected: boolean;
    onSelect: () => void;
    positioned: boolean;
}) {
    const Icon = BUILDING_ICONS[building.key] ?? Shield;
    const central = building.key === "command_center";
    const underConstruction = building.project_id !== null;

    return (
        <button
            onClick={onSelect}
            style={positioned ? {
                position: "absolute",
                left: `${NODE_POSITIONS[building.key].x}%`,
                top: `${NODE_POSITIONS[building.key].y}%`,
                transform: "translate(-50%, -50%)",
            } : undefined}
            className={`group flex items-center gap-2.5 rounded-[11px] border px-3 py-2 transition-all duration-300 ${
                selected
                    ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,#0d0b0a)] shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_25%,transparent)]"
                    : building.locked
                        ? "border-white/[0.06] bg-[#0d0b0a]/90 opacity-60 hover:opacity-90"
                        : "border-white/[0.1] bg-[#0d0b0a]/90 hover:border-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
            } ${central ? "px-4 py-2.5" : ""}`}
        >
            <span
                className={`shrink-0 rounded-[8px] flex items-center justify-center ${central ? "w-9 h-9" : "w-7 h-7"}`}
                style={{
                    background: building.locked
                        ? "rgba(255,255,255,0.04)"
                        : building.level > 0
                            ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                            : "rgba(255,255,255,0.06)",
                    color: building.locked ? "rgba(255,255,255,0.25)" : building.level > 0 ? "var(--accent)" : "rgba(255,255,255,0.5)",
                }}
            >
                {building.locked ? <Lock className="w-3.5 h-3.5" /> : <Icon className={central ? "w-4.5 h-4.5" : "w-3.5 h-3.5"} />}
            </span>

            <span className="text-left min-w-0">
                <span className={`block font-display font-bold text-white leading-tight whitespace-nowrap ${central ? "text-[12.5px]" : "text-[11px]"}`}>
                    {building.name}
                </span>
                <span className="block font-display text-[8.5px] font-black uppercase tracking-[0.1em] leading-tight">
                    {building.locked ? (
                        <span className="text-white/25">Needs CC{building.requires_cc}</span>
                    ) : underConstruction ? (
                        <span className="text-[#f0b429]">Upgrading…</span>
                    ) : building.level > 0 ? (
                        <span className="text-[var(--accent)]">Level {building.level}</span>
                    ) : (
                        <span className="text-white/30">Not built</span>
                    )}
                </span>
            </span>

            {!building.locked && building.level === 0 && !underConstruction && (
                <Plus className="w-3 h-3 text-white/25 group-hover:text-[var(--accent)] transition-colors" />
            )}
        </button>
    );
}

/* ── construction card ────────────────────────────────────────────────── */

function ConstructionCard({
    project, slug, canManage, resources, onChanged,
}: {
    project: ClanProjectRow;
    slug: string;
    canManage: boolean;
    resources: ClanBasePayload["resources"];
    onChanged: () => void;
}) {
    const [busy, setBusy] = useState(false);
    const left = useCountdown(project.status === "building" ? project.finishes_at : null);

    const act = async (fn: () => Promise<unknown>, done: string) => {
        setBusy(true);
        try {
            await fn();
            toast.success(done);
            onChanged();
        } catch (e: unknown) {
            const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "That didn't work.");
        } finally {
            setBusy(false);
        }
    };

    const fundAll = () => act(
        () => axios.post(`/clans/${slug}/base/projects/${project.id}/fund`, {
            intel: Math.min(resources.intel, project.cost_intel - project.funded_intel),
            materials: Math.min(resources.materials, project.cost_materials - project.funded_materials),
        }),
        "Treasury moved into the project."
    );

    const bar = (funded: number, cost: number, color: string, label: string) => (
        <div>
            <p className="flex items-center justify-between mb-1">
                <span className="font-display text-[9px] font-bold uppercase tracking-[0.12em] text-white/40">{label}</span>
                <span className="font-display text-[10px] font-bold tabular-nums" style={{ color }}>
                    {funded.toLocaleString("en-US")} / {cost.toLocaleString("en-US")}
                </span>
            </p>
            <span className="block h-[5px] rounded-full bg-[var(--track)] overflow-hidden">
                <span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${cost > 0 ? Math.min(100, (funded / cost) * 100) : 100}%`, background: color }} />
            </span>
        </div>
    );

    return (
        <Panel
            variant="console"
            title="Current Construction"
            meta={<span className="font-display text-[10px] font-black tabular-nums text-white/40">{project.funded_percent}%</span>}
        >
            <p className="font-display text-[14px] font-black text-white">
                {project.building_name} <span className="text-[var(--accent)]">→ Level {project.target_level}</span>
            </p>

            {project.status === "funding" ? (
                <>
                    <p className="mt-1 text-[11.5px] text-white/40">Funding from the treasury — the timer starts when both costs are met.</p>
                    <div className="mt-3.5 space-y-3">
                        {bar(project.funded_intel, project.cost_intel, RESOURCE_META.intel.color, "Intel")}
                        {bar(project.funded_materials, project.cost_materials, RESOURCE_META.materials.color, "Materials")}
                    </div>
                    {canManage && (
                        <div className="mt-4 flex items-center gap-2">
                            <button
                                onClick={fundAll}
                                disabled={busy}
                                className="flex-1 inline-flex items-center justify-center gap-2 h-9 rounded-[8px] bg-[var(--accent)] hover:brightness-110 disabled:opacity-50 text-white font-display text-[10px] font-bold uppercase tracking-[0.1em] transition-[filter]"
                            >
                                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Coins className="w-3.5 h-3.5" />}
                                Fund from treasury
                            </button>
                            <button
                                onClick={() => act(() => axios.delete(`/clans/${slug}/base/projects/${project.id}`), "Project cancelled — funds returned.")}
                                disabled={busy}
                                title="Cancel project"
                                className="w-9 h-9 rounded-[8px] bg-white/[0.05] border border-white/[0.09] flex items-center justify-center text-white/40 hover:text-red-400 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <p className="mt-3 flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-white/40">
                        <Clock3 className="w-3.5 h-3.5 text-[#f0b429]" />
                        {left.done ? "Finishing…" : `${left.days > 0 ? `${left.days}d ` : ""}${left.hours}h ${left.minutes}m ${left.seconds}s remaining`}
                    </p>
                    <span className="block mt-2.5 h-[6px] rounded-full bg-[var(--track)] overflow-hidden">
                        <span className="block h-full rounded-full bg-gradient-to-r from-[#f0b429]/70 to-[#f0b429] animate-pulse" style={{ width: "100%" }} />
                    </span>
                    {canManage && (
                        <button
                            onClick={() => act(() => axios.post(`/clans/${slug}/base/projects/${project.id}/speed-up`), "Construction completed!")}
                            disabled={busy}
                            className="mt-4 w-full inline-flex items-center justify-center gap-2 h-9 rounded-[8px] bg-[#a855f7]/15 border border-[#a855f7]/40 hover:bg-[#a855f7]/25 disabled:opacity-50 text-[#c084fc] font-display text-[10px] font-bold uppercase tracking-[0.1em] transition-colors"
                        >
                            <Zap className="w-3.5 h-3.5" /> Speed up with Prestige
                        </button>
                    )}
                </>
            )}
        </Panel>
    );
}

/* ── missions ─────────────────────────────────────────────────────────── */

const MISSION_TYPE_META: Record<ClanMissionRow["type"], { label: string; color: string }> = {
    individual: { label: "Mission", color: "var(--accent)" },
    squad: { label: "Squad", color: "#60a5fa" },
    operation: { label: "Operation", color: "#a855f7" },
};

function MissionTimer({ endsAt }: { endsAt: string | null }) {
    const left = useCountdown(endsAt);

    if (left.done) return null;

    return (
        <span className="inline-flex items-center gap-1.5 font-display text-[9.5px] font-bold tabular-nums text-white/35">
            <Clock3 className="w-3 h-3" />
            {left.days > 0 ? `${left.days}d ${left.hours}h` : `${left.hours}h ${left.minutes}m`} left
        </span>
    );
}

function MissionCard({ mission }: { mission: ClanMissionRow }) {
    const meta = MISSION_TYPE_META[mission.type];
    const done = mission.status === "completed";

    return (
        <div
            className="rounded-[12px] border p-4 transition-colors duration-300"
            style={{
                borderColor: done ? "rgba(52,211,153,0.35)" : `color-mix(in srgb, ${meta.color} 22%, transparent)`,
                background: done ? "rgba(52,211,153,0.04)" : "rgba(255,255,255,0.015)",
            }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="flex items-center gap-2 flex-wrap">
                        <span
                            className="inline-flex items-center h-[18px] px-2 rounded-[4px] font-display text-[8px] font-black uppercase tracking-[0.12em]"
                            style={{ color: done ? "#34d399" : meta.color, background: `color-mix(in srgb, ${done ? "#34d399" : meta.color} 13%, transparent)` }}
                        >
                            {done ? "Complete" : meta.label}
                        </span>
                        <span className="font-display text-[13.5px] font-black text-white">{mission.name}</span>
                    </p>
                    {mission.description && (
                        <p className="mt-1 text-[11.5px] text-white/40 leading-snug">{mission.description}</p>
                    )}
                </div>
                {!done && <MissionTimer endsAt={mission.ends_at} />}
            </div>

            {/* progress */}
            <div className="mt-3">
                <p className="flex items-center justify-between mb-1.5">
                    <span className="font-display text-[10px] font-bold tabular-nums text-white/45">
                        {mission.type === "squad" && mission.per_member_target ? (
                            <>{mission.qualified_members ?? 0} / {mission.target} members done ({mission.per_member_target} each)</>
                        ) : (
                            <>{mission.progress.toLocaleString("en-US")} / {mission.target.toLocaleString("en-US")}</>
                        )}
                    </span>
                    <span className="font-display text-[10.5px] font-black tabular-nums" style={{ color: done ? "#34d399" : meta.color }}>
                        {mission.type === "squad"
                            ? `${Math.min(100, Math.round(((mission.qualified_members ?? 0) / Math.max(1, mission.target)) * 100))}%`
                            : `${mission.percent}%`}
                    </span>
                </p>
                <span className="block h-[7px] rounded-full bg-[var(--track)] overflow-hidden">
                    <span
                        className="block h-full rounded-full transition-[width] duration-700 ease-[var(--ease-hud)]"
                        style={{
                            width: `${mission.type === "squad" ? Math.min(100, Math.round(((mission.qualified_members ?? 0) / Math.max(1, mission.target)) * 100)) : mission.percent}%`,
                            background: done ? "#34d399" : `linear-gradient(90deg, color-mix(in srgb, ${meta.color} 60%, transparent), ${meta.color})`,
                        }}
                    />
                </span>

                {/* operation stage markers */}
                {mission.stages && mission.stages.length > 0 && (
                    <p className="mt-2 flex items-center gap-2 flex-wrap">
                        {mission.stages.map((stage, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center gap-1 font-display text-[8.5px] font-black uppercase tracking-[0.1em]"
                                style={{ color: mission.stage > i ? "#34d399" : "rgba(255,255,255,0.3)" }}
                            >
                                {mission.stage > i ? <Check className="w-3 h-3" /> : <Flag className="w-3 h-3" />}
                                Stage {i + 1} · {stage.target}
                            </span>
                        ))}
                    </p>
                )}
            </div>

            {/* rewards + top contributors */}
            <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                <span className="flex items-center gap-3 font-display text-[10px] font-bold tabular-nums">
                    {mission.rewards.intel > 0 && <span style={{ color: RESOURCE_META.intel.color }}>+{mission.rewards.intel.toLocaleString("en-US")} Intel</span>}
                    {mission.rewards.materials > 0 && <span style={{ color: RESOURCE_META.materials.color }}>+{mission.rewards.materials.toLocaleString("en-US")} Materials</span>}
                    {mission.rewards.prestige > 0 && <span style={{ color: RESOURCE_META.prestige.color }}>+{mission.rewards.prestige.toLocaleString("en-US")} Prestige</span>}
                </span>

                {mission.top_contributors.length > 0 && (
                    <span className="flex items-center gap-1.5 font-display text-[9.5px] font-bold text-white/30">
                        <Crown className="w-3 h-3 text-[#f0b429]" />
                        {mission.top_contributors.map((c) => c.username).join(" · ")}
                    </span>
                )}
            </div>
        </div>
    );
}

/* ── boosters ─────────────────────────────────────────────────────────── */

function BoosterRow({
    boost, slug, canManage, slotsFree, onChanged,
}: {
    boost: ClanBoostRow;
    slug: string;
    canManage: boolean;
    slotsFree: boolean;
    onChanged: () => void;
}) {
    const [busy, setBusy] = useState(false);
    const left = useCountdown(boost.active ? boost.ends_at : boost.cooldown_until);

    const activate = async () => {
        setBusy(true);
        try {
            await axios.post(`/clans/${slug}/base/boosts`, { key: boost.key });
            toast.success(`${boost.name} activated`);
            onChanged();
        } catch (e: unknown) {
            const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "Couldn't activate that.");
        } finally {
            setBusy(false);
        }
    };

    const costColor = RESOURCE_META[boost.cost.resource].color;

    return (
        <div
            className={`rounded-[10px] border p-3 transition-colors ${
                boost.active
                    ? "border-emerald-500/35 bg-emerald-500/[0.05]"
                    : "border-white/[0.06] bg-white/[0.015]"
            }`}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="font-display text-[12px] font-bold text-white">{boost.name}</span>
                {boost.active ? (
                    <span className="inline-flex items-center gap-1.5 font-display text-[9px] font-black uppercase tracking-[0.1em] text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {left.done ? "Ending…" : `${left.hours + left.days * 24}h ${left.minutes}m`}
                    </span>
                ) : boost.on_cooldown ? (
                    <span className="font-display text-[9px] font-black uppercase tracking-[0.1em] text-white/25">
                        Cooldown {left.done ? "" : `${left.hours + left.days * 24}h`}
                    </span>
                ) : null}
            </div>
            <p className="mt-1 text-[11px] text-white/40 leading-snug">{boost.description}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
                <span className="font-display text-[10px] font-bold tabular-nums" style={{ color: costColor }}>
                    {boost.cost.amount.toLocaleString("en-US")} {RESOURCE_META[boost.cost.resource].label} · {boost.duration_hours}h
                </span>
                {canManage && !boost.active && !boost.on_cooldown && (
                    <button
                        onClick={activate}
                        disabled={busy || !boost.affordable || !slotsFree}
                        title={!slotsFree ? "Every booster slot is busy" : !boost.affordable ? "The treasury is short" : undefined}
                        className={`inline-flex items-center gap-1.5 h-[26px] px-3 rounded-[6px] font-display text-[9px] font-black uppercase tracking-[0.1em] transition-[filter,background] ${
                            boost.affordable && slotsFree
                                ? "bg-[var(--accent)] hover:brightness-110 text-white"
                                : "bg-white/[0.05] text-white/25 cursor-not-allowed"
                        }`}
                    >
                        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />}
                        Activate
                    </button>
                )}
            </div>
        </div>
    );
}

/* ── polls ────────────────────────────────────────────────────────────── */

function PollCard({ poll, onVoted }: { poll: ClanPollRow; onVoted: () => void }) {
    const [busy, setBusy] = useState(false);
    const showResults = poll.closed || poll.my_vote !== null;

    const vote = async (option: number) => {
        setBusy(true);
        try {
            await axios.post(`/clans/polls/${poll.id}/vote`, { option });
            onVoted();
        } catch (e: unknown) {
            const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "Couldn't vote.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="rounded-[10px] border border-white/[0.07] bg-white/[0.015] p-3.5">
            <p className="text-[12.5px] font-bold text-white leading-snug">{poll.question}</p>
            <p className="mt-0.5 font-display text-[9px] font-bold uppercase tracking-[0.1em] text-white/25">
                {poll.total_votes} vote{poll.total_votes === 1 ? "" : "s"}{poll.closed ? " · closed" : ""}
            </p>

            <div className="mt-2.5 space-y-1.5">
                {poll.options.map((option, i) => (
                    showResults ? (
                        <div key={i} className="relative h-8 rounded-[7px] overflow-hidden border border-white/[0.06]">
                            <span
                                aria-hidden
                                className="absolute inset-y-0 left-0 transition-[width] duration-500"
                                style={{
                                    width: `${option.percent}%`,
                                    background: poll.my_vote === i
                                        ? "color-mix(in srgb, var(--accent) 30%, transparent)"
                                        : "rgba(255,255,255,0.05)",
                                }}
                            />
                            <span className="relative z-10 flex items-center justify-between h-full px-3">
                                <span className={`text-[11.5px] font-semibold ${poll.my_vote === i ? "text-white" : "text-white/60"}`}>
                                    {option.label} {poll.my_vote === i && <Check className="inline w-3 h-3 text-[var(--accent)]" />}
                                </span>
                                <span className="font-display text-[10px] font-black tabular-nums text-white/45">{option.percent}%</span>
                            </span>
                        </div>
                    ) : (
                        <button
                            key={i}
                            onClick={() => vote(i)}
                            disabled={busy}
                            className="w-full h-8 px-3 rounded-[7px] border border-white/[0.08] bg-white/[0.03] hover:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-left text-[11.5px] font-semibold text-white/70 hover:text-white transition-colors"
                        >
                            {option.label}
                        </button>
                    )
                ))}
            </div>
        </div>
    );
}

/* ── the page ─────────────────────────────────────────────────────────── */

export default function BaseClient({ slug }: { slug: string }) {
    const { data, isLoading, mutate } = useSWR<ClanBasePayload>(`/clans/${slug}/base`, fetcher);
    const [selectedKey, setSelectedKey] = useState<string>("command_center");
    const [starting, setStarting] = useState(false);
    const [contribTab, setContribTab] = useState<"week" | "month" | "all">("week");

    const selected = useMemo(
        () => data?.base.buildings.find((b) => b.key === selectedKey) ?? null,
        [data, selectedKey]
    );

    const startProject = async (building: ClanBuildingRow) => {
        setStarting(true);
        try {
            await axios.post(`/clans/${slug}/base/projects`, { building: building.key });
            toast.success(`${building.name} → Level ${building.level + 1} project started`);
            mutate();
        } catch (e: unknown) {
            const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "Couldn't start that project.");
        } finally {
            setStarting(false);
        }
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-[var(--surface-0)]">
                <div className="container-page py-6 space-y-4">
                    <div className="h-[120px] rounded-[var(--radius-panel)] bg-white/[0.04] animate-pulse" />
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                        <div className="xl:col-span-8 h-[460px] rounded-[var(--radius-panel)] bg-white/[0.04] animate-pulse" />
                        <div className="xl:col-span-4 h-[460px] rounded-[var(--radius-panel)] bg-white/[0.04] animate-pulse" />
                    </div>
                </div>
            </main>
        );
    }

    if (!data) {
        return (
            <main className="min-h-screen bg-[var(--surface-0)] flex items-center justify-center">
                <EmptyState
                    icon={<Castle className="w-[18px] h-[18px]" />}
                    title="The base is for members only"
                    body="Join the clan to see inside its walls."
                    action={{ label: "Back to the clan", href: `/clans/${slug}` }}
                />
            </main>
        );
    }

    const clan = data.clan;
    const tier = TIER_COLORS[clan.progress.tier_name] ?? TIER_COLORS.Outpost;
    const contributions = data.contributions[contribTab];
    const activeBonuses = data.base.buildings.filter((b) => b.level > 0).flatMap((b) =>
        b.effects.map((e) => ({ building: b.name, effect: e, key: b.key }))
    );

    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            <div className="container-page py-6 space-y-4">
                {/* ── header ── */}
                <p className="flex items-center gap-2 font-display text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/30">
                    <Link href="/clans" className="hover:text-white transition-colors">Clans</Link>
                    <ChevronRight className="w-3 h-3" />
                    <Link href={`/clans/${clan.slug}`} className="hover:text-white transition-colors">{clan.name}</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-[var(--accent)]">Base</span>
                </p>

                <div className="rounded-[var(--radius-panel)] border border-white/[0.07] bg-[#100e0d] p-5">
                    <div className="flex flex-wrap items-center gap-5">
                        <span
                            className="w-[64px] h-[64px] shrink-0 rounded-[14px] border-2 bg-[#0d0b0a] overflow-hidden flex items-center justify-center"
                            style={{ borderColor: tier }}
                        >
                            {clan.logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={getStorageUrl(clan.logo)} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <Shield className="w-7 h-7" style={{ color: tier }} />
                            )}
                        </span>

                        <div className="min-w-0">
                            <h1 className="font-display text-[20px] font-black text-white leading-tight uppercase tracking-[0.02em]">
                                {clan.name} Base
                            </h1>
                            <p className="flex items-center gap-2 font-display text-[10.5px] font-bold uppercase tracking-[0.12em]" style={{ color: tier }}>
                                <ShieldCheck className="w-3.5 h-3.5" /> {clan.progress.tier_name} · Level {clan.level}
                            </p>
                        </div>

                        <div className="flex-1 min-w-[180px] max-w-[300px]">
                            <p className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="font-display text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">Next level</span>
                                <span className="font-display text-[9.5px] font-bold tabular-nums text-white/35">
                                    {clan.progress.xp.toLocaleString("en-US")} / {clan.progress.next_level_xp.toLocaleString("en-US")} XP
                                </span>
                            </p>
                            <span className="block h-[7px] rounded-full bg-[var(--track)] overflow-hidden">
                                <span
                                    className="block h-full rounded-full transition-[width] duration-700 ease-[var(--ease-hud)]"
                                    style={{ width: `${clan.progress.percent}%`, background: `linear-gradient(90deg, ${tier}90, ${tier})` }}
                                />
                            </span>
                        </div>

                        {/* resources */}
                        <div className="flex items-center gap-5 ml-auto">
                            {(Object.keys(RESOURCE_META) as (keyof typeof RESOURCE_META)[]).map((key) => {
                                const meta = RESOURCE_META[key];
                                const rate = data.resources.rates[key];
                                return (
                                    <span key={key} className="text-right">
                                        <span className="block font-display text-[8.5px] font-bold uppercase tracking-[0.14em] text-white/35">{meta.label}</span>
                                        <span className="block font-display text-[16px] font-black tabular-nums leading-tight" style={{ color: meta.color }}>
                                            {data.resources[key].toLocaleString("en-US")}
                                        </span>
                                        {rate != null && rate > 0 && (
                                            <span className="block font-display text-[8.5px] font-bold tabular-nums text-emerald-400/70">+{rate}/hr</span>
                                        )}
                                    </span>
                                );
                            })}
                            <span className="text-right border-l border-white/[0.08] pl-5">
                                <span className="block font-display text-[8.5px] font-bold uppercase tracking-[0.14em] text-white/35">Roster</span>
                                <span className="block font-display text-[16px] font-black tabular-nums leading-tight text-white">
                                    {clan.members_count}<span className="text-white/30 text-[11px]"> / {clan.member_limit}</span>
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                    {/* ── the map ── */}
                    <div className="xl:col-span-8 min-w-0 space-y-4">
                        <div className="relative rounded-[var(--radius-panel)] border border-white/[0.07] overflow-hidden bg-[#0b0a09]">
                            {/* command-grid backdrop */}
                            <span aria-hidden className="absolute inset-0" style={{
                                backgroundImage: "radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--accent) 9%, transparent), transparent 55%), repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.025) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.025) 40px)",
                            }} />

                            <p className="relative z-10 px-5 pt-4 font-display text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
                                Base Overview
                            </p>

                            {/* positioned nodes on lg+, stacked grid below */}
                            <div className="relative z-10 hidden lg:block h-[400px]">
                                <svg aria-hidden className="absolute inset-0 w-full h-full pointer-events-none">
                                    {Object.entries(NODE_POSITIONS).filter(([k]) => k !== "command_center").map(([key, pos]) => (
                                        <line
                                            key={key}
                                            x1="50%" y1="34%"
                                            x2={`${pos.x}%`} y2={`${pos.y}%`}
                                            stroke="color-mix(in srgb, var(--accent) 18%, transparent)"
                                            strokeWidth="1"
                                            strokeDasharray="3 5"
                                        />
                                    ))}
                                </svg>
                                {data.base.buildings.map((b) => (
                                    <BuildingNode
                                        key={b.key}
                                        building={b}
                                        selected={selectedKey === b.key}
                                        onSelect={() => setSelectedKey(b.key)}
                                        positioned
                                    />
                                ))}
                            </div>

                            <div className="relative z-10 lg:hidden grid grid-cols-2 gap-2 p-4">
                                {data.base.buildings.map((b) => (
                                    <BuildingNode
                                        key={b.key}
                                        building={b}
                                        selected={selectedKey === b.key}
                                        onSelect={() => setSelectedKey(b.key)}
                                        positioned={false}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* ── mission board ── */}
                        <Panel
                            title="Mission Board"
                            meta={data.missions.length > 0 ? (
                                <span className="font-display text-[10px] font-black tabular-nums text-white/35">
                                    {data.missions.filter((m) => m.status === "active").length} active
                                </span>
                            ) : undefined}
                        >
                            {data.missions.length === 0 ? (
                                <EmptyState
                                    variant="compact"
                                    title={(data.base.buildings.find((b) => b.key === "mission_control")?.level ?? 0) > 0
                                        ? "No missions on the board"
                                        : "Build Mission Control to receive missions"}
                                    body={(data.base.buildings.find((b) => b.key === "mission_control")?.level ?? 0) > 0
                                        ? "New missions are briefed every Monday."
                                        : "Once it stands, the clan gets a weekly board of collective goals."}
                                />
                            ) : (
                                <div className="space-y-3">
                                    {data.missions.map((m) => <MissionCard key={m.id} mission={m} />)}
                                </div>
                            )}
                        </Panel>

                        {/* ── clan dna ── */}
                        {data.dna && (
                            <Panel
                                variant="console"
                                title="Clan DNA"
                                meta={data.dna.dominant_archetype ? (
                                    <span className="inline-flex items-center h-[20px] px-2.5 rounded-[5px] bg-[var(--accent-soft)] font-display text-[9px] font-black uppercase tracking-[0.1em] text-[var(--accent)]">
                                        {data.dna.dominant_archetype}
                                    </span>
                                ) : undefined}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <p className="font-display text-[9px] font-black uppercase tracking-[0.14em] text-white/40 mb-2.5">
                                            What the clan plays
                                        </p>
                                        <div className="space-y-2">
                                            {data.dna.genres.map((g) => (
                                                <div key={g.name}>
                                                    <p className="flex items-center justify-between mb-1">
                                                        <span className="text-[11.5px] font-semibold text-white/65">{g.name}</span>
                                                        <span className="font-display text-[10px] font-black tabular-nums text-white/40">{g.percent}%</span>
                                                    </p>
                                                    <span className="block h-[5px] rounded-full bg-[var(--track)] overflow-hidden">
                                                        <span className="block h-full rounded-full" style={{ width: `${g.percent}%`, background: "var(--accent)" }} />
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="font-display text-[9px] font-black uppercase tracking-[0.14em] text-white/40 mb-2.5">
                                            Which eras it lives in
                                        </p>
                                        <div className="flex h-[8px] rounded-full overflow-hidden bg-[var(--track)] mb-2.5">
                                            {data.dna.eras.map((e) => (
                                                e.percent > 0 && <span key={e.key} style={{ width: `${e.percent}%`, background: e.color }} title={`${e.label}: ${e.percent}%`} />
                                            ))}
                                        </div>
                                        <div className="space-y-1.5">
                                            {data.dna.eras.filter((e) => e.percent > 0).map((e) => (
                                                <p key={e.key} className="flex items-center gap-2 text-[11px] text-white/50">
                                                    <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
                                                    {e.label}
                                                    <span className="ml-auto font-display text-[10px] font-black tabular-nums text-white/35">{e.percent}%</span>
                                                </p>
                                            ))}
                                        </div>
                                        <p className="mt-3 pt-3 border-t border-white/[0.07] flex items-center gap-4 font-display text-[10px] font-bold tabular-nums text-white/35">
                                            <span>{data.dna.games.toLocaleString("en-US")} games on the roster</span>
                                            <span className="text-emerald-400/80">{data.dna.completion_rate}% completed</span>
                                        </p>
                                    </div>
                                </div>
                            </Panel>
                        )}

                        {/* ── selected building detail ── */}
                        {selected && (
                            <Panel
                                title={selected.name}
                                meta={
                                    <span className="font-display text-[10px] font-black uppercase tracking-[0.1em] text-white/35 tabular-nums">
                                        Level {selected.level} / {selected.max_level}
                                    </span>
                                }
                            >
                                {selected.locked ? (
                                    <p className="flex items-center gap-2.5 text-[12.5px] text-white/45">
                                        <Lock className="w-4 h-4 text-white/30" />
                                        Locked — raise the Command Center to level {selected.requires_cc} first.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <p className="font-display text-[9px] font-black uppercase tracking-[0.14em] text-white/40 mb-2">Now</p>
                                            <ul className="space-y-1.5">
                                                {selected.effects.map((e) => (
                                                    <li key={e} className="flex items-start gap-2 text-[12.5px] text-white/60 leading-snug">
                                                        <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-400/70" /> {e}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {selected.next_cost && (
                                            <div>
                                                <p className="font-display text-[9px] font-black uppercase tracking-[0.14em] text-white/40 mb-2">
                                                    Level {selected.level + 1}
                                                </p>
                                                <ul className="space-y-1.5 mb-3">
                                                    {selected.next_effects.map((e) => (
                                                        <li key={e} className="flex items-start gap-2 text-[12.5px] text-white/60 leading-snug">
                                                            <ArrowUp className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[var(--accent)]" /> {e}
                                                        </li>
                                                    ))}
                                                </ul>
                                                <p className="flex items-center gap-3.5 font-display text-[11px] font-bold tabular-nums">
                                                    <span style={{ color: RESOURCE_META.intel.color }}>{selected.next_cost.intel.toLocaleString("en-US")} Intel</span>
                                                    <span style={{ color: RESOURCE_META.materials.color }}>{selected.next_cost.materials.toLocaleString("en-US")} Materials</span>
                                                    <span className="text-white/35"><Clock3 className="inline w-3 h-3 mr-1" />{selected.build_hours}h build</span>
                                                </p>
                                                {data.can_manage && !selected.project_id && (
                                                    <button
                                                        onClick={() => startProject(selected)}
                                                        disabled={starting}
                                                        className="mt-3.5 inline-flex items-center gap-2 h-9 px-5 rounded-[8px] bg-[var(--accent)] hover:brightness-110 disabled:opacity-50 text-white font-display text-[10px] font-bold uppercase tracking-[0.1em] transition-[filter]"
                                                    >
                                                        {starting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Hammer className="w-3.5 h-3.5" />}
                                                        Start construction
                                                    </button>
                                                )}
                                                {selected.project_id && (
                                                    <p className="mt-3 font-display text-[10px] font-bold uppercase tracking-[0.1em] text-[#f0b429]">
                                                        A project for this building is already running.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Panel>
                        )}

                        {/* ── contributions ── */}
                        <Panel
                            title="Member Contributions"
                            meta={
                                <span className="flex items-center gap-1">
                                    {(["week", "month", "all"] as const).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setContribTab(t)}
                                            className={`h-[22px] px-2.5 rounded-[5px] font-display text-[8.5px] font-black uppercase tracking-[0.1em] transition-colors ${
                                                contribTab === t ? "bg-[var(--accent)] text-white" : "text-white/35 hover:text-white"
                                            }`}
                                        >
                                            {t === "week" ? "This week" : t === "month" ? "This month" : "All time"}
                                        </button>
                                    ))}
                                </span>
                            }
                        >
                            {contributions.length === 0 ? (
                                <EmptyState variant="compact" title="No contributions in this window" body="Reviews, completions, achievements and sessions all feed the base." />
                            ) : (
                                <div className="space-y-2.5">
                                    {contributions.map((row, i) => {
                                        const top = contributions[0]?.total || 1;
                                        return (
                                            <div key={row.username} className="flex items-center gap-3">
                                                <span className={`w-5 shrink-0 font-display text-[11px] font-black tabular-nums ${i === 0 ? "text-[#f0b429]" : "text-white/25"}`}>{i + 1}</span>
                                                <Avatar src={row.avatar_url} alt={row.username} size="sm" />
                                                <Link href={`/profile/${row.username}`} className="w-[130px] shrink-0 text-[12.5px] font-semibold text-white truncate hover:text-[var(--accent)] transition-colors">
                                                    {row.username}
                                                </Link>
                                                <span className="flex-1 h-[6px] rounded-full bg-[var(--track)] overflow-hidden">
                                                    <span
                                                        className="block h-full rounded-full"
                                                        style={{ width: `${(row.total / top) * 100}%`, background: "linear-gradient(90deg, color-mix(in srgb, var(--accent) 60%, transparent), var(--accent))" }}
                                                    />
                                                </span>
                                                <span className="shrink-0 w-[70px] text-right font-display text-[12px] font-black tabular-nums text-white/70">
                                                    {row.total.toLocaleString("en-US")}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Panel>
                    </div>

                    {/* ── sidebar ── */}
                    <aside className="xl:col-span-4 min-w-0 space-y-4">
                        {data.base.projects.length > 0 ? (
                            data.base.projects.map((p) => (
                                <ConstructionCard
                                    key={p.id}
                                    project={p}
                                    slug={slug}
                                    canManage={data.can_manage}
                                    resources={data.resources}
                                    onChanged={() => mutate()}
                                />
                            ))
                        ) : (
                            <Panel variant="console" title="Current Construction">
                                <EmptyState
                                    variant="compact"
                                    title="Nothing under construction"
                                    body={data.can_manage
                                        ? "Pick a building on the map and start its next level."
                                        : "Officers start projects; everything you earn helps fund them."}
                                />
                                <p className="mt-3 font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/30">
                                    {data.base.project_slots} project slot{data.base.project_slots > 1 ? "s" : ""} available
                                </p>
                            </Panel>
                        )}

                        <Panel title="Resource Breakdown">
                            <div className="space-y-3">
                                {(Object.keys(RESOURCE_META) as (keyof typeof RESOURCE_META)[]).map((key) => {
                                    const meta = RESOURCE_META[key];
                                    const value = data.resources[key];
                                    const pct = Math.min(100, (value / data.resources.capacity) * 100);
                                    return (
                                        <div key={key}>
                                            <p className="flex items-center justify-between mb-1">
                                                <span className="text-[12px] font-semibold text-white/60">{meta.label}</span>
                                                <span className="font-display text-[11px] font-black tabular-nums" style={{ color: meta.color }}>
                                                    {value.toLocaleString("en-US")}
                                                    <span className="text-white/25 font-bold"> / {data.resources.capacity.toLocaleString("en-US")}</span>
                                                </span>
                                            </p>
                                            <span className="block h-[5px] rounded-full bg-[var(--track)] overflow-hidden">
                                                <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: meta.color }} />
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="mt-3.5 pt-3 border-t border-white/[0.07] text-[10.5px] text-white/30 leading-snug">
                                The Vault sets the ceiling — a full treasury is the signal to build, not to hoard.
                            </p>
                        </Panel>

                        <Panel
                            title="Boosters"
                            meta={
                                <span className="font-display text-[10px] font-black tabular-nums text-white/35">
                                    {data.boosts.active_count}/{data.boosts.slots} running
                                </span>
                            }
                        >
                            <div className="space-y-2.5">
                                {data.boosts.boosters.map((b) => (
                                    <BoosterRow
                                        key={b.key}
                                        boost={b}
                                        slug={slug}
                                        canManage={data.can_manage}
                                        slotsFree={data.boosts.active_count < data.boosts.slots}
                                        onChanged={() => mutate()}
                                    />
                                ))}
                            </div>
                        </Panel>

                        {activeBonuses.length > 0 && (
                            <Panel title="Active Bonuses">
                                <div className="space-y-2">
                                    {activeBonuses.map((b, i) => (
                                        <p key={i} className="flex items-start gap-2 text-[12px] text-white/55 leading-snug">
                                            <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-400/70" />
                                            <span><span className="font-bold text-white/75">{b.building}:</span> {b.effect}</span>
                                        </p>
                                    ))}
                                </div>
                            </Panel>
                        )}

                        {data.themes.workshop_level > 0 && (
                            <Panel
                                title="Workshop Themes"
                                meta={<span className="font-display text-[10px] font-black tabular-nums text-white/35">Tier {data.themes.workshop_level}</span>}
                            >
                                <div className="grid grid-cols-3 gap-2">
                                    {data.themes.catalog.map((theme) => {
                                        const equipped = data.themes.equipped === theme.key;
                                        return (
                                            <button
                                                key={theme.key}
                                                disabled={!data.can_manage || !theme.unlocked}
                                                onClick={async () => {
                                                    try {
                                                        await axios.post(`/clans/${slug}/base/theme`, { key: equipped ? null : theme.key });
                                                        toast.success(equipped ? "Theme cleared" : `${theme.name} equipped`);
                                                        mutate();
                                                    } catch (e: unknown) {
                                                        const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
                                                        toast.error(message ?? "Couldn't equip that.");
                                                    }
                                                }}
                                                title={theme.unlocked
                                                    ? theme.name
                                                    : `${theme.name} — Workshop ${theme.requires_workshop}${theme.requires_prestige > 0 ? ` + ${theme.requires_prestige.toLocaleString("en-US")} Prestige` : ""}`}
                                                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-[9px] border transition-colors ${
                                                    equipped
                                                        ? "border-[var(--accent)]"
                                                        : theme.unlocked
                                                            ? "border-white/[0.08] hover:border-white/[0.2]"
                                                            : "border-white/[0.05] opacity-40"
                                                }`}
                                            >
                                                <span className="w-7 h-7 rounded-full border border-white/20" style={{ background: theme.value }} />
                                                <span className="font-display text-[8px] font-bold uppercase tracking-[0.06em] text-white/50 text-center leading-tight">
                                                    {theme.name}
                                                </span>
                                                {equipped && <Check className="w-3 h-3 text-[var(--accent)]" />}
                                                {!theme.unlocked && <Lock className="w-2.5 h-2.5 text-white/30" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </Panel>
                        )}

                        {data.polls.enabled && (
                            <Panel title="Clan Polls">
                                {data.polls.items.length === 0 ? (
                                    <EmptyState variant="compact" title="No open polls" body={data.can_manage ? "Put a decision to the roster." : undefined} />
                                ) : (
                                    <div className="space-y-3">
                                        {data.polls.items.map((poll) => (
                                            <PollCard key={poll.id} poll={poll} onVoted={() => mutate()} />
                                        ))}
                                    </div>
                                )}
                            </Panel>
                        )}

                        {data.trophies.length > 0 && (
                            <Panel title="Trophy Hall">
                                <div className="space-y-2.5">
                                    {data.trophies.map((t) => (
                                        <div key={t.id} className="flex items-center gap-3">
                                            <span className="w-8 h-8 shrink-0 rounded-[8px] bg-[#f0b429]/12 border border-[#f0b429]/30 flex items-center justify-center">
                                                <Trophy className="w-3.5 h-3.5 text-[#f0b429]" />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block text-[12px] font-bold text-white leading-snug">{t.title}</span>
                                                <span className="block font-display text-[8.5px] font-bold uppercase tracking-[0.1em] text-white/30">
                                                    {new Date(t.awarded_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                                                </span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Panel>
                        )}

                        <Panel title="Recent Activity">
                            {data.recent_activity.length === 0 ? (
                                <EmptyState variant="compact" title="Quiet so far" />
                            ) : (
                                <div className="space-y-2.5">
                                    {data.recent_activity.map((item) => (
                                        <div key={item.id} className="flex items-center gap-2.5">
                                            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[var(--accent)]/60" />
                                            <span className="min-w-0 flex-1 text-[11.5px] text-white/55 truncate">{item.title}</span>
                                            <span className="shrink-0 font-display text-[9px] font-bold uppercase tracking-[0.08em] text-white/25">
                                                {timeAgo(item.created_at)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Panel>
                    </aside>
                </div>
            </div>
        </main>
    );
}
