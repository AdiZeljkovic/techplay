"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import {
    Shield, Users, Search, X, Plus, ChevronDown, Flame, Crown, Loader2,
    ShieldCheck, Swords, Coffee, Layers, ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import EmptyState from "@/components/ui/EmptyState";
import { getStorageUrl } from "@/lib/imageUrl";
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
            <div
                className="w-full max-w-lg rounded-[14px] border border-white/[0.1] bg-[#12100f] p-6 shadow-[0_28px_60px_rgba(0,0,0,0.7)]"
                onClick={(e) => e.stopPropagation()}
            >
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

/* ── one clan card ────────────────────────────────────────────────────── */

function ClanCard({ clan }: { clan: ClanSummary }) {
    const tier = TIER_COLORS[clan.tier_name] ?? TIER_COLORS.Outpost;
    const recruiting = (clan.status ?? "recruiting") === "recruiting";

    return (
        <Link
            href={`/clans/${clan.slug}`}
            className="group relative flex flex-col rounded-[12px] overflow-hidden border border-white/[0.07] bg-[#0d0b0a] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:-translate-y-0.5 transition-[border-color,transform] duration-300"
        >
            {/* banner strip */}
            <span className="relative h-[68px] bg-white/[0.03] overflow-hidden">
                {clan.banner ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getStorageUrl(clan.banner)} alt="" aria-hidden className="w-full h-full object-cover opacity-60" />
                ) : (
                    <span
                        aria-hidden
                        className="absolute inset-0"
                        style={{ background: `radial-gradient(120% 160% at 15% 0%, color-mix(in srgb, ${tier} 22%, transparent), transparent 60%)` }}
                    />
                )}
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#0d0b0a] to-transparent" />

                <span
                    className="absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 h-[20px] px-2 rounded-[5px] font-display text-[8.5px] font-black uppercase tracking-[0.1em]"
                    style={{ color: tier, background: `color-mix(in srgb, ${tier} 14%, #0d0b0a)` }}
                >
                    <ShieldCheck className="w-2.5 h-2.5" /> {clan.tier_name} · L{clan.level}
                </span>
            </span>

            {/* emblem overlaps the banner */}
            <span className="relative px-4 -mt-7">
                <span className="block w-[54px] h-[54px] rounded-[12px] border-2 bg-[#0d0b0a] overflow-hidden" style={{ borderColor: tier }}>
                    {clan.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={getStorageUrl(clan.logo)} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span className="w-full h-full flex items-center justify-center">
                            <Shield className="w-6 h-6" style={{ color: tier }} />
                        </span>
                    )}
                </span>
            </span>

            <span className="flex flex-col flex-1 p-4 pt-2.5">
                <span className="flex items-center gap-2">
                    <span className="font-display text-[15px] font-black text-white truncate group-hover:text-[var(--accent)] transition-colors">
                        {clan.name}
                    </span>
                    {clan.tag && <span className="shrink-0 font-display text-[10px] font-black text-[var(--accent)]">[{clan.tag}]</span>}
                </span>

                <span className="mt-1 text-[11.5px] text-white/40 leading-snug line-clamp-2 min-h-[30px]">
                    {clan.motto ?? clan.description ?? ""}
                </span>

                <span className="mt-3 flex items-center gap-3.5 font-display text-[10px] font-bold tabular-nums text-white/35">
                    <span className="inline-flex items-center gap-1.5">
                        <Users className="w-3 h-3" /> {clan.members_count}/{clan.member_limit}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[#a855f7]">
                        <Crown className="w-3 h-3" /> {clan.prestige_lifetime.toLocaleString("en-US")}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-emerald-400/80">
                        <Flame className="w-3 h-3" /> {clan.activity_score.toLocaleString("en-US")}/wk
                    </span>
                </span>

                <span className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-2">
                    {recruiting ? (
                        <span className="inline-flex items-center gap-1.5 font-display text-[9px] font-black uppercase tracking-[0.12em] text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Recruiting
                        </span>
                    ) : (
                        <span className="font-display text-[9px] font-black uppercase tracking-[0.12em] text-white/25">
                            {clan.status === "closed" ? "Closed" : "Invite only"}
                        </span>
                    )}
                    {clan.region && <span className="font-display text-[9px] font-bold uppercase tracking-[0.1em] text-white/25">· {clan.region}</span>}
                    {clan.playstyle && <span className="font-display text-[9px] font-bold uppercase tracking-[0.1em] text-white/25 capitalize">· {clan.playstyle}</span>}
                    <ArrowRight className="ml-auto w-3.5 h-3.5 text-white/20 group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-[color,transform]" />
                </span>
            </span>
        </Link>
    );
}

/* ── the page ─────────────────────────────────────────────────────────── */

