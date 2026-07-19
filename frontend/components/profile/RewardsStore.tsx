"use client";

import { useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { Coins, Gift, Award, Frame, Palette, Sparkles, Ticket, Package, Loader2, History } from "lucide-react";
import type { RewardItem, BountyTransaction } from "@/lib/types/profile";

const fetcher = (url: string) => axios.get(url).then((r) => r.data);

const TYPE_META: Record<string, { icon: any; color: string }> = {
    badge: { icon: Award, color: "#facc15" },
    frame: { icon: Frame, color: "#60a5fa" },
    theme: { icon: Palette, color: "#a78bfa" },
    perk: { icon: Sparkles, color: "#FC4100" },
    discount: { icon: Ticket, color: "#34d399" },
    physical: { icon: Package, color: "#f472b6" },
};

interface Props {
    username: string;
    isOwnProfile: boolean;
}

export default function RewardsStore({ username, isOwnProfile }: Props) {
    const [redeeming, setRedeeming] = useState<string | null>(null);

    const { data: catalog } = useSWR<{ data: RewardItem[] }>("/rewards", fetcher);
    const { data: bountyData, mutate: mutateBounty } = useSWR<{ data: { balance: number; transactions: BountyTransaction[] } }>(
        isOwnProfile ? "/bounty" : null,
        fetcher,
    );

    const items = catalog?.data ?? [];
    const balance = bountyData?.data?.balance ?? 0;
    const transactions = bountyData?.data?.transactions ?? [];

    const redeem = async (item: RewardItem) => {
        if (!isOwnProfile) return;
        if (balance < item.cost) return toast.error("Not enough bounty.");
        setRedeeming(item.slug);
        try {
            await axios.post(`/rewards/${item.slug}/redeem`);
            toast.success(`Redeemed: ${item.name}`);
            mutateBounty();
            globalMutate(`/users/${username}`);
        } catch (e: any) {
            toast.error(e?.response?.data?.message ?? "Redemption failed.");
        } finally {
            setRedeeming(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Balance header */}
            {isOwnProfile && (
                <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-400/[0.1] to-transparent border border-amber-400/20 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-amber-400/15 flex items-center justify-center">
                            <Coins className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Your Bounty</div>
                            <div className="text-2xl font-black text-amber-400 tabular-nums leading-none">{balance.toLocaleString("en-US")}</div>
                        </div>
                    </div>
                    <span className="text-[11px] text-white/35 max-w-[200px] text-right hidden sm:block">Earn Bounty by posting, commenting and engaging across TechPlay.</span>
                </div>
            )}

            {/* Store grid */}
            <div>
                <h3 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-white mb-4">
                    <Gift className="w-4 h-4 text-[var(--accent)]" /> Rewards Store
                </h3>
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-white/30">
                        <Gift className="w-8 h-8 mb-3" />
                        <span className="text-[13px]">No rewards available right now.</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((item) => {
                            const meta = TYPE_META[item.type] ?? TYPE_META.perk;
                            const Icon = meta.icon;
                            const affordable = balance >= item.cost;
                            const outOfStock = item.stock !== null && item.stock <= 0;
                            return (
                                <div key={item.id} className="flex flex-col rounded-2xl bg-[var(--bg-card)] border border-white/[0.06] overflow-hidden hover:border-white/[0.12] transition-colors">
                                    <div className="relative h-28 flex items-center justify-center overflow-hidden" style={{ background: `radial-gradient(circle at 50% 30%, ${meta.color}22, transparent 70%)` }}>
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Icon className="w-10 h-10" style={{ color: meta.color }} />
                                        )}
                                        <span className="absolute top-2 left-2 text-[8px] font-bold uppercase tracking-wider px-1.5 py-1 rounded text-white" style={{ backgroundColor: meta.color }}>{item.type}</span>
                                    </div>
                                    <div className="flex flex-col flex-1 p-4">
                                        <h4 className="text-[14px] font-bold text-white mb-1">{item.name}</h4>
                                        {item.description && <p className="text-[11px] text-white/45 leading-relaxed mb-3 line-clamp-2">{item.description}</p>}
                                        <div className="mt-auto flex items-center justify-between gap-2">
                                            <span className="flex items-center gap-1.5 text-[14px] font-black text-amber-400 tabular-nums">
                                                <Coins className="w-3.5 h-3.5" /> {item.cost.toLocaleString("en-US")}
                                            </span>
                                            {isOwnProfile && (
                                                <button
                                                    onClick={() => redeem(item)}
                                                    disabled={!affordable || outOfStock || redeeming === item.slug}
                                                    className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-bold uppercase tracking-wider transition-colors"
                                                >
                                                    {redeeming === item.slug ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : outOfStock ? "Sold out" : affordable ? "Redeem" : "Locked"}
                                                </button>
                                            )}
                                        </div>
                                        {item.stock !== null && !outOfStock && <span className="mt-2 text-[9px] text-white/30">{item.stock} left</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Transaction history (own profile) */}
            {isOwnProfile && transactions.length > 0 && (
                <div>
                    <h3 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-white mb-4">
                        <History className="w-4 h-4 text-white/50" /> Bounty History
                    </h3>
                    <div className="rounded-2xl bg-[var(--bg-card)] border border-white/[0.06] divide-y divide-white/[0.05]">
                        {transactions.map((t) => (
                            <div key={t.id} className="flex items-center justify-between px-4 py-2.5">
                                <div className="min-w-0">
                                    <div className="text-[12px] font-semibold text-white/75 truncate">{t.reason ?? t.type}</div>
                                    <div className="text-[10px] text-white/30">{new Date(t.created_at).toLocaleDateString()}</div>
                                </div>
                                <span className={`text-[13px] font-black tabular-nums shrink-0 ${t.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                    {t.amount >= 0 ? "+" : ""}{t.amount.toLocaleString("en-US")}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
