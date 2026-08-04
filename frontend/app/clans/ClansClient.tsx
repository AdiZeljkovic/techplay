"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import {
    Shield, Users, Search, X, Plus, ChevronDown, Flame, Crown, Loader2, ArrowRight,
    ShieldCheck, Swords, Coffee, Layers, Globe2, Check, TrendingUp, Sparkles,
    UserPlus, BarChart3, Send,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import EmptyState from "@/components/ui/EmptyState";
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

function ClanEmblem({ logo, tint, size = 48, className = "" }: { logo: string | null; tint: string; size?: number; className?: string }) {
    return (
        <span
            className={`shrink-0 rounded-[12px] border-2 bg-[#0d0b0a] overflow-hidden flex items-center justify-center ${className}`}
            style={{ width: size, height: size, borderColor: tint }}
        >
            {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={getStorageUrl(logo)} alt="" className="w-full h-full object-cover" />
            ) : (
                <Shield style={{ color: tint, width: size * 0.44, height: size * 0.44 }} />
            )}
        </span>
    );
}

/* ── create modal (unchanged behaviour, kept from the previous page) ──── */

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

function SpotlightCard({ spotlight }: { spotlight: Spotlight }) {
    const tint = spotlight.theme_color ?? TIER_COLORS[spotlight.tier_name] ?? TIER_COLORS.Outpost;
    const recruiting = spotlight.status === "recruiting";

    return (
        <div
            className="relative overflow-hidden rounded-[14px] border"
            style={{ borderColor: `color-mix(in srgb, ${tint} 40%, transparent)` }}
        >
            {spotlight.banner ? (
                <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getStorageUrl(spotlight.banner)} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-25" />
                    <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#0d0b0a] via-[#0d0b0a]/85 to-[#0d0b0a]/50" />
                </>
            ) : (
                <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(110deg, color-mix(in srgb, ${tint} 13%, #0d0b0a), #0d0b0a 55%)` }}
                />
            )}

            <div className="relative z-10 flex flex-wrap items-center gap-5 p-5">
                <span className="relative shrink-0">
                    <ClanEmblem logo={spotlight.logo} tint={tint} size={84} />
                    <span aria-hidden className="absolute inset-0 rounded-[12px]" style={{ boxShadow: `0 0 36px color-mix(in srgb, ${tint} 40%, transparent)` }} />
                </span>

                <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-display text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: tint }}>
                        <Sparkles className="w-3 h-3" /> Featured clan
                        {spotlight.tag && <span className="text-white/30">[{spotlight.tag}]</span>}
                    </p>
                    <h2 className="mt-1 font-display text-[24px] font-black text-white leading-tight">{spotlight.name}</h2>
                    <p className="mt-1 text-[12.5px] text-white/50 leading-snug line-clamp-2 max-w-xl">
                        {spotlight.description ?? spotlight.motto ?? ""}
                    </p>
                    {spotlight.top_games.length > 0 && (
                        <p className="mt-2.5 flex flex-wrap gap-1.5">
                            {spotlight.top_games.map((g) => (
                                <span key={g} className="inline-flex items-center h-[20px] px-2.5 rounded-[5px] bg-white/[0.06] border border-white/[0.08] font-display text-[8.5px] font-bold uppercase tracking-[0.08em] text-white/55">
                                    {g}
                                </span>
                            ))}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-6 shrink-0">
                    {([
                        ["Members", `${spotlight.members_count} / ${spotlight.member_limit}`, <Users key="u" className="w-3.5 h-3.5" />],
                        ["Prestige", spotlight.prestige_lifetime.toLocaleString("en-US"), <Crown key="c" className="w-3.5 h-3.5" />],
                        ["Level", `${spotlight.tier_name} ${spotlight.level}`, <ShieldCheck key="s" className="w-3.5 h-3.5" />],
                    ] as const).map(([label, value, icon]) => (
                        <span key={label} className="text-center">
                            <span className="flex items-center justify-center gap-1.5 font-display text-[8.5px] font-bold uppercase tracking-[0.14em] text-white/35">
                                {icon} {label}
                            </span>
                            <span className="mt-1 block font-display text-[15px] font-black tabular-nums text-white whitespace-nowrap">{value}</span>
                        </span>
                    ))}
                    <span className="text-center">
                        <span className="block font-display text-[8.5px] font-bold uppercase tracking-[0.14em] text-white/35">Status</span>
                        <span className={`mt-1 inline-flex items-center gap-1.5 font-display text-[11px] font-black uppercase tracking-[0.08em] ${recruiting ? "text-emerald-400" : "text-white/40"}`}>
                            {recruiting && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                            {recruiting ? "Recruiting" : spotlight.status === "closed" ? "Closed" : "Invite only"}
                        </span>
                    </span>
                </div>

                <Link
                    href={`/clans/${spotlight.slug}`}
                    className="shrink-0 inline-flex items-center gap-2 h-11 px-6 rounded-[9px] bg-[var(--accent)] hover:brightness-110 text-white font-display text-[11px] font-bold uppercase tracking-[0.1em] transition-[filter]"
                >
                    View clan <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}

/* ── one clan card ────────────────────────────────────────────────────── */

function ClanCard({ clan }: { clan: ClanSummary }) {
    const tint = TIER_COLORS[clan.tier_name] ?? TIER_COLORS.Outpost;
    const recruiting = (clan.status ?? "recruiting") === "recruiting";

    return (
        <div className="group relative flex flex-col rounded-[12px] border border-white/[0.07] bg-[#0d0b0a] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:-translate-y-0.5 transition-[border-color,transform] duration-300">
            {clan.featured && (
                <span className="absolute -top-2 left-4 z-10 inline-flex items-center gap-1 h-[19px] px-2 rounded-[4px] bg-[var(--accent)] font-display text-[8px] font-black uppercase tracking-[0.12em] text-white">
                    Featured
                </span>
            )}

            <div className="flex items-start gap-3.5 p-4 pb-3">
                <ClanEmblem logo={clan.logo} tint={tint} size={52} />
                <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2">
                        {clan.tag && <span className="font-display text-[9.5px] font-black text-[var(--accent)]">[{clan.tag}]</span>}
                        <span
                            className="ml-auto inline-flex items-center gap-1 font-display text-[8.5px] font-black uppercase tracking-[0.1em]"
                            style={{ color: tint }}
                        >
                            <ShieldCheck className="w-2.5 h-2.5" /> L{clan.level}
                        </span>
                    </p>
                    <Link href={`/clans/${clan.slug}`} className="block font-display text-[16px] font-black text-white leading-tight truncate group-hover:text-[var(--accent)] transition-colors">
                        {clan.name}
                    </Link>
                    <p className="mt-1 text-[11.5px] text-white/40 leading-snug line-clamp-2 min-h-[30px]">
                        {clan.motto ?? clan.description ?? ""}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3.5 px-4 pb-3 font-display text-[10px] font-bold tabular-nums text-white/35">
                <span className="inline-flex items-center gap-1.5"><Users className="w-3 h-3" /> {clan.members_count}/{clan.member_limit}</span>
                {clan.region && <span className="inline-flex items-center gap-1.5"><Globe2 className="w-3 h-3" /> {clan.region}</span>}
                <span className="ml-auto inline-flex items-center gap-1.5 text-[#a855f7]">
                    <Crown className="w-3 h-3" /> {clan.prestige_lifetime.toLocaleString("en-US")}
                </span>
            </div>

            <div className="mt-auto flex items-center justify-between gap-2 px-4 py-2.5 border-t border-white/[0.06]">
                {recruiting ? (
                    <span className="inline-flex items-center gap-1.5 font-display text-[8.5px] font-black uppercase tracking-[0.12em] text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Recruiting
                    </span>
                ) : (
                    <span className="font-display text-[8.5px] font-black uppercase tracking-[0.12em] text-white/25">
                        {clan.status === "closed" ? "Closed" : "Invite only"}
                    </span>
                )}
                <Link
                    href={`/clans/${clan.slug}`}
                    className="inline-flex items-center gap-1.5 h-[28px] px-3.5 rounded-[7px] bg-white/[0.05] hover:bg-[var(--accent)] border border-white/[0.09] hover:border-transparent font-display text-[9px] font-black uppercase tracking-[0.1em] text-white/70 hover:text-white transition-colors"
                >
                    View clan <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
        </div>
    );
}

/* ── pending invites ──────────────────────────────────────────────────── */

function PendingInvites() {
    const { data, mutate } = useSWR<PendingInvite[]>("/user/clan-invites", fetcher);
    const [busy, setBusy] = useState<number | null>(null);

    const invites = data ?? [];

    if (invites.length === 0) return null;

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
            meta={
                <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-[var(--accent)] font-display text-[10px] font-black text-white tabular-nums">
                    {invites.length}
                </span>
            }
        >
            <div className="space-y-3">
                {invites.map((invite) => (
                    <div key={invite.id} className="flex items-center gap-3">
                        <ClanEmblem logo={invite.clan.logo} tint="var(--accent)" size={36} />
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
    const [creating, setCreating] = useState(false);
    const [pages, setPages] = useState(1);

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
    // Extra pages append below page 1; the filter set resets them.
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

    const filterChip = (active: boolean) =>
        `inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[9px] font-display text-[10px] font-bold uppercase tracking-[0.08em] transition-colors ${
            active ? "bg-[var(--accent)] text-white" : "bg-white/[0.04] text-white/45 hover:text-white hover:bg-white/[0.08]"
        }`;

    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            {/* ── header band ── */}
            <div className="relative overflow-hidden border-b border-white/[0.07]">
                <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(80% 140% at 85% 0%, color-mix(in srgb, var(--accent) 15%, transparent), transparent 55%), radial-gradient(60% 120% at 10% 100%, rgba(255,255,255,0.03), transparent 60%)",
                    }}
                />
                <div className="relative z-10 max-w-[1500px] mx-auto px-4 xl:px-6 py-10">
                    <div className="flex flex-wrap items-center justify-between gap-5">
                        <div className="flex items-center gap-4">
                            <span className="w-12 h-12 rounded-[12px] bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] flex items-center justify-center">
                                <Shield className="w-6 h-6 text-[var(--accent)]" />
                            </span>
                            <div>
                                <h1 className="font-display text-[30px] font-black text-white tracking-tight leading-none">Clans</h1>
                                <p className="mt-1.5 text-[13px] text-white/45">Find squads, build communities, and climb together.</p>
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

                    {/* ── controls ── */}
                    <div className="mt-6 flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
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

                        {(data?.sidebar.regions.length ?? 0) > 0 && (
                            <div className="relative">
                                <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
                                <select
                                    value={region}
                                    onChange={(e) => { setRegion(e.target.value); setPages(1); }}
                                    className="h-9 pl-9 pr-7 rounded-[9px] bg-[#0f0d0c] border border-white/[0.07] text-[12px] text-white/70 appearance-none focus:outline-none cursor-pointer"
                                >
                                    <option value="">All regions</option>
                                    {data!.sidebar.regions.map((r) => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                            </div>
                        )}

                        {PLAYSTYLES.map((p) => {
                            const Icon = p.icon;
                            return (
                                <button key={p.id} onClick={() => { setPlaystyle(playstyle === p.id ? "" : p.id); setPages(1); }} className={filterChip(playstyle === p.id)}>
                                    <Icon className="w-3.5 h-3.5" /> {p.label}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => { setRecruitingOnly((v) => !v); setPages(1); }}
                            className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[9px] font-display text-[10px] font-bold uppercase tracking-[0.08em] transition-colors ${
                                recruitingOnly ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/35" : "bg-white/[0.04] text-white/45 hover:text-white hover:bg-white/[0.08]"
                            }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${recruitingOnly ? "bg-emerald-400" : "bg-white/25"}`} /> Recruiting
                        </button>

                        <div className="flex-1" />

                        <div className="relative">
                            <select
                                value={sort}
                                onChange={(e) => { setSort(e.target.value); setPages(1); }}
                                className="h-9 pl-3 pr-7 rounded-[9px] bg-[#0f0d0c] border border-white/[0.07] text-[12px] text-white/70 appearance-none focus:outline-none cursor-pointer"
                            >
                                {SORTS.map((s) => <option key={s.id} value={s.id}>Sort: {s.label}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1500px] mx-auto px-4 xl:px-6 py-6 grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                {/* ── main column ── */}
                <div className="xl:col-span-9 min-w-0 space-y-5">
                    {data?.spotlight && !search && !playstyle && !region && <SpotlightCard spotlight={data.spotlight} />}

                    <div>
                        <h2 className="flex items-center gap-2.5 font-display text-[12px] font-bold uppercase tracking-[0.15em] text-white/55 mb-4">
                            <span className="w-1 h-3.5 rounded-full bg-[var(--accent)]" /> Discover clans
                            {clans.length > 0 && <span className="font-black tabular-nums text-white/25">{clans.length}</span>}
                        </h2>

                        {isLoading && clans.length === 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[...Array(6)].map((_, i) => <div key={i} className="h-[190px] rounded-[12px] bg-white/[0.04] animate-pulse" />)}
                            </div>
                        ) : clans.length === 0 ? (
                            <EmptyState
                                icon={<Shield className="w-[18px] h-[18px]" />}
                                title="No clans match"
                                body={user ? "Loosen the filters — or found the clan you're looking for." : "Loosen the filters, or sign in to found one."}
                            />
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {clans.map((clan, i) => (
                                        <div key={clan.id} className={i < 6 ? `tp-fade-up tp-d${Math.min(6, i + 1)}` : undefined}>
                                            <ClanCard clan={clan} />
                                        </div>
                                    ))}
                                </div>
                                {hasMore && (
                                    <div className="mt-5 flex justify-center">
                                        <button
                                            onClick={() => setPages((p) => p + 1)}
                                            className="inline-flex items-center gap-2 h-10 px-6 rounded-[9px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] font-display text-[10px] font-bold uppercase tracking-[0.1em] text-white/60 transition-colors"
                                        >
                                            Load more clans <ChevronDown className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ── sidebar ── */}
                <aside className="xl:col-span-3 min-w-0 space-y-4">
                    {/* my clan status */}
                    <Panel title="My Clan Status" icon={<Shield className="w-4 h-4 text-[var(--accent)]" />}>
                        {mine?.clan ? (
                            <Link href={`/clans/${mine.clan.slug}`} className="group flex items-center gap-3">
                                <ClanEmblem logo={mine.clan.logo} tint="var(--accent)" size={44} />
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

                    {user && <PendingInvites />}

                    {/* top clans this week */}
                    {(data?.sidebar.top_weekly.length ?? 0) > 0 && (
                        <Panel title="Top Clans This Week" icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}>
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
                        </Panel>
                    )}

                    {/* why join */}
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

                    {/* recently active */}
                    {(data?.sidebar.recent_active.length ?? 0) > 0 && (
                        <Panel title="Recently Active" icon={<Flame className="w-4 h-4 text-[#f0b429]" />}>
                            <div className="space-y-2.5">
                                {data!.sidebar.recent_active.map((row) => (
                                    <Link key={row.slug} href={`/clans/${row.slug}`} className="group flex items-center gap-3">
                                        <ClanEmblem logo={row.logo} tint="rgba(255,255,255,0.2)" size={30} />
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[12.5px] font-semibold text-white truncate group-hover:text-[var(--accent)] transition-colors">
                                                {row.name}
                                            </span>
                                            <span className="block font-display text-[8.5px] font-bold uppercase tracking-[0.1em] text-white/30">
                                                Active {timeAgo(row.last_active_at)}
                                            </span>
                                        </span>
                                        {row.online > 0 && (
                                            <span className="shrink-0 inline-flex items-center gap-1.5 font-display text-[10px] font-black tabular-nums text-emerald-400">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {row.online} online
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </Panel>
                    )}
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