export default function ClansClient() {
    const { user } = useAuth();
    const [search, setSearch] = useState("");
    const [playstyle, setPlaystyle] = useState("");
    const [recruitingOnly, setRecruitingOnly] = useState(false);
    const [sort, setSort] = useState("activity");
    const [creating, setCreating] = useState(false);

    const params = useMemo(() => {
        const q = new URLSearchParams();
        if (search.trim()) q.set("search", search.trim());
        if (playstyle) q.set("playstyle", playstyle);
        if (recruitingOnly) q.set("recruiting", "1");
        q.set("sort", sort);
        return q.toString();
    }, [search, playstyle, recruitingOnly, sort]);

    const { data, isLoading, mutate } = useSWR<{ data: ClanSummary[] }>(`/clans?${params}`, fetcher, {
        keepPreviousData: true,
    });
    const { data: mine } = useSWR<MyClan | null>(user ? "/user/clan" : null, fetcher);

    const clans = data?.data ?? [];

    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            {/* ── hero ── */}
            <div className="relative overflow-hidden border-b border-white/[0.07]">
                <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{ background: "radial-gradient(90% 130% at 50% 0%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 60%)" }}
                />
                <div className="relative z-10 max-w-[1320px] mx-auto px-4 xl:px-0 py-12 md:py-16">
                    <div className="flex flex-wrap items-end justify-between gap-6">
                        <div>
                            <p className="inline-flex items-center gap-2 font-display text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--accent)] mb-2">
                                <Shield className="w-4 h-4" /> Clans
                            </p>
                            <h1 className="font-display text-3xl md:text-5xl font-black text-white tracking-tight">
                                Find your legion
                            </h1>
                            <p className="mt-2 text-[14px] text-white/45 max-w-xl">
                                Everything you already do on TechPlay — reviews, comments, completions, achievements — earns
                                your clan resources and levels its base.
                            </p>
                        </div>

                        {mine?.clan ? (
                            <Link
                                href={`/clans/${mine.clan.slug}`}
                                className="group flex items-center gap-3.5 p-3 pr-5 rounded-[12px] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[#12100f] hover:border-[var(--accent)] transition-colors"
                            >
                                <span className="w-11 h-11 rounded-[10px] bg-white/[0.05] border border-white/[0.09] overflow-hidden flex items-center justify-center shrink-0">
                                    {mine.clan.logo ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={getStorageUrl(mine.clan.logo)} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Shield className="w-5 h-5 text-[var(--accent)]" />
                                    )}
                                </span>
                                <span>
                                    <span className="block font-display text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">Your clan</span>
                                    <span className="block font-display text-[14px] font-black text-white group-hover:text-[var(--accent)] transition-colors">
                                        {mine.clan.name}
                                    </span>
                                </span>
                                <ArrowRight className="w-4 h-4 text-white/25 group-hover:text-[var(--accent)] transition-colors" />
                            </Link>
                        ) : user ? (
                            <button
                                onClick={() => setCreating(true)}
                                className="inline-flex items-center gap-2 h-11 px-6 rounded-[9px] bg-[var(--accent)] hover:brightness-110 text-white font-display text-[11px] font-bold uppercase tracking-[0.1em] transition-[filter]"
                            >
                                <Plus className="w-4 h-4" /> Found a clan
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-6 space-y-4">
                {/* ── controls ── */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[220px] max-w-[340px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or tag…"
                            className="w-full h-9 pl-9 pr-8 rounded-[9px] bg-[#0f0d0c] border border-white/[0.07] text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {PLAYSTYLES.map((p) => {
                        const Icon = p.icon;
                        const active = playstyle === p.id;
                        return (
                            <button
                                key={p.id}
                                onClick={() => setPlaystyle(active ? "" : p.id)}
                                className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[9px] font-display text-[10px] font-bold uppercase tracking-[0.08em] transition-colors ${
                                    active ? "bg-[var(--accent)] text-white" : "bg-white/[0.04] text-white/45 hover:text-white hover:bg-white/[0.08]"
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" /> {p.label}
                            </button>
                        );
                    })}

                    <button
                        onClick={() => setRecruitingOnly((v) => !v)}
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
                            onChange={(e) => setSort(e.target.value)}
                            className="h-9 pl-3 pr-7 rounded-[9px] bg-[#0f0d0c] border border-white/[0.07] text-[12px] text-white/70 appearance-none focus:outline-none cursor-pointer"
                        >
                            {SORTS.map((s) => <option key={s.id} value={s.id}>Sort: {s.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                    </div>
                </div>

                {/* ── grid ── */}
                {isLoading && clans.length === 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => <div key={i} className="h-[240px] rounded-[12px] bg-white/[0.04] animate-pulse" />)}
                    </div>
                ) : clans.length === 0 ? (
                    <EmptyState
                        icon={<Shield className="w-[18px] h-[18px]" />}
                        title="No clans match"
                        body={user ? "Loosen the filters — or found the clan you're looking for." : "Loosen the filters, or sign in to found one."}
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {clans.map((clan, i) => (
                            <div key={clan.id} className={i < 8 ? `tp-fade-up tp-d${Math.min(6, i + 1)}` : undefined}>
                                <ClanCard clan={clan} />
                            </div>
                        ))}
                    </div>
                )}
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
