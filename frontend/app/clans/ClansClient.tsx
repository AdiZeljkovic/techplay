"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import {
    Shield, Users, Search, X, Plus, ChevronDown, Flame, Crown, Loader2, ArrowRight,
    ShieldCheck, Swords, Coffee, Layers, Globe2, Check, TrendingUp, Sparkles,
    UserPlus, BarChart3, Send, Activity, Trophy, Clock3,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Panel from "@/components/ui/Panel";
import { getStorageUrl } from "@/lib/imageUrl";
import { timeAgo } from "@/lib/timeAgo";
import type { ClanSummary } from "@/lib/types/clan";

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data);

/** Tier tint ramps with the ladder — an Outpost is quiet, a Nexus glows. */
export const TIER_COLORS: Record<string, string> = {
    Outpost: "#9ca3af",
    Garrison: "#34d399",
    Bastion: "#60a5fa",
    Citadel: "#a855f7",
    Nexus: "#f0b429",
};

const PLAYSTYLES = [
    { id: "competitive", label: "Competitive", icon: Swords },
    { id: "casual", label: "Casual", icon: Coffee },
    { id: "mixed", label: "Mixed", icon: Layers },
];

const SORTS = [
    { id: "activity", label: "Most active" },
    { id: "prestige", label: "Prestige" },
    { id: "level", label: "Level" },
    { id: "members", label: "Members" },
    { id: "newest", label: "Newest" },
];

/** The pill row: a preset is just a saved combination of the real filters. */
type PresetId = "all" | "competitive" | "casual" | "mixed" | "recruiting" | "top" | "new";

const PRESETS: { id: PresetId; label: string; dot?: string; icon?: typeof Swords }[] = [
    { id: "all", label: "All" },
    { id: "competitive", label: "Competitive", icon: Swords },
    { id: "casual", label: "Casual", icon: Coffee },
    { id: "mixed", label: "Mixed", icon: Layers },
    { id: "recruiting", label: "Recruiting", dot: "#34d399" },
    { id: "top", label: "Top ranked", icon: Trophy },
    { id: "new", label: "New", icon: Sparkles },
];

interface MyClan {
    clan: { name: string; slug: string; logo: string | null; tag: string | null };
    role: string;
}

interface Spotlight {
    name: string;
    slug: string;
    tag: string | null;
    logo: string | null;
    banner: string | null;
    description: string | null;
    motto: string | null;
    region: string | null;
    status: string;
    level: number;
    tier_name: string;
    members_count: number;
    member_limit: number;
    prestige_lifetime: number;
    theme_color: string | null;
    boosted: boolean;
    top_games: string[];
}

interface DirectorySidebar {
    top_weekly: { name: string; slug: string; tag: string | null; logo: string | null; tier_name: string; score: number }[];
    recent_active: { name: string; slug: string; tag: string | null; logo: string | null; last_active_at: string; online: number }[];
    regions: string[];
}

interface PendingInvite {
    id: number;
    created_at: string;
    clan: { id: number; name: string; slug: string; tag: string | null; logo: string | null };
}

interface DirectoryPayload {
    data: ClanSummary[];
    next_page_url: string | null;
    spotlight: Spotlight | null;
    sidebar: DirectorySidebar;
}

/**
 * The clan crest. With no uploaded logo it draws a real shield in the tier
 * tint rather than an empty box — a young clan should still look like one.
 */
function ClanEmblem({ logo, tint, size = 48, glow = false }: { logo: string | null; tint: string; size?: number; glow?: boolean }) {
    return (
        <span
            className="relative shrink-0 flex items-center justify-center overflow-hidden"
            style={{
                width: size,
                height: size,
                borderRadius: size * 0.24,
                border: `2px solid color-mix(in srgb, ${tint} 55%, transparent)`,
                background: logo ? "#0d0b0a" : `linear-gradient(150deg, color-mix(in srgb, ${tint} 18%, #0d0b0a), #0b0a09)`,
                boxShadow: glow ? `0 0 ${size * 0.4}px color-mix(in srgb, ${tint} 35%, transparent)` : undefined,
            }}
        >
            {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={getStorageUrl(logo)} alt="" className="w-full h-full object-cover" />
            ) : (
                <Shield style={{ color: tint, width: size * 0.46, height: size * 0.46 }} strokeWidth={1.6} />
            )}
        </span>
    );
}

