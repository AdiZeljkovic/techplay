"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import useSWR, { mutate as globalMutate } from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { Sparkles, Award, Palette, Frame, Star, X, Lock, Check, Coins, Loader2, Box } from "lucide-react";
import HexMedal from "./HexMedal";
import type { CustomizationData, CustomizationCatalogItem } from "@/lib/types/profile";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

const TYPE_META: Record<string, { icon: any; label: string }> = {
    theme: { icon: Palette, label: "Themes" },
    frame: { icon: Frame, label: "Frames" },
    badge: { icon: Award, label: "Badges" },
    perk: { icon: Star, label: "Perks" },
};

interface Props {
    data: CustomizationData;
    isOwnProfile: boolean;
    username: string;
    xp?: number;
    nextXp?: number | null;
    nextTierName?: string | null;
    tierColor?: string;
}

export default function LoyaltyCustomization({ data, isOwnProfile, username, xp = 0, nextXp = null, nextTierName = null, tierColor = "#CD7F32" }: Props) {
    const [open, setOpen] = useState(false);
    const searchParams = useSearchParams();

    // The header's "Customize Profile" button links to ?customize=1 — auto-open.
    useEffect(() => {
        if (isOwnProfile && searchParams.get("customize") === "1") setOpen(true);
    }, [isOwnProfile, searchParams]);

    const xpToGo = nextXp ? Math.max(0, nextXp - xp) : 0;
    const pct = nextXp && nextXp > 0 ? Math.min(100, Math.round((xp / nextXp) * 100)) : 100;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Left: tier + next-tier progress */}
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <HexMedal size={56} color={tierColor}><Box className="w-5 h-5" strokeWidth={2.2} /></HexMedal>
                        <div className="min-w-0">
                            <div className="text-xl font-black uppercase tracking-wide leading-none" style={{ color: tierColor }}>{data.tier ?? "Bronze"}</div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 mt-1">Tier</div>
                        </div>
                    </div>
                    {nextTierName ? (
                        <>
                            <div className="text-[11px] text-white/45">Next Tier: {nextTierName}</div>
                            <div className="text-[12px] font-bold text-[var(--accent)] mb-1.5"><span className="text-white">{xpToGo.toLocaleString("en-US")} XP</span> to go</div>
                            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-[var(--accent)] to-[#FF7A3D] rounded-full" style={{ width: `${Math.max(3, pct)}%` }} />
                            </div>
                        </>
                    ) : (
                        <div className="text-[11px] font-semibold text-white/40">Max tier reached</div>
                    )}
                </div>

                {/* Right: owned/total counts */}
                <div className="space-y-2.5">
                    {data.summary.map((s) => {
                        const meta = TYPE_META[s.type] ?? TYPE_META.perk;
                        const Icon = meta.icon;
                        return (
                            <div key={s.type} className="flex items-center gap-2">
                                <Icon className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                                <span className="text-[12px] font-medium text-white/65 truncate flex-1">{s.label}</span>
                                <span className="text-[11px] font-bold text-white tabular-nums">{s.owned} / {s.total}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {isOwnProfile && (
                <button onClick={() => setOpen(true)} className="w-full py-2.5 rounded-lg border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white text-[11px] font-bold uppercase tracking-wider transition-colors">
                    Customize Profile
                </button>
            )}

            {open && <CustomizationModal username={username} onClose={() => setOpen(false)} />}
        </div>
    );
}

function CustomizationModal({ username, onClose }: { username: string; onClose: () => void }) {
    const [tab, setTab] = useState<string>("theme");
    const [busy, setBusy] = useState<number | null>(null);
    const { data, mutate } = useSWR<{ data: { items: CustomizationCatalogItem[]; tier: string | null; balance: number } }>("/customizations", fetcher);

    const items = (data?.data?.items ?? []).filter((i) => i.type === tab);
    const balance = data?.data?.balance ?? 0;

    const refresh = () => { mutate(); globalMutate(`/users/${username}`); };

    const acquire = async (item: CustomizationCatalogItem) => {
        setBusy(item.id);
        try {
            await axios.post(`/customizations/${item.id}/acquire`);
            toast.success(`Unlocked: ${item.name}`);
            refresh();
        } catch (e: any) {
            toast.error(e?.response?.data?.message ?? "Failed to unlock.");
        } finally { setBusy(null); }
    };

    const toggleEquip = async (item: CustomizationCatalogItem) => {
        setBusy(item.id);
        try {
            await axios.post(`/customizations/${item.id}/${item.equipped ? "unequip" : "equip"}`);
            refresh();
        } catch {
            toast.error("Failed.");
        } finally { setBusy(null); }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 pt-[8vh]" onClick={onClose}>
            <div className="w-full max-w-2xl rounded-2xl bg-[var(--bg-card)] border border-white/10 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                    <h3 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-white"><Sparkles className="w-4 h-4 text-fuchsia-400" /> Customization</h3>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-[13px] font-black text-amber-400 tabular-nums"><Coins className="w-3.5 h-3.5" /> {balance.toLocaleString("en-US")}</span>
                        <button onClick={onClose} className="p-1.5 rounded hover:bg-white/10 text-white/50"><X className="w-4 h-4" /></button>
                    </div>
                </div>

                <div className="flex items-center gap-1 px-5 pt-3 border-b border-white/[0.06]">
                    {Object.entries(TYPE_META).map(([type, meta]) => {
                        const Icon = meta.icon;
                        return (
                            <button key={type} onClick={() => setTab(type)} className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider border-b-2 -mb-px transition-colors ${tab === type ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-white/40 hover:text-white/70"}`}>
                                <Icon className="w-3.5 h-3.5" /> {meta.label}
                            </button>
                        );
                    })}
                </div>

                <div className="p-5 max-h-[55vh] overflow-y-auto">
                    {!data ? (
                        <div className="flex justify-center py-10 text-white/40"><Loader2 className="w-5 h-5 animate-spin" /></div>
                    ) : items.length === 0 ? (
                        <p className="text-[12px] text-white/30 text-center py-10">Nothing here yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {items.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                                    <Swatch item={item} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[13px] font-bold text-white truncate">{item.name}</div>
                                        {item.description && <div className="text-[10px] text-white/40 line-clamp-1">{item.description}</div>}
                                        <div className="text-[10px] font-bold mt-0.5">
                                            {item.required_tier ? <span className="text-fuchsia-400">{item.required_tier} tier</span> : item.cost > 0 ? <span className="text-amber-400 inline-flex items-center gap-1"><Coins className="w-3 h-3" />{item.cost}</span> : <span className="text-emerald-400">Free</span>}
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        {item.owned ? (
                                            item.type === "perk" ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400"><Check className="w-3.5 h-3.5" /> Owned</span>
                                            ) : (
                                                <button onClick={() => toggleEquip(item)} disabled={busy === item.id} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${item.equipped ? "bg-[var(--accent)] text-white" : "bg-white/[0.06] text-white/70 hover:bg-white/[0.12]"}`}>
                                                    {busy === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : item.equipped ? "Equipped" : "Equip"}
                                                </button>
                                            )
                                        ) : item.tier_locked ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white/30"><Lock className="w-3.5 h-3.5" /> Locked</span>
                                        ) : (
                                            <button onClick={() => acquire(item)} disabled={busy === item.id || !item.affordable} className="px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-bold uppercase tracking-wider">
                                                {busy === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : item.affordable ? "Unlock" : "Need ⛁"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Swatch({ item }: { item: CustomizationCatalogItem }) {
    if (item.asset) return <img src={item.asset} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />;
    if (item.type === "theme" || item.type === "badge") {
        return <div className="w-10 h-10 rounded-lg shrink-0" style={{ background: item.value ?? "#333" }} />;
    }
    if (item.type === "frame") {
        return <div className="w-10 h-10 rounded-full shrink-0 p-[3px]" style={{ background: item.value ?? "#333" }}><div className="w-full h-full rounded-full bg-[var(--bg-card)]" /></div>;
    }
    return <div className="w-10 h-10 rounded-lg shrink-0 bg-white/[0.06] flex items-center justify-center"><Star className="w-4 h-4 text-white/40" /></div>;
}