/** One cell of the featured card's stat row — icon + label above, value below. */
function StatCell({ icon, label, value, valueClass = "text-white" }: { icon: React.ReactNode; label: string; value: React.ReactNode; valueClass?: string }) {
    return (
        <span className="shrink-0">
            <span className="flex items-center gap-1.5 font-display text-[8.5px] font-bold uppercase tracking-[0.14em] text-white/35 whitespace-nowrap">
                {icon} {label}
            </span>
            <span className={`mt-1 block font-display text-[15px] font-black tabular-nums leading-none whitespace-nowrap ${valueClass}`}>
                {value}
            </span>
        </span>
    );
}

/* ── create modal ─────────────────────────────────────────────────────── */

function CreateClanModal({ onClose, onCreated }: { onClose: () => void; onCreated: (slug?: string) => void }) {
    const [form, setForm] = useState({
        name: "", tag: "", description: "", motto: "", region: "", playstyle: "", is_public: true,
    });
    const [saving, setSaving] = useState(false);

    const set = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await axios.post("/clans", {
                ...form,
                tag: form.tag || null,
                motto: form.motto || null,
                region: form.region || null,
                playstyle: form.playstyle || null,
            });
            toast.success("Clan founded!");
            onCreated(res.data?.data?.slug);
        } catch (e: unknown) {
            const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "Couldn't create the clan.");
        } finally {
            setSaving(false);
        }
    };

    const field = "w-full h-10 px-3 rounded-[8px] bg-white/[0.04] border border-white/[0.09] text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)]";
    const label = "block font-display text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 mb-1.5";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-lg rounded-[14px] border border-white/[0.1] bg-[#12100f] p-6 shadow-[0_28px_60px_rgba(0,0,0,0.7)]" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="flex items-center gap-2.5 font-display text-[16px] font-black text-white">
                        <Shield className="w-[18px] h-[18px] text-[var(--accent)]" /> Found a clan
                    </h2>
                    <button onClick={onClose} className="p-1.5 text-white/30 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                            <span className={label}>Clan name</span>
                            <input value={form.name} onChange={(e) => set("name", e.target.value)} required minLength={3} maxLength={40} placeholder="Alpha Legion" className={field} />
                        </div>
                        <div>
                            <span className={label}>Tag</span>
                            <input value={form.tag} onChange={(e) => set("tag", e.target.value.toUpperCase())} maxLength={8} placeholder="ALPHA" className={field} />
                        </div>
                    </div>

                    <div>
                        <span className={label}>Motto</span>
                        <input value={form.motto} onChange={(e) => set("motto", e.target.value)} maxLength={120} placeholder="One Legion. Unbroken." className={field} />
                    </div>

                    <div>
                        <span className={label}>Description</span>
                        <textarea
                            value={form.description}
                            onChange={(e) => set("description", e.target.value.slice(0, 500))}
                            rows={3}
                            placeholder="What is this clan about?"
                            className="w-full px-3 py-2.5 rounded-[8px] bg-white/[0.04] border border-white/[0.09] text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <span className={label}>Region</span>
                            <input value={form.region} onChange={(e) => set("region", e.target.value)} maxLength={40} placeholder="Europe" className={field} />
                        </div>
                        <div>
                            <span className={label}>Playstyle</span>
                            <div className="relative">
                                <select value={form.playstyle} onChange={(e) => set("playstyle", e.target.value)} className={`${field} appearance-none pr-8 cursor-pointer`}>
                                    <option value="">—</option>
                                    {PLAYSTYLES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-1">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 h-10 px-6 rounded-[8px] bg-[var(--accent)] hover:brightness-110 disabled:opacity-50 text-white font-display text-[11px] font-bold uppercase tracking-[0.1em] transition-[filter]"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Found clan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── the featured clan ────────────────────────────────────────────────── */

function SpotlightCard({ spotlight, canApply }: { spotlight: Spotlight; canApply: boolean }) {
    const tint = spotlight.theme_color ?? TIER_COLORS[spotlight.tier_name] ?? TIER_COLORS.Outpost;
    const recruiting = spotlight.status === "recruiting";
    const [applying, setApplying] = useState(false);
    const [applied, setApplied] = useState(false);

    const apply = async () => {
        setApplying(true);
        try {
            await axios.post(`/clans/${spotlight.slug}/apply`);
            toast.success("Application sent.");
            setApplied(true);
        } catch (e: unknown) {
            const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "Couldn't apply.");
        } finally {
            setApplying(false);
        }
    };

    return (
        <div
            className="relative overflow-hidden rounded-[12px] border"
            style={{ borderColor: `color-mix(in srgb, ${tint} 42%, transparent)`, background: "#0d0b0a" }}
        >
            {/* the corner ribbon, exactly where the mockup puts it */}
            <span
                className="absolute top-0 left-0 z-20 inline-flex items-center gap-1.5 h-[22px] pl-3 pr-3.5 rounded-br-[10px] font-display text-[8.5px] font-black uppercase tracking-[0.14em] text-white"
                style={{ background: tint }}
            >
                {spotlight.boosted && <Sparkles className="w-2.5 h-2.5" />} Featured clan
            </span>

            {spotlight.banner ? (
                <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getStorageUrl(spotlight.banner)} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-30" />
                    <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#0d0b0a] via-[#0d0b0a]/85 to-[#0d0b0a]/55" />
                </>
            ) : (
                <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{ background: `radial-gradient(70% 160% at 8% 50%, color-mix(in srgb, ${tint} 14%, transparent), transparent 62%)` }}
                />
            )}

            <div className="relative z-10 flex flex-wrap items-center gap-x-7 gap-y-4 p-5 pt-7">
                <ClanEmblem logo={spotlight.logo} tint={tint} size={92} glow />

                <div className="min-w-0 flex-1 basis-[280px]">
                    {spotlight.tag && (
                        <p className="font-display text-[10px] font-black tracking-[0.1em]" style={{ color: tint }}>
                            [{spotlight.tag}]
                        </p>
                    )}
                    <h2 className="mt-0.5 font-display text-[26px] font-black text-white leading-none">{spotlight.name}</h2>
                    <p className="mt-2 text-[12.5px] text-white/50 leading-snug line-clamp-2 max-w-[440px]">
                        {spotlight.description ?? spotlight.motto ?? ""}
                    </p>

                    {spotlight.top_games.length > 0 && (
                        <p className="mt-3 flex items-center gap-1.5 flex-nowrap overflow-hidden">
                            {spotlight.top_games.slice(0, 3).map((g) => (
                                <span
                                    key={g}
                                    className="shrink-0 inline-flex items-center h-[22px] px-2.5 rounded-[6px] bg-white/[0.05] border border-white/[0.08] text-[10px] font-semibold text-white/55 max-w-[150px] truncate"
                                >
                                    {g}
                                </span>
                            ))}
                            {spotlight.top_games.length > 3 && (
                                <span className="shrink-0 font-display text-[10px] font-bold text-white/30">+{spotlight.top_games.length - 3}</span>
                            )}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-7">
                    <StatCell
                        icon={<Users className="w-3 h-3" />}
                        label="Members"
                        value={<>{spotlight.members_count} <span className="text-white/30">/ {spotlight.member_limit}</span></>}
                    />
                    <StatCell
                        icon={<Crown className="w-3 h-3" />}
                        label="Prestige"
                        value={spotlight.prestige_lifetime.toLocaleString("en-US")}
                        valueClass="text-[#a855f7]"
                    />
                    <StatCell
                        icon={<ShieldCheck className="w-3 h-3" />}
                        label="Level"
                        value={`${spotlight.tier_name} ${spotlight.level}`}
                    />
                    <StatCell
                        icon={<Globe2 className="w-3 h-3" />}
                        label="Region"
                        value={spotlight.region ?? "—"}
                        valueClass={spotlight.region ? "text-white" : "text-white/25"}
                    />
                    <span className="shrink-0">
                        <span className="block font-display text-[8.5px] font-bold uppercase tracking-[0.14em] text-white/35">Status</span>
                        <span className={`mt-1 inline-flex items-center gap-1.5 font-display text-[12px] font-black uppercase tracking-[0.06em] ${recruiting ? "text-emerald-400" : "text-white/40"}`}>
                            {recruiting && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                            {recruiting ? "Recruiting" : spotlight.status === "closed" ? "Closed" : "Invite only"}
                        </span>
                    </span>
                </div>

                <div className="flex flex-col gap-2 ml-auto shrink-0 min-w-[150px]">
                    <Link
                        href={`/clans/${spotlight.slug}`}
                        className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-[8px] bg-[var(--accent)] hover:brightness-110 text-white font-display text-[10.5px] font-bold uppercase tracking-[0.1em] transition-[filter]"
                    >
                        View clan <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    {canApply && spotlight.status !== "closed" && (
                        <button
                            onClick={apply}
                            disabled={applying || applied}
                            className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-[8px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white/80 font-display text-[10.5px] font-bold uppercase tracking-[0.1em] transition-colors disabled:opacity-60"
                        >
                            {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : applied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Send className="w-3.5 h-3.5" />}
                            {applied ? "Applied" : "Apply to join"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── one clan card ────────────────────────────────────────────────────── */

function ClanCard({ clan }: { clan: ClanSummary }) {
    const tint = TIER_COLORS[clan.tier_name] ?? TIER_COLORS.Outpost;
    const recruiting = (clan.status ?? "recruiting") === "recruiting";

    return (
        <div className="group relative flex flex-col h-full rounded-[12px] border border-white/[0.07] bg-[#0d0b0a] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:-translate-y-0.5 transition-[border-color,transform] duration-300">
            {clan.featured && (
                <span className="absolute -top-2 left-3 z-10 inline-flex items-center h-[18px] px-2 rounded-[4px] bg-[var(--accent)] font-display text-[7.5px] font-black uppercase tracking-[0.12em] text-white">
                    Featured
                </span>
            )}

            <div className="flex gap-3 p-3.5">
                <ClanEmblem logo={clan.logo} tint={tint} size={46} />
                <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2">
                        {clan.tag && <span className="font-display text-[9px] font-black text-[var(--accent)] truncate">[{clan.tag}]</span>}
                        <span className="ml-auto shrink-0 inline-flex items-center gap-1 font-display text-[8px] font-black uppercase tracking-[0.1em]" style={{ color: tint }}>
                            <ShieldCheck className="w-2.5 h-2.5" /> L{clan.level}
                        </span>
                    </p>
                    <Link href={`/clans/${clan.slug}`} className="block font-display text-[15px] font-black text-white leading-tight truncate group-hover:text-[var(--accent)] transition-colors">
                        {clan.name}
                    </Link>
                    <p className="mt-1 text-[11px] text-white/40 leading-snug line-clamp-2 min-h-[28px]">
                        {clan.motto ?? clan.description ?? ""}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 px-3.5 pb-2.5 font-display text-[9.5px] font-bold tabular-nums text-white/35">
                <span className="inline-flex items-center gap-1.5"><Users className="w-3 h-3" /> {clan.members_count} / {clan.member_limit}</span>
                {clan.region && <span className="inline-flex items-center gap-1.5 truncate"><Globe2 className="w-3 h-3 shrink-0" /> {clan.region}</span>}
            </div>

            <div className="flex items-center justify-between gap-2 px-3.5 pb-3">
                {recruiting ? (
                    <span className="inline-flex items-center gap-1.5 font-display text-[8.5px] font-black uppercase tracking-[0.1em] text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Recruiting
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 font-display text-[8.5px] font-black uppercase tracking-[0.1em] text-blue-400/70">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400/70" /> {clan.status === "closed" ? "Closed" : "Invite only"}
                    </span>
                )}
                <span className="inline-flex items-center gap-1.5 font-display text-[11px] font-black tabular-nums text-[#a855f7]">
                    <Crown className="w-3 h-3" /> {clan.prestige_lifetime.toLocaleString("en-US")}
                </span>
            </div>

            <Link
                href={`/clans/${clan.slug}`}
                className="mt-auto mx-3.5 mb-3.5 inline-flex items-center justify-center h-9 rounded-[8px] bg-white/[0.04] hover:bg-[var(--accent)] border border-white/[0.08] hover:border-transparent font-display text-[9.5px] font-black uppercase tracking-[0.1em] text-white/70 hover:text-white transition-colors"
            >
                View clan
            </Link>
        </div>
    );
}

/* ── sidebar: a quiet line instead of a missing panel ─────────────────── */

function RailEmpty({ children }: { children: React.ReactNode }) {
    return <p className="py-1 text-[11.5px] text-white/30 leading-snug">{children}</p>;
}

function PendingInvites() {
    const { data, mutate } = useSWR<PendingInvite[]>("/user/clan-invites", fetcher);
    const [busy, setBusy] = useState<number | null>(null);

    const invites = data ?? [];

    const respond = async (id: number, accept: boolean) => {
        setBusy(id);
        try {
            await axios.post(`/clans/invites/${id}/respond`, { accept });
            toast.success(accept ? "Welcome to the clan!" : "Invite declined.");
            mutate();
            if (accept) window.location.reload();
        } catch (e: unknown) {
            const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "Couldn't respond.");
        } finally {
            setBusy(null);
        }
    };

    return (
        <Panel
            title="Pending Invites"
            icon={<Send className="w-4 h-4 text-[var(--accent)]" />}
            meta={invites.length > 0 ? (
                <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-[var(--accent)] font-display text-[10px] font-black text-white tabular-nums">
                    {invites.length}
                </span>
            ) : undefined}
        >
            {invites.length === 0 ? (
                <RailEmpty>No invites waiting. Clan officers can invite you by username.</RailEmpty>
            ) : (
                <div className="space-y-3">
                    {invites.map((invite) => (
                        <div key={invite.id} className="flex items-center gap-3">
                            <ClanEmblem logo={invite.clan.logo} tint="var(--accent)" size={34} />
                            <span className="min-w-0 flex-1">
                                <Link href={`/clans/${invite.clan.slug}`} className="block text-[12.5px] font-bold text-white truncate hover:text-[var(--accent)] transition-colors">
                                    {invite.clan.name} {invite.clan.tag && <span className="text-[var(--accent)] text-[10px]">[{invite.clan.tag}]</span>}
                                </Link>
                                <span className="block font-display text-[9px] font-bold uppercase tracking-[0.1em] text-white/30">
                                    Invited {timeAgo(invite.created_at)}
                                </span>
                            </span>
                            <span className="shrink-0 flex items-center gap-1">
                                <button
                                    onClick={() => respond(invite.id, true)}
                                    disabled={busy === invite.id}
                                    title="Accept"
                                    className="w-7 h-7 rounded-[6px] bg-emerald-500/12 border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                                >
                                    {busy === invite.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                    onClick={() => respond(invite.id, false)}
                                    disabled={busy === invite.id}
                                    title="Decline"
                                    className="w-7 h-7 rounded-[6px] bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </Panel>
    );
}

/* ── the page ─────────────────────────────────────────────────────────── */

export default function ClansClient() {
    const { user } = useAuth();
    const [search, setSearch] = useState("");
    const [playstyle, setPlaystyle] = useState("");
    const [region, setRegion] = useState("");
    const [recruitingOnly, setRecruitingOnly] = useState(false);
    const [sort, setSort] = useState("activity");
    const [preset, setPreset] = useState<PresetId>("all");
    const [creating, setCreating] = useState(false);
    const [pages, setPages] = useState(1);

    /** A pill sets the underlying filters — one source of truth, no shadow state. */
    const applyPreset = (id: PresetId) => {
        setPreset(id);
        setPages(1);
        setPlaystyle(["competitive", "casual", "mixed"].includes(id) ? id : "");
        setRecruitingOnly(id === "recruiting");
        setSort(id === "top" ? "prestige" : id === "new" ? "newest" : "activity");
    };

    const params = useMemo(() => {
        const q = new URLSearchParams();
        if (search.trim()) q.set("search", search.trim());
        if (playstyle) q.set("playstyle", playstyle);
        if (region) q.set("region", region);
        if (recruitingOnly) q.set("recruiting", "1");
        q.set("sort", sort);
        return q.toString();
    }, [search, playstyle, region, recruitingOnly, sort]);

    const { data, isLoading, mutate } = useSWR<DirectoryPayload>(`/clans?${params}&page=1`, fetcher, {
        keepPreviousData: true,
    });
    const { data: more } = useSWR<DirectoryPayload[]>(
        pages > 1 ? `extra:${params}:${pages}` : null,
        async () => Promise.all(
            Array.from({ length: pages - 1 }, (_, i) =>
                axios.get(`/clans?${params}&page=${i + 2}`).then((r) => r.data?.data)
            )
        ),
    );

    const { data: mine } = useSWR<MyClan | null>(user ? "/user/clan" : null, fetcher);

    const clans = useMemo(() => {
        const extra = (more ?? []).flatMap((p) => p?.data ?? []);
        return [...(data?.data ?? []), ...extra];
    }, [data, more]);

    const hasMore = (more?.length ? more[more.length - 1]?.next_page_url : data?.next_page_url) != null;
    const filtering = !!(search || playstyle || region || recruitingOnly);
    const canApply = !!user && !mine?.clan;

    const selectClass = "h-9 pl-9 pr-8 rounded-[9px] bg-[#0f0d0c] border border-white/[0.07] text-[12px] text-white/70 appearance-none focus:outline-none cursor-pointer";

    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            {/* ── header band ── */}
            <div className="relative overflow-hidden border-b border-white/[0.07]">
                {/* The featured clan's banner doubles as the page's artwork —
                    real data carrying the art the mockup asks for. */}
                {data?.spotlight?.banner ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getStorageUrl(data.spotlight.banner)} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-[0.18]" />
                        <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--surface-0)]/60 to-[var(--surface-0)]" />
                    </>
                ) : null}
                <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(70% 150% at 78% -10%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 58%), radial-gradient(50% 120% at 8% 110%, rgba(255,255,255,0.035), transparent 62%)",
                    }}
                />

                <div className="relative z-10 max-w-[1500px] mx-auto px-4 xl:px-6 pt-8 pb-6">
                    <div className="flex flex-wrap items-center justify-between gap-5">
                        <div className="flex items-center gap-3.5">
                            <span className="w-11 h-11 rounded-[11px] bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] flex items-center justify-center">
                                <Shield className="w-5 h-5 text-[var(--accent)]" />
                            </span>
                            <div>
                                <h1 className="font-display text-[28px] font-black text-white tracking-tight leading-none">Clans</h1>
                                <p className="mt-1.5 text-[12.5px] text-white/45">Find squads, build communities, and climb together.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                            {user && !mine?.clan && (
                                <button
                                    onClick={() => setCreating(true)}
                                    className="inline-flex items-center gap-2 h-10 px-5 rounded-[9px] bg-[var(--accent)] hover:brightness-110 text-white font-display text-[10.5px] font-bold uppercase tracking-[0.1em] transition-[filter]"
                                >
                                    <Plus className="w-4 h-4" /> Create clan
                                </button>
                            )}
                            {mine?.clan && (
                                <Link
                                    href={`/clans/${mine.clan.slug}`}
                                    className="inline-flex items-center gap-2 h-10 px-5 rounded-[9px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white font-display text-[10.5px] font-bold uppercase tracking-[0.1em] transition-colors"
                                >
                                    <Users className="w-4 h-4" /> My clan
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* row 1 — search and the selects */}
                    <div className="mt-6 flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
                            <input
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPages(1); }}
                                placeholder="Search clans…"
                                className="w-full h-9 pl-9 pr-8 rounded-[9px] bg-[#0f0d0c] border border-white/[0.07] text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
                            />
                            {search && (
                                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="relative">
                            <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
                            <select
                                value={region}
                                onChange={(e) => { setRegion(e.target.value); setPages(1); }}
                                className={selectClass}
                            >
                                <option value="">All regions</option>
                                {(data?.sidebar.regions ?? []).map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                        </div>

                        <div className="relative">
                            <Swords className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
                            <select
                                value={playstyle}
                                onChange={(e) => { setPlaystyle(e.target.value); setPreset("all"); setPages(1); }}
                                className={selectClass}
                            >
                                <option value="">All playstyles</option>
                                {PLAYSTYLES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                        </div>

                        <div className="relative">
                            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
                            <select
                                value={recruitingOnly ? "recruiting" : "any"}
                                onChange={(e) => { setRecruitingOnly(e.target.value === "recruiting"); setPreset("all"); setPages(1); }}
                                className={selectClass}
                            >
                                <option value="any">All activity</option>
                                <option value="recruiting">Recruiting only</option>
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                        </div>

                        <div className="flex-1" />

                        <div className="relative">
                            <select
                                value={sort}
                                onChange={(e) => { setSort(e.target.value); setPreset("all"); setPages(1); }}
                                className="h-9 pl-3 pr-8 rounded-[9px] bg-[#0f0d0c] border border-white/[0.07] text-[12px] text-white/70 appearance-none focus:outline-none cursor-pointer"
                            >
                                {SORTS.map((s) => <option key={s.id} value={s.id}>Sort: {s.label}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                        </div>
                    </div>

                    {/* row 2 — the preset pills */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {PRESETS.map((p) => {
                            const Icon = p.icon;
                            const active = preset === p.id;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => applyPreset(p.id)}
                                    className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[8px] border font-display text-[9.5px] font-black uppercase tracking-[0.1em] transition-colors ${
                                        active
                                            ? "bg-[var(--accent)] border-transparent text-white"
                                            : "bg-white/[0.03] border-white/[0.07] text-white/45 hover:text-white hover:border-white/[0.16]"
                                    }`}
                                >
                                    {p.dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? "#fff" : p.dot }} />}
                                    {Icon && <Icon className="w-3 h-3" />}
                                    {p.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="max-w-[1500px] mx-auto px-4 xl:px-6 py-6 grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                {/* ── main column ── */}
                <div className="xl:col-span-9 min-w-0 space-y-5">
                    {isLoading && !data ? (
                        <div className="h-[168px] rounded-[12px] bg-white/[0.04] animate-pulse" />
                    ) : data?.spotlight && !filtering ? (
                        <SpotlightCard spotlight={data.spotlight} canApply={canApply} />
                    ) : null}

                    <div>
                        <h2 className="flex items-center gap-2.5 font-display text-[12px] font-bold uppercase tracking-[0.15em] text-white/55 mb-3.5">
                            <span className="w-1 h-3.5 rounded-full bg-[var(--accent)]" /> Discover clans
                            {clans.length > 0 && <span className="font-black tabular-nums text-white/25">{clans.length}</span>}
                        </h2>

                        {isLoading && clans.length === 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3.5">
                                {[...Array(8)].map((_, i) => <div key={i} className="h-[196px] rounded-[12px] bg-white/[0.04] animate-pulse" />)}
                            </div>
                        ) : clans.length === 0 ? (
                            <div className="rounded-[12px] border border-dashed border-white/[0.09] bg-white/[0.015] px-6 py-12 text-center">
                                <Shield className="w-7 h-7 mx-auto mb-3 text-white/15" />
                                <p className="font-display text-[14px] font-bold text-white">
                                    {filtering ? "No clans match those filters" : "No clans yet"}
                                </p>
                                <p className="mt-1.5 text-[12px] text-white/40">
                                    {filtering
                                        ? "Loosen the filters — or found the clan you're looking for."
                                        : "Be the first. Found a clan and everything you already play starts building its base."}
                                </p>
                                {user && !mine?.clan && (
                                    <button
                                        onClick={() => setCreating(true)}
                                        className="mt-4 inline-flex items-center gap-2 h-9 px-5 rounded-[8px] bg-[var(--accent)] hover:brightness-110 text-white font-display text-[10px] font-black uppercase tracking-[0.1em] transition-[filter]"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Found a clan
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3.5">
                                    {clans.map((clan, i) => (
                                        <div key={clan.id} className={i < 8 ? `tp-fade-up tp-d${Math.min(6, i + 1)}` : undefined}>
                                            <ClanCard clan={clan} />
                                        </div>
                                    ))}
                                </div>
                                {hasMore && (
                                    <div className="mt-4 flex justify-center">
                                        <button
                                            onClick={() => setPages((p) => p + 1)}
                                            className="inline-flex items-center gap-2 h-9 px-6 rounded-[9px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] font-display text-[9.5px] font-black uppercase tracking-[0.1em] text-white/60 transition-colors"
                                        >
                                            Load more clans <ChevronDown className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ── sidebar — every panel keeps its place, empty or not ── */}
                <aside className="xl:col-span-3 min-w-0 space-y-4">
                    <Panel title="My Clan Status" icon={<Shield className="w-4 h-4 text-[var(--accent)]" />}>
                        {mine?.clan ? (
                            <Link href={`/clans/${mine.clan.slug}`} className="group flex items-center gap-3">
                                <ClanEmblem logo={mine.clan.logo} tint="var(--accent)" size={42} />
                                <span className="min-w-0 flex-1">
                                    <span className="block font-display text-[14px] font-black text-white truncate group-hover:text-[var(--accent)] transition-colors">
                                        {mine.clan.name}
                                    </span>
                                    <span className="block font-display text-[9px] font-bold uppercase tracking-[0.12em] text-white/35 capitalize">
                                        {mine.role}
                                    </span>
                                </span>
                                <ArrowRight className="w-4 h-4 text-white/25 group-hover:text-[var(--accent)] transition-colors" />
                            </Link>
                        ) : (
                            <div className="flex items-start gap-3.5">
                                <span className="w-11 h-11 shrink-0 rounded-[11px] bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-white/20" />
                                </span>
                                <div>
                                    <p className="text-[13px] font-bold text-white">You are not in a clan yet.</p>
                                    <p className="mt-1 text-[11.5px] text-white/40 leading-snug">
                                        Join a clan to play, compete and level up with your squad.
                                    </p>
                                    {user && (
                                        <button
                                            onClick={() => setCreating(true)}
                                            className="mt-3 inline-flex items-center gap-1.5 h-8 px-4 rounded-[7px] bg-[var(--accent)] hover:brightness-110 text-white font-display text-[9.5px] font-black uppercase tracking-[0.1em] transition-[filter]"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Found a clan
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </Panel>

                    <Panel
                        title="Top Clans This Week"
                        icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
                        action={(data?.sidebar.top_weekly.length ?? 0) > 0 ? { label: "View all", onClick: () => applyPreset("top") } : undefined}
                    >
                        {(data?.sidebar.top_weekly.length ?? 0) === 0 ? (
                            <RailEmpty>Nothing earned this week yet — the first clan to review, complete or unlock anything takes the top spot.</RailEmpty>
                        ) : (
                            <div className="space-y-2.5">
                                {data!.sidebar.top_weekly.map((row, i) => (
                                    <Link key={row.slug} href={`/clans/${row.slug}`} className="group flex items-center gap-3">
                                        <span className={`w-5 shrink-0 font-display text-[11px] font-black tabular-nums ${i === 0 ? "text-[#f0b429]" : i < 3 ? "text-white/55" : "text-white/25"}`}>
                                            {i + 1}
                                        </span>
                                        <ClanEmblem logo={row.logo} tint={TIER_COLORS[row.tier_name] ?? TIER_COLORS.Outpost} size={30} />
                                        <span className="min-w-0 flex-1 text-[12.5px] font-semibold text-white truncate group-hover:text-[var(--accent)] transition-colors">
                                            {row.tag && <span className="text-white/30 font-display text-[10px]">[{row.tag}]</span>} {row.name}
                                        </span>
                                        <span className="shrink-0 font-display text-[11px] font-black tabular-nums text-emerald-400">
                                            {row.score.toLocaleString("en-US")}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </Panel>

                    <Panel title="Why Join a Clan?" icon={<Sparkles className="w-4 h-4 text-[var(--accent)]" />}>
                        <div className="space-y-3.5">
                            {([
                                [UserPlus, "Team up", "Everything you already do — reviews, completions, achievements — earns your clan resources."],
                                [Shield, "Build the base", "Eight buildings, weekly missions and boosters your whole roster levels together."],
                                [BarChart3, "Climb rankings", "Seasonal trophies with size categories — small clans compete in their own weight class."],
                            ] as const).map(([Icon, title, body]) => (
                                <div key={title} className="flex items-start gap-3">
                                    <span className="w-8 h-8 shrink-0 rounded-[8px] bg-[var(--accent-soft)] flex items-center justify-center">
                                        <Icon className="w-3.5 h-3.5 text-[var(--accent)]" />
                                    </span>
                                    <span>
                                        <span className="block text-[12.5px] font-bold text-white">{title}</span>
                                        <span className="block mt-0.5 text-[11px] text-white/40 leading-snug">{body}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Panel>

                    <Panel title="Recently Active Clans" icon={<Flame className="w-4 h-4 text-[#f0b429]" />}>
                        {(data?.sidebar.recent_active.length ?? 0) === 0 ? (
                            <RailEmpty>No clan activity recorded yet. Play, post or log a session and your clan lands here.</RailEmpty>
                        ) : (
                            <div className="space-y-2.5">
                                {data!.sidebar.recent_active.map((row) => (
                                    <Link key={row.slug} href={`/clans/${row.slug}`} className="group flex items-center gap-3">
                                        <ClanEmblem logo={row.logo} tint="rgba(255,255,255,0.22)" size={30} />
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[12.5px] font-semibold text-white truncate group-hover:text-[var(--accent)] transition-colors">
                                                {row.name}
                                            </span>
                                            <span className="flex items-center gap-1 font-display text-[8.5px] font-bold uppercase tracking-[0.1em] text-white/30">
                                                <Clock3 className="w-2.5 h-2.5" /> {timeAgo(row.last_active_at)}
                                            </span>
                                        </span>
                                        {row.online > 0 && (
                                            <span className="shrink-0 inline-flex items-center gap-1.5 font-display text-[10px] font-black tabular-nums text-emerald-400">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {row.online}
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </Panel>

                    {user && <PendingInvites />}
                </aside>
            </div>

            {creating && (
                <CreateClanModal
                    onClose={() => setCreating(false)}
                    onCreated={(slug) => {
                        setCreating(false);
                        mutate();
                        if (slug) window.location.href = `/clans/${slug}`;
                    }}
                />
            )}
        </main>
    );
}
